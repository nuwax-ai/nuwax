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
 * 折叠范围：收起 = 整条侧栏（单栏会话列 + 二级菜单列一起），展开 = 一并恢复。
 * 桌面沉浸壳顶栏 ☰ 与浏览器侧栏按钮共用同一语义（沉浸壳下浮出展开钮已隐去，
 * 展开由壳顶栏 ☰ 承担）。`immersiveShell` 仍作为入参保留，便于后续按宿主分化。
 */
export function resolveSidebarCollapsePolicy({
  collapsed,
  secondMenuAvailable,
}: SidebarCollapsePolicyInput): SidebarCollapsePolicy {
  return {
    primarySidebarCollapsed: collapsed,
    secondMenuVisible: secondMenuAvailable && !collapsed,
  };
}
