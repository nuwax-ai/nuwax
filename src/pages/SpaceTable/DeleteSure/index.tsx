import { DeleteSureProps } from '@/types/interfaces/dataTable';
import { WarningFilled } from '@ant-design/icons';
import { Button, Form, Input, Modal, Space } from 'antd';
import React, { useEffect, useState } from 'react';

const DeleteSure: React.FC<DeleteSureProps> = ({
  title,
  sureText,
  open,
  onCancel,
  onSure,
  width,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async () => {
    try {
      await form.validateFields(); // 先校验表单
      setLoading(true);
      onSure();
    } catch (error) {
      setLoading(false); // 校验失败时重置loading状态
    }
  };

  const onClose = () => {
    onCancel();
    form.resetFields();
    setLoading(false);
  };

  useEffect(() => {
    if (!open) {
      setLoading(false); // 关闭时重置表单
    }
  }, [open]);

  return (
    <Modal
      title={title}
      open={open}
      width={width}
      okText="提交"
      cancelText="取消"
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button
          danger
          key="submit"
          type="primary"
          loading={loading}
          onClick={onFinish}
        >
          确认
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={() => setLoading(false)}
      >
        <Form.Item>
          <Space className="clear-box">
            <WarningFilled style={{ color: 'red' }} />
            <p>请谨慎删除，点击确定后将丢失所有数据！</p>
          </Space>
        </Form.Item>
        <Form.Item
          label="请再次确认"
          name="inputStr"
          rules={[
            {
              validator: (_, value) =>
                value === sureText
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(`输入必须与"${sureText}"完全匹配`),
                    ),
            },
          ]}
        >
          <Input placeholder={`请输入"${sureText}"确认删除`} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DeleteSure;
