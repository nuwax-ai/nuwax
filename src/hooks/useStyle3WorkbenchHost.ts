/**
 * 当前页是否以「单栏 style3 桌面端」形态承载全屏工作台页
 * @description 与 layouts/index.tsx 同源复用 getSidebarShellLayoutPolicy：
 * 单栏桌面端的工作台详情走 page-container（侧栏常驻），经典风格/移动端走 bare
 * 裸全屏。工作台页返回按钮据此分流返回语义：
 * - true（单栏）：走真实浏览器历史 history.back()，配合 workbenchHistoryBase
 *   的栈底兜底，保证 back/forward（含桌面壳前进后退按钮）始终有路；
 * - false（经典风格/移动端）：保留既有返回逻辑（固定列表页 / jumpBack），
 *   不受单栏改造影响。
 * 非工作台路径（如内嵌宿主页面）一律返回 false，维持宿主页自身语义。
 */
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import {
  getSidebarShellLayoutPolicy,
  isFullscreenWorkbenchPath,
} from '@/layouts/fullscreenWorkbenchPaths';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import { useLocation, useModel } from 'umi';

export const useStyle3WorkbenchHost = (): boolean => {
  const location = useLocation();
  const { effectiveNavigationStyle } = useUnifiedTheme();
  const { isMobile } = useModel('layout');

  if (!isFullscreenWorkbenchPath(location.pathname)) return false;

  return (
    getSidebarShellLayoutPolicy({
      pathname: location.pathname,
      isStyle3: effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3,
      isMobile,
    }).variant === 'page'
  );
};

export default useStyle3WorkbenchHost;
