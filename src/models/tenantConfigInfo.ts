import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { apiTenantConfig } from '@/services/account';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import { useState } from 'react';
import { useRequest } from 'umi';

export default () => {
  const [tenantConfigInfo, setTenantConfigInfo] = useState<TenantConfigInfo>();

  // 租户配置信息查询接口
  const { run: runTenantConfig } = useRequest(apiTenantConfig, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: TenantConfigInfo) => {
      setTenantConfigInfo(result);
      localStorage.setItem(TENANT_CONFIG_INFO, JSON.stringify(result));
      const { siteName, siteDescription } = result;
      document.title = siteDescription
        ? `${siteName} - ${siteDescription}`
        : siteName;
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
    tenantConfigInfo,
    runTenantConfig,
    setTitle,
  };
};
