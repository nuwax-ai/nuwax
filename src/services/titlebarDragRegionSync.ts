import { hostBridge, isImmersiveShell } from '@/utils/hostBridge';

export const TITLEBAR_DRAG_REGION_SELECTOR =
  '[data-nuwax-titlebar-drag="true"]';
const MAX_TOP = 48;

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
