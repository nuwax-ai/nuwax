/**
 * 动态菜单布局分发器
 * @description 按生效导航风格（effectiveNavigationStyle）分发布局形态：
 *   - style3（默认）：单栏模式（SidebarNavLayout，主导航改造形态；桌面端锁定）
 *   - style1/style2：经典布局（ClassicLayout，改版前形态）
 */
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import React from 'react';
import ClassicLayout from './ClassicLayout';
import SidebarNavLayout from './SidebarNavLayout';
import { useCreditSummaryPolling } from './useCreditSummaryPolling';

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
  // 分发器常驻：单栏/经典共用同一份积分轮询，切主题不重挂
  useCreditSummaryPolling();

  if (effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3) {
    return <SidebarNavLayout {...props} />;
  }
  return <ClassicLayout {...props} />;
};

export default DynamicMenusLayout;
