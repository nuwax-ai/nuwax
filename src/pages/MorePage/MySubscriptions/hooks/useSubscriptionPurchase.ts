import {
  apiCreateAgentSubscriptionOrder,
  apiGetAgentSubscriptionOrderCashier,
} from '@/pages/EditAgent/services/agent-subscription-plan';
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { useState } from 'react';
import { useRequest } from 'umi';

export const useSubscriptionPurchase = () => {
  const [processingId, setProcessingId] = useState<number | string | null>(
    null,
  );

  // 获取收银台地址并跳转支付
  const { run: getCashierUrl } = useRequest(
    apiGetAgentSubscriptionOrderCashier,
    {
      manual: true,
      onSuccess: (res: any) => {
        const data = res?.data || res;
        if (data && data?.cashierUrl) {
          const returnUrl = encodeURIComponent(window.location.href);
          const separator = data.cashierUrl.includes('?') ? '&' : '?';
          const url = `${data.cashierUrl}${separator}returnUrl=${returnUrl}`;
          window.location.href = url;
        }
      },
      onFinally: () => {
        setProcessingId(null);
      },
    },
  );

  // 创建订阅订单
  const { run: createOrder } = useRequest(apiCreateAgentSubscriptionOrder, {
    manual: true,
    onSuccess: (res: any) => {
      if (res) {
        const data = res?.data || res;
        const orderId = data?.id;
        if (orderId) {
          getCashierUrl({ orderId });
        } else {
          message.error(
            dict('PC.Pages.MorePage.MySubscriptions.orderIdNotFound'),
          );
          setProcessingId(null);
        }
      } else {
        setProcessingId(null);
      }
    },
    onError: () => {
      setProcessingId(null);
    },
  });

  const handlePay = (planId: number | string) => {
    if (processingId) return;
    setProcessingId(planId);
    createOrder(Number(planId));
  };

  return {
    processingId,
    handlePay,
  };
};
