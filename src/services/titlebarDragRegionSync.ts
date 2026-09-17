import {
  hostBridge,
  isImmersiveShell,
  isMac,
  shellAvoid,
} from '@/utils/hostBridge';

export const TITLEBAR_DRAG_REGION_SELECTOR =
  '[data-nuwax-titlebar-drag="true"]';
const MAX_TOP = 48;
/** 挖洞后剩余空隙的最小保留宽度：更窄的碎片不值得占用矩形名额。 */
const MIN_GAP_WIDTH = 8;
/** 命中洞的外扩安全边距：hover/点击热区常比视觉框略大，多让一点防误吞。 */
const HOLE_PADDING = 4;
/** 横向采样步长（CSS px）：4px 足以分辨页头小图标，一次 flush 数百次 elementFromPoint 可忽略。 */
const SAMPLE_STEP = 4;
/** 带内纵向采样行（相对带顶）：覆盖贴顶控件与沉底控件两档。 */
const SAMPLE_ROW_INSET = 8;

/** 命中测试判定为交互的元素（含其祖先回溯）；cursor:pointer 兜底自绘控件。 */
const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'textarea',
  'select',
  '[onclick]',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="combobox"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[contenteditable="true"]',
].join(',');

type BandRect = { x: number; y: number; width: number; height: number };

/** 元素自身或 4 层祖先内是否可交互：选择器命中或 pointer 光标（自绘 onClick 控件的通用形态）。 */
function isInteractiveAt(element: Element | null): boolean {
  let current: Element | null = element;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (current.matches(INTERACTIVE_SELECTOR)) return true;
    try {
      if (window.getComputedStyle(current).cursor === 'pointer') return true;
    } catch {
      /* jsdom 等环境无 computed style 时忽略 */
    }
    current = current.parentElement;
  }
  return false;
}

/**
 * 逐点命中挖洞：沿声明带横向按 SAMPLE_STEP 采样、带内两行纵向取样，
 * elementFromPoint 命中交互元素即记洞——不依赖页面用标准 <button>，
 * 画布页头这类自绘 onClick/pointer 控件同样被识别（v1.0.x 工作流页头被盖教训）。
 */
function subtractInteractiveElements(region: BandRect): BandRect[] {
  if (typeof document.elementFromPoint !== 'function') return [region];

  const rows = [
    region.y + SAMPLE_ROW_INSET,
    region.y + region.height - SAMPLE_ROW_INSET,
  ].filter((y) => y > region.y && y < region.y + region.height);
  if (rows.length === 0) return [region];

  const colCount = Math.max(1, Math.ceil(region.width / SAMPLE_STEP));
  const holes: Array<{ left: number; right: number }> = [];
  let holeStart: number | null = null;
  const closeHole = (endX: number) => {
    if (holeStart !== null) {
      holes.push({ left: holeStart, right: endX });
      holeStart = null;
    }
  };
  for (let i = 0; i < colCount; i += 1) {
    const x = region.x + i * SAMPLE_STEP + SAMPLE_STEP / 2;
    const hit = rows.some((y) => isInteractiveAt(document.elementFromPoint(x, y)));
    if (hit) {
      if (holeStart === null) holeStart = region.x + i * SAMPLE_STEP;
    } else {
      closeHole(region.x + i * SAMPLE_STEP);
    }
  }
  closeHole(region.x + region.width);
  if (holes.length === 0) return [region];

  // 洞外扩安全边距并合并相邻
  holes.forEach((hole) => {
    hole.left = Math.max(region.x, hole.left - HOLE_PADDING);
    hole.right = Math.min(region.x + region.width, hole.right + HOLE_PADDING);
  });
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
  if (region.x + region.width - cursor >= MIN_GAP_WIDTH) {
    gaps.push({
      x: cursor,
      y: region.y,
      width: region.x + region.width - cursor,
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
    // 空隙超出上限时丢最窄的：保右缘空隙（发布/窗口按钮常在右缘）不被 slice 削掉
    .sort((a, b) => b.width - a.width)
    .slice(0, 16)
    .sort((a, b) => a.x - b.x);
}

/**
 * 全局常驻声明带：由同步器自挂在 body 上，任何路由（含 layout:false 全屏详情页）
 * 自动有带——此前声明散在 SidebarNavLayout/ClassicLayout/Login，全屏页无带即
 * 上报空、壳退回 8px 保底条，用户实测「进某些页面拖拽/双击全失效」的根源。
 */
function ensureMarkerBand(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(TITLEBAR_DRAG_REGION_SELECTOR);
  if (existing) return existing;
  const band = document.createElement('div');
  band.dataset.nuwaxTitlebarDrag = 'true';
  band.setAttribute('aria-hidden', 'true');
  band.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100vw',
    `height:${isMac() ? shellAvoid.TOP : shellAvoid.CONTENT_TOP}px`,
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(band);
  return band;
}

/**
 * 同步器自持声明带并在路由/尺寸/布局变化时上报 DOMRect（交互控件命中挖洞）。
 * 卸载时移除声明带并清空上报，避免旧页面的透明拖拽层残留并吞掉新页面点击。
 */
export function initTitlebarDragRegionSync(): () => void {
  if (!isImmersiveShell()) return () => {};

  const markerBand = ensureMarkerBand();
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
    markerBand.remove();
    hostBridge.layout.setTitlebarDragRegions([]);
  };
}
