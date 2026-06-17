import { dict } from '@/services/i18nRuntime';
import {
  apiGetWithdrawConfig,
  apiSaveWithdrawConfig,
} from '@/services/subscriptionService';
import { Button, Card, Form, InputNumber, message, Radio, Spin } from 'antd';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const WithdrawConfigCard: React.FC = () => {
  const [form] = Form.useForm();

  const {
    data: configData,
    loading: fetching,
    run: fetchConfig,
  } = useRequest(apiGetWithdrawConfig);

  const { loading: saving, run: saveConfig } = useRequest(
    apiSaveWithdrawConfig,
    {
      manual: true,
      onSuccess: () => {
        message.success(
          dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.saveSuccess',
          ),
        );
        fetchConfig();
      },
    },
  );

  useEffect(() => {
    if (configData) {
      form.setFieldsValue(configData);
    }
  }, [configData, form]);

  const onFinish = (values: any) => {
    saveConfig(values);
  };

  return (
    <Card className={styles.configCard} variant="outlined">
      <Spin spinning={fetching}>
        <div className={styles.title}>
          {dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.configTitle',
          )}
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ limitMode: 'ALL' }}
        >
          <Form.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.minAmountLabel',
            )}
            name="minAmount"
            required
            rules={[{ required: true }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="100"
              controls={true}
            />
          </Form.Item>
          <div className={styles.hintText}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.minAmountHint',
            )}
          </div>

          <div className={styles.rowLayout}>
            <Form.Item
              label={dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.monthlyLimitLabel',
              )}
              name="monthlyLimit"
              required
              rules={[{ required: true }]}
              className={styles.rowItem}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="5" />
            </Form.Item>
            <Form.Item
              label={dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.dailyLimitLabel',
              )}
              name="dailyLimit"
              required
              rules={[{ required: true }]}
              className={styles.rowItem}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="1" />
            </Form.Item>
          </div>

          <Form.Item
            label={dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.limitModeLabel',
            )}
            name="limitMode"
          >
            <Radio.Group>
              <Radio value="ALL">
                {dict(
                  'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.limitModeAll',
                )}
              </Radio>
              <Radio value="ANY">
                {dict(
                  'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.limitModeAny',
                )}
              </Radio>
            </Radio.Group>
          </Form.Item>
          <div className={styles.hintText}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.limitModeHint',
            )}
          </div>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={saving}>
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.saveConfig',
              )}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default WithdrawConfigCard;
