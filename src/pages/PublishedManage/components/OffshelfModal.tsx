import CustomFormModal from '@/components/CustomFormModal';
import { apiOffShelf } from '@/services/publishManage';
import { customizeRequiredMark } from '@/utils/form';
import { useRequest } from 'ahooks';
import { Form, Input, message } from 'antd';
import { useState } from 'react';

interface OffshelfModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  id: number | undefined;
}

const OffshelfModal: React.FC<OffshelfModalProps> = ({
  open,
  onCancel,
  onConfirm,
  id,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { run: runOffShelf } = useRequest(apiOffShelf, {
    manual: true,
    loadingDelay: 300,
    onBefore: () => {
      setLoading(true);
    },
    onSuccess: () => {
      message.success('下架成功');
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
        runOffShelf({ id, reason: values.reason });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <CustomFormModal
      open={open}
      form={form}
      title="下架"
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
          label="请输入下架原因"
          rules={[{ required: true, message: '请输入下架原因' }]}
        >
          <Input.TextArea rows={4} placeholder="请输入下架原因" />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default OffshelfModal;
