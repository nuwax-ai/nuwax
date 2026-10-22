import { EVENT_TYPE } from '@/constants/event.constants';
import eventBus from '@/utils/eventBus';
import { useEffect, useState } from 'react';

/**
 * 全局积分轮询（/api/credit/summary）最近一次 totalCredit 是否大于 0。
 * 大于 0 时收起增购提示；再次小于等于 0 时允许提示重新出现。
 */
export function useCreditBalancePositive(): boolean {
  const [positive, setPositive] = useState(false);

  useEffect(() => {
    const handleSummaryUpdated = (data?: { totalCredit?: number }) => {
      if (typeof data?.totalCredit !== 'number') {
        return;
      }
      setPositive(data.totalCredit > 0);
    };
    eventBus.on(EVENT_TYPE.CreditSummaryUpdated, handleSummaryUpdated);
    return () => {
      eventBus.off(EVENT_TYPE.CreditSummaryUpdated, handleSummaryUpdated);
    };
  }, []);

  return positive;
}
