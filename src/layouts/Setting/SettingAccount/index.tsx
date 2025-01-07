import type { SaveNickname, SaveUsername } from '@/types/interfaces/setting';
import type { FormProps } from 'antd';
import { Button, Form, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SettingAccount: React.FC = () => {
  const onSaveUsername: FormProps<SaveUsername>['onFinish'] = (values) => {
    console.log(values);
  };

  const onSaveNickname: FormProps<SaveNickname>['onFinish'] = (values) => {
    console.log(values);
  };

  return (
    <div className={cx(styles.container)}>
      <h3>账号</h3>
      <div className={cx(styles.avatar)} />
      <Form layout="vertical" onFinish={onSaveUsername}>
        <Form.Item name="username" className={cx(styles.label)} label="用户名">
          <div>
            <Input
              rootClassName={cx(styles.input)}
              placeholder="请输入用户名"
            />
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form.Item>
      </Form>
      <Form layout="vertical" onFinish={onSaveNickname}>
        <Form.Item
          name="nickname"
          className={cx(styles.label)}
          label="用户昵称"
        >
          <div>
            <Input
              rootClassName={cx(styles.input)}
              placeholder="请输入用户昵称"
            />
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form.Item>
      </Form>
      <h4 className={cx(styles.name)}>手机号码</h4>
      <span className={cx(styles.text, styles.phone)}>156xxxxx</span>
      <h4 className={cx(styles.name)}>邮箱地址</h4>
      <span className={cx(styles.text)}>待绑定</span>
    </div>
  );
};

export default SettingAccount;
