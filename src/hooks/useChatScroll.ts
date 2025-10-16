import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 聊天滚动管理 Hook
 * 提供自动滚动、滚动按钮、滚动位置检测等功能
 */
export const useChatScroll = () => {
  // 滚动相关状态
  const [isAutoScroll, setIsAutoScroll] = useState(true); // 是否启用自动滚动
  const [showScrollButton, setShowScrollButton] = useState(false); // 是否显示滚动按钮
  const chatMessagesRef = useRef<HTMLDivElement>(null); // 聊天消息容器引用
  const isProgrammaticScroll = useRef(false); // 标记是否为程序触发的滚动
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 滚动延迟处理定时器
  const lastScrollTop = useRef(-1); // 记录上次滚动位置，初始值设为-1避免误判
  const userScrollDisabled = useRef(false); // 标记用户是否主动禁用了自动滚动
  const justDisabledAutoScroll = useRef(false); // 标记是否刚刚禁用了自动滚动

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      isProgrammaticScroll.current = true; // 标记为程序触发
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      // 更新滚动位置记录
      lastScrollTop.current = chatMessagesRef.current.scrollHeight;
      // 延迟重置标记，确保滚动事件处理完成
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 50);
    }
  }, []);

  /**
   * 平滑滚动到底部
   */
  const smoothScrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      isProgrammaticScroll.current = true; // 标记为程序触发
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
      // 更新滚动位置记录
      lastScrollTop.current = chatMessagesRef.current.scrollHeight;
      // 延迟重置标记，确保滚动事件处理完成
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500); // 增加延迟时间，确保平滑滚动完全结束
    }
  }, []);

  /**
   * 检查是否在页面底部
   */
  const isAtBottom = useCallback(() => {
    if (!chatMessagesRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 距离底部小于 50px 认为是在底部
    return distanceFromBottom < 50;
  }, []);

  /**
   * 检查是否需要显示滚动按钮
   */
  const checkScrollPosition = useCallback(() => {
    if (!chatMessagesRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 如果距离底部超过 100px，显示滚动按钮
    if (distanceFromBottom > 100) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  }, []);

  /**
   * 处理滚动事件
   */
  const handleScroll = useCallback(() => {
    if (!chatMessagesRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 距离底部超过 100px，取消自动滚动并显示按钮
    if (distanceFromBottom > 100) {
      setIsAutoScroll(false);
      setShowScrollButton(true);
    }
    // 距离底部小于 50px，重新启用自动滚动并隐藏按钮
    else if (distanceFromBottom < 50) {
      setIsAutoScroll(true);
      setShowScrollButton(false);
    }
  }, []);

  /**
   * 处理用户主动滚动事件
   * 当用户向上滚动时立即关闭自动滚动
   */
  const handleUserScroll = useCallback(() => {
    // 如果是程序触发的滚动，忽略
    if (isProgrammaticScroll.current) {
      return;
    }

    if (!chatMessagesRef.current) return;

    const currentScrollTop = chatMessagesRef.current.scrollTop;
    const scrollDirection =
      currentScrollTop < lastScrollTop.current ? 'up' : 'down';

    // 更新上次滚动位置
    lastScrollTop.current = currentScrollTop;

    // 立即检查滚动位置并更新按钮状态
    const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 清除之前的延迟处理
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 立即处理向上滚动的情况，确保按钮能及时显示
    if (scrollDirection === 'up') {
      setIsAutoScroll(false);
      setShowScrollButton(true);
      userScrollDisabled.current = true; // 标记用户主动禁用
      justDisabledAutoScroll.current = true; // 标记刚刚禁用
      // 延迟重置刚刚禁用标记，避免立即重新启用
      setTimeout(() => {
        justDisabledAutoScroll.current = false;
      }, 200);
    }
    // 如果用户向下滚动且滚动到底部附近（50px内），且不是刚刚禁用的情况
    else if (
      scrollDirection === 'down' &&
      distanceFromBottom <= 50 &&
      !justDisabledAutoScroll.current
    ) {
      setIsAutoScroll(true);
      setShowScrollButton(false);
      userScrollDisabled.current = false; // 重置用户禁用标记
    }
    // 如果距离底部超过 100px，确保显示滚动按钮
    else if (distanceFromBottom > 100) {
      setShowScrollButton(true);
    }

    // 延迟处理滚动事件，避免频繁更新状态
    scrollTimeoutRef.current = setTimeout(() => {
      // 再次检查滚动位置，确保状态正确
      checkScrollPosition();
    }, 50); // 50ms 延迟处理
  }, [checkScrollPosition]);

  /**
   * 滚动按钮点击处理
   */
  const handleScrollButtonClick = useCallback(() => {
    smoothScrollToBottom();
    setIsAutoScroll(true);

    // 使用更精确的方法检测滚动完成
    const checkScrollComplete = () => {
      if (chatMessagesRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatMessagesRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // 如果已经滚动到底部附近（50px内），隐藏按钮
        if (distanceFromBottom <= 50) {
          setShowScrollButton(false);
        } else {
          // 如果还没到底部，继续检查
          setTimeout(checkScrollComplete, 50);
        }
      }
    };

    // 延迟开始检查，给滚动动画一些时间
    setTimeout(checkScrollComplete, 100);
  }, [smoothScrollToBottom]);

  /**
   * 强制滚动到底部并开启自动滚动
   */
  const forceScrollToBottom = useCallback(() => {
    scrollToBottom();
    setIsAutoScroll(true);
    setShowScrollButton(false);
  }, [scrollToBottom]);

  /**
   * 检查滚动位置并决定是否开启自动滚动
   * 用于发送消息前的检查
   */
  const checkAndEnableAutoScroll = useCallback(() => {
    if (isAtBottom()) {
      setIsAutoScroll(true);
      setShowScrollButton(false);
      userScrollDisabled.current = false; // 重置用户禁用标记
      justDisabledAutoScroll.current = false; // 重置刚刚禁用标记
    }
  }, [isAtBottom]);

  /**
   * 发送消息后强制滚动到底部并开启自动滚动
   */
  const forceScrollToBottomAndEnable = useCallback(() => {
    scrollToBottom();
    setIsAutoScroll(true);
    setShowScrollButton(false);
    userScrollDisabled.current = false; // 重置用户禁用标记
    justDisabledAutoScroll.current = false; // 重置刚刚禁用标记
  }, [scrollToBottom]);

  /**
   * 清理定时器
   */
  const cleanup = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  // 组件挂载时初始化滚动位置
  useEffect(() => {
    if (chatMessagesRef.current) {
      // 初始化滚动位置记录
      lastScrollTop.current = chatMessagesRef.current.scrollTop;
      // 检查初始滚动位置
      checkScrollPosition();
    }
  }, [checkScrollPosition]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // 状态
    isAutoScroll,
    showScrollButton,
    chatMessagesRef,
    userScrollDisabled,

    // 方法
    scrollToBottom,
    smoothScrollToBottom,
    isAtBottom,
    checkScrollPosition,
    handleScroll,
    handleUserScroll,
    handleScrollButtonClick,
    forceScrollToBottom,
    checkAndEnableAutoScroll,
    forceScrollToBottomAndEnable,

    // 状态设置方法
    setIsAutoScroll,
    setShowScrollButton,
  };
};

/**
 * 聊天滚动效果 Hook
 * 处理各种滚动触发场景
 */
export const useChatScrollEffects = (
  chatMessages: any[],
  isLoadingHistory: boolean,
  scrollToBottom: () => void,
  isAutoScroll: boolean,
  checkScrollPosition: () => void,
  userScrollDisabled: React.MutableRefObject<boolean>,
) => {
  /**
   * 自动滚动效果 - 当消息更新且启用自动滚动时，滚动到底部
   */
  useEffect(() => {
    if (
      isAutoScroll &&
      chatMessages.length > 0 &&
      !userScrollDisabled.current
    ) {
      scrollToBottom();
    }
  }, [chatMessages, isAutoScroll, scrollToBottom]);

  /**
   * 监听消息内容变化，在打字机效果期间也保持自动滚动
   */
  useEffect(() => {
    if (
      isAutoScroll &&
      chatMessages.length > 0 &&
      !userScrollDisabled.current
    ) {
      // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
      const timeoutId = requestAnimationFrame(() => {
        scrollToBottom();
      });

      return () => cancelAnimationFrame(timeoutId);
    }
  }, [
    chatMessages.map((msg) => msg.text).join(''),
    isAutoScroll,
    scrollToBottom,
  ]);

  /**
   * 监听流式消息状态变化，确保在打字机效果期间保持滚动
   */
  useEffect(() => {
    if (chatMessages.length > 0) {
      // 检查是否有正在流式传输的消息
      const hasStreamingMessage = chatMessages.some((msg) => msg.isStreaming);

      if (hasStreamingMessage) {
        // 在流式传输期间，定期检查并滚动到底部
        const intervalId = setInterval(() => {
          if (isAutoScroll && !userScrollDisabled.current) {
            scrollToBottom();
          }
          // 同时检查滚动位置，更新滚动按钮状态
          checkScrollPosition();
        }, 100); // 每100ms检查一次

        return () => clearInterval(intervalId);
      }
    }
  }, [
    chatMessages.map((msg) => msg.isStreaming).join(''),
    isAutoScroll,
    scrollToBottom,
    checkScrollPosition,
  ]);

  /**
   * 监听历史消息加载完成，确保滚动到底部
   */
  useEffect(() => {
    if (!isLoadingHistory && chatMessages.length > 0) {
      // 历史消息加载完成，延迟一点时间确保 DOM 渲染完成
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoadingHistory, chatMessages.length, scrollToBottom]);
};
