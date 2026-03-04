import { Form, Input, Modal } from 'antd';
import React, { useEffect } from 'react';

interface RawSegmentEditModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (values: { rawTxt: string }) => Promise<void>;
  loading: boolean;
  initialValues?: { rawTxt: string };
}

const RawSegmentEditModal: React.FC<RawSegmentEditModalProps> = ({
  open,
  onCancel,
  onOk,
  loading,
  initialValues,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values);
    } catch (error) {
      console.error('Validate failed:', error);
    }
  };

  return (
    <Modal
      title="编辑原始分段"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="rawTxt"
          label="分段内容"
          rules={[
            { required: true, message: '请输入分段内容' },
            // { max: 2000, message: '分段内容不能超过2000个字符' },
          ]}
        >
          <Input.TextArea
            rows={16}
            placeholder="请输入分段内容"
            showCount
            // maxLength={2000}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RawSegmentEditModal;
