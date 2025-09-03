import {
  THEME_BACKGROUND_CONFIGS,
  THEME_COLOR_CONFIGS,
} from '@/constants/theme.constants';
import { TenantInfo, TenantThemeConfig } from '@/types/tenant';

/**
 * 租户相关API服务
 */

/**
 * 获取租户信息
 * @returns Promise<TenantInfo>
 */
export const getTenantInfo = async (): Promise<TenantInfo> => {
  // 模拟API调用 - 实际项目中应该调用真实的API
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockTenantInfo: TenantInfo = {
        id: 'tenant-001',
        name: '示例租户',
        themeConfig: {
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
              description:
                '展开模式：88px宽度，显示文字，页面容器无外边距和圆角',
            },
          ],
          defaultThemeColor: '#5147ff',
          defaultBackgroundId: 'bg-variant-1',
          defaultNavigationStyleId: 'style1',
          supportDarkMode: true,
          defaultIsDarkMode: false,
        },
      };
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
