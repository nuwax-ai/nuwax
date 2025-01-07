import useCountDown from '@/hooks/useCountDown';
import { Button, Form, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SettingEmail: React.FC = () => {
  const { countDown, handleCount } = useCountDown();
  // const { run, loading } = useRequest(apiHome, {
  //   manual: true,
  //   debounceWait: 300,
  //   onSuccess: (res: RequestResponse<T>) => {
  //     const { data } = res;
  //     if (data) {
  //     }
  //   },
  // });

  const handlerBindEmail = (values) => {
    console.log(values);
  };

  return (
    <div className={cx(styles.container)}>
      <h3>邮箱绑定</h3>
      <Form
        layout="vertical"
        rootClassName={cx(styles.form)}
        onFinish={handlerBindEmail}
      >
        <Form.Item
          name="username"
          className={cx(styles.label)}
          label="邮箱地址"
        >
          <Input placeholder="请输入邮箱地址" />
        </Form.Item>
        <Form.Item name="code" className={cx(styles.label)} label="验证码">
          <div className={cx('flex', 'content-between')}>
            <Input
              rootClassName={styles.input}
              placeholder="请输入邮箱验证码"
            />
            <Button
              rootClassName={styles.btn}
              disabled={countDown > 0}
              type="primary"
              onClick={handleCount}
            >
              {countDown > 0 ? `${countDown}s` : '发送验证码'}
            </Button>
          </div>
        </Form.Item>
        <Form.Item>
          <Button block type="primary" htmlType="submit">
            绑定
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SettingEmail;
