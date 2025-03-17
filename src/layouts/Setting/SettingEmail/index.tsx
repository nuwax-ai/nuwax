import { VERIFICATION_CODE_LEN } from '@/constants/common.constants';
import useCountDown from '@/hooks/useCountDown';
import { apiBindEmail, apiSendCode } from '@/services/account';
import { SendCodeEnum } from '@/types/enums/login';
import type { BindEmailParams } from '@/types/interfaces/login';
import { isValidEmail } from '@/utils/common';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { Button, Form, Input, message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 邮箱绑定
 */
const SettingEmail: React.FC = () => {
  const { countDown, setCountDown, onClearTimer, handleCount } = useCountDown();
  const [form] = Form.useForm<BindEmailParams>();

  // 绑定邮箱
  const { run, loading } = useRequest(apiBindEmail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('绑定成功');
      form.resetFields();
      setCountDown(0);
      onClearTimer();
    },
    onError: () => {
      setCountDown(0);
      onClearTimer();
    },
  });

  // 绑定事件
  const handlerBindEmail = (values) => {
    run(values);
  };

  // 发送邮箱验证码
  const { run: runSendCode } = useRequest(apiSendCode, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('验证码已发送');
    },
  });

  const handleSendCode = async () => {
    form.validateFields(['email']).then(({ email }) => {
      handleCount();
      runSendCode({
        type: SendCodeEnum.BIND_EMAIL,
        email,
      });
    });
  };

  return (
    <div className={cx(styles.container)}>
      <h3>邮箱绑定</h3>
      <Form
        layout="vertical"
        form={form}
        rootClassName={cx(styles.form)}
        requiredMark={customizeRequiredNoStarMark}
        onFinish={handlerBindEmail}
      >
        <Form.Item
          name="email"
          label="邮箱地址"
          rules={[
            { required: true, message: '请输入邮箱地址' },
            {
              validator(_, value) {
                if (!value || isValidEmail(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入正确的邮箱地址!'));
              },
            },
          ]}
        >
          <Input placeholder="请输入邮箱地址" />
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
              placeholder="请输入邮箱验证码"
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
            绑定
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SettingEmail;
