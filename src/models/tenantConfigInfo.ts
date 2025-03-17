import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { apiTenantConfig } from '@/services/account';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import { useRequest } from '@@/exports';
import { useState } from 'react';

export default () => {
  const [tenantConfigInfo, setTenantConfigInfo] = useState<TenantConfigInfo>();

  // 租户配置信息查询接口
  const { run: runTenantConfig } = useRequest(apiTenantConfig, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: TenantConfigInfo) => {
      setTenantConfigInfo(result);
      localStorage.setItem(TENANT_CONFIG_INFO, JSON.stringify(result));
    },
  });

  return {
    tenantConfigInfo,
    runTenantConfig,
  };
};
