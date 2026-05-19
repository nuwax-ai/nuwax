import {
  apiCreateAgentSubscriptionOrder,
  apiGetAgentSubscriptionOrderCashier,
  apiGetAgentSubscriptionPlanList,
} from '@/pages/EditAgent/services/agent-subscription-plan';
import { apiQueryToolPricing } from '@/pages/SpaceResource/services/resource';
import { ResourcePricingConfigInfo } from '@/pages/SpaceResource/types/resource';
import {
  SubscriptionPlanInfo,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { apiGetMySubscription } from '@/services/subscriptionService';
import { BizTypeEnum } from '@/types/interfaces/subscription';
import { message } from 'antd';
import { useCallback, useState } from 'react';
import { useRequest } from 'umi';

/**
 * 智能体订阅（套餐列表、「我的订阅」当前智能体数据）
 */
const useAgentSubscription = () => {
  // 智能体订阅计划列表
  const [agentSubscriptionPlans, setAgentSubscriptionPlans] = useState<
    SubscriptionPlanInfo[]
  >([]);

  // 套餐列表来自 apiQueryToolPricing
  const [targetSubscriptionPlans, setTargetSubscriptionPlans] = useState<
    SubscriptionPlanInfo[]
  >([]);

  // 查询目标对象定价配置
  const { run: loadTargetPricing, loading: loadingTargetPricing } = useRequest(
    apiQueryToolPricing,
    {
      manual: true,
      loadingDelay: 300,
      onSuccess: (data: ResourcePricingConfigInfo) => {
        setTargetSubscriptionPlans(data?.plans || []);
      },
    },
  );

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

  /** 当前智能体、技能套餐维度「我的订阅」 */
  const {
    data: mySubscriptionInfo,
    run: loadMySubscription,
    loading: loadingMySubscription,
  } = useRequest(apiGetMySubscription, {
    manual: true,
    loadingDelay: 500,
  });

  /**
   * 创建智能体订阅订单
   */
  const createSubscriptionOrder = async (plan: SubscriptionPlanInfo) => {
    if (!plan.id || plan.status !== SubscriptionPlanStatusEnum.Online) {
      return;
    }

    // 创建订阅订单
    try {
      const orderResponse = await apiCreateAgentSubscriptionOrder(plan.id);
      const orderId = orderResponse?.data?.id;
      if (!orderId) {
        message.error('创建订阅订单失败');
        return;
      }

      // 获取收银台地址
      const cashierResponse = await apiGetAgentSubscriptionOrderCashier(
        orderId,
      );
      if (!cashierResponse?.data?.cashierUrl) {
        message.error('获取收银台地址失败');
        return;
      }

      // 打开收银台
      if (cashierResponse?.data?.cashierUrl) {
        const returnUrl = encodeURIComponent(window.location.href);
        const separator = cashierResponse.data.cashierUrl.includes('?')
          ? '&'
          : '?';
        const url = `${cashierResponse.data.cashierUrl}${separator}returnUrl=${returnUrl}`;
        window.location.href = url;
      }
    } catch (error) {
      console.error('点击套餐卡片失败:', error);
    }
  };

  // 打开智能体订阅套餐弹窗
  const openAgentSubscriptionModal = useCallback((agentId: number) => {
    // 查询智能体订阅计划列表
    loadAgentSubscriptionPlans({
      agentId,
      status: SubscriptionPlanStatusEnum.Online,
    });

    // 查询当前智能体维度「我的订阅」接口数据
    loadMySubscription({
      bizType: BizTypeEnum.Agent,
      bizId: agentId,
    });
  }, []);

  return {
    agentSubscriptionPlans,
    loadingAgentSubscriptionPlans,
    mySubscriptionInfo,
    loadingMySubscription,
    // 查询当前智能体维度「我的订阅」接口数据
    loadMySubscription,
    // 创建智能体订阅订单
    createSubscriptionOrder,
    openAgentSubscriptionModal,
    // 查询目标对象定价配置
    loadTargetPricing,
    loadingTargetPricing,
    targetSubscriptionPlans,
  };
};

export default useAgentSubscription;
