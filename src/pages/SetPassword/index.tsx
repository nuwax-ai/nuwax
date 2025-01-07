import { ICON_LOGO } from '@/constants/images.constants';
import type { SetPasswordFieldType } from '@/types/interfaces/login';
import { Button, Form, FormProps, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const SetPassword: React.FC = () => {
  // const { run, loading } = useRequest(apiHome, {
  //   manual: true,
  //   debounceWait: 300,
  //   onSuccess: (res: RequestResponse<T>) => {
  //     const { data } = res;
  //     if (data) {
  //     }
  //   },
  // });

  const onFinish: FormProps<SetPasswordFieldType>['onFinish'] = (values) => {
    console.log(values);
    history.push('/');
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
      <ICON_LOGO className={cx(styles.logo)} />
      <Form
        rootClassName={cx(styles.form, 'flex', 'flex-col')}
        name="login"
        onFinish={onFinish}
      >
        <Form.Item>
          <h3 className={cx(styles.title)}>密码设置</h3>
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input rootClassName={cx(styles.input)} placeholder="请输入密码" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          rules={[{ required: true, message: '请再次输入密码!' }]}
        >
          <Input
            rootClassName={cx(styles.input)}
            placeholder="请再次输入密码"
          />
        </Form.Item>
        <Form.Item className={cx(styles.login)}>
          <Button
            className={cx(styles.btn)}
            block
            type="primary"
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
