/**
 * 动态菜单布局分发器
 * @description 按生效导航风格（effectiveNavigationStyle）分发布局形态：
 *   - style3（默认）：单栏模式（SidebarNavLayout，主导航改造形态；桌面端锁定）
 *   - style1/style2：经典布局（ClassicLayout，改版前形态）
 */
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { createWebImUnreadRefresh } from '@/services/imEventBridge';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { isImMenu } from '@/utils/imMenuPolicy';
import React, { useEffect, useRef } from 'react';
import { useLocation, useModel } from 'umi';
import ClassicLayout from './ClassicLayout';
import SidebarNavLayout from './SidebarNavLayout';
import { useCreditSummaryPolling } from './useCreditSummaryPolling';

const containsImMenu = (menus: MenuItemDto[]): boolean =>
  menus.some(
    (menu) =>
      isImMenu(menu) || (!!menu.children && containsImMenu(menu.children)),
  );

export interface DynamicMenusLayoutProps {
  /** 覆盖容器样式 */
  overrideContainerStyle?: React.CSSProperties;
  /** 是否为移动端 */
  isMobile?: boolean;
  /** 抑制二级菜单列（全屏工作台页宿主：只保留主会话列，不并列二级列） */
  suppressSecondMenu?: boolean;
}

const DynamicMenusLayout: React.FC<DynamicMenusLayoutProps> = (props) => {
  const { effectiveNavigationStyle } = useUnifiedTheme();
  const { menuTree } = useModel('menuModel');
  const { pathname, search, hash } = useLocation();
  const hasImMenu = containsImMenu(menuTree);
  const unreadRefreshRef =
    useRef<ReturnType<typeof createWebImUnreadRefresh>>();

  useEffect(() => {
    if (!hasImMenu) return;
    const unreadRefresh = createWebImUnreadRefresh();
    unreadRefreshRef.current = unreadRefresh;
    return () => {
      unreadRefresh.dispose();
      unreadRefreshRef.current = undefined;
    };
  }, [hasImMenu]);

  // 共用路由入口覆盖两种导航及二级菜单；相同地址的重复点击不重复查询。
  useEffect(() => {
    void unreadRefreshRef.current?.refresh();
  }, [hasImMenu, pathname, search, hash]);

  // 分发器常驻：单栏/经典共用同一份积分轮询，切主题不重挂
  useCreditSummaryPolling();

  if (effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3) {
    return <SidebarNavLayout {...props} />;
  }
  return <ClassicLayout {...props} />;
};

export default DynamicMenusLayout;
