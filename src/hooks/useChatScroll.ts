import { throttle } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 聊天滚动管理 Hook
 * 提供自动滚动、滚动按钮、滚动位置检测等功能
 * 重构版本：简洁高效，专注核心功能
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

  /**
   * 滚动到底部（平滑滚动）
   */
  const scrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      isProgrammaticScroll.current = true; // 标记为程序触发
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth', // 使用平滑滚动
      });
      // 更新滚动位置记录
      lastScrollTop.current = chatMessagesRef.current.scrollHeight;
      // 延迟重置标记，确保平滑滚动完成
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500); // 500ms 延迟，确保平滑滚动完全结束
    }
  }, []);

  /**
   * 瞬时滚动到底部（用于特殊场景）
   */
  const instantScrollToBottom = useCallback(() => {
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
   * 处理用户主动滚动事件（内部实现）
   */
  const handleUserScrollInternal = useCallback(() => {
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
    }
    // 如果用户向下滚动且滚动到底部附近（50px内），重新启用自动滚动
    else if (scrollDirection === 'down' && distanceFromBottom <= 50) {
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
   * 处理用户主动滚动事件（节流版本）
   * 使用 200ms 节流，平衡性能和响应速度
   */
  const handleUserScroll = useCallback(
    throttle(handleUserScrollInternal, 200),
    [handleUserScrollInternal],
  );

  /**
   * 滚动按钮点击处理
   */
  const handleScrollButtonClick = useCallback(() => {
    scrollToBottom();
    setIsAutoScroll(true);
    setShowScrollButton(false);
    userScrollDisabled.current = false; // 重置用户禁用标记
  }, [scrollToBottom]);

  /**
   * 强制滚动到底部并开启自动滚动
   */
  const forceScrollToBottomAndEnable = useCallback(() => {
    scrollToBottom();
    setIsAutoScroll(true);
    setShowScrollButton(false);
    userScrollDisabled.current = false; // 重置用户禁用标记
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
    instantScrollToBottom,
    isAtBottom,
    checkScrollPosition,
    handleUserScroll,
    handleScrollButtonClick,
    forceScrollToBottomAndEnable,

    // 状态设置方法
    setIsAutoScroll,
    setShowScrollButton,
  };
};

/**
 * 聊天滚动效果 Hook
 * 处理各种滚动触发场景
 * 重构版本：简洁高效，专注核心功能
 */
export const useChatScrollEffects = (
  chatMessages: any[],
  isLoadingHistory: boolean,
  scrollToBottom: () => void,
  isAutoScroll: boolean,
  checkScrollPosition: () => void,
  userScrollDisabled: React.MutableRefObject<boolean>,
  // chatMessagesRef: React.RefObject<HTMLDivElement>, // 暂时未使用，保留以备将来使用
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
      // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
      const timeoutId = requestAnimationFrame(() => {
        scrollToBottom();
      });

      return () => cancelAnimationFrame(timeoutId);
    }
  }, [chatMessages, isAutoScroll, scrollToBottom]);

  /**
   * 监听消息内容变化，确保内容更新时滚动
   */
  useEffect(() => {
    if (chatMessages.length > 0 && !userScrollDisabled.current) {
      // 检查是否有正在流式传输的消息
      const hasStreamingMessage = chatMessages.some((msg) => msg.isStreaming);

      // 如果有流式消息，强制滚动
      if (hasStreamingMessage) {
        // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
        const timeoutId = requestAnimationFrame(() => {
          scrollToBottom();
        });

        return () => cancelAnimationFrame(timeoutId);
      }
      // 如果没有流式消息，按照正常的自动滚动逻辑
      else if (isAutoScroll) {
        // 使用 requestAnimationFrame 确保在 DOM 更新后滚动
        const timeoutId = requestAnimationFrame(() => {
          scrollToBottom();
        });

        return () => cancelAnimationFrame(timeoutId);
      }
    }
  }, [
    chatMessages.map((msg) => msg.text).join(''),
    chatMessages.map((msg) => msg.isStreaming).join(''),
    isAutoScroll,
    scrollToBottom,
  ]);

  /**
   * 流式消息期间定期检查滚动
   */
  useEffect(() => {
    if (chatMessages.length > 0) {
      // 检查是否有正在流式传输的消息
      const hasStreamingMessage = chatMessages.some((msg) => msg.isStreaming);

      if (hasStreamingMessage) {
        // 流式传输期间，立即滚动到底部
        if (!userScrollDisabled.current) {
          scrollToBottom();
        }

        // 在流式传输期间，定期检查并滚动到底部
        const intervalId = setInterval(() => {
          if (!userScrollDisabled.current) {
            scrollToBottom();
          }
          // 同时检查滚动位置，更新滚动按钮状态
          checkScrollPosition();
        }, 150); // 150ms 检查一次，平衡性能和实时性

        return () => clearInterval(intervalId);
      }
    }
  }, [
    chatMessages.map((msg) => msg.isStreaming).join(''),
    scrollToBottom,
    checkScrollPosition,
    userScrollDisabled,
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

  /**
   * 长内容检测机制
   * 监听消息内容长度变化，处理长内容一次性渲染
   */
  useEffect(() => {
    if (chatMessages.length > 0 && !userScrollDisabled.current) {
      // 检查最后一条消息的内容长度
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage && lastMessage.text && lastMessage.text.length > 500) {
        // 如果是长内容且不是流式消息，延迟滚动确保内容完全渲染
        if (!lastMessage.isStreaming) {
          const timeoutId = setTimeout(() => {
            scrollToBottom();
          }, 200);

          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [
    chatMessages.map((msg) => msg.text?.length || 0).join(','),
    chatMessages.map((msg) => msg.isStreaming).join(','),
    scrollToBottom,
  ]);
};
