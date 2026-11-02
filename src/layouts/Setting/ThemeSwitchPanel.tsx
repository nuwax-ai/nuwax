import ThemeManagerPanel from '@/features/themes/ThemeManagerPanel';
import type { TenantThemeConfig } from '@/types/tenant';
import type { FC } from 'react';

/** 保留设置页入口契约，外观统一交给主题包运行时。 */
const ThemeSwitchPanel: FC<{ tenantThemeConfig: TenantThemeConfig }> = () => (
  <ThemeManagerPanel />
);
export default ThemeSwitchPanel;
