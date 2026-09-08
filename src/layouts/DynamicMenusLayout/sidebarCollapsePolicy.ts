export interface SidebarCollapsePolicyInput {
  collapsed: boolean;
  immersiveShell: boolean;
  secondMenuAvailable: boolean;
}

export interface SidebarCollapsePolicy {
  primarySidebarCollapsed: boolean;
  secondMenuVisible: boolean;
}

/**
 * 主导航改造后的折叠范围：
 * - Electron 工具栏只控制业务二级列，主会话列常驻；
 * - 浏览器侧栏按钮继续沿用整栏收起行为。
 */
export function resolveSidebarCollapsePolicy({
  collapsed,
  immersiveShell,
  secondMenuAvailable,
}: SidebarCollapsePolicyInput): SidebarCollapsePolicy {
  return {
    primarySidebarCollapsed: collapsed && !immersiveShell,
    secondMenuVisible: secondMenuAvailable && !collapsed,
  };
}
