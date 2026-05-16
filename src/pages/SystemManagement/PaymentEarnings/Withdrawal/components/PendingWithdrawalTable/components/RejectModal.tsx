import { dict } from '@/services/i18nRuntime';
import { ModalForm, ProFormTextArea } from '@ant-design/pro-components';
import React from 'react';

interface RejectModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const RejectModal: React.FC<RejectModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  return (
    <ModalForm
      title={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectModalTitle',
      )}
      open={open}
      modalProps={{
        onCancel: onCancel,
        destroyOnHidden: true,
        okButtonProps: { danger: true },
      }}
      width={480}
      submitter={{
        searchConfig: {
          submitText: dict(
            'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.reject',
          ),
        },
      }}
      onFinish={async (values) => {
        await onConfirm(values.reason);
        onCancel();
        return true;
      }}
    >
      <div style={{ paddingTop: 16 }} />
      <ProFormTextArea
        name="reason"
        label={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectReasonLabel',
        )}
        placeholder={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectReasonPlaceholder',
        )}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectReasonPlaceholder',
            ),
          },
        ]}
        fieldProps={{
          rows: 4,
          maxLength: 200,
          showCount: true,
        }}
      />
    </ModalForm>
  );
};

export default RejectModal;
