import {
  THEME_BACKGROUND_CONFIGS,
  THEME_COLOR_CONFIGS,
} from '@/constants/theme.constants';
import { TenantInfo, TenantThemeConfig } from '@/types/tenant';
import { layoutStyleManager } from '@/utils/backgroundStyle';

/**
 * 租户相关API服务
 */

/**
 * 获取租户信息
 * @returns Promise<TenantInfo>
 */
export const getTenantInfo = async (): Promise<TenantInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 从 backgroundStyle.ts 获取实际的主题配置数据
      const themeConfig = layoutStyleManager.getThemeConfigData();
      const currentBackground = layoutStyleManager.getCurrentBackground();
      const currentLayoutStyle = layoutStyleManager.getCurrentLayoutStyle();
      const currentNavStyle = layoutStyleManager.getCurrentNavigationStyle();

      // 构建租户主题配置，优先使用实际配置数据
      const tenantThemeConfig: TenantThemeConfig = {
        themeColors: [...THEME_COLOR_CONFIGS],
        backgroundImages: THEME_BACKGROUND_CONFIGS.map((config) => ({
          id: `bg-${config.id}`,
          name: config.name,
          preview: config.url,
          url: config.url,
          isDefault: config.id === 'variant-1',
        })),
        navigationStyles: [
          {
            id: 'style1',
            name: '风格1',
            description:
              '紧凑模式：60px宽度，无文字显示，页面容器有外边距和圆角',
            isDefault: true,
          },
          {
            id: 'style2',
            name: '风格2',
            description: '展开模式：88px宽度，显示文字，页面容器无外边距和圆角',
          },
        ],
        // 使用实际配置数据，如果没有则使用默认值
        defaultThemeColor: themeConfig?.selectedThemeColor || '#5147ff',
        defaultBackgroundId:
          themeConfig?.selectedBackgroundId || currentBackground?.id || '',
        defaultNavigationStyleId:
          themeConfig?.navigationStyleId || currentNavStyle || 'style1',
        supportDarkMode: true,
        defaultIsDarkMode: currentLayoutStyle === 'dark',
      };

      const mockTenantInfo: TenantInfo = {
        id: 'tenant-001',
        name: '示例租户',
        themeConfig: tenantThemeConfig,
      };

      console.log('租户信息基于实际主题配置构建:', {
        themeConfig,
        tenantThemeConfig,
      });
      resolve(mockTenantInfo);
    }, 500); // 模拟网络延迟
  });
};

/**
 * 获取租户主题配置
 * @returns Promise<TenantThemeConfig>
 */
export const getTenantThemeConfig = async (): Promise<TenantThemeConfig> => {
  const tenantInfo = await getTenantInfo();
  return tenantInfo.themeConfig;
};
