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
          themeColors: [
            { color: '#5147ff', name: '蓝色', isDefault: true },
            { color: '#ff4d4f', name: '红色' },
            { color: '#fa8c16', name: '橙色' },
            { color: '#52c41a', name: '绿色' },
            { color: '#722ed1', name: '紫色' },
            { color: '#eb2f96', name: '粉色' },
          ],
          backgroundImages: [
            {
              id: 'bg-variant-1',
              name: '背景1',
              preview: '/bg/bg-variant-1.png',
              url: '/bg/bg-variant-1.png',
              isDefault: true,
            },
            {
              id: 'bg-variant-2',
              name: '背景2',
              preview: '/bg/bg-variant-2.png',
              url: '/bg/bg-variant-2.png',
            },
            {
              id: 'bg-variant-3',
              name: '背景3',
              preview: '/bg/bg-variant-3.png',
              url: '/bg/bg-variant-3.png',
            },
            {
              id: 'bg-variant-4',
              name: '背景4',
              preview: '/bg/bg-variant-4.png',
              url: '/bg/bg-variant-4.png',
            },
            {
              id: 'bg-variant-5',
              name: '背景5',
              preview: '/bg/bg-variant-5.png',
              url: '/bg/bg-variant-5.png',
            },
          ],
          navigationStyles: [
            {
              id: 'nav-style-1',
              name: '风格1',
              description: '当前默认风格',
              isDefault: true,
            },
            {
              id: 'nav-style-2',
              name: '风格2',
              description: '简洁风格',
            },
          ],
          defaultThemeColor: '#5147ff',
          defaultBackgroundId: 'bg-variant-1',
          defaultNavigationStyleId: 'nav-style-1',
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
