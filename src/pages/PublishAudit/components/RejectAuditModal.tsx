import CustomFormModal from '@/components/CustomFormModal';
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
      message.success('拒绝审核成功');
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
      title="拒绝审核"
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
          label="请输入拒绝原因"
          rules={[{ required: true, message: '请输入拒绝原因' }]}
        >
          <Input.TextArea rows={4} placeholder="请输入拒绝原因" />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default RejectAuditModal;
