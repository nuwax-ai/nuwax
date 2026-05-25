import { XModalForm } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiUpdateSystemUser } from '@/services/systemManage';
import type { SystemUserListInfo } from '@/types/interfaces/systemManage';
import { validatePassword } from '@/utils/common';
import { ProFormText } from '@ant-design/pro-components';
import { Form, message } from 'antd';
import React, { useEffect } from 'react';

interface ResetPasswordModalProps {
  open: boolean;
  record: SystemUserListInfo | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  record,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({
        userName: record.userName,
      });
    } else {
      form.resetFields();
    }
  }, [open, record, form]);

  const handleFinish = async (values: any) => {
    if (!record) return false;
    const res = await apiUpdateSystemUser({
      // ...record,
      id: record.id,
      password: values.password,
    } as any);
    if (res.code === SUCCESS_CODE) {
      message.success(
        dict('PC.Pages.UserManage.ResetPasswordModal.resetSuccess'),
      );
      onSuccess();
      return true;
    }
    return false;
  };

  return (
    <XModalForm
      title={dict('PC.Pages.UserManage.ResetPasswordModal.title')}
      open={open}
      form={form}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
      width={480}
      modalProps={{
        destroyOnClose: true,
      }}
      onFinish={handleFinish}
    >
      <ProFormText
        name="userName"
        label={dict('PC.Pages.UserManage.Index.userName')}
        disabled
      />
      <ProFormText.Password
        name="password"
        label={dict('PC.Pages.UserManage.ResetPasswordModal.newPassword')}
        placeholder={dict(
          'PC.Pages.UserManage.ResetPasswordModal.inputNewPassword',
        )}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.UserManage.ResetPasswordModal.newPasswordRequired',
            ),
          },
          {
            validator(_, value) {
              if (!value || validatePassword(value)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(
                  dict(
                    'PC.Pages.UserManage.UserFormModal.inputCorrectPassword',
                  ),
                ),
              );
            },
          },
        ]}
      />
      <ProFormText.Password
        name="confirmPassword"
        label={dict('PC.Pages.UserManage.ResetPasswordModal.confirmPassword')}
        placeholder={dict(
          'PC.Pages.UserManage.ResetPasswordModal.inputConfirmPassword',
        )}
        dependencies={['password']}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.UserManage.ResetPasswordModal.confirmPasswordRequired',
            ),
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(
                  dict(
                    'PC.Pages.UserManage.ResetPasswordModal.passwordMismatch',
                  ),
                ),
              );
            },
          }),
        ]}
      />
    </XModalForm>
  );
};

export default ResetPasswordModal;
