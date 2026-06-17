import { dict } from '@/services/i18nRuntime';
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
      okText={dict('PC.Common.Global.submit')}
      cancelText={dict('PC.Common.Global.cancel')}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          {dict('PC.Common.Global.cancel')}
        </Button>,
        <Button
          danger
          key="submit"
          type="primary"
          loading={loading}
          onClick={onFinish}
        >
          {dict('PC.Common.Global.confirm')}
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
            <p>{dict('PC.Pages.SpaceTable.DeleteSure.warning')}</p>
          </Space>
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.SpaceTable.DeleteSure.confirmAgain')}
          name="inputStr"
          rules={[
            {
              validator: (_, value) =>
                value === sureText
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(
                        dict(
                          'PC.Pages.SpaceTable.DeleteSure.matchValidation',
                          sureText,
                        ),
                      ),
                    ),
            },
          ]}
        >
          <Input
            placeholder={dict(
              'PC.Pages.SpaceTable.DeleteSure.inputPlaceholder',
              sureText,
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DeleteSure;
