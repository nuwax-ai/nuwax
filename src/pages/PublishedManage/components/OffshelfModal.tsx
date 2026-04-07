import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
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
      message.success(
        dict('PC.Pages.PublishedManage.OffshelfModal.offShelfSuccess'),
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
      title={dict('PC.Pages.PublishedManage.OffshelfModal.title')}
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
          label={dict('PC.Pages.PublishedManage.OffshelfModal.reasonLabel')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.PublishedManage.OffshelfModal.reasonRequired',
              ),
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder={dict(
              'PC.Pages.PublishedManage.OffshelfModal.reasonPlaceholder',
            )}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default OffshelfModal;
