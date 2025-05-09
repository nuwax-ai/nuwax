import { KnowledgeTextImportEnum } from '@/types/enums/library';
import { Form, Input, Modal } from 'antd';

interface QaModalProps {
  id?: number;
  type: KnowledgeTextImportEnum;
  open: boolean;
  onCancel: () => void;
  onConfirm: (values: any) => void;
}

const QaModal: React.FC<QaModalProps> = ({ id, open, onCancel, onConfirm }) => {
  const [form] = Form.useForm();
  const handleConfirm = () => {
    form.validateFields().then((values) => {
      onConfirm({ ...values, id });
    });
  };
  return (
    <Modal
      open={open}
      title="添加QA问答"
      onCancel={onCancel}
      onOk={handleConfirm}
    >
      {/* 一个表单 两个输入框 都是必填 */}
      <Form form={form}>
        <Form.Item
          name="question"
          label="问题"
          rules={[{ required: true, message: '请输入问题' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="answer"
          label="答案"
          rules={[{ required: true, message: '请输入答案' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QaModal;
