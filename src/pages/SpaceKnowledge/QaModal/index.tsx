import { KnowledgeTextImportEnum } from '@/types/enums/library';
import { KnowledgeQAInfo } from '@/types/interfaces/knowledge';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, Modal } from 'antd';
import { useEffect, useState } from 'react';

/**
 * QA问答编辑对话框组件属性定义
 */
interface QaModalProps {
  id?: number; // 问答ID
  type: KnowledgeTextImportEnum; // 导入类型
  open: boolean; // 对话框是否可见
  data?: KnowledgeQAInfo | null; // 问答数据
  onCancel: () => void; // 取消回调
  onConfirm: (values: KnowledgeQAInfo) => void; // 确认回调
}

/**
 * QA问答编辑对话框组件
 * 用于新增或编辑知识库中的QA问答内容
 */
const QaModal: React.FC<QaModalProps> = ({
  data,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 处理表单提交
  const handleConfirm = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await onConfirm({ ...values, id: data?.id });
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当编辑模式且有数据时，设置表单初始值
  useEffect(() => {
    if (open && data?.id) {
      form.setFieldsValue(data);
    }
  }, [data, open]);

  // 关闭对话框时的处理
  const handleCancel = () => {
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={data?.id ? '编辑QA问答' : '添加QA问答'}
      confirmLoading={loading}
      onCancel={handleCancel}
      onOk={handleConfirm}
      maskClosable
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        requiredMark={customizeRequiredMark}
      >
        <Form.Item
          name="question"
          label="问题"
          rules={[{ required: true, message: '请输入问题' }]}
        >
          <Input.TextArea
            className="dispose-textarea-count"
            autoSize={{ minRows: 5, maxRows: 8 }}
            placeholder="请输入问题内容"
            showCount
            maxLength={500}
          />
        </Form.Item>
        <Form.Item
          name="answer"
          label="答案"
          rules={[{ required: true, message: '请输入答案' }]}
        >
          <Input.TextArea
            className="dispose-textarea-count"
            autoSize={{ minRows: 5, maxRows: 8 }}
            placeholder="请输入答案内容"
            showCount
            maxLength={5000}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QaModal;
