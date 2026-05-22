import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetCreditSummary,
  apiGetMySubscription,
  apiListSystemSubscriptionPlans,
} from '@/services/subscriptionService';
import { BizTypeEnum } from '@/types/interfaces/subscription';
import { Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation, useRequest } from 'umi';
import CreditsBreakdown from './components/CreditsBreakdown';
import PurchaseModal from './components/CreditsBreakdown/components/PurchaseModal';
// import CurrentPlanCard from './components/CurrentPlanCard';
import SubscribedContent from './components/SubscribedContent';
import SubscriptionPlanCards from './components/SubscriptionPlanCards';

const MySubscriptions: React.FC<{ app?: boolean }> = ({ app = false }) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const location = useLocation();

  const {
    data: creditsSummary,
    run: fetchCreditSummary,
    loading: creditsLoading,
  } = useRequest(apiGetCreditSummary, {
    manual: true,
  });

  const {
    data: subData,
    run: fetchMySubscription,
    loading: subLoading,
  } = useRequest(() => apiGetMySubscription({ bizType: BizTypeEnum.System }), {
    manual: true,
  });

  const {
    data: packagesData,
    run: fetchPackagesData,
    loading: packagesLoading,
  } = useRequest(apiListSystemSubscriptionPlans, {
    manual: true,
  });

  const pageLoading = creditsLoading || subLoading || packagesLoading;

  // 刷新所有数据
  const refreshAll = () => {
    fetchCreditSummary();
    fetchMySubscription();
    if (!app) {
      fetchPackagesData();
    }
  };

  useEffect(() => {
    refreshAll();
  }, [location]);

  const currentSub = subData?.currentSubscription;

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.MySubscriptions.pageTitle')}
    >
      <Spin spinning={pageLoading}>
        {/* 展板信息 */}
        {/* {currentSub && <CurrentPlanCard planInfo={currentSub} />} */}

        {/* 积分明细 */}
        <CreditsBreakdown
          app={app}
          summary={creditsSummary}
          onAddPurchase={() => setPurchaseOpen(true)}
        />

        {/* 订阅套餐网格 */}
        {!app && (
          <SubscriptionPlanCards
            data={packagesData}
            currentPlanId={currentSub?.planId}
            endTime={currentSub?.endTime}
            price={currentSub?.plan?.price}
          />
        )}

        {/* 已订阅内容 */}
        <SubscribedContent />
      </Spin>
      <PurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default MySubscriptions;
