import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import { MessageStatusEnum } from '@/types/enums/common';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react';

export interface UseUnifiedChatScrollProps {
  messageList?: any[];
  isConversationActive?: boolean;
  chatSuggestList?: any[];
  isLoading?: boolean;
  loadingMore?: boolean;
  externalMessageViewRef?: RefObject<HTMLDivElement>;
  externalAllowAutoScrollRef?: MutableRefObject<boolean>;
  externalScrollTimeoutRef?: MutableRefObject<any>;
  onScrollBtnVisibleChange?: (visible: boolean) => void;
  showScrollBtn?: boolean;
}

export function useUnifiedChatScroll({
  messageList = [],
  isConversationActive = false,
  chatSuggestList = [],
  isLoading = false,
  loadingMore = false,
  externalMessageViewRef,
  externalAllowAutoScrollRef,
  externalScrollTimeoutRef,
  onScrollBtnVisibleChange,
  showScrollBtn = false,
}: UseUnifiedChatScrollProps) {
  const [isHoveringChat, setIsHoveringChat] = useState<boolean>(false);
  const internalMessageViewRef = useRef<HTMLDivElement>(null);
  const messageViewRef = externalMessageViewRef || internalMessageViewRef;
  const internalAllowAutoScrollRef = useRef<boolean>(true);
  const allowAutoScrollRef =
    externalAllowAutoScrollRef || internalAllowAutoScrollRef;
  const lastMsgCountRef = useRef<number>(0);
  const lastTextLengthRef = useRef<number>(0);
  // 记录上一轮最后一条消息是否处于流式（loading/incomplete）状态。
  // 会话结束时末条消息会从流式态切换到完成态（stopped/complete），
  // 此时 DOM 高度会因状态切换、processingList 渲染、markdown 排版等再次变化，
  // 但文本长度已不再增长，需要单独识别这一切换并补触发一次置底。
  const lastWasStreamingRef = useRef<boolean>(false);
  // 记录上一轮 isConversationActive，用于检测会话结束的下降沿。
  // isConversationActive 从 true → false 是会话结束的可靠信号。
  const prevConvActiveRef = useRef<boolean>(isConversationActive);
  const internalScrollTimeoutRef = useRef<any>(null);
  const scrollTimeoutRef = externalScrollTimeoutRef || internalScrollTimeoutRef;
  const programmaticTimerRef = useRef<any>(null);
  const [scrollBtnVisible, setScrollBtnVisibleState] =
    useState<boolean>(showScrollBtn);
  const setScrollBtnVisible = useCallback(
    (visible: boolean) => {
      setScrollBtnVisibleState(visible);
      onScrollBtnVisibleChange?.(visible);
    },
    [onScrollBtnVisibleChange],
  );

  // 1. 滚动检测逻辑
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setScrollBtnVisible,
  );

  // 发送消息时强制重置自动滚动状态并立即置底。
  const handleSendScrollReset = () => {
    allowAutoScrollRef.current = true;
    setScrollBtnVisible(false);
    const el = messageViewRef.current;
    if (el) {
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
      (el as any).__isProgrammaticScroll = true;
      el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
      programmaticTimerRef.current = setTimeout(() => {
        if (messageViewRef.current) {
          (messageViewRef.current as any).__isProgrammaticScroll = false;
        }
        programmaticTimerRef.current = null;
      }, 100);
    }
  };

  // 点击回到底部（平滑滚动）
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    const element = messageViewRef.current;
    if (element) {
      (element as any).__isProgrammaticScroll = 'smooth';
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
      programmaticTimerRef.current = setTimeout(() => {
        if (messageViewRef.current) {
          (messageViewRef.current as any).__isProgrammaticScroll = false;
        }
        programmaticTimerRef.current = null;
      }, 500);
    }
    setScrollBtnVisible(false);
  };

  // 大模型流式输出或更新时自动平滑滚动置底
  useEffect(() => {
    const lastMessage = messageList[messageList.length - 1];
    const isStreaming =
      lastMessage?.status === MessageStatusEnum.Loading ||
      lastMessage?.status === MessageStatusEnum.Incomplete ||
      isConversationActive;
    const textLength = lastMessage?.text?.length || 0;
    const msgCount = messageList.length;

    const isFirstMessageLoad =
      lastMsgCountRef.current === 0 && msgCount > 0 && !isStreaming;

    let shouldScroll = false;

    if (msgCount > lastMsgCountRef.current) {
      shouldScroll = true;
    } else if (isStreaming && textLength > lastTextLengthRef.current) {
      shouldScroll = true;
    }

    // 会话结束兜底：末条消息从流式态切换到完成态时，文本已不再增长，但 DOM 会因
    // 状态切换(loading->stopped/complete)、processingList 渲染、markdown 排版等再次撑高，
    // 此时需要补触发一次置底，避免会话结束后视图停在偏上位置、没有顶到底部。
    const justFinishedStreaming =
      lastWasStreamingRef.current && !isStreaming && msgCount > 0;
    if (justFinishedStreaming) {
      shouldScroll = true;
    }

    lastMsgCountRef.current = msgCount;
    lastTextLengthRef.current = textLength;
    lastWasStreamingRef.current = isStreaming;

    if (shouldScroll && allowAutoScrollRef.current) {
      const element = messageViewRef.current;
      if (element) {
        const performScroll = () => {
          const el = messageViewRef.current;
          if (el) {
            if (programmaticTimerRef.current) {
              clearTimeout(programmaticTimerRef.current);
            }
            (el as any).__isProgrammaticScroll = true;
            el.scrollTo({
              top: el.scrollHeight,
              behavior: 'instant',
            });
            programmaticTimerRef.current = setTimeout(() => {
              if (messageViewRef.current) {
                (messageViewRef.current as any).__isProgrammaticScroll = false;
              }
              programmaticTimerRef.current = null;
            }, 100);
          }
        };

        performScroll();

        // 会话结束(isFirstMessageLoad / justFinishedStreaming)时，markdown/图片/processingList
        // 等异步渲染会持续撑高 DOM，需要多级延迟兜底确保最终顶到底部。
        if (isFirstMessageLoad || justFinishedStreaming) {
          const t1 = setTimeout(() => {
            if (allowAutoScrollRef.current) performScroll();
          }, 150);
          const t2 = setTimeout(() => {
            if (allowAutoScrollRef.current) performScroll();
          }, 400);
          const t3 = setTimeout(() => {
            if (allowAutoScrollRef.current) performScroll();
          }, 800);
          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
          };
        } else {
          const timer = setTimeout(performScroll, 60);
          return () => {
            clearTimeout(timer);
          };
        }
      }
    }
  }, [messageList, isConversationActive, chatSuggestList]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
    };
  }, []);

  // 安全网：isLoading 从 true → false 时（消息刚完成渲染），补触发多级延迟置底。
  const prevIsLoadingRef = useRef(isLoading);
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    if (
      wasLoading &&
      !isLoading &&
      messageList.length > 0 &&
      allowAutoScrollRef.current
    ) {
      const doScroll = () => {
        if (!allowAutoScrollRef.current || !messageViewRef.current) return;
        const el = messageViewRef.current;
        if (programmaticTimerRef.current) {
          clearTimeout(programmaticTimerRef.current);
        }
        (el as any).__isProgrammaticScroll = true;
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
        programmaticTimerRef.current = setTimeout(() => {
          if (messageViewRef.current) {
            (messageViewRef.current as any).__isProgrammaticScroll = false;
          }
          programmaticTimerRef.current = null;
        }, 100);
      };

      doScroll();
      const t1 = setTimeout(() => {
        if (allowAutoScrollRef.current) doScroll();
      }, 150);
      const t2 = setTimeout(() => {
        if (allowAutoScrollRef.current) doScroll();
      }, 400);
      const t3 = setTimeout(() => {
        if (allowAutoScrollRef.current) doScroll();
      }, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isLoading, messageList.length]);

  // 会话结束兜底：isConversationActive 从 true → false 时触发多级延迟置底。
  // 关键设计：此 effect 仅依赖 [isConversationActive]，不会被 onClose 中 messageList
  // 变更触发的重渲染 cleanup，确保延迟滚动定时器能完整执行。
  useEffect(() => {
    const wasActive = prevConvActiveRef.current;
    prevConvActiveRef.current = isConversationActive;

    // 仅在活跃→非活跃下降沿、且有消息、且允许自动滚动时触发
    if (!wasActive || isConversationActive) {
      return;
    }
    if (messageList.length === 0 || !allowAutoScrollRef.current) {
      return;
    }

    const doScroll = () => {
      const el = messageViewRef.current;
      if (!el || !allowAutoScrollRef.current) return;
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
      (el as any).__isProgrammaticScroll = true;
      el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
      programmaticTimerRef.current = setTimeout(() => {
        if (messageViewRef.current) {
          (messageViewRef.current as any).__isProgrammaticScroll = false;
        }
        programmaticTimerRef.current = null;
      }, 100);
    };

    // 会话结束后 markdown/图片/processingList 等异步渲染会持续撑高 DOM，
    // 需要多级延迟兜底确保最终顶到底部
    doScroll();
    const delays = [100, 250, 500, 900, 1500];
    const timers = delays.map((d) =>
      setTimeout(() => {
        if (allowAutoScrollRef.current) doScroll();
      }, d),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConversationActive]);

  // 向上滚动加载更多历史消息时的滚动锁定机制
  const lastScrollHeightRef = useRef<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const prevLoadingMoreRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    const element = messageViewRef.current;
    if (!element) return;

    if (prevLoadingMoreRef.current && !loadingMore) {
      const heightDifference =
        element.scrollHeight - lastScrollHeightRef.current;
      if (heightDifference > 0) {
        element.scrollTop = lastScrollTopRef.current + heightDifference;
      }
    }

    lastScrollHeightRef.current = element.scrollHeight;
    lastScrollTopRef.current = element.scrollTop;
    prevLoadingMoreRef.current = loadingMore || false;
  }, [messageList, loadingMore]);

  // 处理滚动区域 hover 及滚动按钮显示逻辑
  const handleMouseEnter = () => {
    setIsHoveringChat(true);
    const el = messageViewRef.current;
    if (el) {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (scrollHeight > clientHeight && distanceFromBottom > 50) {
        setScrollBtnVisible(true);
      } else {
        setScrollBtnVisible(false);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHoveringChat(false);
  };

  return {
    messageViewRef,
    scrollBtnVisible,
    isHoveringChat,
    handleSendScrollReset,
    onScrollBottom,
    handleMouseEnter,
    handleMouseLeave,
    setScrollBtnVisible,
  };
}
