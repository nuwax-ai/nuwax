import { PAYMENT_SETTLEMENT_PATH } from '@/constants/subscription.constants';
import {
  apiCreateAgentSubscriptionOrder,
  apiGetAgentSubscriptionOrderCashier,
} from '@/pages/EditAgent/services/agent-subscription-plan';
import { dict } from '@/services/i18nRuntime';
import { apiCreateCreditOrder } from '@/services/subscriptionService';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { history, useLocation, useRequest } from 'umi';

// 全局单例锁：记录已展示过 Toast 的 订单ID + 支付结果 映射，防止同页面中多实例重复触发弹窗
const alertedKeys = new Set<string>();

export const useSubscriptionPurchase = () => {
  const [processingId, setProcessingId] = useState<number | string | null>(
    null,
  );
  const location = useLocation();
  const returnUrlRef = useRef<string>('');

  // 处理支付返回的 payResult 参数并清除 URL 冗余参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const payResult = searchParams.get('payResult');
    const orderId = searchParams.get('orderId') || '';
    if (payResult) {
      // 构造全局唯一事务锁 Key
      const alertKey = `${orderId}_${payResult}`;
      if (alertedKeys.has(alertKey)) return;
      alertedKeys.add(alertKey);

      if (payResult === 'success') {
        message.success(dict('PC.Pages.MorePage.MySubscriptions.paySuccess'));
      } else if (payResult === 'failed') {
        message.error(dict('PC.Pages.MorePage.MySubscriptions.payFailed'));
      } else if (payResult === 'pending') {
        message.info(dict('PC.Pages.MorePage.MySubscriptions.payPending'));
      }

      // 清除 URL 中的参数，防止刷新页面时重复提示
      const params = new URLSearchParams(location.search);
      params.delete('payResult');
      params.delete('orderId');
      const searchStr = params.toString();
      const newSearch = searchStr ? `?${searchStr}` : '';
      history.replace({
        pathname: location.pathname,
        search: newSearch,
      });
    }
  }, [location.search]);

  // 获取收银台地址并跳转支付
  const { run: getCashierUrl, loading: fetchingCashier } = useRequest(
    apiGetAgentSubscriptionOrderCashier,
    {
      manual: true,
      onSuccess: (res: any) => {
        const data = res?.data || res;
        if (data && data?.cashierUrl) {
          window.location.href = data.cashierUrl;
        }
      },
      onFinally: () => {
        setProcessingId(null);
      },
    },
  );

  // 创建订阅订单
  const { run: createSubscriptionOrder } = useRequest(
    apiCreateAgentSubscriptionOrder,
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res) {
          const data = res?.data || res;
          const orderId = data?.id;
          if (orderId) {
            const settlementUrl = new URL(
              PAYMENT_SETTLEMENT_PATH,
              window.location.origin,
            );
            settlementUrl.searchParams.set('orderId', String(orderId));
            settlementUrl.searchParams.set(
              'returnUrl',
              returnUrlRef.current || window.location.href,
            );

            getCashierUrl({
              orderId,
              returnUrl: settlementUrl.href,
            });
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
    },
  );

  // 创建积分订单
  const { run: createCreditOrder, loading: creatingCreditOrder } = useRequest(
    apiCreateCreditOrder,
    {
      manual: true,
      onSuccess: (res: any) => {
        if (res) {
          const data = res?.data || res;
          const orderId = data?.id;
          if (orderId) {
            const settlementUrl = new URL(
              PAYMENT_SETTLEMENT_PATH,
              window.location.origin,
            );
            settlementUrl.searchParams.set('orderId', String(orderId));
            settlementUrl.searchParams.set(
              'returnUrl',
              returnUrlRef.current || window.location.href,
            );

            getCashierUrl({
              orderId,
              returnUrl: settlementUrl.href,
            });
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
    },
  );

  // 发起订阅计划支付 (支持自定义传入回跳的 Return URL)
  const handlePaySubscription = (
    planId: number | string,
    dynamicReturnUrl?: string,
  ) => {
    if (processingId) return;
    setProcessingId(planId);
    returnUrlRef.current = dynamicReturnUrl || '';
    createSubscriptionOrder(Number(planId));
  };

  // 发起增购积分支付 (支持自定义传入回跳的 Return URL)
  const handlePayCredits = (
    packageId: number | string,
    dynamicReturnUrl?: string,
  ) => {
    if (processingId) return;
    setProcessingId(packageId);
    returnUrlRef.current = dynamicReturnUrl || '';
    createCreditOrder({ packageId: Number(packageId) });
  };

  // 针对已存在的订单发起支付 (支持自定义传入回跳的 Return URL)
  const handlePayExistingOrder = (
    orderId: number | string,
    dynamicReturnUrl?: string,
  ) => {
    if (processingId) return;
    setProcessingId(orderId);
    returnUrlRef.current = dynamicReturnUrl || '';

    const settlementUrl = new URL(
      PAYMENT_SETTLEMENT_PATH,
      window.location.origin,
    );
    settlementUrl.searchParams.set('orderId', String(orderId));
    settlementUrl.searchParams.set(
      'returnUrl',
      dynamicReturnUrl || window.location.href,
    );

    getCashierUrl({
      orderId,
      returnUrl: settlementUrl.href,
    });
  };

  const loading = fetchingCashier || creatingCreditOrder;

  return {
    processingId,
    loading,
    handlePaySubscription,
    handlePayCredits,
    handlePayExistingOrder,
  };
};
