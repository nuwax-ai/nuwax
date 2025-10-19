import { throttle } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 流式消息自动滚动管理 Hook
 * 专门处理流式消息的自动滚动和用户交互控制
 *
 * 主要功能：
 * 1. 流式消息期间自动滚动到底部
 * 2. 用户手动滚动时暂停自动滚动
 * 3. 滚动按钮显示和点击处理
 * 4. 自动滚动状态管理
 */
export interface UseStreamMessageScrollOptions {
  /** 滚动容器引用 */
  scrollContainerRef: React.RefObject<HTMLElement>;
  /** 是否启用自动滚动（默认 true） */
  enableAutoScroll?: boolean;
  /** 滚动节流延迟（默认 300ms） */
  throttleDelay?: number;
  /** 滚动到底部的阈值（默认 50px） */
  scrollThreshold?: number;
  /** 显示滚动按钮的阈值（默认 100px） */
  showButtonThreshold?: number;
}

export interface UseStreamMessageScrollReturn {
  /** 是否启用自动滚动 */
  isAutoScrollEnabled: boolean;
  /** 是否显示滚动按钮 */
  showScrollButton: boolean;
  /** 滚动到底部 */
  scrollToBottom: () => void;
  /** 手动滚动到底部并启用自动滚动 */
  handleScrollButtonClick: () => void;
  /** 强制启用自动滚动 */
  enableAutoScroll: () => void;
  /** 禁用自动滚动 */
  disableAutoScroll: () => void;
  /** 重置自动滚动状态 */
  resetAutoScroll: () => void;
  /** 检查是否在底部 */
  isAtBottom: () => boolean;
  /** 处理新消息到达 */
  handleNewMessage: (isStreaming?: boolean) => void;
  /** 检查滚动位置并更新按钮状态 */
  checkScrollPosition: () => void;
}

/**
 * 流式消息自动滚动管理 Hook
 *
 * @param options 配置选项
 * @returns 滚动管理相关的方法和状态
 */
export const useStreamMessageScroll = (
  options: UseStreamMessageScrollOptions,
): UseStreamMessageScrollReturn => {
  const {
    scrollContainerRef,
    enableAutoScroll: initialEnableAutoScroll = true,
    throttleDelay = 300,
    scrollThreshold = 50,
    showButtonThreshold = 100,
  } = options;

  // 状态管理
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(
    initialEnableAutoScroll,
  );
  const [showScrollButton, setShowScrollButton] = useState(false);

  // 引用管理
  const allowAutoScrollRef = useRef(initialEnableAutoScroll);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef(false);

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [scrollContainerRef]);

  /**
   * 检查是否在底部
   */
  const isAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom <= scrollThreshold;
  }, [scrollContainerRef, scrollThreshold]);

  /**
   * 检查滚动位置并更新按钮状态
   */
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 如果距离底部超过阈值，显示滚动按钮
    if (distanceFromBottom > showButtonThreshold) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  }, [scrollContainerRef, showButtonThreshold]);

  /**
   * 处理用户滚动事件
   */
  const handleUserScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }

    // 如果用户滚动到非底部区域，暂停自动滚动
    if (distanceFromBottom > scrollThreshold) {
      allowAutoScrollRef.current = false;
      setIsAutoScrollEnabled(false);
      setShowScrollButton(true);
      isUserScrollingRef.current = true;
    } else {
      // 如果用户滚动到底部，重新启用自动滚动
      allowAutoScrollRef.current = true;
      setIsAutoScrollEnabled(true);
      setShowScrollButton(false);
      isUserScrollingRef.current = false;
    }

    // 延迟检查滚动位置，避免频繁更新
    scrollTimeoutRef.current = setTimeout(() => {
      checkScrollPosition();
    }, throttleDelay);
  }, [
    scrollContainerRef,
    scrollThreshold,
    showButtonThreshold,
    throttleDelay,
    checkScrollPosition,
  ]);

  /**
   * 处理滚动按钮点击
   */
  const handleScrollButtonClick = useCallback(() => {
    scrollToBottom();
    allowAutoScrollRef.current = true;
    setIsAutoScrollEnabled(true);
    setShowScrollButton(false);
    isUserScrollingRef.current = false;
  }, [scrollToBottom]);

  /**
   * 强制启用自动滚动
   */
  const enableAutoScroll = useCallback(() => {
    allowAutoScrollRef.current = true;
    setIsAutoScrollEnabled(true);
    isUserScrollingRef.current = false;
  }, []);

  /**
   * 禁用自动滚动
   */
  const disableAutoScroll = useCallback(() => {
    allowAutoScrollRef.current = false;
    setIsAutoScrollEnabled(false);
    isUserScrollingRef.current = true;
  }, []);

  /**
   * 重置自动滚动状态
   */
  const resetAutoScroll = useCallback(() => {
    allowAutoScrollRef.current = initialEnableAutoScroll;
    setIsAutoScrollEnabled(initialEnableAutoScroll);
    setShowScrollButton(false);
    isUserScrollingRef.current = false;

    // 清理定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, [initialEnableAutoScroll]);

  /**
   * 处理新消息到达
   * @param isStreaming 是否为流式消息
   */
  const handleNewMessage = useCallback(
    (isStreaming = false) => {
      // 如果启用自动滚动且用户没有主动滚动，则滚动到底部
      if (allowAutoScrollRef.current && !isUserScrollingRef.current) {
        // 对于流式消息，立即滚动
        if (isStreaming) {
          scrollToBottom();
        } else {
          // 对于非流式消息，延迟一点时间确保 DOM 更新完成
          setTimeout(() => {
            if (allowAutoScrollRef.current) {
              scrollToBottom();
            }
          }, 100);
        }
      }
    },
    [scrollToBottom],
  );

  // 初始化滚动事件监听
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // 创建节流版本的滚动处理函数
    const throttledHandleScroll = throttle(handleUserScroll, throttleDelay);

    // 添加滚动事件监听
    container.addEventListener('wheel', throttledHandleScroll);
    container.addEventListener('scroll', throttledHandleScroll);

    // 初始化滚动位置检查
    checkScrollPosition();

    // 延迟检查一次，确保 DOM 完全渲染后检查
    const timeoutId = setTimeout(() => {
      checkScrollPosition();
    }, 100);

    return () => {
      container.removeEventListener('wheel', throttledHandleScroll);
      container.removeEventListener('scroll', throttledHandleScroll);

      // 清理定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      clearTimeout(timeoutId);
    };
  }, [
    scrollContainerRef,
    handleUserScroll,
    throttleDelay,
    checkScrollPosition,
  ]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    isAutoScrollEnabled,
    showScrollButton,
    scrollToBottom,
    handleScrollButtonClick,
    enableAutoScroll,
    disableAutoScroll,
    resetAutoScroll,
    isAtBottom,
    handleNewMessage,
    checkScrollPosition,
  };
};

/**
 * 流式消息滚动效果 Hook
 * 处理流式消息期间的自动滚动效果
 *
 * @param messages 消息列表
 * @param isStreaming 是否正在流式传输
 * @param scrollToBottom 滚动到底部的方法
 * @param isAutoScrollEnabled 是否启用自动滚动
 * @param handleNewMessage 处理新消息的方法
 */
export const useStreamMessageScrollEffects = (
  messages: any[],
  isStreaming: boolean,
  scrollToBottom: () => void,
  isAutoScrollEnabled: boolean,
  handleNewMessage: (isStreaming?: boolean) => void,
  checkScrollPosition: () => void,
) => {
  // 监听消息变化
  useEffect(() => {
    if (messages.length > 0) {
      handleNewMessage(isStreaming);
      // 检查滚动位置，更新按钮状态
      checkScrollPosition();
    }
  }, [messages.length, isStreaming, handleNewMessage, checkScrollPosition]);

  // 监听流式消息内容变化
  useEffect(() => {
    if (isStreaming && isAutoScrollEnabled) {
      // 流式消息期间，定期滚动到底部
      const intervalId = setInterval(() => {
        scrollToBottom();
      }, 150); // 150ms 检查一次

      return () => clearInterval(intervalId);
    }
  }, [isStreaming, isAutoScrollEnabled, scrollToBottom]);

  // 监听消息内容变化（用于流式消息内容更新）
  useEffect(() => {
    if (messages.length > 0 && isAutoScrollEnabled) {
      // 检查最后一条消息是否为流式消息
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        // 流式消息内容更新时，立即滚动
        scrollToBottom();
      }
    }
  }, [
    messages.map((msg) => msg.text || '').join(''),
    messages.map((msg) => msg.isStreaming).join(''),
    isAutoScrollEnabled,
    scrollToBottom,
  ]);
};
