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
  messageViewRef: React.RefObject<HTMLDivElement>,
  allowAutoScrollRef: React.MutableRefObject<boolean>,
  scrollTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  setShowScrollBtn: (show: boolean) => void,
) => {
  // 记录上一次滚动位置，用于判断滚动方向
  const lastScrollTopRef = useRef<number>(0);

  useEffect(() => {
    const messageView = messageViewRef.current;
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
      // 如果是程序触发的滚动，忽略（不处理用户滚动逻辑）
      if ((messageView as any).__isProgrammaticScroll) {
        return;
      }

      const { scrollTop } = messageView;
      // 判断是否向上滚动（必须在更新 lastScrollTopRef 之前判断）
      const isScrollingUp = scrollTop < lastScrollTopRef.current;

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
  }, [messageViewRef, allowAutoScrollRef, scrollTimeoutRef, setShowScrollBtn]);
};
