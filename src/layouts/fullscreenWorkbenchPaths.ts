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
  /^\/space\/[^/]+\/app-dev\/[^/]+$/, // 全栈应用 Web IDE（AppDev）
  /^\/space\/[^/]+\/app-pro$/, // 全栈应用会话（AppDevPro）
  /^\/space\/[^/]+\/app-dev-design\/[^/]+$/, // 应用设计页（AppDevDesign）
  /^\/space\/[^/]+\/agent-dev$/, // 智能体会话开发（ConversationAgent）
];

export const isFullscreenWorkbenchPath = (pathname: string): boolean =>
  FULLSCREEN_WORKBENCH_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
