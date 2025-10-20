import {
  useStreamMessageScroll,
  useStreamMessageScrollEffects,
} from '@/pages/AppDev/hooks/useStreamMessageScroll';
import classNames from 'classnames';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 流式消息滚动容器组件的引用接口
 */
export interface StreamMessageScrollContainerRef {
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
  /** 获取滚动容器元素 */
  getScrollContainer: () => HTMLDivElement | null;
}

/**
 * 流式消息滚动容器组件的 Props
 */
export interface StreamMessageScrollContainerProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 消息列表 */
  messages: any[];
  /** 是否正在流式传输 */
  isStreaming?: boolean;
  /** 是否启用自动滚动（默认 true） */
  enableAutoScroll?: boolean;
  /** 滚动节流延迟（默认 300ms） */
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
}

/**
 * 流式消息滚动容器组件
 *
 * 功能特性：
 * 1. 自动管理流式消息的滚动行为
 * 2. 用户手动滚动时智能暂停/恢复自动滚动
 * 3. 提供滚动按钮和状态控制
 * 4. 支持自定义样式和配置
 *
 * @param props 组件属性
 * @param ref 组件引用
 */
const StreamMessageScrollContainer = forwardRef<
  StreamMessageScrollContainerRef,
  StreamMessageScrollContainerProps
>(
  (
    {
      children,
      messages = [],
      isStreaming = false,
      enableAutoScroll = true,
      throttleDelay = 300,
      scrollThreshold = 50,
      showButtonThreshold = 100,
      className,
      style,
      onAutoScrollChange,
      onScrollPositionChange,
    },
    ref,
  ) => {
    // 滚动容器引用
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 使用流式消息滚动 Hook
    const {
      isAutoScrollEnabled,
      scrollToBottom,
      handleScrollButtonClick: internalHandleScrollButtonClick,
      enableAutoScroll: internalEnableAutoScroll,
      disableAutoScroll: internalDisableAutoScroll,
      resetAutoScroll: internalResetAutoScroll,
      isAtBottom,
      handleNewMessage,
      checkScrollPosition,
    } = useStreamMessageScroll({
      scrollContainerRef,
      enableAutoScroll,
      throttleDelay,
      scrollThreshold,
      showButtonThreshold,
    });

    // 使用滚动效果 Hook
    useStreamMessageScrollEffects(
      messages,
      isStreaming,
      scrollToBottom,
      isAutoScrollEnabled,
      handleNewMessage,
      checkScrollPosition,
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
        checkScrollPosition,
        getScrollContainer: () => scrollContainerRef.current,
      }),
      [
        scrollToBottom,
        internalHandleScrollButtonClick,
        internalEnableAutoScroll,
        internalDisableAutoScroll,
        internalResetAutoScroll,
        isAtBottom,
        handleNewMessage,
        checkScrollPosition,
      ],
    );

    // 监听自动滚动状态变化
    React.useEffect(() => {
      onAutoScrollChange?.(isAutoScrollEnabled);
    }, [isAutoScrollEnabled, onAutoScrollChange]);

    // 监听滚动位置变化
    React.useEffect(() => {
      const checkPosition = () => {
        const atBottom = isAtBottom();
        onScrollPositionChange?.(atBottom);
      };

      checkPosition();

      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener('scroll', checkPosition);
        return () => container.removeEventListener('scroll', checkPosition);
      }
    }, [isAtBottom, onScrollPositionChange]);

    return (
      <div
        className={cx('stream-message-scroll-container', className)}
        style={style}
      >
        {/* 滚动容器 */}
        <div ref={scrollContainerRef} className={cx('scroll-container')}>
          {children}
        </div>
      </div>
    );
  },
);

StreamMessageScrollContainer.displayName = 'StreamMessageScrollContainer';

export default StreamMessageScrollContainer;
