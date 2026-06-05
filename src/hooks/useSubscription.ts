import { apiGetAgentSubscriptionPlanList } from '@/pages/EditAgent/services/agent-subscription-plan';
import { useSubscriptionPurchase } from '@/pages/MorePage/MySubscriptions/hooks/useSubscriptionPurchase';
import { apiQueryToolPricing } from '@/pages/SpaceResource/services/resource';
import {
  ResourcePricingConfigInfo,
  ToolPricingTargetType,
} from '@/pages/SpaceResource/types/resource';
import {
  SubscriptionPlanInfo,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { dict } from '@/services/i18nRuntime';
import { apiGetMySubscription } from '@/services/subscriptionService';
import { BizTypeEnum } from '@/types/interfaces/subscription';
import { message } from 'antd';
import { useCallback, useState } from 'react';
import useRequestPromiseBridge from './useRequestPromiseBridge';

/**
 * 智能体订阅（套餐列表、「我的订阅」当前智能体数据）
 */
const useSubscription = () => {
  const { handlePaySubscription } = useSubscriptionPurchase();

  // 智能体订阅计划列表
  const [agentSubscriptionPlans, setAgentSubscriptionPlans] = useState<
    SubscriptionPlanInfo[]
  >([]);

  // 套餐列表来自 apiQueryToolPricing
  const [targetSubscriptionPlans, setTargetSubscriptionPlans] = useState<
    SubscriptionPlanInfo[]
  >([]);

  // 查询目标对象定价配置
  const { runWithPromise: loadTargetPricing, loading: loadingTargetPricing } =
    useRequestPromiseBridge(apiQueryToolPricing, {
      manual: true,
      loadingDelay: 300,
      onSuccess: (data: ResourcePricingConfigInfo) => {
        setTargetSubscriptionPlans(data?.plans || []);
      },
    });

  // 查询订阅计划列表
  const {
    runWithPromise: loadAgentSubscriptionPlans,
    loading: loadingAgentSubscriptionPlans,
  } = useRequestPromiseBridge(apiGetAgentSubscriptionPlanList, {
    manual: true,
    loadingDelay: 500,
    onSuccess: (data: SubscriptionPlanInfo[]) =>
      setAgentSubscriptionPlans(data),
  });

  /** 当前智能体、技能套餐维度「我的订阅」 */
  const {
    data: mySubscriptionInfo,
    runWithPromise: loadMySubscription,
    loading: loadingMySubscription,
  } = useRequestPromiseBridge(apiGetMySubscription, {
    manual: true,
    loadingDelay: 500,
  });

  const ignoreRequestError = useCallback(() => {
    // Global request errorHandler already shows the user-facing message.
  }, []);

  /**
   * 创建智能体订阅订单
   */
  const createSubscriptionOrder = async (plan: SubscriptionPlanInfo) => {
    if (!plan.id) {
      message.warning(
        dict('PC.Pages.Square.SkillDetail.subscribeNeedsPlanConfigured'),
      );
      return;
    }

    if (plan.status !== SubscriptionPlanStatusEnum.Online) {
      return;
    }

    // 统一走支付 Hook
    handlePaySubscription(plan.id);
  };

  // 查询智能体订阅计划列表以及当前智能体我的订阅信息
  const queryAgentSubscriptionPlans = useCallback(
    (agentId: number) => {
      // 查询智能体订阅计划列表
      loadAgentSubscriptionPlans({
        agentId,
        status: SubscriptionPlanStatusEnum.Online,
      }).catch(ignoreRequestError);

      // 查询当前智能体维度「我的订阅」接口数据
      loadMySubscription({
        bizType: BizTypeEnum.Agent,
        bizId: agentId,
      }).catch(ignoreRequestError);
    },
    [ignoreRequestError, loadAgentSubscriptionPlans, loadMySubscription],
  );

  // 查询智能体订阅计划列表以及当前智能体我的订阅信息
  const querySkillSubscriptionPlans = useCallback(
    (skillId: number) => {
      // 查询技能定价配置
      loadTargetPricing({
        targetType: ToolPricingTargetType.SKILL,
        targetId: String(skillId),
      }).catch(ignoreRequestError);

      // 查询当前技能维度「我的订阅」接口数据
      loadMySubscription({
        bizType: BizTypeEnum.Skill,
        bizId: skillId,
      }).catch(ignoreRequestError);
    },
    [ignoreRequestError, loadMySubscription, loadTargetPricing],
  );

  return {
    // 智能体订阅计划列表
    agentSubscriptionPlans,
    // 查询智能体订阅计划列表
    loadingAgentSubscriptionPlans,
    // 我的订阅信息
    mySubscriptionInfo,
    loadingMySubscription,
    // 创建订阅订单
    createSubscriptionOrder,
    // 查询目标对象定价配置
    loadingTargetPricing,
    targetSubscriptionPlans,
    // 查询智能体订阅计划列表以及当前智能体我的订阅信息
    queryAgentSubscriptionPlans,
    // 查询技能订阅计划列表以及当前技能我的订阅信息
    querySkillSubscriptionPlans,
  };
};

export default useSubscription;
