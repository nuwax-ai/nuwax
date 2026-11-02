/**
 * 全屏工作台页路径匹配（单栏模式侧栏常驻的页面集合）
 * @description 与 src/routes/index.ts 根路由 children 中的「全屏工作台页组」保持一致。
 * layouts/index.tsx 据此切换 SidebarShell 的内容区形态：这些页与主站共用同一路由树、
 * 同一个侧栏实例，跳转时侧栏不重挂、不重新初始化（仅内容区形态切换）。
 */

/** 全屏工作台页路径形态（与路由表逐一对应） */
const FULLSCREEN_WORKBENCH_PATH_PATTERNS: RegExp[] = [
  /^\/space\/[^/]+\/workflow\/[^/]+$/, // 工作流编排（Antv-X6）
  /^\/space\/[^/]+\/agent\/[^/]+$/, // 智能体编排（EditAgent）
  /^\/space\/[^/]+\/app-dev\/[^/]+$/, // 网站应用 Web IDE（AppDev）
  /^\/space\/[^/]+\/app-pro\/[^/]+\/[^/]+$/, // 网站应用会话（AppDevPro）
  /^\/space\/[^/]+\/app-dev-design\/[^/]+$/, // 应用设计页（AppDevDesign）
  /^\/space\/[^/]+\/agent-dev$/, // 智能体会话开发（ConversationAgent）
];

export const isFullscreenWorkbenchPath = (pathname: string): boolean =>
  FULLSCREEN_WORKBENCH_PATH_PATTERNS.some((pattern) => pattern.test(pathname));

/**
 * 是否需要为当前工作台页垫历史栈底（workbenchHistoryBase 的判定核心）：
 * 是全屏工作台页，且标签页历史栈没有可退条目，或路由仍处于 idx=0 的栈首。
 * 原生栈长可能包含壳启动中转页，不能只靠 length 判断是否有应用内返回入口。
 * 纯函数无副作用，供启动期种子与 layout 层补网共用。
 */
export const shouldSeedWorkbenchHistoryBase = (
  pathname: string,
  historyLength: number,
  historyState?: unknown,
): boolean => {
  if (!isFullscreenWorkbenchPath(pathname)) return false;
  if (historyLength <= 1) return true;
  // 桌面壳启动链（loading / bridge / 深链中转）会把原生中间条目压在本条之前：
  // window 栈长 ≥2，但当前条目仍是路由栈首（umi/react-router 写入的 state.idx
  // 为 0，壳条目没有 idx）。此时 back 消耗的是壳条目而非应用内返回，同样需要
  // 垫栈。idx 缺失（非 router 写入 / 旧环境）退化为仅按栈长判定，web 行为不变。
  const idx = (historyState as { idx?: unknown } | null)?.idx;
  return typeof idx === 'number' && idx <= 0;
};

export interface SidebarShellLayoutPolicy {
  variant: 'page' | 'bare';
  suppressSecondMenu: boolean;
  immersiveMarginTop: boolean;
}

/**
 * 根路由壳的唯一分流策略。
 *
 * 单栏桌面端进入工作台详情时必须继续走 page-container；经典风格及移动端
 * 保持历史裸全屏。把三项联动值收口成纯函数，避免路由匹配正确但 variant 又在
 * 调用处被单独改坏，也便于覆盖「单栏 → 网页应用开发详情」这一真实回归场景。
 */
export const getSidebarShellLayoutPolicy = ({
  pathname,
  isStyle3,
  isMobile,
}: {
  pathname: string;
  isStyle3: boolean;
  isMobile: boolean;
}): SidebarShellLayoutPolicy => {
  const onFullscreenWorkbench = isFullscreenWorkbenchPath(pathname);
  const style3Desktop = isStyle3 && !isMobile;

  return {
    variant: onFullscreenWorkbench && !style3Desktop ? 'bare' : 'page',
    suppressSecondMenu: onFullscreenWorkbench,
    immersiveMarginTop: !onFullscreenWorkbench,
  };
};
