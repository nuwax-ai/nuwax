import {
  ScrollController,
  ScrollPositionObserver,
  useReactScrollToBottom,
  useReactScrollToBottomEffects,
} from '@/pages/AppDev/hooks/useReactScrollToBottom';
import type { AppDevChatMessage } from '@/types/interfaces/appDev';
import classNames from 'classnames';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 滚动状态处理器组件
 * 暂时不使用，所有状态检测都通过备用监听器处理
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const ScrollStateHandler: React.FC<{
//   atBottom: boolean;
//   onScrollPositionChange?: (isAtBottom: boolean) => void;
//   children: React.ReactNode;
// }> = ({ children }) => {
//   // 完全禁用库的状态检测，使用备用检测
//   return <>{children}</>;
// };

/**
 * 基于 react-scroll-to-bottom 的滚动容器组件的引用接口
 */
export interface ReactScrollToBottomContainerRef {
  /** 滚动到底部 */
  scrollToBottom: (options?: { behavior?: 'smooth' | 'auto' }) => void;
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
  /** 获取滚动容器元素 */
  getScrollContainer: () => HTMLDivElement | null;
}

/**
 * 基于 react-scroll-to-bottom 的滚动容器组件的 Props
 */
export interface ReactScrollToBottomContainerProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 消息列表 */
  messages: AppDevChatMessage[];
  /** 是否正在流式传输 */
  isStreaming?: boolean;
  /** 是否启用自动滚动（默认 true） */
  enableAutoScroll?: boolean;
  /** 滚动节流延迟（默认 50ms） */
  throttleDelay?: number;
  /** 滚动到底部的阈值（默认 50px） */
  scrollThreshold?: number;
  /** 显示滚动按钮的阈值（默认 100px） */
  showButtonThreshold?: number;
  /** 容器样式类名 */
  className?: string;
  /** 容器内联样式 */
  style?: React.CSSProperties;
  /** 自动滚动状态变化回调 */
  onAutoScrollChange?: (enabled: boolean) => void;
  /** 滚动位置变化回调 */
  onScrollPositionChange?: (isAtBottom: boolean) => void;
  /** 滚动到顶部回调 */
  onScrollToTop?: () => void;
}

/**
 * 基于 react-scroll-to-bottom 的滚动容器组件
 *
 * 功能特性：
 * 1. 使用 react-scroll-to-bottom 库实现自动滚动
 * 2. 根据流程图实现智能滚动逻辑
 * 3. 支持流式消息的自动滚动
 * 4. 提供与 StreamMessageScrollContainer 相同的接口
 *
 * @param props 组件属性
 * @param ref 组件引用
 */
const ReactScrollToBottomContainer = forwardRef<
  ReactScrollToBottomContainerRef,
  ReactScrollToBottomContainerProps
>(
  (
    {
      children,
      messages = [],
      isStreaming = false,
      enableAutoScroll = true,
      throttleDelay = 50,
      scrollThreshold = 50,
      showButtonThreshold = 100,
      className,
      style,
      onAutoScrollChange,
      onScrollPositionChange,
      onScrollToTop,
    },
    ref,
  ) => {
    // 滚动容器引用
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 使用基于 react-scroll-to-bottom 的滚动 Hook
    const {
      isAutoScrollEnabled,
      // showScrollButton,
      scrollToBottom: hookScrollToBottom,
      scrollToBottomRef,
      handleScrollButtonClick: internalHandleScrollButtonClick,
      enableAutoScroll: internalEnableAutoScroll,
      disableAutoScroll: internalDisableAutoScroll,
      resetAutoScroll: internalResetAutoScroll,
      isAtBottom: internalIsAtBottom,
      handleNewMessage,
      checkScrollPosition,
      handleUserScrollUp,
      handleUserScrollToBottom,
      allowAutoScrollRef,
      isUserScrollingRef,
    } = useReactScrollToBottom({
      enableAutoScroll,
      throttleDelay,
      scrollThreshold,
      showButtonThreshold,
    });

    // 暴露滚动容器给 Hook 使用
    React.useImperativeHandle(
      scrollToBottomRef,
      () => {
        return (options?: { behavior?: 'smooth' | 'auto' }) => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: options?.behavior || 'smooth',
            });
          }
        };
      },
      [],
    );

    // 实际的滚动控制方法（通过 Context 获取）
    const actualScrollToBottom = useRef<
      ((options?: { behavior?: 'smooth' | 'auto' }) => void) | null
    >(null);
    const actualIsAtBottom = useRef<(() => boolean) | null>(null);
    const actualCheckScrollPosition = useRef<(() => void) | null>(null);

    // 包装后的方法，使用实际的滚动控制
    const scrollToBottom = useCallback(
      (options?: { behavior?: 'smooth' | 'auto' }) => {
        if (actualScrollToBottom.current) {
          actualScrollToBottom.current(options || { behavior: 'smooth' });
        }
      },
      [],
    );

    const isAtBottom = useCallback(() => {
      if (actualIsAtBottom.current) {
        return actualIsAtBottom.current();
      }
      return internalIsAtBottom();
    }, [internalIsAtBottom]);

    const checkScrollPositionWrapper = useCallback(() => {
      if (actualCheckScrollPosition.current) {
        actualCheckScrollPosition.current();
      } else {
        checkScrollPosition();
      }
    }, [checkScrollPosition]);

    // 使用滚动效果 Hook
    useReactScrollToBottomEffects(
      messages,
      isStreaming,
      hookScrollToBottom,
      isAutoScrollEnabled,
      handleNewMessage,
      checkScrollPositionWrapper,
      allowAutoScrollRef,
      isUserScrollingRef,
    );

    // 暴露组件方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom,
        handleScrollButtonClick: internalHandleScrollButtonClick,
        enableAutoScroll: internalEnableAutoScroll,
        disableAutoScroll: internalDisableAutoScroll,
        resetAutoScroll: internalResetAutoScroll,
        isAtBottom,
        handleNewMessage,
        checkScrollPosition: checkScrollPositionWrapper,
        getScrollContainer: () => scrollContainerRef.current,
      }),
      [
        hookScrollToBottom,
        internalHandleScrollButtonClick,
        internalEnableAutoScroll,
        internalDisableAutoScroll,
        internalResetAutoScroll,
        isAtBottom,
        handleNewMessage,
        checkScrollPositionWrapper,
      ],
    );

    // 监听自动滚动状态变化
    useEffect(() => {
      onAutoScrollChange?.(isAutoScrollEnabled);
    }, [isAutoScrollEnabled, onAutoScrollChange]);

    // 监听滚动位置变化
    // useEffect(() => {
    //   const checkPosition = () => {
    //     // const atBottom = isAtBottom();
    //     // 完全禁用库的状态检查，使用备用检测
    //     // onScrollPositionChange?.(atBottom);
    //   };

    //   checkPosition();
    // }, [isAtBottom, onScrollPositionChange]);

    // 添加备用滚动监听器，确保滚动位置检测正常工作
    useEffect(() => {
      const timer = setTimeout(() => {
        const scrollContainer = document.querySelector(
          '.react-scroll-to-bottom-container .scroll-container-inner',
        );
        if (!scrollContainer) {
          return;
        }

        let lastIsAtBottom = true; // 记录上次的状态，避免重复调用
        let lastIsAtTop = false; // 记录上次是否在顶部

        const handleScroll = () => {
          const scrollTop = scrollContainer.scrollTop;
          const containerHeight = scrollContainer.clientHeight;
          const contentHeight = scrollContainer.scrollHeight;
          const threshold = 150; // 增加检测范围到 150px
          const isAtBottom =
            scrollTop + containerHeight >= contentHeight - threshold;

          // 检测是否滚动到顶部
          const isAtTop = scrollTop <= 50; // 距离顶部50px内视为在顶部

          // 只有状态发生变化时才调用回调
          if (isAtBottom !== lastIsAtBottom) {
            lastIsAtBottom = isAtBottom;
            onScrollPositionChange?.(isAtBottom);
          }

          // 检测滚动到顶部
          if (isAtTop && !lastIsAtTop) {
            lastIsAtTop = true;
            onScrollToTop?.();
          } else if (!isAtTop && lastIsAtTop) {
            lastIsAtTop = false;
          }
        };

        scrollContainer.addEventListener('scroll', handleScroll, {
          passive: true,
        });
        handleScroll(); // 立即检查一次

        return () => {
          scrollContainer.removeEventListener('scroll', handleScroll);
        };
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }, []);

    return (
      <div
        className={cx('react-scroll-to-bottom-container', className)}
        style={style}
      >
        <ScrollToBottom
          mode="bottom"
          followButtonClassName={cx('scroll-to-bottom-button')}
        >
          <ScrollController>
            {({ scrollToBottom: contextScrollToBottom, atBottom }) => {
              // 完全禁用库的状态检测，避免冲突
              // console.log('[ScrollController] atBottom 状态:', atBottom);

              // 直接设置 ref，不使用 useEffect
              scrollToBottomRef.current = contextScrollToBottom;
              actualScrollToBottom.current = contextScrollToBottom;
              actualIsAtBottom.current = () => atBottom;
              actualCheckScrollPosition.current = () => {
                // 完全禁用库的状态检查，使用备用检测
                // const isAtBottomNow = atBottom;
                // onScrollPositionChange?.(isAtBottomNow);
              };

              return (
                <div
                  ref={scrollContainerRef}
                  className={cx('scroll-container-inner')}
                >
                  {/* 滚动位置观察器 - 仅用于用户滚动检测 */}
                  <ScrollPositionObserver
                    onScrollChange={() => {
                      // 不再使用自定义计算，依赖库的状态
                    }}
                    onUserScrollUp={handleUserScrollUp}
                    onUserScrollToBottom={handleUserScrollToBottom}
                    enabled={true}
                  />
                  {children}
                </div>
              );
            }}
          </ScrollController>
        </ScrollToBottom>
      </div>
    );
  },
);

ReactScrollToBottomContainer.displayName = 'ReactScrollToBottomContainer';

export default ReactScrollToBottomContainer;
