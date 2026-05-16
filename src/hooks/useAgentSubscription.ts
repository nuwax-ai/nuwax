import {
  apiCreateAgentSubscriptionOrder,
  apiGetAgentSubscriptionOrderCashier,
  apiGetAgentSubscriptionPlanList,
} from '@/pages/EditAgent/services/agent-subscription-plan';
import {
  SubscriptionPlanInfo,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { message } from 'antd';
import { useState } from 'react';
import { useRequest } from 'umi';

/**
 * 智能体订阅
 */
const useAgentSubscription = () => {
  // 智能体订阅计划列表
  const [agentSubscriptionPlans, setAgentSubscriptionPlans] = useState<
    SubscriptionPlanInfo[]
  >([]);

  // 查询订阅计划列表
  const {
    run: loadAgentSubscriptionPlans,
    loading: loadingAgentSubscriptionPlans,
  } = useRequest(apiGetAgentSubscriptionPlanList, {
    manual: true,
    loadingDelay: 500,
    onSuccess: (data: SubscriptionPlanInfo[]) =>
      setAgentSubscriptionPlans(data),
  });

  /**
   * 创建智能体订阅订单
   */
  const createAgentSubscriptionOrder = async (plan: SubscriptionPlanInfo) => {
    if (!plan.id || plan.status !== SubscriptionPlanStatusEnum.Online) {
      return;
    }

    // 创建订阅订单
    try {
      const orderInfo = await apiCreateAgentSubscriptionOrder(plan.id);
      const orderId = orderInfo?.data?.id;
      if (!orderId) {
        message.error('创建订阅订单失败');
        return;
      }

      // 获取收银台地址
      const res = await apiGetAgentSubscriptionOrderCashier(orderId);
      if (!res?.data?.cashierUrl) {
        message.error('获取收银台地址失败');
        return;
      }

      // 打开收银台
      window.open(res?.data?.cashierUrl, '_blank');
    } catch (error) {
      console.error('点击套餐卡片失败:', error);
    }
  };

  return {
    agentSubscriptionPlans,
    loadingAgentSubscriptionPlans,
    loadAgentSubscriptionPlans,
    createAgentSubscriptionOrder,
  };
};

export default useAgentSubscription;
