import { KnowledgeTextImportEnum } from '@/types/enums/library';
import { KnowledgeQAInfo } from '@/types/interfaces/knowledge';
import { Form, Input, Modal } from 'antd';
import { useEffect, useState } from 'react';

interface QaModalProps {
  id?: number;
  type: KnowledgeTextImportEnum;
  open: boolean;
  data?: KnowledgeQAInfo;
  onCancel: () => void;
  onConfirm: (values: any) => void;
}

const QaModal: React.FC<QaModalProps> = ({
  data,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    form.validateFields().then(async (values) => {
      await onConfirm({ ...values, id: data?.id });
      setLoading(false);
    });
  };
  useEffect(() => {
    if (data?.id) {
      form.setFieldsValue(data);
    }
  }, [data?.id]);
  return (
    <Modal
      open={open}
      title={data?.id ? '编辑QA问答' : '添加QA问答'}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={handleConfirm}
    >
      {/* 一个表单 两个多行输入框 都是必填 */}
      <Form form={form}>
        <Form.Item
          name="question"
          label="问题"
          rules={[{ required: true, message: '请输入问题' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="answer"
          label="答案"
          rules={[{ required: true, message: '请输入答案' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QaModal;
