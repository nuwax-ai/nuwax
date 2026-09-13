/**
 * Layout 主布局组件（主站路由 / 下的布局宿主）
 * @description 布局本体（侧栏容器 + 内容区 + 弹窗 + 数据加载）收口在
 * SidebarShell 共享壳。全屏工作台页组（fullscreenWorkbenchPaths）也挂在同一
 * 路由树下：单栏模式时与主站同用 page-container 容器、侧栏常驻，仅抑制二级
 * 菜单列；经典风格/移动端以 bare 形态裸渲染（维持历史全屏行为）。
 */
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import React, { useEffect } from 'react';
import { history, Outlet, useLocation, useModel } from 'umi';
import {
  getSidebarShellLayoutPolicy,
  shouldSeedWorkbenchHistoryBase,
} from './fullscreenWorkbenchPaths';
import SidebarShell from './SidebarShell';
import { WORKBENCH_HISTORY_BASE_URL } from './workbenchHistoryBase';

const Layout: React.FC = () => {
  const location = useLocation();
  const { effectiveNavigationStyle } = useUnifiedTheme();
  const { isMobile } = useModel('layout');

  const shellPolicy = getSidebarShellLayoutPolicy({
    pathname: location.pathname,
    isStyle3: effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3,
    isMobile,
  });

  // 单栏工作台页历史栈补网：启动后才变成栈首的路径（/login redirect、直开
  // /home/chat 被 Chat 页 replace 成工作台页）boot 种子覆盖不到，这里按最终
  // 生效形态补一条 /home 栈底，保证 back 有路可退。经典风格 bare 形态不触发
  //（variant 非 page），行为不变；垫栈后 length 变 2，本 effect 自然自限。
  useEffect(() => {
    if (shellPolicy.variant !== 'page') return;
    if (
      !shouldSeedWorkbenchHistoryBase(location.pathname, window.history.length)
    )
      return;
    const { pathname, search, hash } = location;
    history.replace(WORKBENCH_HISTORY_BASE_URL);
    history.push(pathname + search + hash);
  }, [shellPolicy.variant, location]);

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
