import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { apiRejectAudit } from '@/services/publishManage';
import { customizeRequiredMark } from '@/utils/form';
import { useRequest } from 'ahooks';
import { Form, Input, message } from 'antd';
import { useState } from 'react';

interface RejectAuditModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  id: number | undefined;
}

const RejectAuditModal: React.FC<RejectAuditModalProps> = ({
  open,
  onCancel,
  onConfirm,
  id,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { run: runRejectAudit } = useRequest(apiRejectAudit, {
    manual: true,
    loadingDelay: 300,
    onBefore: () => {
      setLoading(true);
    },
    onSuccess: () => {
      message.success(
        dict('PC.Pages.PublishAudit.RejectAuditModal.rejectSuccess'),
      );
      form.resetFields();
      onConfirm();
    },
    onFinally: () => {
      setLoading(false);
    },
  });

  const handleConfirm = () => {
    form
      .validateFields()
      .then((values) => {
        runRejectAudit({ id, reason: values.reason });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <CustomFormModal
      open={open}
      form={form}
      title={dict('PC.Pages.PublishAudit.RejectAuditModal.title')}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onConfirm={handleConfirm}
      loading={loading}
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        <Form.Item
          name="reason"
          label={dict('PC.Pages.PublishAudit.RejectAuditModal.reasonLabel')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.PublishAudit.RejectAuditModal.reasonRequired',
              ),
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder={dict(
              'PC.Pages.PublishAudit.RejectAuditModal.reasonPlaceholder',
            )}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default RejectAuditModal;
