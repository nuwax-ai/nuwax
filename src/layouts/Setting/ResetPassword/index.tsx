import { VERIFICATION_CODE_LEN } from '@/constants/common.constants';
import { PHONE } from '@/constants/home.constants';
import useCountDown from '@/hooks/useCountDown';
import useSendCode from '@/hooks/useSendCode';
import { apiResetPassword } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { SendCodeEnum } from '@/types/enums/login';
import type { ResetPasswordForm } from '@/types/interfaces/login';
import { validatePassword } from '@/utils/common';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { Button, Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 重置密码
 */
const ResetPassword: React.FC = () => {
  // 获取当前登录方式,如果有@证明是邮箱登录,否则是手机登录
  const phone = localStorage.getItem(PHONE);

  const { countDown, setCountDown, onClearTimer, handleCount } = useCountDown();
  const { runSendCode } = useSendCode();
  const [form] = Form.useForm<ResetPasswordForm>();

  const { run, loading } = useRequest(apiResetPassword, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(dict('PC.Layouts.Setting.ResetPassword.resetSuccess'));
      form.resetFields();
      setCountDown(0);
      onClearTimer();
    },
    onError: () => {
      setCountDown(0);
      onClearTimer();
    },
  });

  const onFinish: FormProps<ResetPasswordForm>['onFinish'] = (values) => {
    const { newPassword, code } = values;
    run({
      newPassword,
      code,
    });
  };

  const handleSendCode = async () => {
    handleCount();
    const authType = localStorage.getItem('AUTH_TYPE') === '1';
    const _params = {
      type: SendCodeEnum.RESET_PASSWORD,
      [authType ? 'phone' : 'email']: phone,
    };
    runSendCode(_params);
  };

  return (
    <div className={cx(styles.container)}>
      <h3>{dict('PC.Layouts.Setting.ResetPassword.title')}</h3>
      <Form
        layout="vertical"
        form={form}
        requiredMark={customizeRequiredNoStarMark}
        rootClassName={cx(styles.form)}
        onFinish={onFinish}
      >
        <Form.Item
          name="password"
          label={dict('PC.Layouts.Setting.ResetPassword.newPassword')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Layouts.Setting.ResetPassword.inputNewPassword',
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
                      'PC.Layouts.Setting.ResetPassword.inputCorrectPassword',
                    ),
                  ),
                );
              },
            },
          ]}
        >
          <Input.Password
            placeholder={dict(
              'PC.Layouts.Setting.ResetPassword.placeholderNewPassword',
            )}
          />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label={dict('PC.Layouts.Setting.ResetPassword.confirmPassword')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Layouts.Setting.ResetPassword.inputConfirmPassword',
              ),
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const _password = getFieldValue('password');
                if (!value || _password === value) {
                  return Promise.resolve();
                }
                if (_password && _password !== value) {
                  return Promise.reject(
                    new Error(
                      dict('PC.Layouts.Setting.ResetPassword.passwordMismatch'),
                    ),
                  );
                }
                return Promise.reject(
                  new Error(
                    dict(
                      'PC.Layouts.Setting.ResetPassword.inputCorrectNewPassword',
                    ),
                  ),
                );
              },
            }),
          ]}
        >
          <Input.Password
            placeholder={dict(
              'PC.Layouts.Setting.ResetPassword.placeholderConfirmPassword',
            )}
          />
        </Form.Item>
        <Form.Item
          name="code"
          label={dict('PC.Layouts.Setting.ResetPassword.verificationCode')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Layouts.Setting.ResetPassword.inputVerificationCode',
              ),
            },
            {
              validator(_, value) {
                if (!value || value?.length === VERIFICATION_CODE_LEN) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    dict('PC.Layouts.Setting.ResetPassword.inputCorrectCode'),
                  ),
                );
              },
            },
          ]}
        >
          <div className={cx('flex', 'content-between')}>
            <Input
              rootClassName={styles.input}
              placeholder={dict(
                'PC.Layouts.Setting.ResetPassword.placeholderCode',
              )}
            />
            {countDown < 60 && countDown > 0 ? (
              <Button rootClassName={styles.btn} disabled type="primary">
                {`${countDown}s`}
              </Button>
            ) : (
              <Button
                rootClassName={styles.btn}
                type="primary"
                onClick={handleSendCode}
              >
                {dict('PC.Layouts.Setting.ResetPassword.sendCode')}
              </Button>
            )}
          </div>
        </Form.Item>
        <Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            {dict('PC.Layouts.Setting.ResetPassword.submit')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ResetPassword;
