import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { apiSystemSubscriptionConfigSave } from '@/services/systemManage';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Switch,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const { Text } = Typography;

const BasicConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(100);

  // 租户配置信息
  const { tenantConfigInfo, runTenantConfig } = useModel('tenantConfigInfo');

  // 保存租户配置信息接口
  const { run: runSaveConfig } = useRequest(apiSystemSubscriptionConfigSave, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.saveSuccess'));
      setSaving(false);
      // 重新获取租户配置信息，更新Model或者缓存中的租户配置信息
      runTenantConfig();
    },
    onError: () => {
      setSaving(false);
    },
  });

  useEffect(() => {
    if (tenantConfigInfo) {
      form.setFieldsValue({
        ...tenantConfigInfo,
        enableSubscription: Boolean(tenantConfigInfo.enableSubscription),
        enableGiftCredit: Boolean(tenantConfigInfo.enableGiftCredit),
        enableDailyGiftCredit: Boolean(tenantConfigInfo.enableDailyGiftCredit),
      });
    } else {
      // 租户配置信息查询接口
      runTenantConfig();
    }
  }, [tenantConfigInfo]);

  // 保存配置
  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      enableSubscription: values.enableSubscription ? 1 : 0,
      enableGiftCredit: values.enableGiftCredit ? 1 : 0,
      enableDailyGiftCredit: values.enableDailyGiftCredit ? 1 : 0,
    };
    setSaving(true);
    runSaveConfig(payload);
  };

  return (
    <WorkspaceLayout title={dict('PC.Routes.subsBasicConfig')}>
      <div className={styles.page}>
        <div className={styles.scrollBody}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={(changed) => {
              if (changed.creditExchangeRate !== undefined) {
                setExchangeRate(changed.creditExchangeRate);
              }
            }}
          >
            {/* 积分兑换配置 */}
            <section className={styles.sectionBlock}>
              <div className={styles.sectionTitleRow}>
                <h5 className={styles.sectionTitle}>订阅与积分功能开关</h5>
                <Form.Item
                  name="enableSubscription"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </div>
              <Text type="secondary" className={styles.sectionDesc}>
                全局控制订阅/计费和积分体系的启用状态
              </Text>
              <h5 className={styles.sectionTitle}>积分兑换比例</h5>
              <Text type="secondary" className={styles.sectionDesc}>
                设置积分与币值的兑换比率，用户可使用积分兑换订单金额
              </Text>
              <Row gutter={[24, 0]} align="bottom">
                <Col span={24}>
                  <div className={styles.exchangeLine}>
                    <div className={styles.exchangeLineLabel}>
                      {dict(
                        'PC.Pages.SystemSubscriptionBasicConfig.creditExchangeRate',
                      )}
                    </div>
                    <div className={styles.exchangeLineContent}>
                      <InputNumber
                        min={1}
                        precision={2}
                        value={1}
                        disabled
                        style={{ width: 112 }}
                        addonBefore="¥"
                      />
                      <span className={styles.exchangeEqual}>=</span>
                      <Form.Item name="creditExchangeRate" noStyle>
                        <InputNumber
                          min={1}
                          max={100000000}
                          precision={0}
                          style={{ width: 120 }}
                        />
                      </Form.Item>
                      <span className={styles.exchangeUnit}>
                        {dict(
                          'PC.Pages.SystemSubscriptionBasicConfig.creditsUnit',
                        )}
                      </span>
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className={styles.exchangeLine}>
                    <div className={styles.exchangeLineLabel}>
                      {dict(
                        'PC.Pages.SystemSubscriptionBasicConfig.currentExchange',
                      )}
                    </div>
                    <div className={styles.exchangeNotice}>
                      <Text type="secondary">
                        每 100 积分 ≈ ¥
                        {(100 / Number(exchangeRate || 1)).toFixed(2)}， 每
                        10,000 积分 ≈ ¥
                        {(10000 / Number(exchangeRate || 1)).toFixed(2)}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className={styles.exchangeLine}>
                    <div className={styles.exchangeLineLabel}>
                      {dict(
                        'PC.Pages.SystemSubscriptionBasicConfig.creditExchangeDesc',
                      )}
                    </div>
                    <div className={styles.exchangeDescWrap}>
                      <Form.Item name="creditExchangeDesc" noStyle>
                        <Input.TextArea
                          className="dispose-textarea-count"
                          placeholder={dict(
                            'PC.Pages.SystemSubscriptionBasicConfig.creditExchangeDescPlaceholder',
                          )}
                          maxLength={200}
                          showCount
                          autoSize={{ minRows: 3, maxRows: 5 }}
                        />
                      </Form.Item>
                    </div>
                  </div>
                </Col>
              </Row>
            </section>

            {/* 新用户注册赠送 */}
            <section className={styles.sectionBlock}>
              <div className={styles.sectionTitleRow}>
                <h5 className={styles.sectionTitle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.sectionRegisterGift',
                  )}
                </h5>
                <Form.Item
                  name="enableGiftCredit"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </div>
              <Text type="secondary" className={styles.sectionDesc}>
                用户首次注册完成后，自动获得赠送积分
              </Text>

              <Row gutter={[24, 0]} align="bottom">
                <Col span={12}>
                  {/* 赠送积分 */}
                  <Form.Item
                    label={dict(
                      'PC.Pages.SystemSubscriptionBasicConfig.registerGiftCredits',
                    )}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Form.Item name="giftCreditAmount" noStyle>
                        <InputNumber
                          min={0}
                          max={100000000}
                          precision={0}
                          style={{ width: 120 }}
                        />
                      </Form.Item>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {dict(
                          'PC.Pages.SystemSubscriptionBasicConfig.creditsUnit',
                        )}
                      </span>
                    </div>
                  </Form.Item>
                </Col>
                {/* 赠送积分有效期 */}
                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.SystemSubscriptionBasicConfig.registerGiftValidity',
                    )}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Form.Item name="giftCreditExpire" noStyle>
                        <InputNumber
                          min={0}
                          max={100000000}
                          precision={0}
                          style={{ width: 120 }}
                        />
                      </Form.Item>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {dict('PC.Common.Global.days')}
                      </span>
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </section>

            {/* 每日登录赠送 */}
            <section style={{ marginBottom: 16 }}>
              <div className={styles.sectionTitleRow}>
                <h5 className={styles.sectionTitle}>
                  {dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.sectionDailyLogin',
                  )}
                </h5>
                <Form.Item
                  name="enableDailyGiftCredit"
                  valuePropName="checked"
                  noStyle
                >
                  <Switch />
                </Form.Item>
              </div>
              <Text type="secondary" className={styles.sectionDesc}>
                用户每日首次登录时自动获得赠送积分
              </Text>

              {/* 每日登录赠送积分 */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Form.Item
                  name="dailyGiftCreditAmount"
                  label={dict(
                    'PC.Pages.SystemSubscriptionBasicConfig.dailyLoginCredits',
                  )}
                >
                  <InputNumber
                    min={0}
                    max={100000000}
                    precision={0}
                    style={{ width: 120 }}
                  />
                </Form.Item>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {dict('PC.Pages.SystemSubscriptionBasicConfig.creditsUnit')}
                </span>
              </div>
            </section>
          </Form>
        </div>
        <footer className={styles.footerBar}>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {dict('PC.Common.Global.save')}
          </Button>
        </footer>
      </div>
    </WorkspaceLayout>
  );
};

export default BasicConfig;
