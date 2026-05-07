import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetCreditSummary,
  apiGetMySubscription,
} from '@/services/subscriptionService';
import { BizTypeEnum } from '@/types/interfaces/subscription';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import CreditsBreakdown from './components/CreditsBreakdown';
import CurrentPlanCard from './components/CurrentPlanCard';
import SubscribedContent from './components/SubscribedContent';
import type { PlanInfo } from './components/SubscriptionPlanCards';
import SubscriptionPlanCards from './components/SubscriptionPlanCards';

// Mock 订阅套餐数据
const MOCK_PLANS: PlanInfo[] = [
  {
    id: 'basic',
    name: '基础版',
    price: 99,
    features: [
      '500 积分/月',
      '20个模型',
      '全部工具',
      '标准技术支持',
      'API调用',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: 299,
    features: [
      '2,000 积分/月',
      '50个模型',
      '全部工具+技能',
      '优先技术支持',
      'API调用',
    ],
  },
  {
    id: 'enterprise',
    name: '旗舰版',
    price: 999,
    features: [
      '10,000 积分/月',
      '100+个模型',
      '全部工具+技能',
      '专属技术支持',
      'API调用 + 私有部署',
    ],
  },
];

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

  useEffect(() => {
    fetchCreditSummary();
    fetchMySubscription();
  }, []);

  // 刷新所有数据
  const refreshAll = () => {
    fetchCreditSummary();
    fetchMySubscription();
  };

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
        plans={MOCK_PLANS}
        currentPlanId="pro"
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
