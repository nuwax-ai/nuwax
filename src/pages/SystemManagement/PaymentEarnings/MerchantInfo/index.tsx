import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetMerchantInfo,
  apiSaveMerchantInfo,
} from '@/services/subscriptionService';
import type { MerchantInfoData } from '@/types/interfaces/subscription';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, message } from 'antd';
import React, { useEffect, useState } from 'react';

const MOCK_MERCHANT: MerchantInfoData = {
  companyName: '北京示例科技有限公司',
  creditCode: '91110000000000000X',
  legalPerson: '张三',
  contactName: '李四',
  contactPhone: '13800138000',
  contactEmail: 'contact@example.com',
  businessLicense: '',
  status: 'approved',
};

const statusMap = {
  pending: {
    icon: <ClockCircleFilled style={{ color: '#faad14' }} />,
    color: 'warning',
    text: dict('PC.Pages.SystemMerchantInfo.statusPending'),
  },
  approved: {
    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
    color: 'success',
    text: dict('PC.Pages.SystemMerchantInfo.statusApproved'),
  },
  rejected: {
    icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
    color: 'error',
    text: dict('PC.Pages.SystemMerchantInfo.statusRejected'),
  },
};

const MerchantInfo: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<MerchantInfoData['status']>('approved');

  useEffect(() => {
    form.setFieldsValue(MOCK_MERCHANT);
    setStatus(MOCK_MERCHANT.status);
    apiGetMerchantInfo()
      .then((res) => {
        if (res?.data) {
          form.setFieldsValue(res.data);
          setStatus(res.data.status);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const res = await apiSaveMerchantInfo({
        ...values,
        status,
      } as MerchantInfoData);
      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.saveSuccess'));
        setStatus('pending');
      } else {
        message.success(dict('PC.Common.Global.saveSuccess'));
        setStatus('pending');
      }
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = statusMap[status];

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.paymentMerchantInfo')}
      rightSlot={
        <Button type="primary" loading={saving} onClick={handleSave}>
          {dict('PC.Common.Global.save')}
        </Button>
      }
    >
      <div style={{ maxWidth: 640 }}>
        <Alert
          style={{ marginBottom: 20 }}
          type={statusInfo.color as 'warning' | 'success' | 'error'}
          icon={statusInfo.icon}
          showIcon
          message={statusInfo.text}
          description={
            status === 'rejected'
              ? dict('PC.Pages.SystemMerchantInfo.rejectedHint')
              : undefined
          }
        />

        <Form form={form} layout="vertical">
          <Form.Item
            name="companyName"
            label={dict('PC.Pages.SystemMerchantInfo.companyName')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="creditCode"
            label={dict('PC.Pages.SystemMerchantInfo.creditCode')}
            rules={[{ required: true }]}
          >
            <Input maxLength={18} />
          </Form.Item>
          <Form.Item
            name="legalPerson"
            label={dict('PC.Pages.SystemMerchantInfo.legalPerson')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contactName"
            label={dict('PC.Pages.SystemMerchantInfo.contactName')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contactPhone"
            label={dict('PC.Pages.SystemMerchantInfo.contactPhone')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contactEmail"
            label={dict('PC.Pages.SystemMerchantInfo.contactEmail')}
            rules={[{ required: true }, { type: 'email' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </div>
    </WorkspaceLayout>
  );
};

export default MerchantInfo;
