import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetCreditSummary,
  apiGetMySubscription,
  apiListSystemSubscriptionPlans,
} from '@/services/subscriptionService';
import { BizTypeEnum } from '@/types/interfaces/subscription';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import CreditsBreakdown from './components/CreditsBreakdown';
import PurchaseModal from './components/CreditsBreakdown/components/PurchaseModal';
// import CurrentPlanCard from './components/CurrentPlanCard';
import SubscribedContent from './components/SubscribedContent';
import SubscriptionPlanCards from './components/SubscriptionPlanCards';

const MySubscriptions: React.FC = () => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  // 获取积分汇总数据
  const { data: creditsSummary, run: fetchCreditSummary } = useRequest(
    apiGetCreditSummary,
    {
      manual: true,
    },
  );

  // 获取我的订阅（系统级）
  const { data: subData, run: fetchMySubscription } = useRequest(
    () => apiGetMySubscription({ bizType: BizTypeEnum.System }),
    {
      manual: true,
    },
  );

  // 获取积分套餐列表（新版系统计划）
  const { data: packagesData, run: fetchPackagesData } = useRequest(
    apiListSystemSubscriptionPlans,
    {
      manual: true,
    },
  );

  // 刷新所有数据
  const refreshAll = () => {
    fetchCreditSummary();
    fetchMySubscription();
    fetchPackagesData();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const currentSub = subData?.currentSubscription;

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.MySubscriptions.pageTitle')}
    >
      {/* 展板信息 */}
      {/* {currentSub && <CurrentPlanCard planInfo={currentSub} />} */}

      {/* 积分明细 */}
      <CreditsBreakdown
        summary={creditsSummary}
        onAddPurchase={() => setPurchaseOpen(true)}
      />

      {/* 订阅套餐网格 */}
      <SubscriptionPlanCards
        data={packagesData}
        currentPlanId={currentSub?.planId}
        endTime={currentSub?.endTime}
        price={currentSub?.price}
      />

      {/* 已订阅内容 */}
      <SubscribedContent />
      <PurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default MySubscriptions;
