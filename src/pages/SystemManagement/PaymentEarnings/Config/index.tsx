import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiSystemSubscriptionConfigSave } from '@/services/systemManage';
import { Alert, Button, Form, Input, InputNumber, Tabs, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 系统管理 - 支付与结算配置页面
 * 包含：开发者分成比例设置、支付网关地址配置
 */
const Config: React.FC = () => {
  const { tenantConfigInfo, runTenantConfig } = useModel('tenantConfigInfo');
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  // tenantConfigInfo.revenueRatio tenantConfigInfo.paymentGateway

  // 初始化加载配置数据
  useEffect(() => {
    if (tenantConfigInfo) {
      const { revenueRatio, paymentGateway } = tenantConfigInfo;
      // revenueRatio 为小数形式，显示需乘以 100
      const ratio =
        typeof revenueRatio === 'number' ? revenueRatio * 100 : undefined;
      form.setFieldsValue({
        revenueRatio: ratio,
        paymentGateway,
      });
    }
  }, [tenantConfigInfo, form]);

  // 执行保存配置操作
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      // 保存时将百分比转换为小数
      const params = {
        ...values,
        revenueRatio: values.revenueRatio / 100,
      };
      const res = await apiSystemSubscriptionConfigSave(params);
      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.saveSuccess'));
        runTenantConfig();
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
        tooltip={dict('PC.Pages.SystemPaymentConfig.serviceRatioHint')}
      >
        <div className={cx(styles['ratio-input-wrapper'])}>
          <Form.Item
            name="revenueRatio"
            noStyle
            rules={[
              {
                required: true,
                message: dict('PC.Common.Global.required'),
              },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: 120 }}
            />
          </Form.Item>
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
        name="paymentGateway"
        rules={[
          {
            required: true,
            message: dict('PC.Common.Global.required'),
          },
          {
            pattern: /^(http|https):\/\//,
            message: dict('PC.Common.Global.invalidUrl'),
          },
        ]}
      >
        <Input style={{ maxWidth: 600 }} />
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
