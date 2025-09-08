import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { STORAGE_KEYS } from '@/constants/theme.constants';
import { apiTenantConfig } from '@/services/account';
import { unifiedThemeService } from '@/services/unifiedThemeService';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import {
  initializeLayoutStyle,
  initializeWithFallback,
} from '@/utils/styleInitializer';
import { useState } from 'react';
import { useRequest } from 'umi';

export default () => {
  const [loadEnd, setLoadEnd] = useState<boolean>(false);
  const [tenantConfigInfo, setTenantConfigInfo] = useState<TenantConfigInfo>();

  // 租户配置信息查询接口
  const { run: runTenantConfig } = useRequest(apiTenantConfig, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: TenantConfigInfo) => {
      setLoadEnd(true);
      setTenantConfigInfo(result);
      localStorage.setItem(TENANT_CONFIG_INFO, JSON.stringify(result));
      localStorage.setItem('AUTH_TYPE', result.authType.toString());

      // 设置页面标题和图标
      const { siteName, siteDescription, faviconUrl } = result;
      document.title = siteDescription
        ? `${siteName} - ${siteDescription}`
        : siteName;
      if (faviconUrl) {
        // 创建一个新的link元素
        const link = document.createElement('link');
        link.rel = 'shortcut icon';
        link.href = faviconUrl;
        link.type = 'image/x-icon';

        // 获取head元素并添加link元素
        const head = document.head || document.getElementsByTagName('head')[0];
        head.appendChild(link);
      }

      // 租户信息保存到localStorage后，重新初始化统一主题服务
      // 让它重新读取包含templateConfig的租户配置
      console.log('租户配置保存完成，重新初始化统一主题服务');
      // 统一主题服务会自动加载配置，不需要手动调用
      // unifiedThemeService.loadConfiguration();

      // 只有在本地没有主题配置时才同步租户配置
      // 避免覆盖用户已保存的本地主题配置
      const hasLocalThemeConfig = localStorage.getItem(
        STORAGE_KEYS.USER_THEME_CONFIG,
      );
      if (result.templateConfig && !hasLocalThemeConfig) {
        try {
          const templateConfig = JSON.parse(result.templateConfig);
          const currentData = unifiedThemeService.getCurrentData();
          await unifiedThemeService.updateData(
            {
              ...currentData,
              ...templateConfig,
            },
            {
              immediate: true,
            },
          );
        } catch (error) {
          console.warn('同步租户主题颜色失败:', error);
        }
      } else if (hasLocalThemeConfig) {
        console.log('检测到本地主题配置，跳过租户配置同步');
      }

      // 租户信息初始化完成后，立即初始化 layout navigation 相关的 CSS 变量
      // 确保样式管理器已经加载了本地存储的配置并应用到页面
      await initializeLayoutStyle('租户信息初始化完成');
    },
    onError: async () => {
      setLoadEnd(true);

      // 接口失败时也要初始化 layout navigation CSS 变量，使用兜底方案
      await initializeWithFallback('租户信息接口失败');
    },
  });

  // 从缓存中获取租户配置信息，设置页面title
  const setTitle = () => {
    const tenantConfigInfoString = localStorage.getItem(TENANT_CONFIG_INFO);
    if (!!tenantConfigInfoString) {
      const tenantConfigInfo = JSON.parse(tenantConfigInfoString);
      const { siteName, siteDescription } = tenantConfigInfo;
      document.title = siteDescription
        ? `${siteName} - ${siteDescription}`
        : siteName;
    }
  };

  return {
    loadEnd,
    tenantConfigInfo,
    runTenantConfig,
    setTitle,
  };
};
