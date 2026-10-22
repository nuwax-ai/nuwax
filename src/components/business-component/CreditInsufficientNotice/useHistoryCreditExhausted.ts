import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiGetCreditSummary } from '@/services/subscriptionService';
import { useEffect, useState } from 'react';
import { lastMessageIndicatesCreditExhausted } from './hasCreditDeductionInsufficientError';

/**
 * 历史会话最后一条正文含「403 您的积分已用完」时查一次积分总览。
 * totalCredit 小于等于 0 才视为仍然不足；查询失败不展示提示。
 */
export function useHistoryCreditExhausted(
  messageList?: Array<{ text?: string | null }>,
  conversationId?: string | number,
): boolean {
  const matched = lastMessageIndicatesCreditExhausted(messageList);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    if (!matched) {
      setExhausted(false);
      return;
    }
    let cancelled = false;
    apiGetCreditSummary({ silentPolling: true })
      .then((result) => {
        if (cancelled) {
          return;
        }
        const totalCredit = result?.data?.totalCredit;
        setExhausted(
          result?.code === SUCCESS_CODE &&
            typeof totalCredit === 'number' &&
            totalCredit <= 0,
        );
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        console.error('[CreditInsufficientNotice] 查询积分总览失败', error);
        setExhausted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [matched, conversationId]);

  return exhausted;
}
