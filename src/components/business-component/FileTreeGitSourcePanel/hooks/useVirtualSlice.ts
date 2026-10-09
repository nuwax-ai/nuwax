import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/** 变更列表单行高度，需与 ChangeFileListSection 样式中的行高一致 */
export const CHANGE_LIST_ROW_HEIGHT = 30;

/** 超过该行数后只挂载视口内的行，避免数千条变更一次性创建 DOM */
export const CHANGE_LIST_VIRTUALIZE_MIN_COUNT = 50;

const OVERSCAN_ROWS = 8;
const INITIAL_VISIBLE_ROWS = 40;

export interface VirtualSliceRange {
  start: number;
  end: number;
}

/**
 * 根据列表相对视口的位置计算需要挂载的行区间
 * @param itemCount 总行数
 * @param rowHeight 单行高度
 * @param listTop 列表容器顶部（相对视口）
 * @param viewportTop 滚动容器顶部（相对视口）
 * @param viewportBottom 滚动容器底部（相对视口）
 */
export const getVirtualSliceRange = (
  itemCount: number,
  rowHeight: number,
  listTop: number,
  viewportTop: number,
  viewportBottom: number,
): VirtualSliceRange => {
  if (itemCount <= 0 || rowHeight <= 0) {
    return { start: 0, end: 0 };
  }

  const startPx = viewportTop - listTop;
  const endPx = viewportBottom - listTop;
  const start = Math.max(0, Math.floor(startPx / rowHeight) - OVERSCAN_ROWS);
  const end = Math.min(
    itemCount,
    Math.ceil(Math.max(endPx, 0) / rowHeight) + OVERSCAN_ROWS,
  );

  return { start, end: Math.max(start, end) };
};

const isVerticalClip = (overflowY: string): boolean =>
  overflowY === 'auto' ||
  overflowY === 'scroll' ||
  overflowY === 'hidden' ||
  overflowY === 'overlay' ||
  overflowY === 'clip';

/** 收集会裁切内容的祖先。滚动时只读它们的位置，避免每帧重算样式 */
const collectClipAncestors = (listElement: HTMLElement): HTMLElement[] => {
  const clips: HTMLElement[] = [];
  let current: HTMLElement | null = listElement.parentElement;

  while (current) {
    if (isVerticalClip(getComputedStyle(current).overflowY)) {
      clips.push(current);
    }
    current = current.parentElement;
  }

  return clips;
};

/**
 * 计算列表在屏幕上的可见纵向区间。
 * 必须和窗口、以及高度固定的裁切祖先取交集。
 * 只拿「跟着内容一起长高」的滚动层时，滚下去算出的仍是第一屏。
 */
const getVisibleViewport = (
  clipAncestors: HTMLElement[],
): { top: number; bottom: number } => {
  let top = 0;
  let bottom = window.innerHeight;

  clipAncestors.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom <= rect.top) {
      return;
    }
    top = Math.max(top, rect.top);
    bottom = Math.min(bottom, rect.bottom);
  });

  return { top, bottom: Math.max(top, bottom) };
};

/**
 * 在指定滚动容器内只跟踪可见行区间。
 * 变更列表的滚动发生在外层 `.changes-scroll`，本 hook 不自己创建滚动条。
 * @param itemCount 当前需要虚拟化的行数
 * @param scrollParentRef 外层滚动容器
 * @param active 列表是否挂在文档上。折叠后需要重新绑定滚动容器
 * @param layoutKey 视图模式等会导致列表节点重建的标记
 */
export const useVirtualSlice = (
  itemCount: number,
  scrollParentRef: RefObject<HTMLElement | null>,
  active = true,
  layoutKey: string | number = 'list',
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const enabled = itemCount > CHANGE_LIST_VIRTUALIZE_MIN_COUNT;
  const [range, setRange] = useState<VirtualSliceRange>({
    start: 0,
    end: INITIAL_VISIBLE_ROWS,
  });

  useLayoutEffect(() => {
    if (!enabled || !active) {
      return;
    }

    const listElement = containerRef.current;
    if (!listElement) {
      return;
    }

    let frame = 0;
    const clipAncestors = collectClipAncestors(listElement);
    const update = () => {
      const viewport = getVisibleViewport(clipAncestors);
      const listRect = listElement.getBoundingClientRect();
      const next = getVirtualSliceRange(
        itemCount,
        CHANGE_LIST_ROW_HEIGHT,
        listRect.top,
        viewport.top,
        viewport.bottom,
      );
      setRange((prev) =>
        prev.start === next.start && prev.end === next.end ? prev : next,
      );
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        // 在下一帧绘制前换上新行，避免滚过第一屏后先看到空白
        flushSync(update);
      });
    };

    update();
    // scroll 不冒泡，所以每一层可能滚动的祖先都要单独听；
    // 捕获阶段再兜一层，避免漏掉侧栏自己的滚动条。
    clipAncestors.forEach((element) => {
      element.addEventListener('scroll', schedule, { passive: true });
    });
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const scrollParent = scrollParentRef.current;
    if (scrollParent && !clipAncestors.includes(scrollParent)) {
      scrollParent.addEventListener('scroll', schedule, { passive: true });
    }
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(listElement);
    if (scrollParent) {
      observer?.observe(scrollParent);
    }

    return () => {
      cancelAnimationFrame(frame);
      clipAncestors.forEach((element) => {
        element.removeEventListener('scroll', schedule);
      });
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      scrollParent?.removeEventListener('scroll', schedule);
      observer?.disconnect();
    };
  }, [active, enabled, itemCount, layoutKey, scrollParentRef]);

  const start = Math.min(range.start, itemCount);
  const end = Math.min(Math.max(range.end, start), itemCount);

  return {
    containerRef,
    enabled,
    start,
    end,
  };
};
