import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetCurrentAgentSub,
  apiListAgentSubPlans,
  apiSubscribeAgentPlan,
} from '@/services/subscriptionService';
import { CheckCircleFilled, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Card, message, Modal, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'umi';
import './index.less';

interface Plan {
  id: string;
  name: string;
  desc: string;
  cycle: string;
  price: number;
  calls: string;
  callsNum: number;
  trialCalls: number;
  recommend: boolean;
}

interface CurrentSub {
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
}

const MOCK_PLANS: Plan[] = [
  {
    id: 'plan_a',
    name: '免费版',
    desc: '适合轻度使用，体验基础智能体功能',
    cycle: '月',
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
    cycle: '月',
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
    cycle: '月',
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
    cycle: '月',
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
    cycle: '季',
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
    cycle: '年',
    price: 999,
    calls: '2000次/日',
    callsNum: 2000,
    trialCalls: 200,
    recommend: false,
  },
];

const MOCK_CURRENT: CurrentSub = {
  planId: 'plan_b',
  startDate: '2026-03-15',
  endDate: '2026-04-15',
  status: 'active',
};

const SpaceAgentSubscriptions: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [currentSub, setCurrentSub] = useState<CurrentSub>(MOCK_CURRENT);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    visible: boolean;
    type: 'subscribe' | 'upgrade' | 'downgrade';
    plan: Plan | null;
  }>({ visible: false, type: 'subscribe', plan: null });

  const currentPlan = plans.find((p) => p.id === currentSub.planId);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        apiListAgentSubPlans(spaceId),
        apiGetCurrentAgentSub(spaceId),
      ]);
      if (plansRes?.data) setPlans(plansRes.data as Plan[]);
      if (subRes?.data) setCurrentSub(subRes.data as CurrentSub);
    } catch {
      // fallback to mock
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [spaceId]);

  const formatPrice = (p: number) =>
    p % 1 === 0 ? p.toFixed(0) : p.toFixed(1);

  const isCurrent = (planId: string) => planId === currentSub.planId;

  const getButton = (plan: Plan) => {
    if (isCurrent(plan.id)) {
      return (
        <Button
          type="primary"
          ghost
          size="small"
          style={{
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            minWidth: 80,
          }}
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
            style={{
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              minWidth: 80,
            }}
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
            style={{
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              minWidth: 80,
              background: 'rgba(245,158,11,0.1)',
              color: '#d97706',
              borderColor: 'transparent',
            }}
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
        style={{ borderRadius: 8, fontSize: 12, fontWeight: 600, minWidth: 80 }}
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
        setCurrentSub(res.data as CurrentSub);
      }
    } catch {
      const now = new Date();
      const endDate = new Date(now);
      switch (plan.cycle) {
        case '月':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case '季':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case '年':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
      setCurrentSub({
        planId: plan.id,
        startDate: now.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        status: 'active',
      });
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
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDowngrade
              ? 'rgba(245,158,11,0.1)'
              : 'rgba(13,148,136,0.1)',
            color: isDowngrade ? '#d97706' : '#0d9488',
            fontSize: 26,
          }}
        >
          {isUpgrade ? <ThunderboltOutlined /> : <CheckCircleFilled />}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          {dict(
            isUpgrade
              ? 'PC.Pages.SpaceAgentSubscriptions.confirmUpgradeTitle'
              : isDowngrade
              ? 'PC.Pages.SpaceAgentSubscriptions.confirmDowngradeTitle'
              : 'PC.Pages.SpaceAgentSubscriptions.confirmSubTitle',
          )}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: '#4a5b6f',
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {isUpgrade
            ? dict('PC.Pages.SpaceAgentSubscriptions.confirmUpgradeDesc')
            : isDowngrade
            ? dict('PC.Pages.SpaceAgentSubscriptions.confirmDowngradeDesc')
            : dict('PC.Pages.SpaceAgentSubscriptions.confirmSubDesc', {
                name: plan.name,
                price: `¥${formatPrice(plan.price)}`,
                cycle: plan.cycle,
              })}
        </p>
        {(isUpgrade || isDowngrade) && currentPlan && (
          <div
            style={{
              background: 'rgba(240,244,254,0.4)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: 12,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#8a9bb0', marginBottom: 2 }}>
                {dict('PC.Pages.SpaceAgentSubscriptions.confirmCurrent')}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#8a9bb0',
                  textDecoration: 'line-through',
                }}
              >
                {currentPlan.name}
              </div>
              <div style={{ fontSize: 12, color: '#8a9bb0' }}>
                ¥{formatPrice(currentPlan.price)}
              </div>
            </div>
            <div style={{ color: '#8a9bb0', fontSize: 18 }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#8a9bb0', marginBottom: 2 }}>
                {dict(
                  isUpgrade
                    ? 'PC.Pages.SpaceAgentSubscriptions.confirmUpgradeTo'
                    : 'PC.Pages.SpaceAgentSubscriptions.confirmDowngradeTo',
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a6bff' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a6bff' }}>
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
      hideScroll={true}
    >
      <div style={{ padding: '16px 24px' }}>
        <div style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#0b1a33',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                width: 3,
                height: 18,
                background: 'linear-gradient(135deg, #1a6bff, #0d9488)',
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
            {dict('PC.Pages.SpaceAgentSubscriptions.sectionTitle')}
          </h2>
          <span style={{ fontSize: 12, color: '#8a9bb0' }}>
            {dict('PC.Pages.SpaceAgentSubscriptions.sectionHint')}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}
        >
          {plans.map((plan) => {
            const subscribed = isCurrent(plan.id);
            return (
              <Card
                key={plan.id}
                hoverable
                loading={loading}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  borderColor: subscribed ? '#1a6bff' : undefined,
                  boxShadow: subscribed
                    ? '0 0 0 1px #1a6bff, 0 8px 32px rgba(0,0,0,0.06)'
                    : undefined,
                  opacity: subscribed ? undefined : undefined,
                }}
                bodyStyle={{ padding: 0 }}
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
                  style={{
                    height: 4,
                    background:
                      plan.id === 'plan_a'
                        ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                        : 'linear-gradient(135deg, #1a6bff, #0d9488)',
                  }}
                />
                {subscribed && (
                  <Tag
                    color="blue"
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 8,
                      lineHeight: '18px',
                      boxShadow: '0 2px 10px rgba(26,107,255,0.25)',
                    }}
                  >
                    {dict('PC.Pages.SpaceAgentSubscriptions.currentSub')}
                  </Tag>
                )}
                {!subscribed && plan.recommend && (
                  <Tag
                    color="warning"
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 8,
                      lineHeight: '18px',
                    }}
                  >
                    {dict('PC.Pages.SpaceAgentSubscriptions.recommend')}
                  </Tag>
                )}
                <div style={{ padding: '18px 18px 14px' }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {plan.name}
                    {plan.cycle !== '月' && (
                      <Tag
                        color="orange"
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          borderRadius: 6,
                          lineHeight: '18px',
                        }}
                      >
                        {plan.cycle}
                      </Tag>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4a5b6f',
                      lineHeight: 1.5,
                      marginBottom: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {plan.desc}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <div
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        background: 'rgba(240,244,254,0.5)',
                        borderRadius: 8,
                        padding: '6px 4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#0b1a33',
                          letterSpacing: '-0.3px',
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600 }}>¥</span>
                        {formatPrice(plan.price)}
                        <span
                          style={{
                            fontSize: 9,
                            color: '#8a9bb0',
                            fontWeight: 500,
                          }}
                        >
                          /{plan.cycle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#4a5b6f',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
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
                      <span style={{ color: '#1a6bff', fontWeight: 600 }}>
                        {dict('PC.Pages.SpaceAgentSubscriptions.unlimited')}
                      </span>
                    ) : (
                      plan.calls
                    )}
                    {plan.trialCalls > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: '#0d9488',
                          background: 'rgba(13,148,136,0.08)',
                          padding: '1px 7px',
                          borderRadius: 5,
                          fontWeight: 500,
                          marginLeft: 'auto',
                        }}
                      >
                        {dict('PC.Pages.SpaceAgentSubscriptions.trial')}{' '}
                        {plan.trialCalls}
                        {dict('PC.Pages.SpaceAgentSubscriptions.callsPerDay')}
                      </span>
                    )}
                  </div>
                  {subscribed && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#8a9bb0',
                        marginTop: 6,
                        paddingTop: 6,
                        borderTop: '1px solid rgba(229,236,246,0.6)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        {dict('PC.Pages.SpaceAgentSubscriptions.expireAt')}
                      </span>
                      <span style={{ fontWeight: 600, color: '#4a5b6f' }}>
                        {currentSub.endDate}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: '10px 18px',
                    borderTop: '1px solid rgba(229,236,246,0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'rgba(229,236,246,0.15)',
                  }}
                >
                  {getButton(plan)}
                </div>
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
            style={{ borderRadius: 10, fontWeight: 600, flex: 1 }}
          >
            {dict('PC.Pages.SpaceAgentSubscriptions.confirmCancel')}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleConfirm}
            style={{
              borderRadius: 10,
              fontWeight: 600,
              flex: 1,
              background: 'linear-gradient(135deg, #1a6bff, #0d9488)',
              border: 'none',
            }}
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
