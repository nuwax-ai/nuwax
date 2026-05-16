import { dict } from '@/services/i18nRuntime';
import { Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';

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
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  const handleOk = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectModalTitle',
      )}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okButtonProps={{ danger: true }}
      okText={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.reject',
      )}
    >
      <p style={{ marginBottom: 12 }}>
        {dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectReasonLabel',
        )}
      </p>
      <Input.TextArea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={dict(
          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.rejectReasonPlaceholder',
        )}
        maxLength={200}
        showCount
      />
    </Modal>
  );
};

export default RejectModal;
