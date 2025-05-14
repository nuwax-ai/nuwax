import { VERIFICATION_CODE_LEN } from '@/constants/common.constants';
import useCountDown from '@/hooks/useCountDown';
import useSendCode from '@/hooks/useSendCode';
import { apiBindEmail } from '@/services/account';
import { SendCodeEnum } from '@/types/enums/login';
import type { BindEmailParams } from '@/types/interfaces/login';
import { isValidEmail, isValidPhone } from '@/utils/common';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { Button, Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 邮箱绑定
 */
const SettingEmail: React.FC = () => {
  const { countDown, setCountDown, onClearTimer, handleCount } = useCountDown();
  const { runSendCode } = useSendCode();
  const [form] = Form.useForm<BindEmailParams>();
  const { setUserInfo } = useModel('userInfo');

  // 获取当前登录方式是否为手机登录,如果是手机登录,则为true,否则为false
  const authType = localStorage.getItem('AUTH_TYPE') === '1';

  // 绑定邮箱
  const { run, loading } = useRequest(apiBindEmail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: BindEmailParams[]) => {
      message.success('绑定成功');
      form.resetFields();
      setCountDown(0);
      onClearTimer();
      // 更新用户信息
      setUserInfo({
        ...setUserInfo,
        email: params[0].email,
      });
    },
    onError: () => {
      setCountDown(0);
      onClearTimer();
    },
  });

  // 绑定事件
  const handlerBindEmail: FormProps<BindEmailParams>['onFinish'] = (values) => {
    run(values);
  };

  const handleSendCode = () => {
    const fieldName: 'phone' | 'email' = authType ? 'phone' : 'email';
    form.validateFields([fieldName]).then((values) => {
      handleCount();
      runSendCode({
        type: SendCodeEnum.BIND_EMAIL,
        [fieldName]: values[fieldName],
      });
    });
  };

  return (
    <div className={cx(styles.container)}>
      <h3>{authType ? '手机号绑定' : '邮箱绑定'}</h3>
      <Form
        layout="vertical"
        form={form}
        rootClassName={cx(styles.form)}
        requiredMark={customizeRequiredNoStarMark}
        onFinish={handlerBindEmail}
      >
        <Form.Item
          name={authType ? 'phone' : 'email'}
          label={authType ? '手机号码' : '邮箱地址'}
          rules={[
            {
              required: true,
              message: authType ? '请输入手机号码' : '请输入邮箱地址',
            },
            {
              validator(_, value) {
                if (!value) return Promise.resolve();
                if (authType) {
                  return isValidPhone(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('请输入正确的手机号码!'));
                } else {
                  return isValidEmail(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('请输入正确的邮箱地址!'));
                }
              },
            },
          ]}
        >
          <Input placeholder={authType ? '请输入手机号码' : '请输入邮箱地址'} />
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
            <Input rootClassName={styles.input} placeholder="请输入验证码" />
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
            绑定
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SettingEmail;
