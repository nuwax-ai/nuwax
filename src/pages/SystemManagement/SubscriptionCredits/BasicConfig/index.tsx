import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetBasicConfig,
  apiSaveBasicConfig,
} from '@/services/subscriptionService';
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Switch,
  message,
} from 'antd';
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

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.subsBasicConfig')}
      rightSlot={
        <Button type="primary" loading={saving} onClick={handleSave}>
          {dict('PC.Common.Global.save')}
        </Button>
      }
    >
      <Form form={form} layout="vertical" style={{ maxWidth: 720 }}>
        {/* 订阅功能配置 */}
        <Card
          title={dict(
            'PC.Pages.SystemSubscriptionBasicConfig.sectionSubscription',
          )}
          extra={
            <Form.Item
              name="subscriptionEnabled"
              valuePropName="checked"
              noStyle
            >
              <Switch onChange={setSubscriptionEnabled} />
            </Form.Item>
          }
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              opacity: subscriptionEnabled ? 1 : 0.4,
              pointerEvents: subscriptionEnabled ? 'auto' : 'none',
            }}
          >
            <Row gutter={[32, 0]}>
              <Col span={12}>
                <Form.Item
                  name="platformFeeRate"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.platformFeeRate',
                  )}
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
              </Col>
              <Col span={12}>
                <Form.Item
                  name="developerFeeRate"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.developerFeeRate',
                  )}
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
              </Col>
              <Col span={12}>
                <Form.Item
                  name="defaultTrialCount"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.defaultTrialCount',
                  )}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    precision={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="refundWindowDays"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.refundWindowDays',
                  )}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    suffix={dict('PC.Common.Global.days')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Card>

        {/* 积分功能配置 */}
        <Card
          title={dict('PC.Pages.SystemSubscriptionBasicConfig.sectionCredits')}
          extra={
            <Form.Item name="creditsEnabled" valuePropName="checked" noStyle>
              <Switch onChange={setCreditsEnabled} />
            </Form.Item>
          }
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              opacity: creditsEnabled ? 1 : 0.4,
              pointerEvents: creditsEnabled ? 'auto' : 'none',
            }}
          >
            <Row gutter={[32, 0]}>
              <Col span={12}>
                <Form.Item
                  name="creditsExchangeRate"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.creditsExchangeRate',
                  )}
                  extra={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.creditsExchangeRateHint',
                  )}
                >
                  <InputNumber
                    min={1}
                    precision={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Card>

        {/* 提现配置 */}
        <Card
          title={dict(
            'PC.Pages.SystemSubscriptionBasicConfig.sectionWithdrawal',
          )}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[32, 0]}>
            <Col span={12}>
              <Form.Item
                name="withdrawalFeeRate"
                label={dict(
                  'PC.Pages.SystemSubscriptionBasicConfig.withdrawalFeeRate',
                )}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </WorkspaceLayout>
  );
};

export default BasicConfig;
