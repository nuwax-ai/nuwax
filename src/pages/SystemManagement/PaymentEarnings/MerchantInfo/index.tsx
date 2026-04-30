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
  InboxOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Timeline,
  Upload,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

interface MerchantInfoExt extends MerchantInfoData {
  legalPersonId: string;
  licenseExpiry: string;
  bankName: string;
  bankAccount: string;
  bankBranchCode: string;
  auditTimeline: { time: string; action: string; status: string }[];
}

const MOCK_MERCHANT: MerchantInfoExt = {
  companyName: '北京示例科技有限公司',
  creditCode: '91110000000000000X',
  legalPerson: '张三',
  legalPersonId: '110101199001011234',
  licenseExpiry: '2030-12-31',
  contactName: '李四',
  contactPhone: '13800138000',
  contactEmail: 'contact@example.com',
  bankName: '中国工商银行',
  bankAccount: '6222021234567890123',
  bankBranchCode: '102100099996',
  status: 'approved',
  auditTimeline: [
    { time: '2026-03-01 10:00', action: '提交进件申请', status: 'done' },
    { time: '2026-03-02 14:30', action: '资料审核通过', status: 'done' },
    { time: '2026-03-03 09:00', action: '账户开通完成', status: 'done' },
  ],
};

const statusMap = {
  pending: {
    icon: <ClockCircleFilled style={{ color: '#faad14' }} />,
    color: 'warning' as const,
    text: dict('PC.Pages.SystemMerchantInfo.statusPending'),
  },
  approved: {
    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
    color: 'success' as const,
    text: dict('PC.Pages.SystemMerchantInfo.statusApproved'),
  },
  rejected: {
    icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
    color: 'error' as const,
    text: dict('PC.Pages.SystemMerchantInfo.statusRejected'),
  },
};

const MerchantInfo: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<MerchantInfoData['status']>('approved');
  const [auditTimeline, setAuditTimeline] = useState<
    { time: string; action: string; status: string }[]
  >([]);

  const setFormWithExpiry = (data: MerchantInfoExt) => {
    form.setFieldsValue({
      ...data,
      licenseExpiry: data.licenseExpiry ? dayjs(data.licenseExpiry) : undefined,
    });
    setStatus(data.status);
    setAuditTimeline(data.auditTimeline ?? []);
  };

  useEffect(() => {
    setFormWithExpiry(MOCK_MERCHANT);
    apiGetMerchantInfo()
      .then((res) => {
        if (res?.data) {
          setFormWithExpiry(res.data as MerchantInfoExt);
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
        licenseExpiry:
          values.licenseExpiry?.format?.('YYYY-MM-DD') ?? values.licenseExpiry,
        status,
      } as MerchantInfoData);
      if (res?.code === SUCCESS_CODE) {
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
      <div style={{ maxWidth: 720 }}>
        <Alert
          style={{ marginBottom: 16 }}
          type={statusInfo.color}
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
          {/* 法人身份信息 */}
          <Card
            title={dict('PC.Pages.SystemMerchantInfo.sectionLegalPerson')}
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="legalPerson"
              label={dict('PC.Pages.SystemMerchantInfo.legalPersonName')}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="legalPersonId"
              label={dict('PC.Pages.SystemMerchantInfo.legalPersonId')}
              rules={[{ required: true }]}
            >
              <Input maxLength={18} />
            </Form.Item>
            <Form.Item label={dict('PC.Pages.SystemMerchantInfo.idCardFront')}>
              <Upload.Dragger
                maxCount={1}
                beforeUpload={() => false}
                accept="image/*"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p>{dict('PC.Pages.SystemMerchantInfo.uploadHint')}</p>
              </Upload.Dragger>
            </Form.Item>
            <Form.Item label={dict('PC.Pages.SystemMerchantInfo.idCardBack')}>
              <Upload.Dragger
                maxCount={1}
                beforeUpload={() => false}
                accept="image/*"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p>{dict('PC.Pages.SystemMerchantInfo.uploadHint')}</p>
              </Upload.Dragger>
            </Form.Item>
          </Card>

          {/* 营业执照信息 */}
          <Card
            title={dict('PC.Pages.SystemMerchantInfo.sectionBusinessLicense')}
            style={{ marginBottom: 16 }}
          >
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
              name="licenseExpiry"
              label={dict('PC.Pages.SystemMerchantInfo.licenseExpiry')}
              rules={[{ required: true }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={dict('PC.Pages.SystemMerchantInfo.licensePhoto')}>
              <Upload.Dragger
                maxCount={1}
                beforeUpload={() => false}
                accept="image/*"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p>{dict('PC.Pages.SystemMerchantInfo.uploadHint')}</p>
              </Upload.Dragger>
            </Form.Item>
          </Card>

          {/* 结算账户信息 */}
          <Card
            title={dict('PC.Pages.SystemMerchantInfo.sectionBankAccount')}
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="bankName"
              label={dict('PC.Pages.SystemMerchantInfo.bankName')}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="bankAccount"
              label={dict('PC.Pages.SystemMerchantInfo.bankAccount')}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="bankBranchCode"
              label={dict('PC.Pages.SystemMerchantInfo.bankBranchCode')}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Card>
        </Form>

        {/* 审核进度 */}
        {auditTimeline.length > 0 && (
          <Card
            title={dict('PC.Pages.SystemMerchantInfo.sectionAuditProgress')}
          >
            <Timeline
              items={auditTimeline.map((item) => ({
                children: (
                  <div>
                    <div>{item.action}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {item.time}
                    </div>
                  </div>
                ),
                color:
                  item.status === 'done'
                    ? 'green'
                    : item.status === 'rejected'
                    ? 'red'
                    : 'blue',
              }))}
            />
          </Card>
        )}
      </div>
    </WorkspaceLayout>
  );
};

export default MerchantInfo;
