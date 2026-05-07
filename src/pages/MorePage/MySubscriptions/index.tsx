import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { apiGetUserCredits } from '@/services/subscriptionService';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
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

// Mock 当前订阅信息
const MOCK_CURRENT_PLAN = {
  planName: '专业版',
  price: 299,
  expireAt: '2025-12-31',
  monthlyCredits: 2000,
  issuedCredits: 1500,
};

const MySubscriptions: React.FC = () => {
  const [balance, setBalance] = useState<number>(12580);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const { run: fetchCredits } = useRequest(apiGetUserCredits, {
    manual: true,
    onSuccess: (res: { data: { balance: number } }) => {
      if (res?.data) setBalance(res.data.balance);
    },
  });

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleRenew = () => {
    message.success(
      dict('PC.Pages.MorePage.MySubscriptions.renewSuccess') || '续订成功',
    );
  };

  const handleUpgrade = () => {
    message.success(
      dict('PC.Pages.MorePage.MySubscriptions.upgradeSuccess') || '升级成功',
    );
  };

  // 积分明细数据
  const creditsBreakdown = {
    total: balance,
    subscription: 8580,
    purchase: 3500,
    activity: 500,
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.MySubscriptions.pageTitle')}
    >
      {/* 展板信息 */}
      <CurrentPlanCard
        planInfo={MOCK_CURRENT_PLAN}
        creditsBreakdown={creditsBreakdown}
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
        onSuccess={fetchCredits}
      />
    </WorkspaceLayout>
  );
};

export default MySubscriptions;
