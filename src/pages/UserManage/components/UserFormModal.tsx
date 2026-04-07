import { dict } from '@/services/i18nRuntime';
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
      title={
        isEdit
          ? dict('PC.Pages.UserManage.UserFormModal.editUser')
          : dict('PC.Pages.UserManage.UserFormModal.addUser')
      }
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {dict('PC.Common.Global.cancel')}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={isLoading}
          onClick={handleOk}
        >
          {dict('PC.Common.Global.confirm')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        <Form.Item
          label={dict('PC.Pages.UserManage.UserFormModal.userName')}
          name="userName"
        >
          <Input
            placeholder={dict(
              'PC.Pages.UserManage.UserFormModal.inputUserName',
            )}
          />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.UserManage.UserFormModal.nickName')}
          name="nickName"
        >
          <Input
            placeholder={dict(
              'PC.Pages.UserManage.UserFormModal.inputNickName',
            )}
          />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.UserManage.UserFormModal.phoneNumber')}
          name="phone"
        >
          <Input
            placeholder={dict(
              'PC.Pages.UserManage.UserFormModal.inputPhoneNumber',
            )}
          />
        </Form.Item>
        <Form.Item
          label={dict('PC.Pages.UserManage.UserFormModal.emailAddress')}
          name="email"
        >
          <Input
            placeholder={dict(
              'PC.Pages.UserManage.UserFormModal.inputEmailAddress',
            )}
          />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            label={dict('PC.Pages.UserManage.UserFormModal.loginPassword')}
            name="password"
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Pages.UserManage.UserFormModal.inputLoginPassword',
                ),
              },
            ]}
          >
            <Input.Password
              placeholder={dict(
                'PC.Pages.UserManage.UserFormModal.inputLoginPassword',
              )}
            />
          </Form.Item>
        )}
        <Form.Item
          label={dict('PC.Pages.UserManage.UserFormModal.userType')}
          name="role"
          initialValue={UserRoleEnum.Admin}
        >
          <Radio.Group>
            <Radio value={UserRoleEnum.Admin}>
              {dict('PC.Pages.UserManage.UserFormModal.admin')}
            </Radio>
            <Radio value={UserRoleEnum.User}>
              {dict('PC.Pages.UserManage.UserFormModal.normalUser')}
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
