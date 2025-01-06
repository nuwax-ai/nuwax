import { ICON_LOGO } from '@/constants/images.constants';
import { LoginTypeEnum } from '@/types/enums/login';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, Modal, Select } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const { confirm } = Modal;

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<LoginTypeEnum>(
    LoginTypeEnum.Password,
  );
  const [checked, setChecked] = useState(false);
  const [form] = Form.useForm();
  const onFinish = (values) => {
    console.log(values);
    if (!checked) {
      confirm({
        title: '服务协议及隐私保护',
        icon: <ExclamationCircleFilled />,
        content: (
          <div>
            已阅读并同意以下协议：
            <span style={{ color: '#0256FF' }}>女娲使用协议、女娲隐私协议</span>
          </div>
        ),
        okText: '同意',
        cancelText: '不同意',
        onOk() {
          setChecked(true);
        },
      });
      return;
    }
    if (loginType === LoginTypeEnum.Password) {
      const { username, password, areaCode } = values;
      // todo 登录操作
      return;
    }
    const { username, areaCode } = values;
    history.push('/verify-code', {
      phoneNumber: username,
      areaCode,
    });
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
        form={form}
        initialValues={{
          areaCode: '028',
        }}
        rootClassName={cx(styles.form, 'flex', 'flex-col')}
        name="login"
        onFinish={onFinish}
      >
        <Form.Item>
          <h3 className={cx(styles.title)}>欢迎使用女娲智能应用平台</h3>
        </Form.Item>
        <Form.Item className={styles['select-box']} name="areaCode">
          <Select
            rootClassName={cx(styles.select)}
            variant="borderless"
            options={[
              { value: '028', label: '+86' },
              { value: 'lucy', label: 'Lucy' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入手机号码!' }]}
        >
          <Input
            rootClassName={cx(styles.input, styles.username)}
            placeholder="请输入手机号"
          />
        </Form.Item>
        <Form.Item className={'flex-1'}>
          {loginType === LoginTypeEnum.Password ? (
            <>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input
                  rootClassName={styles.input}
                  type="password"
                  placeholder="请输入密码"
                />
              </Form.Item>
              <Form.Item className={cx(styles.login)}>
                <Button
                  className={cx(styles.btn)}
                  block
                  type="primary"
                  htmlType="submit"
                >
                  登录
                </Button>
              </Form.Item>
              <Form.Item className={cx(styles['code-login'])}>
                <span
                  className={'cursor-pointer'}
                  onClick={() => setLoginType(LoginTypeEnum.Code)}
                >
                  验证码登录/注册
                </span>
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item className={cx(styles.login)}>
                <Button
                  className={cx(styles.btn)}
                  block
                  type="primary"
                  htmlType="submit"
                >
                  下一步
                </Button>
              </Form.Item>
              <Form.Item className={cx(styles['code-login'])}>
                <span
                  className={'cursor-pointer'}
                  onClick={() => setLoginType(LoginTypeEnum.Password)}
                >
                  密码登录
                </span>
              </Form.Item>
            </>
          )}
        </Form.Item>
        <Form.Item noStyle>
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          >
            已阅读并同意协议：
            <span className={cx(styles.tips)}>女娲使用协议、女娲隐私政策</span>
          </Checkbox>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
