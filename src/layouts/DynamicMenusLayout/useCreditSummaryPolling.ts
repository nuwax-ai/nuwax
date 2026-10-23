import { EVENT_TYPE } from '@/constants/event.constants';
import {
  getHostVisibility,
  subscribeHostVisibility,
} from '@/services/hostVisibility';
import { apiGetCreditSummary } from '@/services/subscriptionService';
import eventBus from '@/utils/eventBus';
import { useEffect, useRef, useState } from 'react';
import { useModel, useRequest } from 'umi';

const CREDIT_POLLING_INTERVAL = 60000;
/** 积分套餐进入支付页后的临时间隔，总积分大于 0 后回到 60 秒 */
const CREDIT_POLLING_INTERVAL_FAST = 3000;

// summary 接口自带「每日赠送积分」发放（按天幂等），长期开着的页面跨零点后需要再调一次；
// 全局只挂一份，余额栏经事件同步显示，不各自起定时器。
export const useCreditSummaryPolling = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const enabled =
    !!tenantConfigInfo && tenantConfigInfo.enableSubscription !== 0;
  const [pollingInterval, setPollingInterval] = useState(
    CREDIT_POLLING_INTERVAL,
  );

  // 当前 Umi 的轮询计时器不会消费拒绝；失败在调用边界收口，不广播空结果。
  const polling = useRequest(
    () => apiGetCreditSummary({ silentPolling: true }).catch(() => undefined),
    {
      manual: true,
      pollingInterval,
      pollingWhenHidden: false,
      pollingErrorRetryCount: -1,
      onSuccess: (data: unknown) => {
        if (!data || typeof data !== 'object') return;
        eventBus.emit(EVENT_TYPE.CreditSummaryUpdated, data);
        const totalCredit = (data as { totalCredit?: number }).totalCredit;
        if (typeof totalCredit === 'number' && totalCredit > 0) {
          setPollingInterval(CREDIT_POLLING_INTERVAL);
        }
      },
    },
  );
  const pollingRef = useRef(polling);
  pollingRef.current = polling;

  // 积分套餐进入支付页后改为 3 秒。只打开弹窗不会发这个事件
  useEffect(() => {
    const accelerate = () => setPollingInterval(CREDIT_POLLING_INTERVAL_FAST);
    eventBus.on(EVENT_TYPE.CreditPurchasePaymentStarted, accelerate);
    return () => {
      eventBus.off(EVENT_TYPE.CreditPurchasePaymentStarted, accelerate);
    };
  }, []);

  // 间隔变化时立刻重开轮询：变短不用等完原来的 60 秒，变回 60 秒时清掉已经排上的 3 秒计时
  const pollingIntervalRef = useRef(pollingInterval);
  useEffect(() => {
    if (!enabled) return;
    if (pollingIntervalRef.current === pollingInterval) return;
    pollingIntervalRef.current = pollingInterval;
    if (getHostVisibility() && !document.hidden) {
      pollingRef.current.cancel();
      pollingRef.current.run();
    }
  }, [enabled, pollingInterval]);

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
