import { XModalForm } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { ProFormTextArea } from '@ant-design/pro-components';
import { Form, Image } from 'antd';
import React, { useEffect } from 'react';

interface PaymentRemarkModalProps {
  open: boolean;
  onCancel: () => void;
  paymentExtra?: {
    images?: string[];
    remark?: string;
  } | null;
}

const PaymentRemarkModal: React.FC<PaymentRemarkModalProps> = ({
  open,
  onCancel,
  paymentExtra,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        remark: paymentExtra?.remark || '-',
      });
    } else {
      form.resetFields();
    }
  }, [open, paymentExtra, form]);

  return (
    <XModalForm
      form={form}
      title={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.paymentRemarkDetailTitle',
      )}
      open={open}
      onOpenChange={(v) => !v && onCancel()}
      submitter={{
        render: () => null,
      }}
      modalProps={{
        destroyOnClose: true,
      }}
    >
      <div style={{ paddingTop: 12 }}>
        <ProFormTextArea
          name="remark"
          label={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.payRemarkLabel',
          )}
          readonly
        />

        <Form.Item
          label={dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.voucherImagesLabel',
          )}
        >
          {paymentExtra?.images && paymentExtra.images.length > 0 ? (
            <Image.PreviewGroup>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {paymentExtra.images.map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          ) : (
            <span style={{ color: '#bfbfbf' }}>
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.noVoucherImages',
              )}
            </span>
          )}
        </Form.Item>
      </div>
    </XModalForm>
  );
};

export default PaymentRemarkModal;
