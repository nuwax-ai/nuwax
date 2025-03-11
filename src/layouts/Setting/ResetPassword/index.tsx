import { VERIFICATION_CODE_LEN } from '@/constants/common.constants';
import { PHONE } from '@/constants/home.constants';
import useCountDown from '@/hooks/useCountDown';
import { apiResetPassword, apiSendCode } from '@/services/account';
import { SendCodeEnum } from '@/types/enums/login';
import { validatePassword } from '@/utils/common';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { Button, Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import type { ResetPasswordForm } from '@/types/interfaces/login';

const cx = classNames.bind(styles);

/**
 * 重置密码
 */
const ResetPassword: React.FC = () => {
  const { countDown, setCountDown, onClearTimer, handleCount } = useCountDown();
  const [form] = Form.useForm<ResetPasswordForm>();


  const { run, loading } = useRequest(apiResetPassword, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('重置成功');
      form.resetFields();
      setCountDown(0);
      onClearTimer();
    },
    onError: () => {
      setCountDown(0);
      onClearTimer();
    }
  });

  const onFinish: FormProps<ResetPasswordForm>['onFinish'] = (values) => {
    const { newPassword, code } = values;
    run({
      newPassword,
      code,
    });
  };

  // 发送邮箱验证码
  const { run: runSendCode } = useRequest(apiSendCode, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('验证码已发送');
    },
  });

  const handleSendCode = async () => {
    handleCount();
    runSendCode({
      type: SendCodeEnum.RESET_PASSWORD,
      phone: localStorage.getItem(PHONE),
    });
  };

  return (
    <div className={cx(styles.container)}>
      <h3>重置密码</h3>
      <Form
        layout="vertical"
        form={form}
        requiredMark={customizeRequiredNoStarMark}
        rootClassName={cx(styles.form)}
        onFinish={onFinish}
      >
        <Form.Item
          name="password"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码!' },
            {
              validator(_, value) {
                if (!value || validatePassword(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入正确的新密码!'));
              },
            },
          ]}
        >
          <Input placeholder="请输入新密码" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="确认密码"
          rules={[
            { required: true, message: '请再次输入新密码!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const _password = getFieldValue('password');
                if (!value || _password === value) {
                  return Promise.resolve();
                }
                if (_password && _password !== value) {
                  return Promise.reject(new Error('两次密码不一致!'));
                }
                return Promise.reject(new Error('请输入正确的密码!'));
              },
            }),
          ]}
        >
          <Input placeholder="请再次输入新密码" />
        </Form.Item>
        <Form.Item
          name="code"
          label="验证码"
          rules={[
            { required: true, message: '请输入验证码' },
            {
              validator(_, value) {
                if (!value || value?.length === VERIFICATION_CODE_LEN) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入正确的验证码!'));
              },
            },
          ]}
        >
          <div className={cx('flex', 'content-between')}>
            <Input
              rootClassName={styles.input}
              placeholder="请输入手机验证码"
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
                发送验证码
              </Button>
            )}
          </div>
        </Form.Item>
        <Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            确定修改
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ResetPassword;
