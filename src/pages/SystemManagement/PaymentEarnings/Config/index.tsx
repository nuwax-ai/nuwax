import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetPaymentConfig,
  apiSavePaymentConfig,
} from '@/services/subscriptionService';
import { Alert, Button, Form, Input, InputNumber, Tabs, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 系统管理 - 支付与结算配置页面
 * 包含：开发者分成比例设置、支付网关地址配置
 */
const Config: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // 初始化加载配置数据
  useEffect(() => {
    apiGetPaymentConfig()
      .then((res) => {
        if (res?.data) {
          form.setFieldsValue(res.data);
        }
      })
      .catch(() => {
        console.error('Failed to fetch payment config');
      });
  }, [form]);

  // 执行保存配置操作
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await apiSavePaymentConfig(values);
      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.saveSuccess'));
      }
    } catch (error) {
      console.error('Save payment config error:', error);
    } finally {
      setSaving(false);
    }
  };

  // 渲染“开发者分成比例”标签页内容
  const renderShareRatioTab = () => (
    <div className={cx(styles['content-card'])}>
      <Form.Item
        label={dict('PC.Pages.SystemPaymentConfig.serviceRatio')}
        name="serviceRatio"
        required
        tooltip={dict('PC.Pages.SystemPaymentConfig.serviceRatioHint')}
      >
        <div className={cx(styles['ratio-input-wrapper'])}>
          <InputNumber
            min={0}
            max={100}
            precision={2}
            placeholder="1"
            style={{ width: 120, marginRight: '5px' }}
          />
          <span className={cx(styles.unit)}>%</span>
        </div>
      </Form.Item>
    </div>
  );

  // 渲染“支付网关配置”标签页内容
  const renderGatewayTab = () => (
    <div className={cx(styles['content-card'])}>
      {/* 风险提示信息 */}
      <div className={cx(styles['alert-wrapper'])}>
        <Alert
          message={dict('PC.Pages.SystemPaymentConfig.gatewayAlert')}
          type="info"
          showIcon
        />
      </div>

      <Form.Item
        label={dict('PC.Pages.SystemPaymentConfig.gatewayUrl')}
        name="gatewayUrl"
        required
      >
        <Input
          placeholder="https://payment-gateway.nuwax.com"
          style={{ maxWidth: 600 }}
        />
      </Form.Item>
    </div>
  );

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.paymentConfig')}
      tips={dict('PC.Pages.SystemPaymentConfig.pageTips')}
      rightSlot={
        <Button type="primary" loading={saving} onClick={handleSave}>
          {dict('PC.Common.Global.save')}
        </Button>
      }
    >
      <div className={cx(styles.container)}>
        <Form form={form} layout="vertical">
          <Tabs
            defaultActiveKey="ratio"
            items={[
              {
                key: 'ratio',
                label: dict('PC.Pages.SystemPaymentConfig.tabShareRatio'),
                children: renderShareRatioTab(),
              },
              {
                key: 'gateway',
                label: dict('PC.Pages.SystemPaymentConfig.tabGateway'),
                children: renderGatewayTab(),
              },
            ]}
          />
        </Form>
      </div>
    </WorkspaceLayout>
  );
};

export default Config;
