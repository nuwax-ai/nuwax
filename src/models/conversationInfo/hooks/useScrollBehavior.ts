/**
 * 滚动行为管理 Hook
 * 管理消息视图的滚动行为
 */

import { useCallback, useRef, useState } from 'react';
import type { ScrollBehaviorReturn } from '../types';

export const useScrollBehavior = (): ScrollBehaviorReturn => {
  // 消息视图 ref
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  // 滚动定时器 ref
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);
  // 是否显示点击下滚按钮
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);

  /**
   * 滚动到底部
   */
  const messageViewScrollToBottom = useCallback(() => {
    // 只有在允许自动滚动时才执行滚动
    if (!allowAutoScrollRef.current) {
      return;
    }
    // 滚动到底部
    const element = messageViewRef.current;
    if (element) {
      // 标记为程序触发的滚动，避免被误判为用户滚动
      (element as any).__isProgrammaticScroll = true;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
      // 在滚动完成后清除标记（smooth 滚动大约需要 500ms）
      setTimeout(() => {
        (element as any).__isProgrammaticScroll = false;
      }, 600);
    }
  }, []);

  /**
   * 处理滚动到底部（带延迟）
   */
  const handleScrollBottom = useCallback(() => {
    if (allowAutoScrollRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        messageViewScrollToBottom();
      }, 400);
    }
  }, [messageViewScrollToBottom]);

  return {
    messageViewRef,
    scrollTimeoutRef,
    allowAutoScrollRef,
    showScrollBtn,
    setShowScrollBtn,
    messageViewScrollToBottom,
    handleScrollBottom,
  };
};
