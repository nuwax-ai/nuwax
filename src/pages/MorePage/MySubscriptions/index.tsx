import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetCreditSummary,
  apiGetMySubscription,
  apiListCreditPackages,
} from '@/services/subscriptionService';
import { BizTypeEnum } from '@/types/interfaces/subscription';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import CreditsBreakdown from './components/CreditsBreakdown';
import CurrentPlanCard from './components/CurrentPlanCard';
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

  // 获取积分套餐列表
  const { data: packagesData, run: fetchPackages } = useRequest(
    apiListCreditPackages,
    {
      manual: true,
    },
  );

  // 刷新所有数据
  const refreshAll = () => {
    fetchCreditSummary();
    fetchMySubscription();
    fetchPackages();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleRenew = () => {
    message.success(dict('PC.Pages.MorePage.MySubscriptions.renewSuccess'));
  };

  const handleUpgrade = () => {
    message.success(dict('PC.Pages.MorePage.MySubscriptions.upgradeSuccess'));
  };

  const currentSub = subData?.currentSubscription;

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.MySubscriptions.pageTitle')}
    >
      {/* 展板信息 */}
      {currentSub && <CurrentPlanCard planInfo={currentSub} />}

      {/* 积分明细 */}
      <CreditsBreakdown
        summary={creditsSummary}
        onAddPurchase={() => setPurchaseOpen(true)}
      />

      {/* 订阅套餐网格 */}
      <SubscriptionPlanCards
        plans={
          packagesData?.map((item: any) => ({
            id: item.id.toString(),
            name: item.packageName,
            price: item.price,
            features: [item.remark || '', ...[]],
            period: item.period,
          })) || []
        }
        currentPlanId={currentSub?.planId.toString()}
        onRenew={handleRenew}
        onUpgrade={handleUpgrade}
      />

      {/* 已订阅内容 */}
      <SubscribedContent />

      <CreditsPurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
        onSuccess={refreshAll}
      />
    </WorkspaceLayout>
  );
};

export default MySubscriptions;
