import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetCurrentAgentSub,
  apiListAgentSubPlans,
  apiSubscribeAgentPlan,
} from '@/services/subscriptionService';
import type {
  AgentCurrentSubscription,
  AgentSubscriptionPlan,
} from '@/types/interfaces/subscription';
import { formatPrice } from '@/utils/format';
import { CheckCircleFilled, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, message, Modal, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'umi';
import styles from './index.less';

// ─── Cycle helpers ───

const CYCLE_LABEL_MAP: Record<string, string> = {
  monthly: 'PC.Pages.SpaceAgentSubscriptions.cycleMonthly',
  quarterly: 'PC.Pages.SpaceAgentSubscriptions.cycleQuarterly',
  yearly: 'PC.Pages.SpaceAgentSubscriptions.cycleYearly',
  // 兼容中文值
  月: 'PC.Pages.SpaceAgentSubscriptions.cycleMonthly',
  季: 'PC.Pages.SpaceAgentSubscriptions.cycleQuarterly',
  年: 'PC.Pages.SpaceAgentSubscriptions.cycleYearly',
};

function getCycleLabel(cycle: string): string {
  const key = CYCLE_LABEL_MAP[cycle];
  return key ? dict(key) : cycle;
}

// ─── Mock data factory ───

function getMockPlans(): AgentSubscriptionPlan[] {
  return [
    {
      id: 'plan_a',
      name: '免费版',
      desc: '适合轻度使用，体验基础智能体功能',
      cycle: 'monthly',
      price: 0,
      calls: '50次/日',
      callsNum: 50,
      trialCalls: 0,
      recommend: false,
    },
    {
      id: 'plan_b',
      name: '标准版',
      desc: '适合个人开发者日常使用，性价比之选',
      cycle: 'monthly',
      price: 49.9,
      calls: '500次/日',
      callsNum: 500,
      trialCalls: 50,
      recommend: false,
    },
    {
      id: 'plan_c',
      name: '专业版',
      desc: '适合专业开发者，更多调用和高级模型',
      cycle: 'monthly',
      price: 129,
      calls: '2000次/日',
      callsNum: 2000,
      trialCalls: 100,
      recommend: true,
    },
    {
      id: 'plan_d',
      name: '企业版',
      desc: '适合团队使用，不限调用和专属资源',
      cycle: 'monthly',
      price: 399,
      calls: '不限',
      callsNum: -1,
      trialCalls: 200,
      recommend: false,
    },
    {
      id: 'plan_e',
      name: '季度标准',
      desc: '按季度付费，享受标准版全部能力',
      cycle: 'quarterly',
      price: 129,
      calls: '500次/日',
      callsNum: 500,
      trialCalls: 80,
      recommend: false,
    },
    {
      id: 'plan_f',
      name: '年度专业',
      desc: '按年付费优惠，专业版能力全覆盖',
      cycle: 'yearly',
      price: 999,
      calls: '2000次/日',
      callsNum: 2000,
      trialCalls: 200,
      recommend: false,
    },
  ];
}

const MOCK_CURRENT: AgentCurrentSubscription = {
  planId: 'plan_b',
  startDate: '2026-03-15',
  endDate: '2026-04-15',
  status: 'active',
};

// ═══════════════════════════════════════════
//  SpaceAgentSubscriptions
// ═══════════════════════════════════════════

const SpaceAgentSubscriptions: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const defaultPlans = useMemo(() => getMockPlans(), []);
  const [plans, setPlans] = useState<AgentSubscriptionPlan[]>(defaultPlans);
  const [currentSub, setCurrentSub] =
    useState<AgentCurrentSubscription>(MOCK_CURRENT);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    visible: boolean;
    type: 'subscribe' | 'upgrade' | 'downgrade';
    plan: AgentSubscriptionPlan | null;
  }>({ visible: false, type: 'subscribe', plan: null });

  const currentPlan = plans.find((p) => p.id === currentSub.planId);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        apiListAgentSubPlans(spaceId),
        apiGetCurrentAgentSub(spaceId),
      ]);
      if (plansRes?.data) setPlans(plansRes.data as AgentSubscriptionPlan[]);
      if (subRes?.data) setCurrentSub(subRes.data as AgentCurrentSubscription);
    } catch {
      // fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [spaceId]);

  const isCurrent = (planId: string) => planId === currentSub.planId;

  const getButton = (plan: AgentSubscriptionPlan) => {
    if (isCurrent(plan.id)) {
      return (
        <Button
          type="primary"
          ghost
          size="small"
          className={styles.planBtn}
          onClick={(e) => {
            e.stopPropagation();
            message.success(
              dict('PC.Pages.SpaceAgentSubscriptions.toastRenewSuccess'),
            );
          }}
        >
          {dict('PC.Pages.SpaceAgentSubscriptions.renew')}
        </Button>
      );
    }
    if (plan.price === 0) return null;
    if (currentPlan) {
      if (plan.price > currentPlan.price) {
        return (
          <Button
            type="primary"
            size="small"
            className={styles.planBtn}
            onClick={(e) => {
              e.stopPropagation();
              setModalState({ visible: true, type: 'upgrade', plan });
            }}
          >
            {dict('PC.Pages.SpaceAgentSubscriptions.upgrade')}
          </Button>
        );
      }
      if (plan.price < currentPlan.price && plan.price > 0) {
        return (
          <Button
            size="small"
            className={`${styles.planBtn} ${styles.downgradeBtn}`}
            onClick={(e) => {
              e.stopPropagation();
              setModalState({ visible: true, type: 'downgrade', plan });
            }}
          >
            {dict('PC.Pages.SpaceAgentSubscriptions.downgrade')}
          </Button>
        );
      }
    }
    return (
      <Button
        type="primary"
        size="small"
        className={styles.planBtn}
        onClick={(e) => {
          e.stopPropagation();
          setModalState({ visible: true, type: 'subscribe', plan });
        }}
      >
        {dict('PC.Pages.SpaceAgentSubscriptions.subscribe')}
      </Button>
    );
  };

  const handleConfirm = async () => {
    const { type, plan } = modalState;
    if (!plan) return;
    try {
      const res = await apiSubscribeAgentPlan(spaceId, plan.id);
      if (res?.data) {
        setCurrentSub(res.data as AgentCurrentSubscription);
      }
    } catch {
      message.error(dict('PC.Pages.SpaceAgentSubscriptions.operationFailed'));
      setModalState({ visible: false, type: 'subscribe', plan: null });
      return;
    }
    setModalState({ visible: false, type: 'subscribe', plan: null });
    const toastMap: Record<string, string> = {
      subscribe: 'PC.Pages.SpaceAgentSubscriptions.toastSubSuccess',
      upgrade: 'PC.Pages.SpaceAgentSubscriptions.toastUpgradeSuccess',
      downgrade: 'PC.Pages.SpaceAgentSubscriptions.toastDowngradeSuccess',
    };
    message.success(dict(toastMap[type]));
  };

  const renderModalContent = () => {
    const { type, plan } = modalState;
    if (!plan) return null;
    const isUpgrade = type === 'upgrade';
    const isDowngrade = type === 'downgrade';

    return (
      <div className={styles.modalContent}>
        <div
          className={`${styles.modalIcon} ${
            isDowngrade ? styles.modalIconDowngrade : ''
          }`}
        >
          {isUpgrade ? <ThunderboltOutlined /> : <CheckCircleFilled />}
        </div>
        <h3 className={styles.modalTitle}>
          {dict(
            isUpgrade
              ? 'PC.Pages.SpaceAgentSubscriptions.confirmUpgradeTitle'
              : isDowngrade
              ? 'PC.Pages.SpaceAgentSubscriptions.confirmDowngradeTitle'
              : 'PC.Pages.SpaceAgentSubscriptions.confirmSubTitle',
          )}
        </h3>
        <p className={styles.modalDesc}>
          {isUpgrade
            ? dict('PC.Pages.SpaceAgentSubscriptions.confirmUpgradeDesc')
            : isDowngrade
            ? dict('PC.Pages.SpaceAgentSubscriptions.confirmDowngradeDesc')
            : dict(
                'PC.Pages.SpaceAgentSubscriptions.confirmSubDesc',
                plan.name,
                `¥${formatPrice(plan.price)}`,
                getCycleLabel(plan.cycle),
              )}
        </p>
        {(isUpgrade || isDowngrade) && currentPlan && (
          <div className={styles.modalCompare}>
            <div className={styles.modalCompareItem}>
              <div className={styles.modalCompareLabel}>
                {dict('PC.Pages.SpaceAgentSubscriptions.confirmCurrent')}
              </div>
              <div className={styles.modalCompareOldName}>
                {currentPlan.name}
              </div>
              <div className={styles.modalCompareOldPrice}>
                ¥{formatPrice(currentPlan.price)}
              </div>
            </div>
            <div className={styles.modalCompareArrow}>→</div>
            <div className={styles.modalCompareItem}>
              <div className={styles.modalCompareLabel}>
                {dict(
                  isUpgrade
                    ? 'PC.Pages.SpaceAgentSubscriptions.confirmUpgradeTo'
                    : 'PC.Pages.SpaceAgentSubscriptions.confirmDowngradeTo',
                )}
              </div>
              <div className={styles.modalCompareNewName}>{plan.name}</div>
              <div className={styles.modalCompareNewPrice}>
                ¥{formatPrice(plan.price)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceAgentSubscriptions.pageTitle')}
      hideScroll
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionBar} />
            {dict('PC.Pages.SpaceAgentSubscriptions.sectionTitle')}
          </h2>
          <span className={styles.sectionHint}>
            {dict('PC.Pages.SpaceAgentSubscriptions.sectionHint')}
          </span>
        </div>

        <div className={styles.cardGrid}>
          {plans.map((plan) => {
            const subscribed = isCurrent(plan.id);
            return (
              <Card
                key={plan.id}
                hoverable
                loading={loading}
                className={`${styles.planCard} ${
                  subscribed ? styles.planCardSubscribed : ''
                }`}
                styles={{ body: { padding: 0 } }}
                onClick={() => {
                  if (subscribed || plan.price === 0) return;
                  if (currentPlan && plan.price > currentPlan.price) {
                    setModalState({ visible: true, type: 'upgrade', plan });
                  } else if (
                    currentPlan &&
                    plan.price < currentPlan.price &&
                    plan.price > 0
                  ) {
                    setModalState({ visible: true, type: 'downgrade', plan });
                  } else {
                    setModalState({ visible: true, type: 'subscribe', plan });
                  }
                }}
              >
                <div
                  className={styles.cardHeaderBar}
                  style={{
                    background:
                      plan.id === 'plan_a'
                        ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                        : undefined,
                  }}
                />
                {subscribed && (
                  <Tag color="blue" className={styles.tagCurrent}>
                    {dict('PC.Pages.SpaceAgentSubscriptions.currentSub')}
                  </Tag>
                )}
                {!subscribed && plan.recommend && (
                  <Tag color="warning" className={styles.tagRecommend}>
                    {dict('PC.Pages.SpaceAgentSubscriptions.recommend')}
                  </Tag>
                )}
                <div className={styles.cardBody}>
                  <div className={styles.planName}>
                    {plan.name}
                    {plan.cycle !== 'monthly' && plan.cycle !== '月' && (
                      <Tag color="orange" className={styles.cycleTag}>
                        {getCycleLabel(plan.cycle)}
                      </Tag>
                    )}
                  </div>
                  <div className={styles.planDesc}>{plan.desc}</div>
                  <div className={styles.priceBox}>
                    <div className={styles.priceValue}>
                      <span className={styles.priceSymbol}>¥</span>
                      {formatPrice(plan.price)}
                      <span className={styles.priceCycle}>
                        /{getCycleLabel(plan.cycle)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.planMeta}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {plan.callsNum === -1 ? (
                      <span className={styles.callsUnlimited}>
                        {dict('PC.Pages.SpaceAgentSubscriptions.unlimited')}
                      </span>
                    ) : (
                      plan.calls
                    )}
                    {plan.trialCalls > 0 && (
                      <span className={styles.trialBadge}>
                        {dict('PC.Pages.SpaceAgentSubscriptions.trial')}{' '}
                        {plan.trialCalls}
                        {dict('PC.Pages.SpaceAgentSubscriptions.callsPerDay')}
                      </span>
                    )}
                  </div>
                  {subscribed && (
                    <div className={styles.expireRow}>
                      <span>
                        {dict('PC.Pages.SpaceAgentSubscriptions.expireAt')}
                      </span>
                      <span className={styles.expireDate}>
                        {currentSub.endDate}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.cardFooter}>{getButton(plan)}</div>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal
        open={modalState.visible}
        onCancel={() =>
          setModalState({ visible: false, type: 'subscribe', plan: null })
        }
        footer={[
          <Button
            key="cancel"
            onClick={() =>
              setModalState({ visible: false, type: 'subscribe', plan: null })
            }
            className={styles.modalCancelBtn}
          >
            {dict('PC.Pages.SpaceAgentSubscriptions.confirmCancel')}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirm}
            className={styles.modalConfirmBtn}
          >
            {dict(
              modalState.type === 'upgrade'
                ? 'PC.Pages.SpaceAgentSubscriptions.confirmUpgradeBtn'
                : modalState.type === 'downgrade'
                ? 'PC.Pages.SpaceAgentSubscriptions.confirmDowngradeBtn'
                : 'PC.Pages.SpaceAgentSubscriptions.confirmConfirm',
            )}
          </Button>,
        ]}
        width={440}
        centered
        destroyOnClose
      >
        {renderModalContent()}
      </Modal>
    </WorkspaceLayout>
  );
};

export default SpaceAgentSubscriptions;
