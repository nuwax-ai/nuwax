import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import type { PlanInfo } from '@/components/business-component/SubscriptionPlanCards';
import SubscriptionPlanCards from '@/components/business-component/SubscriptionPlanCards';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { apiGetUserCredits } from '@/services/subscriptionService';
import { Button, Segmented, Tag, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

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

// Mock 智能体订阅
const MOCK_SUBSCRIBED_AGENTS = [
  {
    id: 1,
    name: '智能文档摘要',
    provider: 'AI Labs · 文本处理',
    price: 19.9,
    expireAt: '2026-05-28',
    status: 'active' as const,
  },
  {
    id: 2,
    name: 'AI绘画助手',
    provider: 'CreativeAI · 图像处理',
    price: 29.9,
    expireAt: '2026-06-15',
    status: 'active' as const,
  },
  {
    id: 3,
    name: '智能客服对话',
    provider: 'ChatBot · 对话生成',
    price: 9.9,
    expireAt: '2026-04-30',
    status: 'expired' as const,
  },
  {
    id: 4,
    name: '合同审查助手',
    provider: 'LegalAI · 法律合规',
    price: 39.9,
    expireAt: '2026-07-01',
    status: 'active' as const,
  },
  {
    id: 5,
    name: '数据可视化生成',
    provider: 'DataViz · 数据分析',
    price: 14.9,
    expireAt: '2026-05-10',
    status: 'active' as const,
  },
  {
    id: 6,
    name: '邮件智能撰写',
    provider: 'MailGen · 办公效率',
    price: 24.9,
    expireAt: '2026-08-20',
    status: 'active' as const,
  },
];

// Mock 技能订阅
const MOCK_SUBSCRIBED_SKILLS = [
  {
    id: 1,
    name: '语音合成',
    provider: 'TTS · 音视频',
    buyout: true,
    buyoutPrice: 199,
    status: 'active' as const,
  },
  {
    id: 2,
    name: '图像识别',
    provider: 'CV · 视觉',
    buyout: true,
    buyoutPrice: 149,
    status: 'active' as const,
  },
  {
    id: 3,
    name: '翻译服务',
    provider: 'NLP · 多语言',
    buyout: false,
    price: 29.9,
    expireAt: '2026-06-15',
    status: 'active' as const,
  },
  {
    id: 4,
    name: '数据采集',
    provider: 'Scraper · 数据',
    buyout: false,
    price: 19.9,
    expireAt: '2026-05-10',
    status: 'active' as const,
  },
  {
    id: 5,
    name: 'PDF处理',
    provider: 'DocAI · 办公',
    buyout: false,
    price: 9.9,
    expireAt: '2026-04-20',
    status: 'expired' as const,
  },
];

// Mock 增购积分包
const MOCK_CREDIT_PACKS = [
  {
    id: 1,
    name: '积分包C',
    purchaseDate: '2025-08-20',
    totalCredits: 5000,
    consumed: 2100,
    expireAt: '2026-08-20',
    amount: 499,
    remaining: 2900,
    status: 'normal' as const,
  },
  {
    id: 2,
    name: '积分包B',
    purchaseDate: '2025-06-10',
    totalCredits: 2000,
    consumed: 1850,
    expireAt: '2026-06-10',
    amount: 199,
    remaining: 150,
    status: 'low' as const,
  },
  {
    id: 3,
    name: '积分包A',
    purchaseDate: '2025-03-05',
    totalCredits: 1000,
    consumed: 1000,
    expireAt: '2026-03-05',
    amount: 99,
    remaining: 0,
    status: 'empty' as const,
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

const TAB_KEYS = {
  agents: 'agents',
  skills: 'skills',
  credits: 'credits',
} as const;

const MySubscriptions: React.FC = () => {
  const [balance, setBalance] = useState<number>(12580);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.agents);

  const { run: fetchCredits } = useRequest(apiGetUserCredits, {
    manual: true,
    onSuccess: (res) => {
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
      {/* 当前订阅卡片 */}
      <div className={styles.currentPlanCard}>
        <div className={styles.planHeader}>
          <div>
            <div className={styles.planName}>{MOCK_CURRENT_PLAN.planName}</div>
            <div className={styles.planStatus}>
              {dict('PC.Pages.MorePage.MySubscriptions.statusActive')}
            </div>
          </div>
        </div>

        <div className={styles.planMeta}>
          <div className={styles.planMetaItem}>
            <span className={styles.metaLabel}>
              {dict('PC.Pages.MorePage.MySubscriptions.monthlyFee')}
            </span>
            <span className={styles.metaValue}>¥{MOCK_CURRENT_PLAN.price}</span>
            <span className={styles.metaHint}>
              {dict(
                'PC.Pages.MorePage.MySubscriptions.renewedTo',
                MOCK_CURRENT_PLAN.expireAt.slice(0, 7),
              )}
            </span>
          </div>
          <div className={styles.planMetaItem}>
            <span className={styles.metaLabel}>
              {dict('PC.Pages.MorePage.MySubscriptions.monthlyCredits')}
            </span>
            <span className={styles.metaValue}>
              {MOCK_CURRENT_PLAN.monthlyCredits.toLocaleString()}
            </span>
            <span className={styles.metaHint}>
              {dict(
                'PC.Pages.MorePage.MySubscriptions.creditsIssued',
                String(MOCK_CURRENT_PLAN.issuedCredits),
              )}
            </span>
          </div>
        </div>

        {/* 积分明细 */}
        <div className={styles.creditsBreakdown}>
          <div className={styles.creditsRow}>
            <span className={styles.creditsLabel}>
              {dict('PC.Pages.MorePage.MySubscriptions.totalCredits')}
              <span
                className={styles.creditsLink}
                onClick={() => history.push('/more-page/credit-records')}
              >
                {' '}
                {dict('PC.Pages.MorePage.MySubscriptions.detail')}
              </span>
            </span>
            <span className={styles.creditsValue}>
              {creditsBreakdown.total.toLocaleString()}
            </span>
          </div>
          <div className={styles.creditsRow}>
            <span className={styles.creditsLabel}>
              {dict('PC.Pages.MorePage.MySubscriptions.subscriptionCredits')}
            </span>
            <span className={styles.creditsValue}>
              {creditsBreakdown.subscription.toLocaleString()}
            </span>
          </div>
          <div className={styles.creditsRow}>
            <span className={styles.creditsLabel}>
              {dict('PC.Pages.MorePage.MySubscriptions.purchaseCredits')}
              <Button
                type="link"
                size="small"
                className={styles.addPurchaseBtn}
                onClick={() => setPurchaseOpen(true)}
              >
                {dict('PC.Pages.MorePage.MySubscriptions.addPurchase')}
              </Button>
            </span>
            <span className={styles.creditsValue}>
              {creditsBreakdown.purchase.toLocaleString()}
            </span>
          </div>
          <div className={styles.creditsRow}>
            <span className={styles.creditsLabel}>
              {dict('PC.Pages.MorePage.MySubscriptions.activityCredits')}
            </span>
            <span className={styles.creditsValue}>
              {creditsBreakdown.activity.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 订阅套餐网格 */}
      <SubscriptionPlanCards
        plans={MOCK_PLANS}
        currentPlanId="pro"
        onRenew={handleRenew}
        onUpgrade={handleUpgrade}
      />

      {/* 已订阅内容 */}
      <div className={styles.subscribedSection}>
        <div className={styles.subscribedTitle}>
          {dict('PC.Pages.MorePage.MySubscriptions.subscribedContent')}
        </div>
        <Segmented
          className={styles.subscribedTabs}
          value={activeTab}
          onChange={(val) => setActiveTab(val as string)}
          options={[
            {
              value: TAB_KEYS.agents,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabAgents'),
            },
            {
              value: TAB_KEYS.skills,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabSkills'),
            },
            {
              value: TAB_KEYS.credits,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabCredits'),
            },
          ]}
        />

        {/* 智能体 Tab */}
        {activeTab === TAB_KEYS.agents && (
          <div className={styles.subscribedGrid}>
            {MOCK_SUBSCRIBED_AGENTS.map((agent) => (
              <div key={agent.id} className={styles.subscribedCard}>
                <div className={styles.subscribedInfo}>
                  <div className={styles.subscribedName}>{agent.name}</div>
                  <div className={styles.subscribedProvider}>
                    {agent.provider}
                  </div>
                  <div className={styles.subscribedMeta}>
                    <span>
                      {dict('PC.Pages.MorePage.MySubscriptions.subAmount')} ¥
                      {agent.price}
                      {dict('PC.Pages.MorePage.MySubscriptions.perMonth')}
                    </span>
                    <span>
                      {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}{' '}
                      {agent.expireAt}
                    </span>
                  </div>
                </div>
                <div className={styles.subscribedActions}>
                  <Tag
                    className={styles.subscribedStatus}
                    color={agent.status === 'active' ? 'success' : 'error'}
                  >
                    {agent.status === 'active'
                      ? dict('PC.Pages.MorePage.MySubscriptions.subscribing')
                      : dict('PC.Pages.MorePage.MySubscriptions.expired')}
                  </Tag>
                  <Button
                    size="small"
                    onClick={() =>
                      message.success(
                        dict(
                          'PC.Pages.MorePage.MySubscriptions.renewSuccess',
                        ) || '续订成功',
                      )
                    }
                  >
                    {dict('PC.Pages.MorePage.MySubscriptions.renew')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 技能 Tab */}
        {activeTab === TAB_KEYS.skills && (
          <div className={styles.subscribedGrid}>
            {MOCK_SUBSCRIBED_SKILLS.map((skill) => (
              <div key={skill.id} className={styles.subscribedCard}>
                <div className={styles.subscribedInfo}>
                  <div className={styles.subscribedName}>{skill.name}</div>
                  <div className={styles.subscribedProvider}>
                    {skill.provider}
                  </div>
                  {skill.buyout ? (
                    <div className={styles.subscribedMeta}>
                      <span>
                        {dict('PC.Pages.MorePage.MySubscriptions.permanentUse')}
                      </span>
                    </div>
                  ) : (
                    <div className={styles.subscribedMeta}>
                      <span>
                        {dict('PC.Pages.MorePage.MySubscriptions.subAmount')} ¥
                        {skill.price}
                        {dict('PC.Pages.MorePage.MySubscriptions.perMonth')}
                      </span>
                      <span>
                        {dict('PC.Pages.MorePage.MySubscriptions.expireTime')}{' '}
                        {skill.expireAt}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.subscribedActions}>
                  {skill.buyout ? (
                    <>
                      <Tag color="default">
                        {dict('PC.Pages.MorePage.MySubscriptions.boughtOut')}
                      </Tag>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {dict(
                          'PC.Pages.MorePage.MySubscriptions.buyoutPrice',
                          String(skill.buyoutPrice),
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Tag
                        color={skill.status === 'active' ? 'success' : 'error'}
                      >
                        {skill.status === 'active'
                          ? dict(
                              'PC.Pages.MorePage.MySubscriptions.monthlyPayment',
                            )
                          : dict('PC.Pages.MorePage.MySubscriptions.expired')}
                      </Tag>
                      <Button
                        size="small"
                        onClick={() =>
                          message.success(
                            dict(
                              'PC.Pages.MorePage.MySubscriptions.renewSuccess',
                            ) || '续订成功',
                          )
                        }
                      >
                        {dict('PC.Pages.MorePage.MySubscriptions.renew')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 增购积分 Tab */}
        {activeTab === TAB_KEYS.credits && (
          <div className={styles.subscribedGrid}>
            {MOCK_CREDIT_PACKS.map((pack) => (
              <div key={pack.id} className={styles.subscribedCard}>
                <div className={styles.subscribedInfo}>
                  <div className={styles.subscribedName}>{pack.name}</div>
                  <div className={styles.subscribedProvider}>
                    {pack.purchaseDate}
                  </div>
                  <div className={styles.subscribedMeta}>
                    <span>
                      {dict('PC.Pages.MorePage.MySubscriptions.totalCredits')} +
                      {pack.totalCredits.toLocaleString()}
                    </span>
                    <span>
                      {dict(
                        'PC.Pages.MorePage.MySubscriptions.consumedCredits',
                      )}{' '}
                      {pack.consumed.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.subscribedMeta}>
                    <span>
                      {dict(
                        'PC.Pages.MorePage.MySubscriptions.expireTimeShort',
                      )}{' '}
                      {pack.expireAt}
                    </span>
                    <span>
                      {dict('PC.Pages.MorePage.MySubscriptions.purchaseAmount')}{' '}
                      ¥{pack.amount}
                    </span>
                  </div>
                </div>
                <div className={styles.subscribedActions}>
                  <span
                    className={styles.creditsRemaining}
                    style={{
                      color:
                        pack.status === 'empty'
                          ? '#999'
                          : pack.status === 'low'
                          ? '#faad14'
                          : '#52c41a',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {dict(
                      'PC.Pages.MorePage.MySubscriptions.remainingCredits',
                      String(pack.remaining),
                    )}
                  </span>
                  <Tag
                    color={
                      pack.status === 'empty'
                        ? 'default'
                        : pack.status === 'low'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {pack.status === 'empty'
                      ? dict('PC.Pages.MorePage.MySubscriptions.usedUp')
                      : pack.status === 'low'
                      ? dict('PC.Pages.MorePage.MySubscriptions.runningOut')
                      : dict(
                          'PC.Pages.MorePage.MySubscriptions.validityPeriod',
                        )}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreditsPurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
        onSuccess={fetchCredits}
      />
    </WorkspaceLayout>
  );
};

export default MySubscriptions;
