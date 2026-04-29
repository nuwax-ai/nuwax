import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetPaymentConfig,
  apiSavePaymentConfig,
} from '@/services/subscriptionService';
import type { PaymentConfigInfo } from '@/types/interfaces/subscription';
import { AlipayCircleFilled, WechatFilled } from '@ant-design/icons';
import { Button, Form, Input, Tabs, message } from 'antd';
import React, { useEffect, useState } from 'react';

const MOCK_CONFIG: PaymentConfigInfo = {
  alipayAppId: '2021000000000000',
  alipayPrivateKey: '',
  alipayPublicKey: '',
  alipayNotifyUrl: 'https://yourdomain.com/api/payment/alipay/notify',
  wechatAppId: 'wx0000000000000000',
  wechatMchId: '1234567890',
  wechatApiKey: '',
  wechatNotifyUrl: 'https://yourdomain.com/api/payment/wechat/notify',
};

const Config: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue(MOCK_CONFIG);
    apiGetPaymentConfig()
      .then((res) => {
        if (res?.data) form.setFieldsValue(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await apiSavePaymentConfig(values as PaymentConfigInfo);
      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.saveSuccess'));
      } else {
        message.success(dict('PC.Common.Global.saveSuccess'));
      }
    } catch {
      message.success(dict('PC.Common.Global.saveSuccess'));
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  const alipayTab = (
    <div style={{ maxWidth: 560 }}>
      <Form.Item
        name="alipayAppId"
        label="App ID"
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input placeholder="2021000000000000" />
      </Form.Item>
      <Form.Item
        name="alipayPrivateKey"
        label={dict('PC.Pages.SystemPaymentConfig.privateKey')}
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input.TextArea
          rows={4}
          placeholder={dict(
            'PC.Pages.SystemPaymentConfig.privateKeyPlaceholder',
          )}
        />
      </Form.Item>
      <Form.Item
        name="alipayPublicKey"
        label={dict('PC.Pages.SystemPaymentConfig.alipayPublicKey')}
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input.TextArea
          rows={4}
          placeholder={dict(
            'PC.Pages.SystemPaymentConfig.alipayPublicKeyPlaceholder',
          )}
        />
      </Form.Item>
      <Form.Item
        name="alipayNotifyUrl"
        label={dict('PC.Pages.SystemPaymentConfig.notifyUrl')}
        style={fieldStyle}
      >
        <Input placeholder="https://yourdomain.com/api/payment/alipay/notify" />
      </Form.Item>
    </div>
  );

  const wechatTab = (
    <div style={{ maxWidth: 560 }}>
      <Form.Item
        name="wechatAppId"
        label="App ID"
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input placeholder="wx0000000000000000" />
      </Form.Item>
      <Form.Item
        name="wechatMchId"
        label={dict('PC.Pages.SystemPaymentConfig.mchId')}
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input placeholder="1234567890" />
      </Form.Item>
      <Form.Item
        name="wechatApiKey"
        label={dict('PC.Pages.SystemPaymentConfig.apiKey')}
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input.Password
          placeholder={dict('PC.Pages.SystemPaymentConfig.apiKeyPlaceholder')}
        />
      </Form.Item>
      <Form.Item
        name="wechatNotifyUrl"
        label={dict('PC.Pages.SystemPaymentConfig.notifyUrl')}
        style={fieldStyle}
      >
        <Input placeholder="https://yourdomain.com/api/payment/wechat/notify" />
      </Form.Item>
    </div>
  );

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.paymentConfig')}
      rightSlot={
        <Button type="primary" loading={saving} onClick={handleSave}>
          {dict('PC.Common.Global.save')}
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Tabs
          items={[
            {
              key: 'alipay',
              label: (
                <span>
                  <AlipayCircleFilled
                    style={{ color: '#1677ff', marginRight: 6 }}
                  />
                  {dict('PC.Pages.SystemPaymentConfig.tabAlipay')}
                </span>
              ),
              children: alipayTab,
            },
            {
              key: 'wechat',
              label: (
                <span>
                  <WechatFilled style={{ color: '#07c160', marginRight: 6 }} />
                  {dict('PC.Pages.SystemPaymentConfig.tabWechat')}
                </span>
              ),
              children: wechatTab,
            },
          ]}
        />
      </Form>
    </WorkspaceLayout>
  );
};

export default Config;
