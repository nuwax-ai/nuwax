import { throttle } from 'lodash';
import { useEffect, useRef } from 'react';

/**
 * 会话滚动检测 Hook
 * 用于检测用户滚动行为，控制自动滚动的启用/禁用
 *
 * 功能特性：
 * 1. 向上滚动时立即禁用自动滚动（最高优先级）
 * 2. 区分程序滚动和用户滚动
 * 3. 向下滚动到底部时重新启用自动滚动
 * 4. 支持所有滚动方式（鼠标滚轮、拖拽滚动条、触摸滑动等）
 *
 * @param messageViewRef - 消息容器的 ref
 * @param allowAutoScrollRef - 控制是否允许自动滚动的 ref
 * @param scrollTimeoutRef - 滚动定时器的 ref
 * @param setShowScrollBtn - 设置是否显示滚动按钮的函数
 */
export const useConversationScrollDetection = (
  messageViewTarget: React.RefObject<HTMLDivElement> | HTMLDivElement | null,
  allowAutoScrollRef: React.MutableRefObject<boolean>,
  scrollTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setShowScrollBtn: (show: boolean) => void,
) => {
  // 记录上一次滚动位置，用于判断滚动方向
  const lastScrollTopRef = useRef<number>(0);

  useEffect(() => {
    const messageView =
      messageViewTarget && 'current' in messageViewTarget
        ? messageViewTarget.current
        : messageViewTarget;

    if (!messageView) {
      return;
    }

    // 初始化上一次滚动位置
    lastScrollTopRef.current = messageView.scrollTop;

    // 节流版本（用于向下滚动等非紧急情况）
    const handleScrollThrottled = throttle(() => {
      const { scrollTop, scrollHeight, clientHeight } = messageView;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // 如果用户向下滚动到离底部50px内，重新启用自动滚动
      if (distanceFromBottom <= 50) {
        allowAutoScrollRef.current = true;
        setShowScrollBtn(false);
      } else if (distanceFromBottom > 100) {
        // 如果距离底部超过 100px，确保显示滚动按钮
        setShowScrollBtn(true);
      }
    }, 100);

    // 使用 scroll 事件替代 wheel 事件，可以捕获所有类型的滚动行为
    const scrollHandler = () => {
      const { scrollTop, scrollHeight, clientHeight } = messageView;

      // 如果内容不足以滚动（没有滚动条），确保隐藏按钮并直接返回
      if (scrollHeight <= clientHeight) {
        setShowScrollBtn(false);
        return;
      }

      // 计算距离底部的距离
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // 如果已经在底部（距离小于等于50px），确保隐藏按钮
      if (distanceFromBottom <= 50) {
        setShowScrollBtn(false);
        allowAutoScrollRef.current = true;
      }
      const isProgrammatic = (messageView as any).__isProgrammaticScroll;

      // 如果是程序触发的滚动，忽略（不处理用户滚动逻辑）
      // 但如果用户在程序滚动期间向上滚动（试图停止自动滚动），则需要立即响应
      if (isProgrammatic) {
        // 判断是否向上滚动
        // 增加 1px 的阈值补偿，提高触控板滚动的灵敏度
        const isScrollingUp = scrollTop < lastScrollTopRef.current - 1;

        if (isScrollingUp) {
          // 用户试图向上滚动，立即禁用自动滚动
          allowAutoScrollRef.current = false;
          // 清除滚动定时器
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = null;
          }
          // 显示滚动按钮
          setShowScrollBtn(true);
          // 清除程序滚动标记，恢复正常处理
          (messageView as any).__isProgrammaticScroll = false;
          // 更新位置
          lastScrollTopRef.current = scrollTop;
          return;
        }

        // 记录程序滚动后的位置，确保下一次用户滚动对比的是最新位置
        lastScrollTopRef.current = messageView.scrollTop;
        return;
      }

      // 判断是否向上滚动（必须在更新 lastScrollTopRef 之前判断）
      // 增加 1px 的阈值补偿，防止微小的抖动误判，同时提高触控板平滑滚动的响应速度
      const isScrollingUp = scrollTop < lastScrollTopRef.current - 1;

      // 最高优先级：用户向上滚动时立即禁用自动滚动，无论距离底部多远
      if (isScrollingUp) {
        // 立即禁用自动滚动
        allowAutoScrollRef.current = false;
        // 清除滚动定时器
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
        // 显示滚动按钮
        setShowScrollBtn(true);
        // 更新上一次滚动位置
        lastScrollTopRef.current = scrollTop;
        // 立即返回，不执行后续逻辑
        return;
      }

      // 更新上一次滚动位置（向下滚动时）
      lastScrollTopRef.current = scrollTop;

      // 向下滚动时，使用节流处理（非紧急情况）
      handleScrollThrottled();
    };

    messageView.addEventListener('scroll', scrollHandler, {
      passive: true,
    });

    // 组件卸载时移除滚动事件监听器
    return () => {
      messageView.removeEventListener('scroll', scrollHandler);
    };
  }, [
    messageViewTarget,
    (messageViewTarget as any)?.current,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  ]);
};
