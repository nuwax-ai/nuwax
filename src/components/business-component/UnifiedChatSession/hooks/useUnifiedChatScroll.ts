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
  active?: boolean;
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
  active = true,
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
  const activeRef = useRef(active);
  activeRef.current = active;
  const lastVisibleScrollTopRef = useRef(0);
  const suspendedAutoScrollRef = useRef<boolean | null>(null);
  const lastMsgCountRef = useRef<number>(0);
  // 记录上一次 messageList 引用，用于识别“内容是否发生变化”（含新增、流式分片、
  // 原地更新、轮询快照合并等），避免仅比较条数/文本长度时漏触发置底。
  const prevMessageListRef = useRef<any[] | null>(null);
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

  // 程序化瞬间置底：清理上一个置底复位定时器 → 标记程序滚动 → 立即 scrollTo 到底 →
  // 100ms 后复位标记。供各处置底逻辑（发送、流式、会话结束等）复用，避免同一套实现
  // 被复制多份后产生不一致（曾出现 4 份近乎相同的副本）。
  const pinToBottomInstant = useCallback((el: HTMLDivElement) => {
    if (!activeRef.current || el.clientHeight === 0) return;
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
  }, []);

  // 隐藏后 scrollTop 读值为零，只记录可见时的位置。恢复跟随意图与阅读位置
  // 在布局阶段完成，避免后台流式更新或旧滚动检测覆盖用户最后停留的位置。
  useLayoutEffect(() => {
    if (!active) {
      if (suspendedAutoScrollRef.current === null) {
        suspendedAutoScrollRef.current = allowAutoScrollRef.current;
      }
      allowAutoScrollRef.current = false;
      return;
    }

    const element = messageViewRef.current;
    if (!element) return;

    if (suspendedAutoScrollRef.current !== null) {
      const shouldFollowTail = suspendedAutoScrollRef.current;
      suspendedAutoScrollRef.current = null;
      allowAutoScrollRef.current = shouldFollowTail;
      if (shouldFollowTail) {
        pinToBottomInstant(element);
      } else {
        element.scrollTop = lastVisibleScrollTopRef.current;
      }
    }

    const rememberVisiblePosition = () => {
      if (activeRef.current && element.clientHeight > 0) {
        lastVisibleScrollTopRef.current = element.scrollTop;
      }
    };
    rememberVisiblePosition();
    element.addEventListener('scroll', rememberVisiblePosition, {
      passive: true,
    });
    return () => element.removeEventListener('scroll', rememberVisiblePosition);
  }, [active, allowAutoScrollRef, messageViewRef, pinToBottomInstant]);

  // 1. 滚动检测逻辑
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setScrollBtnVisible,
    active,
  );

  // 历史正文可能在懒加载、Markdown 或图片就绪后才撑高，不能只依赖消息引用
  // 和固定延迟。内层 flex 容器可能保持视口高度，需同时观察自然高度子节点。
  useLayoutEffect(() => {
    const element = messageViewRef.current;
    if (
      !active ||
      loadingMore ||
      !element ||
      typeof ResizeObserver === 'undefined'
    ) {
      return;
    }
    const content = element.firstElementChild ?? element;
    const followContentToBottom = () => {
      if (
        activeRef.current &&
        allowAutoScrollRef.current &&
        element.clientHeight > 0 &&
        element.scrollHeight - element.scrollTop - element.clientHeight > 1
      ) {
        pinToBottomInstant(element);
      }
    };
    const resizeObserver = new ResizeObserver(followContentToBottom);
    const observeContent = () => {
      resizeObserver.disconnect();
      const targets = new Set<Element>([element, content, ...content.children]);
      targets.forEach((target) => resizeObserver.observe(target));
    };
    // Suspense 占位替换、历史分页会改变直接子节点；正文内部高度变化由
    // ResizeObserver 处理，不对整棵消息树建立 mutation 订阅。
    const mutationObserver = new MutationObserver(() => {
      observeContent();
      followContentToBottom();
    });
    mutationObserver.observe(content, { childList: true });
    observeContent();
    followContentToBottom();
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [
    active,
    loadingMore,
    allowAutoScrollRef,
    messageViewRef,
    pinToBottomInstant,
  ]);

  // 发送消息时强制重置自动滚动状态并立即置底。
  const handleSendScrollReset = () => {
    allowAutoScrollRef.current = true;
    setScrollBtnVisible(false);
    const el = messageViewRef.current;
    if (el) {
      pinToBottomInstant(el);
    }
  };

  // 点击回到底部（平滑滚动）
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    const element = messageViewRef.current;
    if (activeRef.current && element && element.clientHeight > 0) {
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

  // 大模型流式输出 / 轮询同步 / 原地更新时自动贴底。
  // 触发条件以「messageList 引用变化」为准（覆盖新增消息、流式分片、原地更新、轮询快照合并），
  // 而非仅比较条数/文本长度：后者在轮询同步原地更新末尾消息时会漏触发，导致不置底。
  // 异步渲染（Markdown/图片/processingList）通过多级延迟兜底保证最终顶到底部。
  useEffect(() => {
    const listChanged = messageList !== prevMessageListRef.current;
    prevMessageListRef.current = messageList;

    const lastMessage = messageList[messageList.length - 1];
    const isStreaming =
      lastMessage?.status === MessageStatusEnum.Loading ||
      lastMessage?.status === MessageStatusEnum.Incomplete ||
      isConversationActive;
    const msgCount = messageList.length;

    const isFirstMessageLoad =
      lastMsgCountRef.current === 0 && msgCount > 0 && !isStreaming;

    // 会话结束兜底：末条消息从流式态切换到完成态时，文本已不再增长，但 DOM 会因
    // 状态切换(loading->stopped/complete)、processingList 渲染、markdown 排版等再次撑高，
    // 此时需要补触发一次置底，避免会话结束后视图停在偏上位置、没有顶到底部。
    const justFinishedStreaming =
      lastWasStreamingRef.current && !isStreaming && msgCount > 0;

    lastMsgCountRef.current = msgCount;
    lastWasStreamingRef.current = isStreaming;

    const shouldScroll =
      listChanged || isFirstMessageLoad || justFinishedStreaming;

    // 加载更多历史时不贴底：此时是向前读取历史，需要保持视口位置不变。
    // 用户向上滚动打断自动滚动时（allowAutoScrollRef=false）同样不置底。
    if (
      !active ||
      !shouldScroll ||
      loadingMore ||
      !allowAutoScrollRef.current
    ) {
      return;
    }

    const performScroll = () => {
      const el = messageViewRef.current;
      if (el && allowAutoScrollRef.current) {
        pinToBottomInstant(el);
      }
    };

    performScroll();

    // 统一多级延迟兜底：轮询同步到的完整消息此前只给 60ms，图片/Markdown 异步撑高后
    // 无法顶到底；这里与首次加载/流式结束保持一致的兜底强度。
    const delays = [60, 150, 400, 800];
    const timers = delays.map((d) =>
      setTimeout(() => {
        if (allowAutoScrollRef.current) performScroll();
      }, d),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [
    active,
    messageList,
    isConversationActive,
    chatSuggestList,
    loadingMore,
    pinToBottomInstant,
  ]);

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
      active &&
      !isLoading &&
      messageList.length > 0 &&
      allowAutoScrollRef.current
    ) {
      const doScroll = () => {
        if (!allowAutoScrollRef.current || !messageViewRef.current) return;
        pinToBottomInstant(messageViewRef.current);
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
  }, [active, isLoading, messageList.length, pinToBottomInstant]);

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
      pinToBottomInstant(el);
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
    if (!active || !element || element.clientHeight === 0) return;

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
  }, [active, messageList, loadingMore]);

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
