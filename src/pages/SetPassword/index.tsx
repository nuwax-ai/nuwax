import ConditionRender from '@/components/ConditionRender';
import { apiSetPassword } from '@/services/account';
import type { SetPasswordFieldType } from '@/types/interfaces/login';
import { validatePassword } from '@/utils/common';
import { Button, Form, FormProps, Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useModel, useNavigate, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 设置密码
 */
const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { tenantConfigInfo, setTitle } = useModel('tenantConfigInfo');

  const { run, loading } = useRequest(apiSetPassword, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      navigate('/', { replace: true });
    },
  });

  useEffect(() => {
    // 设置页面title
    setTitle();
  }, []);

  const onFinish: FormProps<SetPasswordFieldType>['onFinish'] = (values) => {
    const { password } = values;
    run({ password });
  };

  return (
    <div
      className={cx(
        styles.container,
        'h-full',
        'flex',
        'content-center',
        'items-center',
      )}
    >
      <ConditionRender condition={!!tenantConfigInfo?.siteLogo}>
        <img
          src={tenantConfigInfo?.siteLogo}
          className={cx(styles.logo)}
          alt=""
        />
      </ConditionRender>
      <Form
        rootClassName={cx(styles.form, 'flex', 'flex-col')}
        name="login"
        validateTrigger="onBlur"
        onFinish={onFinish}
      >
        <Form.Item>
          <h3 className={cx(styles.title)}>密码设置</h3>
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入6位以上密码!' },
            {
              validator(_, value) {
                if (!value || validatePassword(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入正确格式的密码!'));
              },
            },
          ]}
        >
          <Input.Password
            rootClassName={cx(styles.input)}
            placeholder="请输入6位以上密码"
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          rules={[
            {
              required: true,
              message: '请再次输入密码!',
            },
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
          <Input.Password
            rootClassName={cx(styles.input)}
            placeholder="请再次输入密码"
          />
        </Form.Item>
        <Form.Item className={cx(styles.login)}>
          <Button
            className={cx(styles.btn)}
            block
            type="primary"
            loading={loading}
            htmlType="submit"
          >
            确定
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SetPassword;
