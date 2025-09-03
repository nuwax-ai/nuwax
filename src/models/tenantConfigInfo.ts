import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { apiTenantConfig } from '@/services/account';
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
    onSuccess: (result: TenantConfigInfo) => {
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

      // 租户信息初始化完成后，立即初始化 layout navigation 相关的 CSS 变量
      // 确保样式管理器已经加载了本地存储的配置并应用到页面
      initializeLayoutStyle('租户信息初始化完成');
    },
    onError: () => {
      setLoadEnd(true);

      // 接口失败时也要初始化 layout navigation CSS 变量，使用兜底方案
      initializeWithFallback('租户信息接口失败');
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
