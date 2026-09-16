import { hostBridge, isImmersiveShell } from '@/utils/hostBridge';

export const TITLEBAR_DRAG_REGION_SELECTOR =
  '[data-nuwax-titlebar-drag="true"]';
const MAX_TOP = 48;
/** 挖洞后剩余空隙的最小保留宽度：更窄的碎片不值得占用矩形名额。 */
const MIN_GAP_WIDTH = 8;
/** 交互元素外扩安全边距：hover/点击热区常比视觉框略大，多让一点防误吞。 */
const HOLE_PADDING = 4;

/** 顶部带内视为交互、需要挖洞避让的元素（声明元素自身排除）。 */
const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'textarea',
  'select',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="combobox"]',
  '[contenteditable="true"]',
].join(',');

type BandRect = { x: number; y: number; width: number; height: number };

/**
 * 带状挖洞：声明矩形覆盖到内容区顶部空白带（mac 不退让设计）后，页面在带内的
 * 交互元素（右上角头像/设置簇、页头按钮等）必须保持可点——按 x 区间减去与
 * 带纵向相交的交互元素，返回剩余空隙矩形（同带高等高）。
 */
function subtractInteractiveElements(region: BandRect): BandRect[] {
  const regionRight = region.x + region.width;
  const bandTop = region.y;
  const bandBottom = region.y + region.height;
  const holes: Array<{ left: number; right: number }> = [];
  document
    .querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR)
    .forEach((element) => {
      // 声明元素是透明标记层自身，不参与挖洞
      if (element.closest(TITLEBAR_DRAG_REGION_SELECTOR)) return;
      const style = window.getComputedStyle(element);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.pointerEvents === 'none'
      ) {
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.bottom <= bandTop || rect.top >= bandBottom) return;
      const left = Math.max(region.x, rect.left - HOLE_PADDING);
      const right = Math.min(regionRight, rect.right + HOLE_PADDING);
      if (right - left <= 0) return;
      holes.push({ left, right });
    });
  if (holes.length === 0) return [region];

  holes.sort((a, b) => a.left - b.left);
  const merged: Array<{ left: number; right: number }> = [holes[0]];
  for (const hole of holes.slice(1)) {
    const last = merged[merged.length - 1];
    if (hole.left <= last.right) {
      last.right = Math.max(last.right, hole.right);
    } else {
      merged.push(hole);
    }
  }

  const gaps: BandRect[] = [];
  let cursor = region.x;
  for (const hole of merged) {
    if (hole.left - cursor >= MIN_GAP_WIDTH) {
      gaps.push({
        x: cursor,
        y: region.y,
        width: hole.left - cursor,
        height: region.height,
      });
    }
    cursor = Math.max(cursor, hole.right);
  }
  if (regionRight - cursor >= MIN_GAP_WIDTH) {
    gaps.push({
      x: cursor,
      y: region.y,
      width: regionRight - cursor,
      height: region.height,
    });
  }
  return gaps;
}

export function collectTitlebarDragRegions(
  root: ParentNode = document,
): TitlebarDragRegion[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TITLEBAR_DRAG_REGION_SELECTOR))
    .filter((element) => {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    })
    .map((element) => element.getBoundingClientRect())
    .map((rect) => {
      const x = Math.max(0, rect.left);
      const y = Math.max(0, rect.top);
      const right = Math.min(window.innerWidth, rect.right);
      const bottom = Math.min(MAX_TOP, rect.bottom);
      return { x, y, width: right - x, height: bottom - y };
    })
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .flatMap((rect) => subtractInteractiveElements(rect))
    .slice(0, 16);
}

/**
 * 页面只声明空白 DOM，集中同步器负责在路由/尺寸/布局变化时上报 DOMRect。
 * 卸载时清空，避免旧页面的透明拖拽层残留并吞掉新页面点击。
 */
export function initTitlebarDragRegionSync(): () => void {
  if (!isImmersiveShell()) return () => {};

  let frame = 0;
  let lastSignature = '';
  const flush = () => {
    frame = 0;
    const regions = collectTitlebarDragRegions();
    const signature = JSON.stringify(regions);
    if (signature === lastSignature) return;
    lastSignature = signature;
    hostBridge.layout.setTitlebarDragRegions(regions);
  };
  const schedule = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(flush);
  };

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(document.documentElement);
  const mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'data-nuwax-titlebar-drag'],
  });
  window.addEventListener('resize', schedule);
  schedule();

  return () => {
    if (frame) cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    mutationObserver.disconnect();
    window.removeEventListener('resize', schedule);
    hostBridge.layout.setTitlebarDragRegions([]);
  };
}
