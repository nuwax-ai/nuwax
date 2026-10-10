import { apiGetCreditSummary } from '@/services/subscriptionService';
import { useEffect } from 'react';
import { useModel, useRequest } from 'umi';

// 积分 summary 接口自带发放逻辑，必须随布局挂载触发；单栏模式没有常驻余额栏，
// 余额组件只在用户弹层展开后才挂载，不能依赖它来拉取。
export const useCreditGrantTrigger = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const enabled =
    !!tenantConfigInfo && tenantConfigInfo.enableSubscription !== 0;
  const { run } = useRequest(apiGetCreditSummary, { manual: true });

  useEffect(() => {
    if (enabled) run();
  }, [enabled, run]);
};
