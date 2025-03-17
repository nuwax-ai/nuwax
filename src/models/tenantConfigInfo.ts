import { useState } from 'react';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import { useRequest } from '@@/exports';
import { apiTenantConfig } from '@/services/account';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';

export default () => {
  const [tenantConfigInfo, setTenantConfigInfo] = useState<TenantConfigInfo>();

  // 租户配置信息查询接口
  const { run: runTenantConfig } = useRequest(apiTenantConfig, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: TenantConfigInfo) => {
      setTenantConfigInfo(result);
      localStorage.setItem(TENANT_CONFIG_INFO, JSON.stringify(result));
    },
  });

  return {
    tenantConfigInfo,
    runTenantConfig,
  }
}