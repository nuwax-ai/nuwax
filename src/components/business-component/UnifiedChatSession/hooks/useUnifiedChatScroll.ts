import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import { MessageStatusEnum } from '@/types/enums/common';

export interface UseUnifiedChatScrollProps {
  messageList?: any[];
  isConversationActive?: boolean;
  chatSuggestList?: any[];
  isLoading?: boolean;
  loadingMore?: boolean;
  externalMessageViewRef?: RefObject<HTMLDivElement>;
  showScrollBtn?: boolean;
}

export function useUnifiedChatScroll({
  messageList = [],
  isConversationActive = false,
  chatSuggestList = [],
  isLoading = false,
  loadingMore = false,
  externalMessageViewRef,
  showScrollBtn = false,
}: UseUnifiedChatScrollProps) {
  const [isHoveringChat, setIsHoveringChat] = useState<boolean>(false);
  const internalMessageViewRef = useRef<HTMLDivElement>(null);
  const messageViewRef = externalMessageViewRef || internalMessageViewRef;
  const allowAutoScrollRef = useRef<boolean>(true);
  const lastMsgCountRef = useRef<number>(0);
  const lastTextLengthRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<any>(null);
  const programmaticTimerRef = useRef<any>(null);
  const [scrollBtnVisible, setScrollBtnVisible] = useState<boolean>(showScrollBtn);

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

    lastMsgCountRef.current = msgCount;
    lastTextLengthRef.current = textLength;

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

        if (isFirstMessageLoad) {
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

    if (wasLoading && !isLoading && messageList.length > 0 && allowAutoScrollRef.current) {
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
      const t1 = setTimeout(() => { if (allowAutoScrollRef.current) doScroll(); }, 150);
      const t2 = setTimeout(() => { if (allowAutoScrollRef.current) doScroll(); }, 400);
      const t3 = setTimeout(() => { if (allowAutoScrollRef.current) doScroll(); }, 800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isLoading, messageList.length]);

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
