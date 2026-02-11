import { apiAddSystemUser, apiUpdateSystemUser } from '@/services/systemManage';
import { UserRoleEnum } from '@/types/enums/systemManage';
import type { SystemUserListInfo } from '@/types/interfaces/systemManage';
import { customizeRequiredMark } from '@/utils/form';
import { Button, Form, Input, Modal, Radio } from 'antd';
import React, { useEffect, useState } from 'react';

interface UserFormModalProps {
  open: boolean;
  isEdit: boolean;
  record?: SystemUserListInfo | null;
  onCancel: () => void;
  onSuccess: (isEdit: boolean) => void;
}

/**
 * 用户新增/编辑弹窗
 */
const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  isEdit,
  record,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (isEdit && record) {
        form.setFieldsValue(record);
      } else {
        form.resetFields();
      }
    }
  }, [open, isEdit, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setIsLoading(true);
      if (isEdit) {
        await apiUpdateSystemUser({
          id: record?.id,
          ...values,
        });
      } else {
        await apiAddSystemUser({
          ...values,
        });
      }
      onSuccess(isEdit);
    } catch (errorInfo) {
      console.error('Validation Failed:', errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={isEdit ? '修改用户信息' : '新增用户'}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={isLoading}
          onClick={handleOk}
        >
          确认
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        <Form.Item label="用户名" name="userName">
          <Input placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item label="用户昵称" name="nickName">
          <Input placeholder="请输入用户昵称（姓名）" />
        </Form.Item>
        <Form.Item label="手机号码" name="phone">
          <Input placeholder="请输入手机号码" />
        </Form.Item>
        <Form.Item label="邮箱地址" name="email">
          <Input placeholder="请输入邮箱地址" />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            label="登录密码"
            name="password"
            rules={[{ required: true, message: '请输入登录密码' }]}
          >
            <Input.Password placeholder="请输入登录密码" />
          </Form.Item>
        )}
        <Form.Item
          label="用户类型"
          name="role"
          initialValue={UserRoleEnum.Admin}
        >
          <Radio.Group>
            <Radio value={UserRoleEnum.Admin}>管理员</Radio>
            <Radio value={UserRoleEnum.User}>普通用户</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
