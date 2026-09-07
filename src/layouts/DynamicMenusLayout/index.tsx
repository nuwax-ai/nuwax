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

export interface DynamicMenusLayoutProps {
  /** 覆盖容器样式 */
  overrideContainerStyle?: React.CSSProperties;
  /** 是否为移动端 */
  isMobile?: boolean;
}

// 历史兼容导出（外部引用点已清零，保留别名以防遗漏）
export { NUWA_CLAW_PADDING_TOP } from './SidebarNavLayout';

const DynamicMenusLayout: React.FC<DynamicMenusLayoutProps> = (props) => {
  const { effectiveNavigationStyle } = useUnifiedTheme();

  if (effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3) {
    return <SidebarNavLayout {...props} />;
  }
  return <ClassicLayout {...props} />;
};

export default DynamicMenusLayout;
