import {
  hostBridge,
  isImmersiveShell,
  isMac,
  shellAvoid,
} from '@/utils/hostBridge';

/**
 * 标题栏手势（事件时命中判定架构，2026-09-17）：
 *
 * 旧方案「预计算空白矩形上报 + 壳层覆盖 app-region:drag 拖拽层」存在结构缺陷——
 * 拖拽层盖在 webview 上，凡是挖洞遗漏（自绘 onClick 控件/画布/iframe/动态元素）
 * 的点击都被吞掉，页面形态太多无法枚举。
 *
 * 新方案：壳层不再渲染任何拖拽矩形（点击零吞没）；guest 在 mousedown 捕获阶段
 * 用事件目标真值判定「空白」——非交互元素（按钮/链接/表单/角色/pointer·text 光标）
 * 且位于顶部带内 → 请求壳主进程开始跟随光标拖窗；双击空白 → 切换最大化。
 * 误判代价从「点击失效」反转为「该处拖不动」（无害），方向天然安全。
 */

/** 顶部带内视为交互、不发起拖拽的元素。 */
const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'textarea',
  'select',
  'label',
  '[onclick]',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="combobox"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="option"]',
  '[contenteditable="true"]',
].join(',');

/** 顶部带高度：mac 红绿灯行 36 / Win·Linux 壳顶行 28（与布局避让同源）。 */
function bandHeight(): number {
  return isMac() ? shellAvoid.TOP : shellAvoid.CONTENT_TOP;
}

/** 目标元素自身或 4 层祖先内是否可交互/可选文字（自绘 onClick 控件多为 pointer 光标）。 */
function isInteractive(target: EventTarget | null): boolean {
  let current = target instanceof Element ? target : null;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (current.matches(INTERACTIVE_SELECTOR)) return true;
    try {
      const cursor = window.getComputedStyle(current).cursor;
      if (cursor === 'pointer' || cursor === 'text') return true;
    } catch {
      /* 无 computed style 环境忽略 */
    }
    current = current.parentElement;
  }
  return false;
}

/** 顶部带内的空白 mousedown：请求壳开始拖拽；mouseup/blur/按键异常补发结束。 */
function handleMouseDown(event: MouseEvent): void {
  if (event.button !== 0) return;
  const y = event.clientY;
  if (y < 0 || y > bandHeight()) return;
  if (isInteractive(event.target)) return;

  hostBridge.titlebar.beginDrag();

  const end = () => {
    hostBridge.titlebar.endDrag();
    window.removeEventListener('mouseup', end);
    window.removeEventListener('mousemove', checkButtons);
    window.removeEventListener('blur', end);
  };
  // 光标快速甩出窗口会丢 mouseup：move 时按键已松开（buttons 不含左键）也结束
  const checkButtons = (move: MouseEvent) => {
    if ((move.buttons & 1) === 0) end();
  };
  window.addEventListener('mouseup', end);
  window.addEventListener('mousemove', checkButtons);
  window.addEventListener('blur', end);
}

/** 顶部带内的空白双击：切换最大化/还原。 */
function handleDoubleClick(event: MouseEvent): void {
  if (event.button !== 0) return;
  const y = event.clientY;
  if (y < 0 || y > bandHeight()) return;
  if (isInteractive(event.target)) return;
  hostBridge.titlebar.toggleMaximize();
}

/**
 * 初始化标题栏手势监听（仅沉浸式宿主主窗口）。返回清理函数。
 * 调试：localStorage.setItem('nuwax-debug-titlebar','1') 后刷新，页面自绘
 * 顶部带虚线框（pointer-events:none，不影响点击），替代旧壳层红矩形可视化。
 */
export function initTitlebarDragGesture(): () => void {
  if (!isImmersiveShell()) return () => {};

  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('dblclick', handleDoubleClick, true);

  let debugBand: HTMLElement | null = null;
  try {
    if (localStorage.getItem('nuwax-debug-titlebar') === '1') {
      debugBand = document.createElement('div');
      debugBand.setAttribute('aria-hidden', 'true');
      debugBand.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100vw',
        `height:${bandHeight()}px`,
        'pointer-events:none',
        'box-shadow:inset 0 -1px 0 rgba(255,0,0,0.6)',
        'background:rgba(255,0,0,0.06)',
        'z-index:2147483647',
      ].join(';');
      document.body.appendChild(debugBand);
    }
  } catch {
    /* localStorage 不可用时跳过调试可视化 */
  }

  return () => {
    document.removeEventListener('mousedown', handleMouseDown, true);
    document.removeEventListener('dblclick', handleDoubleClick, true);
    debugBand?.remove();
  };
}
