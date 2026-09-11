/**
 * Layout 主布局组件（主站路由 / 下的布局宿主）
 * @description 布局本体（侧栏容器 + 内容区 + 弹窗 + 数据加载）收口在
 * SidebarShell 共享壳。全屏工作台页组（fullscreenWorkbenchPaths）也挂在同一
 * 路由树下：单栏模式时与主站同用 page-container 容器、侧栏常驻，仅抑制二级
 * 菜单列；经典风格/移动端以 bare 形态裸渲染（维持历史全屏行为）。
 */
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import React from 'react';
import { Outlet, useLocation, useModel } from 'umi';
import { getSidebarShellLayoutPolicy } from './fullscreenWorkbenchPaths';
import SidebarShell from './SidebarShell';

const Layout: React.FC = () => {
  const location = useLocation();
  const { effectiveNavigationStyle } = useUnifiedTheme();
  const { isMobile } = useModel('layout');

  const shellPolicy = getSidebarShellLayoutPolicy({
    pathname: location.pathname,
    isStyle3: effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3,
    isMobile,
  });

  return (
    <SidebarShell
      variant={shellPolicy.variant}
      suppressSecondMenu={shellPolicy.suppressSecondMenu}
      // 工作台页沉浸避让由路由层 immersiveShellAvoid 承担，page-container 不叠加
      immersiveMarginTop={shellPolicy.immersiveMarginTop}
    >
      <Outlet />
    </SidebarShell>
  );
};

export default Layout;
