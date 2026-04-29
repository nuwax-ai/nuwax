import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetBasicConfig,
  apiSaveBasicConfig,
} from '@/services/subscriptionService';
import { Divider, Form, InputNumber, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

const MOCK_CONFIG = {
  subscriptionEnabled: true,
  platformFeeRate: 20,
  developerFeeRate: 80,
  creditsEnabled: true,
  creditsExchangeRate: 100,
  defaultTrialCount: 3,
  refundWindowDays: 7,
  withdrawalFeeRate: 1,
};

const BasicConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(true);
  const [creditsEnabled, setCreditsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const { run: fetchConfig } = useRequest(apiGetBasicConfig, {
    manual: true,
    onSuccess: (res) => {
      const cfg = res?.data ?? MOCK_CONFIG;
      form.setFieldsValue(cfg);
      setSubscriptionEnabled(
        (cfg as typeof MOCK_CONFIG).subscriptionEnabled ?? true,
      );
      setCreditsEnabled((cfg as typeof MOCK_CONFIG).creditsEnabled ?? true);
    },
  });

  useEffect(() => {
    form.setFieldsValue(MOCK_CONFIG);
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await apiSaveBasicConfig(values);
      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.saveSuccess'));
      }
    } catch {
      // validation error
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = { fontWeight: 500, minWidth: 160 };
  const sectionStyle: React.CSSProperties = {
    background: '#fafafa',
    borderRadius: 8,
    padding: '20px 24px',
    marginBottom: 16,
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.subsBasicConfig')}
      rightSlot={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 18px',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {saving
            ? dict('PC.Common.Global.saving')
            : dict('PC.Common.Global.save')}
        </button>
      }
    >
      <Form form={form} layout="vertical" style={{ maxWidth: 720 }}>
        {/* 订阅功能配置 */}
        <div style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {dict(
                'PC.Pages.SystemSubscriptionBasicConfig.sectionSubscription',
              )}
            </span>
            <Form.Item
              name="subscriptionEnabled"
              valuePropName="checked"
              noStyle
            >
              <Switch onChange={setSubscriptionEnabled} />
            </Form.Item>
          </div>
          <Divider style={{ margin: '0 0 16px' }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 32px',
              opacity: subscriptionEnabled ? 1 : 0.4,
              pointerEvents: subscriptionEnabled ? 'auto' : 'none',
            }}
          >
            <Form.Item
              name="platformFeeRate"
              label={
                <span style={labelStyle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.platformFeeRate',
                  )}
                </span>
              }
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                max={100}
                precision={1}
                suffix="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="developerFeeRate"
              label={
                <span style={labelStyle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.developerFeeRate',
                  )}
                </span>
              }
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                max={100}
                precision={1}
                suffix="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="defaultTrialCount"
              label={
                <span style={labelStyle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.defaultTrialCount',
                  )}
                </span>
              }
            >
              <InputNumber
                min={0}
                max={100}
                precision={0}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="refundWindowDays"
              label={
                <span style={labelStyle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.refundWindowDays',
                  )}
                </span>
              }
            >
              <InputNumber
                min={0}
                precision={0}
                suffix={dict('PC.Common.Global.days')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        </div>

        {/* 积分功能配置 */}
        <div style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {dict('PC.Pages.SystemSubscriptionBasicConfig.sectionCredits')}
            </span>
            <Form.Item name="creditsEnabled" valuePropName="checked" noStyle>
              <Switch onChange={setCreditsEnabled} />
            </Form.Item>
          </div>
          <Divider style={{ margin: '0 0 16px' }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 32px',
              opacity: creditsEnabled ? 1 : 0.4,
              pointerEvents: creditsEnabled ? 'auto' : 'none',
            }}
          >
            <Form.Item
              name="creditsExchangeRate"
              label={
                <span style={labelStyle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.creditsExchangeRate',
                  )}
                </span>
              }
              extra={dict(
                'PC.Pages.SystemSubscriptionBasicConfig.creditsExchangeRateHint',
              )}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </div>

        {/* 提现配置 */}
        <div style={sectionStyle}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            {dict('PC.Pages.SystemSubscriptionBasicConfig.sectionWithdrawal')}
          </div>
          <Divider style={{ margin: '0 0 16px' }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 32px',
            }}
          >
            <Form.Item
              name="withdrawalFeeRate"
              label={
                <span style={labelStyle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.withdrawalFeeRate',
                  )}
                </span>
              }
            >
              <InputNumber
                min={0}
                max={100}
                precision={2}
                suffix="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </WorkspaceLayout>
  );
};

export default BasicConfig;
