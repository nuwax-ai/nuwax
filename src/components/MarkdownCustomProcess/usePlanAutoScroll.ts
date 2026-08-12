import type { UIEventHandler, WheelEventHandler } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';

const BOTTOM_THRESHOLD = 8;

/**
 * 让执行计划默认跟随最新一条，并在用户向上查看历史计划时暂停跟随。
 */
export const usePlanAutoScroll = (
  contentVersion: unknown,
  enabled: boolean,
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const handleScroll = useCallback<UIEventHandler<HTMLDivElement>>((event) => {
    const container = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;

    if (scrollHeight <= clientHeight) {
      shouldAutoScrollRef.current = true;
      lastScrollTopRef.current = scrollTop;
      return;
    }

    const isScrollingUp = scrollTop < lastScrollTopRef.current;
    const isAtBottom =
      scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD;

    if (isScrollingUp) {
      shouldAutoScrollRef.current = false;
    } else if (isAtBottom) {
      shouldAutoScrollRef.current = true;
    }

    lastScrollTopRef.current = scrollTop;
  }, []);

  const handleWheel = useCallback<WheelEventHandler<HTMLDivElement>>(
    (event) => {
      if (
        event.deltaY < 0 &&
        event.currentTarget.scrollHeight > event.currentTarget.clientHeight
      ) {
        shouldAutoScrollRef.current = false;
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container || !shouldAutoScrollRef.current) {
      return;
    }

    container.scrollTop = Math.max(
      0,
      container.scrollHeight - container.clientHeight,
    );
    lastScrollTopRef.current = container.scrollTop;
  }, [contentVersion, enabled]);

  return { containerRef, handleScroll, handleWheel };
};
