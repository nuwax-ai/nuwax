import type { AppDevChatMessage } from '@/types/interfaces/appDev';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FunctionContext,
  StateContext,
  useObserveScrollPosition,
} from 'react-scroll-to-bottom';

/**
 * 滚动相关常量定义
 */
const SCROLL_CONSTANTS = {
  /** 默认节流延迟（毫秒） */
  DEFAULT_THROTTLE_DELAY: 50,
  /** 默认滚动到底部的阈值（像素） */
  DEFAULT_SCROLL_THRESHOLD: 50,
  /** 默认显示滚动按钮的阈值（像素） */
  DEFAULT_SHOW_BUTTON_THRESHOLD: 100,
  /** 流式消息滚动检查间隔（毫秒） */
  STREAM_SCROLL_INTERVAL: 300,
  /** 非流式消息滚动延迟（毫秒） */
  NON_STREAM_SCROLL_DELAY: 100,
  /** 初始化滚动位置检查延迟（毫秒） */
  INITIAL_SCROLL_CHECK_DELAY: 100,
} as const;

/**
 * 基于 react-scroll-to-bottom 的自动滚动管理 Hook
 *
 * 实现流程图逻辑：
 * 1. 容器内容更新 → 检查自动滚动状态 → 启用时强制滚动到底部
 * 2. 监听滚动事件 → 计算滚动位置 → 判断是否接近底部
 * 3. 新消息发送 → 强制滚动到底部 → 保持自动滚动状态
 * 4. 用户手动滚动 → 判断是否接近底部（是→保持，否→取消自动滚动）
 */
export interface UseReactScrollToBottomOptions {
  /** 是否启用自动滚动（默认 true） */
  enableAutoScroll?: boolean;
  /** 滚动节流延迟（默认 50ms） */
  throttleDelay?: number;
  /** 滚动到底部的阈值（默认 50px） */
  scrollThreshold?: number;
  /** 显示滚动按钮的阈值（默认 100px） */
  showButtonThreshold?: number;
}

export interface UseReactScrollToBottomReturn {
  /** 是否启用自动滚动 */
  isAutoScrollEnabled: boolean;
  /** 是否显示滚动按钮 */
  showScrollButton: boolean;
  /** 滚动到底部 */
  scrollToBottom: (options?: { behavior?: 'smooth' | 'auto' }) => void;
  /** 滚动到底部的 ref，用于组件设置实际的滚动方法 */
  scrollToBottomRef: React.MutableRefObject<
    ((options?: { behavior?: 'smooth' | 'auto' }) => void) | null
  >;
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
  handleNewMessage: (isStreaming?: boolean, immediate?: boolean) => void;
  /** 检查滚动位置并更新按钮状态 */
  checkScrollPosition: () => void;
  /** 处理用户向上滚动 */
  handleUserScrollUp: () => void;
  /** 处理用户滚动到底部 */
  handleUserScrollToBottom: () => void;
}

/**
 * 基于 react-scroll-to-bottom 的自动滚动管理 Hook
 *
 * @param options 配置选项
 * @returns 滚动管理相关的方法和状态
 */
export const useReactScrollToBottom = (
  options: UseReactScrollToBottomOptions,
): UseReactScrollToBottomReturn => {
  const {
    enableAutoScroll: initialEnableAutoScroll = true,
    throttleDelay = SCROLL_CONSTANTS.DEFAULT_THROTTLE_DELAY,
    // scrollThreshold = SCROLL_CONSTANTS.DEFAULT_SCROLL_THRESHOLD,
    // showButtonThreshold = SCROLL_CONSTANTS.DEFAULT_SHOW_BUTTON_THRESHOLD,
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
  const scrollToBottomRef = useRef<
    ((options?: { behavior?: 'smooth' | 'auto' }) => void) | null
  >(null);

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback(
    (options?: { behavior?: 'smooth' | 'auto' }) => {
      try {
        // 首先尝试使用 react-scroll-to-bottom 的方法
        if (scrollToBottomRef.current) {
          scrollToBottomRef.current(options || { behavior: 'smooth' });
        }

        // 同时使用原生滚动方法作为备选
        const scrollContainer = document.querySelector(
          '.react-scroll-to-bottom-container .scroll-container-inner',
        );
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: options?.behavior || 'smooth',
          });
        }
      } catch (error) {
        console.error('[useReactScrollToBottom] 滚动到底部失败:', error);
      }
    },
    [],
  );

  /**
   * 检查是否在底部
   */
  const isAtBottom = useCallback(() => {
    try {
      // 这里将在 ScrollToBottom 组件内部通过 Context 获取实际的检查方法
      console.log('[useReactScrollToBottom] 检查是否在底部');
      return false;
    } catch (error) {
      console.error('[useReactScrollToBottom] 检查滚动位置失败:', error);
      return false;
    }
  }, []);

  /**
   * 检查滚动位置并更新按钮状态
   */
  const checkScrollPosition = useCallback(() => {
    try {
      // 这里将在 ScrollToBottom 组件内部通过 Context 获取实际的检查方法
    } catch (error) {
      console.error('[useReactScrollToBottom] 检查滚动位置失败:', error);
    }
  }, []);

  /**
   * 处理用户向上滚动
   */
  const handleUserScrollUp = useCallback(() => {
    allowAutoScrollRef.current = false;
    setIsAutoScrollEnabled(false);
    isUserScrollingRef.current = true;
    setShowScrollButton(true);

    // 注意：流式消息期间的定时滚动仍然会继续
    // 这样可以确保用户即使滚动过，也能看到新的流式内容
  }, []);

  /**
   * 处理用户滚动到底部
   */
  const handleUserScrollToBottom = useCallback(() => {
    allowAutoScrollRef.current = true;
    setIsAutoScrollEnabled(true);
    isUserScrollingRef.current = false;
    setShowScrollButton(false);

    // 如果当前正在流式消息，立即滚动到底部确保用户看到最新内容
    // 注意：流式消息的定时滚动会继续工作
  }, []);

  /**
   * 处理用户滚动事件
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUserScroll = useCallback(() => {
    try {
      // 清除之前的定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      // 延迟检查滚动位置，避免频繁更新
      scrollTimeoutRef.current = setTimeout(() => {
        checkScrollPosition();
      }, throttleDelay);
    } catch (error) {
      console.error('[useReactScrollToBottom] 处理用户滚动事件失败:', error);
    }
  }, [throttleDelay, checkScrollPosition]);

  /**
   * 处理滚动按钮点击
   */
  const handleScrollButtonClick = useCallback(() => {
    scrollToBottom({ behavior: 'smooth' });
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
   * @param immediate 是否立即滚动（忽略延迟）
   */
  const handleNewMessage = useCallback(
    (isStreaming = false, immediate = false) => {
      try {
        // 对于用户消息（immediate = true），强制滚动到底部并开启自动滚动
        if (immediate) {
          // 强制启用自动滚动
          allowAutoScrollRef.current = true;
          setIsAutoScrollEnabled(true);
          // 重置用户滚动状态
          isUserScrollingRef.current = false;
          // 立即滚动到底部，使用平滑滚动
          scrollToBottom({ behavior: 'smooth' });
          return;
        }

        // 如果启用自动滚动且用户没有主动滚动，则滚动到底部
        if (allowAutoScrollRef.current && !isUserScrollingRef.current) {
          // 对于流式消息，使用平滑滚动
          if (isStreaming) {
            scrollToBottom({ behavior: 'smooth' });
          } else {
            // 对于非流式消息，延迟一点时间确保 DOM 更新完成
            setTimeout(() => {
              if (allowAutoScrollRef.current) {
                scrollToBottom({ behavior: 'smooth' });
              }
            }, SCROLL_CONSTANTS.NON_STREAM_SCROLL_DELAY);
          }
        }
      } catch (error) {
        console.error('[useReactScrollToBottom] 处理新消息失败:', error);
      }
    },
    [scrollToBottom],
  );

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
    scrollToBottomRef,
    handleScrollButtonClick,
    enableAutoScroll,
    disableAutoScroll,
    resetAutoScroll,
    isAtBottom,
    handleNewMessage,
    checkScrollPosition,
    handleUserScrollUp,
    handleUserScrollToBottom,
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
 * @param checkScrollPosition 检查滚动位置的方法
 */
export const useReactScrollToBottomEffects = (
  messages: AppDevChatMessage[],
  isStreaming: boolean,
  scrollToBottom: (options?: { behavior?: 'smooth' | 'auto' }) => void,
  isAutoScrollEnabled: boolean,
  handleNewMessage: (isStreaming?: boolean, immediate?: boolean) => void,
  checkScrollPosition: () => void,
) => {
  // 跟踪是否是首次加载历史消息
  const isInitialLoadRef = useRef(true);
  const previousMessagesLengthRef = useRef(0);

  // 使用 useMemo 缓存消息内容和流式状态，避免不必要的重渲染
  const messagesContent = useMemo(() => {
    return messages.map((msg) => msg.text || '').join('');
  }, [messages]);

  const messagesStreamingStatus = useMemo(() => {
    return messages.map((msg) => msg.isStreaming || false).join('');
  }, [messages]);

  // 监听消息变化
  useEffect(() => {
    if (messages.length > 0) {
      // 检查是否是首次加载历史消息
      const isInitialLoad = isInitialLoadRef.current && messages.length > 0;
      // const isNewMessage = messages.length > previousMessagesLengthRef.current;

      // 更新消息长度记录
      previousMessagesLengthRef.current = messages.length;

      // 如果是首次加载历史消息，滚动到底部
      if (isInitialLoad) {
        isInitialLoadRef.current = false;

        // 尝试立即滚动
        scrollToBottom({ behavior: 'smooth' });

        // 延迟一点时间确保 DOM 渲染完成，再次尝试滚动
        setTimeout(() => {
          scrollToBottom({ behavior: 'smooth' });
        }, 100);

        // 再次延迟，确保 react-scroll-to-bottom 的 Context 准备好
        setTimeout(() => {
          scrollToBottom({ behavior: 'smooth' });
        }, 300);

        return;
      }

      // 检查最后一条消息是否为用户消息
      const lastMessage = messages[messages.length - 1];
      const isUserMessage = lastMessage && lastMessage.role === 'USER';

      // 如果是用户消息，立即滚动；否则按照流式状态处理
      if (isUserMessage) {
        handleNewMessage(false, true); // 用户消息立即滚动
      } else {
        handleNewMessage(isStreaming);
      }

      // 检查滚动位置，更新按钮状态
      checkScrollPosition();
    }
  }, [
    messages.length,
    isStreaming,
    handleNewMessage,
    checkScrollPosition,
    messages,
    scrollToBottom,
  ]);

  // 监听流式消息内容变化
  useEffect(() => {
    if (isStreaming) {
      // 流式消息期间，无论用户是否滚动过，都定期滚动到底部
      // 这样可以确保流式消息内容始终可见
      const intervalId = setInterval(() => {
        scrollToBottom({ behavior: 'smooth' });
      }, SCROLL_CONSTANTS.STREAM_SCROLL_INTERVAL);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isStreaming, scrollToBottom]);

  // 监听消息内容变化（用于流式消息内容更新）
  useEffect(() => {
    if (messages.length > 0 && isAutoScrollEnabled) {
      // 检查最后一条消息是否为流式消息
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        // 流式消息内容更新时，使用平滑滚动
        scrollToBottom({ behavior: 'smooth' });
      }
    }
  }, [
    messagesContent,
    messagesStreamingStatus,
    isAutoScrollEnabled,
    scrollToBottom,
    messages,
  ]);
};

/**
 * 滚动位置观察器组件
 * 用于监听滚动位置变化并更新状态
 */
export const ScrollPositionObserver: React.FC<{
  onScrollChange: (scrollTop: number, isAtBottom: boolean) => void;
  onUserScrollUp?: () => void;
  onUserScrollToBottom?: () => void;
  enabled?: boolean;
}> = ({
  onScrollChange,
  onUserScrollUp,
  onUserScrollToBottom,
  enabled = true,
}) => {
  const previousScrollTopRef = useRef(0);
  const hasScrolledUpRef = useRef(false);
  const backupPreviousScrollTopRef = useRef(0);

  const observer = useCallback(
    ({ scrollTop }: { scrollTop: number }) => {
      if (!enabled) return;

      // 计算滚动容器的高度和内容高度
      // 尝试多个可能的滚动容器选择器
      const possibleContainers = [
        '.react-scroll-to-bottom-container .scroll-container-inner',
        '.react-scroll-to-bottom-container [class*="react-scroll-to-bottom"]',
        '.react-scroll-to-bottom-container',
      ];

      let scrollContainer = null;
      for (const selector of possibleContainers) {
        scrollContainer = document.querySelector(selector);
        if (scrollContainer) {
          break;
        }
      }

      if (!scrollContainer) {
        console.warn('[ScrollPositionObserver] 未找到滚动容器');
        return;
      }

      const containerHeight = scrollContainer.clientHeight;
      const contentHeight = scrollContainer.scrollHeight;
      const threshold = 50; // 增加容差到 50px
      const isAtBottom =
        scrollTop + containerHeight >= contentHeight - threshold;

      // 检测用户是否向上滚动
      if (previousScrollTopRef.current > 0) {
        const scrollDelta = scrollTop - previousScrollTopRef.current;

        // 如果用户向上滚动且不在底部，则取消自动滚动
        if (
          scrollDelta < -5 &&
          !isAtBottom &&
          onUserScrollUp &&
          !hasScrolledUpRef.current
        ) {
          hasScrolledUpRef.current = true;
          onUserScrollUp();
        }

        // 如果用户滚动到底部，重新启用自动滚动
        if (isAtBottom && hasScrolledUpRef.current && onUserScrollToBottom) {
          hasScrolledUpRef.current = false;
          onUserScrollToBottom();
        }
      }

      previousScrollTopRef.current = scrollTop;
      // 不再调用 onScrollChange，依赖库的状态
      // onScrollChange(scrollTop, isAtBottom);
    },
    [onScrollChange, onUserScrollUp, onUserScrollToBottom, enabled],
  );

  useObserveScrollPosition(observer);

  // 添加备用的滚动事件监听器
  React.useEffect(() => {
    if (!enabled) return;

    // 尝试多个可能的滚动容器选择器
    const possibleContainers = [
      '.react-scroll-to-bottom-container .scroll-container-inner',
      '.react-scroll-to-bottom-container [class*="react-scroll-to-bottom"]',
      '.react-scroll-to-bottom-container',
    ];

    let scrollContainer = null;
    for (const selector of possibleContainers) {
      scrollContainer = document.querySelector(selector);
      if (scrollContainer) {
        break;
      }
    }

    if (!scrollContainer) {
      console.warn('[ScrollPositionObserver] 备用监听器未找到滚动容器');
      return;
    }

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const contentHeight = scrollContainer.scrollHeight;
      const threshold = 50; // 增加容差到 50px
      const isAtBottom =
        scrollTop + containerHeight >= contentHeight - threshold;

      // 检测用户是否向上滚动
      if (backupPreviousScrollTopRef.current > 0) {
        const scrollDelta = scrollTop - backupPreviousScrollTopRef.current;

        // 如果用户向上滚动且不在底部，则取消自动滚动
        if (
          scrollDelta < -5 &&
          !isAtBottom &&
          onUserScrollUp &&
          !hasScrolledUpRef.current
        ) {
          hasScrolledUpRef.current = true;
          onUserScrollUp();
        }

        // 如果用户滚动到底部，重新启用自动滚动
        if (isAtBottom && hasScrolledUpRef.current && onUserScrollToBottom) {
          hasScrolledUpRef.current = false;
          onUserScrollToBottom();
        }
      }

      backupPreviousScrollTopRef.current = scrollTop;
      onScrollChange(scrollTop, isAtBottom);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);

  return null;
};

/**
 * 滚动控制组件
 * 使用 react-scroll-to-bottom 的 Context API 获取滚动控制方法
 */
export const ScrollController: React.FC<{
  children: (context: {
    scrollToBottom: (options?: { behavior?: 'smooth' | 'auto' }) => void;
    scrollToTop: () => void;
    scrollTo: (scrollTop: number | '100%') => void;
    atBottom: boolean;
    atTop: boolean;
    sticky: boolean;
  }) => React.ReactNode;
}> = ({ children }) => {
  return (
    <FunctionContext.Consumer>
      {(functionContext) => {
        return (
          <StateContext.Consumer>
            {(stateContext) => {
              return children({
                scrollToBottom: (options = { behavior: 'smooth' }) => {
                  functionContext.scrollToBottom(options);
                },
                scrollToTop: functionContext.scrollToTop,
                scrollTo: functionContext.scrollTo,
                atBottom: stateContext.atBottom,
                atTop: stateContext.atTop,
                sticky: stateContext.sticky,
              });
            }}
          </StateContext.Consumer>
        );
      }}
    </FunctionContext.Consumer>
  );
};
