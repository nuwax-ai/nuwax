import { apiAddSystemUser, apiUpdateSystemUser } from '@/services/systemManage';
import styles from '@/styles/systemManage.less';
import { UserRoleEnum } from '@/types/enums/systemManage';
import type { SystemUserListInfo } from '@/types/interfaces/systemManage';
import { customizeRequiredMark } from '@/utils/form';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

interface CreateModifyUserProps {
  isEdit: boolean;
  record?: SystemUserListInfo;
  onSuccess: (isEdit: boolean) => void;
}

const cx = classNames.bind(styles);

const CreateModifyUser: React.FC<CreateModifyUserProps> = ({
  isEdit,
  record,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTitle(isEdit ? '修改用户信息' : '新增用户');
  }, [isEdit]);

  useEffect(() => {
    if (open && isEdit && record) {
      // 当 Modal 打开且为编辑模式时，填充表单数据
      form.setFieldsValue(record);
    } else if (!open) {
      // 当 Modal 关闭时，重置表单
      form.resetFields();
    }
  }, [open, isEdit, record, form]);

  const modifyUser = () => {
    setOpen(true);
  };

  const addUser = () => {
    setOpen(true);
  };

  const onCancel = () => {
    setOpen(false);
  };

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
      setOpen(false);
      onSuccess(isEdit);
    } catch (errorInfo) {
      console.error('Validation Failed:', errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isEdit ? (
        <Button
          type="link"
          className={cx(styles['table-action-ant-btn-link'])}
          onClick={modifyUser}
        >
          修改
        </Button>
      ) : (
        <Button type="primary" icon={<PlusOutlined />} onClick={addUser}>
          添加用户
        </Button>
      )}
      <Modal
        open={open}
        onCancel={onCancel}
        title={title}
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
        <Form
          form={form}
          layout="vertical"
          requiredMark={customizeRequiredMark}
        >
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
    </>
  );
};

export default CreateModifyUser;
