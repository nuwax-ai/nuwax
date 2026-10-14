import { EVENT_TYPE } from '@/constants/event.constants';
import {
  getHostVisibility,
  subscribeHostVisibility,
} from '@/services/hostVisibility';
import { apiGetCreditSummary } from '@/services/subscriptionService';
import eventBus from '@/utils/eventBus';
import { useEffect, useRef } from 'react';
import { useModel, useRequest } from 'umi';

const CREDIT_POLLING_INTERVAL = 60000;

// summary 接口自带「每日赠送积分」发放（按天幂等），长期开着的页面跨零点后需要再调一次；
// 全局只挂一份，余额栏经事件同步显示，不各自起定时器。
export const useCreditSummaryPolling = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const enabled =
    !!tenantConfigInfo && tenantConfigInfo.enableSubscription !== 0;

  const polling = useRequest(apiGetCreditSummary, {
    manual: true,
    pollingInterval: CREDIT_POLLING_INTERVAL,
    pollingWhenHidden: false,
    pollingErrorRetryCount: -1,
    onSuccess: (data: unknown) => {
      eventBus.emit(EVENT_TYPE.CreditSummaryUpdated, data);
    },
  });
  const pollingRef = useRef(polling);
  pollingRef.current = polling;

  // 不可见（浏览器 tab 切走 / 桌面宿主最小化、锁屏）停轮询，恢复可见立即补拉
  useEffect(() => {
    if (!enabled) return;
    const synchronize = () => {
      if (getHostVisibility() && !document.hidden) {
        pollingRef.current.run();
      } else {
        pollingRef.current.cancel();
      }
    };
    const unsubscribeHost = subscribeHostVisibility(synchronize);
    document.addEventListener('visibilitychange', synchronize);
    synchronize();
    return () => {
      unsubscribeHost();
      document.removeEventListener('visibilitychange', synchronize);
      pollingRef.current.cancel();
    };
  }, [enabled]);
};
