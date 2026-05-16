import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreateSubscriptionPlan,
  apiDeleteSubscriptionPlan,
  apiListSubscriptionPlans,
  apiToggleSubscriptionPlan,
  apiUpdateSubscriptionPlan,
} from '@/services/subscriptionService';
import type { SubscriptionPlan } from '@/types/interfaces/subscription';
import {
  Button,
  Card,
  Input,
  InputNumber,
  message,
  Modal,
  Segmented,
  Switch,
  Tag,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'umi';
import './index.less';

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'p1',
    name: '基础版',
    desc: '适合个人开发者入门使用，包含核心功能，性价比之选',
    cycle: '月',
    price: 29.9,
    calls: 1000,
    trialCalls: 50,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p2',
    name: '专业版',
    desc: '适合专业开发者，更多调用次数和高级功能',
    cycle: '月',
    price: 99,
    calls: 10000,
    trialCalls: 100,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p3',
    name: '企业版',
    desc: '适合团队使用，无限调用和专属技术支持',
    cycle: '月',
    price: 299,
    calls: -1,
    trialCalls: 200,
    funcOnly: false,
    active: true,
  },
  {
    id: 'p4',
    name: 'AI工具订阅',
    desc: '仅限功能使用，模型调用按量计费，灵活搭配',
    cycle: '月',
    price: 19.9,
    calls: 500,
    trialCalls: 20,
    funcOnly: true,
    active: true,
  },
  {
    id: 'p5',
    name: '代码助手包',
    desc: '代码生成、审查、重构等开发工具专用订阅',
    cycle: '月',
    price: 59.9,
    calls: 3000,
    trialCalls: 50,
    funcOnly: true,
    active: true,
  },
  {
    id: 'p6',
    name: '旗舰定制版',
    desc: '全功能包含，包干价，不限调用次数',
    cycle: '年',
    price: 9999,
    calls: -1,
    trialCalls: 500,
    funcOnly: false,
    active: true,
  },
];

const SpaceSubscriptionSettings: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(MOCK_PLANS);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(
    null,
  );

  // Form fields
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cycle, setCycle] = useState<'月' | '季' | '年'>('月');
  const [price, setPrice] = useState<number | null>(null);
  const [callsUnlimited, setCallsUnlimited] = useState(true);
  const [calls, setCalls] = useState<number | null>(null);
  const [trialCalls, setTrialCalls] = useState(0);
  const [funcOnly, setFuncOnly] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiListSubscriptionPlans(spaceId);
      if (res?.data) setPlans(res.data as SubscriptionPlan[]);
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
  const formatCalls = (c: number) =>
    c === -1
      ? dict('PC.Pages.SpaceSubscriptionSettings.fieldCallsUnlimited')
      : c.toLocaleString();

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setDesc('');
    setCycle('月');
    setPrice(null);
    setCallsUnlimited(true);
    setCalls(null);
    setTrialCalls(0);
    setFuncOnly(false);
    setModalVisible(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditId(plan.id);
    setName(plan.name);
    setDesc(plan.desc || '');
    setCycle(plan.cycle);
    setPrice(plan.price);
    setCallsUnlimited(plan.calls === -1);
    setCalls(plan.calls === -1 ? null : plan.calls);
    setTrialCalls(plan.trialCalls);
    setFuncOnly(plan.funcOnly);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      message.warning(
        dict('PC.Pages.SpaceSubscriptionSettings.fieldNameRequired'),
      );
      return;
    }
    if (!price || price <= 0) {
      message.warning(
        dict('PC.Pages.SpaceSubscriptionSettings.fieldPriceRequired'),
      );
      return;
    }
    if (!callsUnlimited && (!calls || calls <= 0)) {
      message.warning(
        dict('PC.Pages.SpaceSubscriptionSettings.fieldCallsRequired'),
      );
      return;
    }

    const data = {
      name: name.trim(),
      desc: desc.trim(),
      cycle,
      price,
      calls: callsUnlimited ? -1 : calls || 0,
      trialCalls: trialCalls || 0,
      funcOnly,
    };

    try {
      if (editId) {
        await apiUpdateSubscriptionPlan(editId, data);
        message.success(
          dict('PC.Pages.SpaceSubscriptionSettings.toastUpdated'),
        );
      } else {
        await apiCreateSubscriptionPlan(spaceId, data);
        message.success(dict('PC.Pages.SpaceSubscriptionSettings.toastAdded'));
      }
    } catch {
      // mock fallback
      setPlans((prev) => {
        if (editId) {
          return prev.map((p) => (p.id === editId ? { ...p, ...data } : p));
        }
        return [
          ...prev,
          { id: `p${Date.now()}`, ...data, active: true } as SubscriptionPlan,
        ];
      });
      message.success(
        editId
          ? dict('PC.Pages.SpaceSubscriptionSettings.toastUpdated')
          : dict('PC.Pages.SpaceSubscriptionSettings.toastAdded'),
      );
    }

    setModalVisible(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiDeleteSubscriptionPlan(deleteTarget.id);
    } catch {
      // mock fallback
    }
    setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    message.success(dict('PC.Pages.SpaceSubscriptionSettings.toastDeleted'));
  };

  const handleToggle = async (plan: SubscriptionPlan) => {
    const newActive = !plan.active;
    try {
      await apiToggleSubscriptionPlan(plan.id, newActive);
    } catch {
      // mock fallback
    }
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, active: newActive } : p)),
    );
    message.success(
      newActive
        ? dict('PC.Pages.SpaceSubscriptionSettings.toastActivated')
        : dict('PC.Pages.SpaceSubscriptionSettings.toastDeactivated'),
    );
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceSubscriptionSettings.pageTitle')}
      hideScroll={true}
    >
      <div style={{ padding: '16px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#0b1a33',
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
            {dict('PC.Pages.SpaceSubscriptionSettings.sectionTitle')}
          </h2>
          <Button
            type="primary"
            onClick={openAddModal}
            style={{
              borderRadius: 10,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1a6bff, #0d9488)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {dict('PC.Pages.SpaceSubscriptionSettings.addPlan')}
          </Button>
        </div>

        {plans.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#8a9bb0',
            }}
          >
            <p style={{ fontSize: 14 }}>
              {dict('PC.Pages.SpaceSubscriptionSettings.emptyState')}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 14,
            }}
          >
            {plans.map((plan) => (
              <Card
                key={plan.id}
                loading={loading}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  opacity: plan.active ? 1 : 0.5,
                }}
                bodyStyle={{ padding: 0 }}
              >
                <div
                  style={{
                    height: 4,
                    background: plan.funcOnly
                      ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                      : 'linear-gradient(135deg, #1a6bff, #0d9488)',
                  }}
                />
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
                    <Tag
                      color={plan.funcOnly ? 'orange' : 'green'}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 6,
                        lineHeight: '18px',
                      }}
                    >
                      {plan.funcOnly
                        ? dict('PC.Pages.SpaceSubscriptionSettings.tagFunc')
                        : dict('PC.Pages.SpaceSubscriptionSettings.tagPackage')}
                    </Tag>
                    {!plan.active && (
                      <span
                        style={{
                          fontSize: 10,
                          color: '#8a9bb0',
                          background: 'rgba(138,155,176,0.12)',
                          padding: '1px 7px',
                          borderRadius: 5,
                          fontWeight: 500,
                          marginLeft: 'auto',
                        }}
                      >
                        {dict(
                          'PC.Pages.SpaceSubscriptionSettings.statusInactive',
                        )}
                      </span>
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
                        flex: 1.5,
                        textAlign: 'center',
                        background: 'rgba(240,244,254,0.5)',
                        borderRadius: 8,
                        padding: '6px 4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: '#0b1a33',
                          letterSpacing: '-0.3px',
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600 }}>¥</span>
                        {formatPrice(plan.price)}
                        <span
                          style={{
                            fontSize: 12,
                            color: '#8a9bb0',
                            fontWeight: 500,
                            marginLeft: 2,
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
                    {formatCalls(plan.calls)}
                    {plan.trialCalls > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: '#0d9488',
                          background: 'rgba(13,148,136,0.08)',
                          padding: '1px 7px',
                          borderRadius: 5,
                          fontWeight: 500,
                        }}
                      >
                        {dict('PC.Pages.SpaceAgentSubscriptions.trial')}{' '}
                        {plan.trialCalls}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    padding: '10px 18px',
                    borderTop: '1px solid rgba(229,236,246,0.6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    background: 'rgba(229,236,246,0.15)',
                  }}
                >
                  <Switch
                    checked={plan.active}
                    onChange={() => handleToggle(plan)}
                    size="small"
                    checkedChildren={dict(
                      'PC.Pages.SpaceSubscriptionSettings.tooltipOnline',
                    )}
                    unCheckedChildren={dict(
                      'PC.Pages.SpaceSubscriptionSettings.tooltipOffline',
                    )}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="small"
                      style={{
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(26,107,255,0.08)',
                        color: '#1a6bff',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      icon={
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      }
                      onClick={() => openEditModal(plan)}
                    >
                      {dict('PC.Pages.SpaceSubscriptionSettings.edit')}
                    </Button>
                    <Button
                      size="small"
                      danger
                      style={{
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(239,68,68,0.08)',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      icon={
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      }
                      onClick={() => setDeleteTarget(plan)}
                    >
                      {dict('PC.Pages.SpaceSubscriptionSettings.delete')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={dict(
          editId
            ? 'PC.Pages.SpaceSubscriptionSettings.editTitle'
            : 'PC.Pages.SpaceSubscriptionSettings.addTitle',
        )}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setModalVisible(false)}
            style={{ borderRadius: 10 }}
          >
            {dict('PC.Pages.SpaceSubscriptionSettings.cancelBtn')}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleSave}
            style={{
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1a6bff, #0d9488)',
              border: 'none',
            }}
          >
            {dict('PC.Pages.SpaceSubscriptionSettings.confirmBtn')}
          </Button>,
        ]}
        width={520}
        centered
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#4a5b6f',
                marginBottom: 6,
              }}
            >
              {dict('PC.Pages.SpaceSubscriptionSettings.fieldName')}{' '}
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={dict(
                'PC.Pages.SpaceSubscriptionSettings.fieldNamePlaceholder',
              )}
              maxLength={30}
              style={{ borderRadius: 10 }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#4a5b6f',
                marginBottom: 6,
              }}
            >
              {dict('PC.Pages.SpaceSubscriptionSettings.fieldDesc')}
            </label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={dict(
                'PC.Pages.SpaceSubscriptionSettings.fieldDescPlaceholder',
              )}
              style={{ borderRadius: 10 }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#4a5b6f',
                marginBottom: 6,
              }}
            >
              {dict('PC.Pages.SpaceSubscriptionSettings.fieldPrice')}{' '}
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 auto', width: 120 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: '#8a9bb0',
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  {dict('PC.Pages.SpaceSubscriptionSettings.fieldCycle')}
                </div>
                <Segmented
                  value={cycle}
                  onChange={(v) => setCycle(v as '月' | '季' | '年')}
                  options={[
                    {
                      value: '月',
                      label: dict(
                        'PC.Pages.SpaceSubscriptionSettings.fieldCycleMonthly',
                      ),
                    },
                    {
                      value: '季',
                      label: dict(
                        'PC.Pages.SpaceSubscriptionSettings.fieldCycleQuarterly',
                      ),
                    },
                    {
                      value: '年',
                      label: dict(
                        'PC.Pages.SpaceSubscriptionSettings.fieldCycleYearly',
                      ),
                    },
                  ]}
                  style={{ borderRadius: 9 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: '#8a9bb0',
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  {dict('PC.Pages.SpaceSubscriptionSettings.fieldPrice')}
                </div>
                <InputNumber
                  value={price}
                  onChange={(v) => setPrice(v)}
                  min={0}
                  step={0.01}
                  precision={2}
                  prefix="¥"
                  placeholder="0"
                  style={{ width: '100%', borderRadius: 10 }}
                />
              </div>
            </div>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#4a5b6f',
                marginBottom: 6,
              }}
            >
              {dict('PC.Pages.SpaceSubscriptionSettings.fieldCalls')}
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Button
                size="small"
                type={callsUnlimited ? 'primary' : 'default'}
                onClick={() => {
                  setCallsUnlimited(true);
                  setCalls(null);
                }}
                style={{ borderRadius: 9, fontWeight: 600, flex: 1 }}
              >
                {dict('PC.Pages.SpaceSubscriptionSettings.fieldCallsUnlimited')}
              </Button>
              <Button
                size="small"
                type={!callsUnlimited ? 'primary' : 'default'}
                onClick={() => setCallsUnlimited(false)}
                style={{ borderRadius: 9, fontWeight: 600, flex: 1 }}
              >
                {dict('PC.Pages.SpaceSubscriptionSettings.fieldCallsLimited')}
              </Button>
            </div>
            {!callsUnlimited && (
              <InputNumber
                value={calls}
                onChange={(v) => setCalls(v)}
                min={1}
                step={1}
                placeholder={dict(
                  'PC.Pages.SpaceSubscriptionSettings.fieldCallsPlaceholder',
                )}
                style={{ width: '100%', borderRadius: 10 }}
              />
            )}
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#4a5b6f',
                marginBottom: 6,
              }}
            >
              {dict('PC.Pages.SpaceSubscriptionSettings.fieldTrialCalls')}
            </label>
            <InputNumber
              value={trialCalls}
              onChange={(v) => setTrialCalls(v || 0)}
              min={0}
              step={1}
              placeholder="0"
              style={{ maxWidth: 200, width: '100%', borderRadius: 10 }}
            />
            <div style={{ fontSize: 11, color: '#8a9bb0', marginTop: 4 }}>
              {dict('PC.Pages.SpaceSubscriptionSettings.fieldTrialCallsHint')}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 14px',
              background: 'rgba(240,244,254,0.4)',
              borderRadius: 10,
              border: '1px solid rgba(229,236,246,0.6)',
            }}
          >
            <Switch checked={funcOnly} onChange={setFuncOnly} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0b1a33',
                  marginBottom: 2,
                }}
              >
                {dict('PC.Pages.SpaceSubscriptionSettings.fieldFuncOnly')}
              </div>
              <div style={{ fontSize: 11, color: '#8a9bb0', lineHeight: 1.5 }}>
                {funcOnly
                  ? dict('PC.Pages.SpaceSubscriptionSettings.fieldFuncOnlyOn')
                  : dict('PC.Pages.SpaceSubscriptionSettings.fieldFuncOnlyOff')}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        title={dict('PC.Pages.SpaceSubscriptionSettings.deleteTitle')}
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setDeleteTarget(null)}
            style={{ borderRadius: 9 }}
          >
            {dict('PC.Pages.SpaceSubscriptionSettings.cancelBtn')}
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            onClick={handleDelete}
            style={{ borderRadius: 9 }}
          >
            {dict('PC.Pages.SpaceSubscriptionSettings.deleteConfirmBtn')}
          </Button>,
        ]}
        width={380}
        centered
        destroyOnClose
      >
        <p
          style={{
            fontSize: 13,
            color: '#4a5b6f',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {deleteTarget
            ? dict('PC.Pages.SpaceSubscriptionSettings.deleteConfirm', {
                name: deleteTarget.name,
              })
            : ''}
        </p>
      </Modal>
    </WorkspaceLayout>
  );
};

export default SpaceSubscriptionSettings;
