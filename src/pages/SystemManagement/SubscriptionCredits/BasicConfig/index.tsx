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
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

const { Text } = Typography;

const MOCK_CONFIG = {
  exchangeRate: 100,
  exchangeDesc:
    '每消费 1 元人民币可获得 100 积分，积分可用于智能体对话、知识库检索等场景。',
  registerGiftCredits: 100,
  registerGiftValidity: 'permanent',
  registerGiftEnabled: true,
  dailyLoginCredits: 10,
  dailyLoginEnabled: true,
};

const BasicConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [registerGiftEnabled, setRegisterGiftEnabled] = useState(true);
  const [dailyLoginEnabled, setDailyLoginEnabled] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(100);

  const { run: fetchConfig } = useRequest(apiGetBasicConfig, {
    manual: true,
    onSuccess: (res) => {
      const cfg = res?.data ?? MOCK_CONFIG;
      form.setFieldsValue(cfg);
      setExchangeRate((cfg as typeof MOCK_CONFIG).exchangeRate ?? 100);
      setRegisterGiftEnabled(
        (cfg as typeof MOCK_CONFIG).registerGiftEnabled ?? true,
      );
      setDailyLoginEnabled(
        (cfg as typeof MOCK_CONFIG).dailyLoginEnabled ?? true,
      );
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
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 720 }}
        onValuesChange={(changed) => {
          if (changed.exchangeRate !== undefined) {
            setExchangeRate(changed.exchangeRate);
          }
        }}
      >
        {/* 积分兑换配置 */}
        <Card
          title={dict('PC.Pages.SystemSubscriptionBasicConfig.sectionExchange')}
          style={{ marginBottom: 16 }}
        >
          <Row gutter={[32, 0]}>
            <Col span={12}>
              <Form.Item
                name="exchangeRate"
                label={dict(
                  'PC.Pages.SystemSubscriptionBasicConfig.exchangeRate',
                )}
                rules={[{ required: true }]}
                extra={dict(
                  'PC.Pages.SystemSubscriptionBasicConfig.exchangeRateHint',
                )}
              >
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: '100%' }}
                  addonBefore="¥1 ="
                  addonAfter={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.creditsUnit',
                  )}
                />
              </Form.Item>
              <div style={{ marginTop: -8, marginBottom: 16 }}>
                <Text type="secondary">
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.currentExchange',
                  )}
                  ：¥1 = {exchangeRate}{' '}
                  {dict('PC.Pages.SystemSubscriptionBasicConfig.creditsUnit')}
                </Text>
              </div>
            </Col>
            <Col span={24}>
              <Form.Item
                name="exchangeDesc"
                label={dict(
                  'PC.Pages.SystemSubscriptionBasicConfig.exchangeDesc',
                )}
              >
                <Input.TextArea
                  rows={3}
                  placeholder={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.exchangeDescPlaceholder',
                  )}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 新用户注册赠送 */}
        <Card
          title={dict(
            'PC.Pages.SystemSubscriptionBasicConfig.sectionRegisterGift',
          )}
          extra={
            <Form.Item
              name="registerGiftEnabled"
              valuePropName="checked"
              noStyle
            >
              <Switch onChange={setRegisterGiftEnabled} />
            </Form.Item>
          }
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              opacity: registerGiftEnabled ? 1 : 0.4,
              pointerEvents: registerGiftEnabled ? 'auto' : 'none',
            }}
          >
            <Row gutter={[32, 0]}>
              <Col span={12}>
                <Form.Item
                  name="registerGiftCredits"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.registerGiftCredits',
                  )}
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    addonAfter={dict(
                      'PC.Pages.SystemSubscriptionBasicConfig.creditsUnit',
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="registerGiftValidity"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.registerGiftValidity',
                  )}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      {
                        value: 'permanent',
                        label: dict(
                          'PC.Pages.SystemSubscriptionBasicConfig.validityPermanent',
                        ),
                      },
                      {
                        value: '7d',
                        label: dict(
                          'PC.Pages.SystemSubscriptionBasicConfig.validity7d',
                        ),
                      },
                      {
                        value: '30d',
                        label: dict(
                          'PC.Pages.SystemSubscriptionBasicConfig.validity30d',
                        ),
                      },
                      {
                        value: '90d',
                        label: dict(
                          'PC.Pages.SystemSubscriptionBasicConfig.validity90d',
                        ),
                      },
                      {
                        value: '1y',
                        label: dict(
                          'PC.Pages.SystemSubscriptionBasicConfig.validity1y',
                        ),
                      },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Card>

        {/* 每日登录赠送 */}
        <Card
          title={dict(
            'PC.Pages.SystemSubscriptionBasicConfig.sectionDailyLogin',
          )}
          extra={
            <Form.Item name="dailyLoginEnabled" valuePropName="checked" noStyle>
              <Switch onChange={setDailyLoginEnabled} />
            </Form.Item>
          }
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              opacity: dailyLoginEnabled ? 1 : 0.4,
              pointerEvents: dailyLoginEnabled ? 'auto' : 'none',
            }}
          >
            <Row gutter={[32, 0]}>
              <Col span={12}>
                <Form.Item
                  name="dailyLoginCredits"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.dailyLoginCredits',
                  )}
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    addonAfter={dict(
                      'PC.Pages.SystemSubscriptionBasicConfig.creditsUnit',
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Card>
      </Form>
    </WorkspaceLayout>
  );
};

export default BasicConfig;
