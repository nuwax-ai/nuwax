import logo from '@/assets/images/logo.png';
import { ACCESS_TOKEN, EXPIRE_DATE, PHONE } from '@/constants/home.constants';
import { apiLogin } from '@/services/account';
import { LoginTypeEnum } from '@/types/enums/login';
import type { ILoginResult, LoginFieldType } from '@/types/interfaces/login';
import { isValidPhone, validatePassword } from '@/utils/common';
import { ExclamationCircleFilled } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  FormProps,
  Input,
  message,
  Modal,
  Select,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel, useNavigate, useRequest } from 'umi';
import styles from './index.less';
import ModalSliderCaptcha from './ModalSliderCaptcha';

const cx = classNames.bind(styles);

const { confirm } = Modal;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [loginType, setLoginType] = useState<LoginTypeEnum>(
    LoginTypeEnum.Password,
  );
  const [checked, setChecked] = useState<boolean>(true);
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState<LoginFieldType>();

  const { tenantConfigInfo, runTenantConfig } = useModel('tenantConfigInfo');

  const { run } = useRequest(apiLogin, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ILoginResult, params: LoginFieldType[]) => {
      const { expireDate, token } = result;
      localStorage.setItem(ACCESS_TOKEN, token);
      localStorage.setItem(EXPIRE_DATE, expireDate);
      localStorage.setItem(PHONE, params[0].phone);
      navigate('/', { replace: true });
      message.success('登录成功');
    },
  });

  useEffect(() => {
    runTenantConfig();
  }, []);

  // 账号密码登录
  const handlerPasswordLogin = () => {
    const { phone, areaCode, password } = formValues;
    run({ phone, areaCode, password });
  };

  // 验证码登录
  const handlerCodeLogin = () => {
    const { phone, areaCode } = formValues;
    history.push('/verify-code', {
      phone,
      areaCode,
    });
  };

  const handlerSuccess = () => {
    setOpen(false);
    if (loginType === LoginTypeEnum.Password) {
      handlerPasswordLogin();
    } else {
      handlerCodeLogin();
    }
  };

  const onFinish: FormProps<LoginFieldType>['onFinish'] = (values) => {
    setFormValues(values);
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
          setOpen(true);
        },
      });
    } else {
      setOpen(true);
    }
  };

  const handlerLink = () => {
    const type =
      loginType === LoginTypeEnum.Password
        ? LoginTypeEnum.Code
        : LoginTypeEnum.Password;
    setLoginType(type);
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
      <img
        src={tenantConfigInfo?.siteLogo || (logo as string)}
        className={cx(styles.logo)}
        alt=""
      />
      <Form
        form={form}
        validateTrigger="onBlur"
        initialValues={{
          areaCode: '86',
        }}
        rootClassName={cx(styles.form, 'flex', 'flex-col')}
        name="login"
        onFinish={onFinish}
      >
        <Form.Item>
          <h3
            className={cx(styles.title)}
          >{`欢迎使用${tenantConfigInfo?.siteName || ''}`}</h3>
        </Form.Item>
        <Form.Item className={styles['select-box']} name="areaCode">
          <Select
            rootClassName={cx(styles.select)}
            variant="borderless"
            options={[{ value: '86', label: '+86' }]}
          />
        </Form.Item>
        <Form.Item
          name="phone"
          rules={[
            { required: true, message: '请输入手机号码!' },
            {
              validator(_, value) {
                if (!value || isValidPhone(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入正确的手机号码!'));
              },
            },
          ]}
        >
          <Input
            rootClassName={cx(styles.input, styles.username)}
            placeholder="请输入手机号"
          />
        </Form.Item>
        <Form.Item className={'flex-1'}>
          {loginType === LoginTypeEnum.Password && (
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
              <Input
                rootClassName={styles.input}
                type="password"
                autoComplete="off"
                placeholder="请输入6位以上密码"
              />
            </Form.Item>
          )}
          <Form.Item className={cx(styles.login)}>
            <Button
              className={cx(styles.btn)}
              block
              type="primary"
              htmlType="submit"
            >
              {loginType === LoginTypeEnum.Password ? '登录' : '下一步'}
            </Button>
          </Form.Item>
          <Form.Item className={cx(styles['code-login'])}>
            <span className={'cursor-pointer'} onClick={handlerLink}>
              {loginType === LoginTypeEnum.Password
                ? '验证码登录/注册'
                : '密码登录'}
            </span>
          </Form.Item>
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
      <ModalSliderCaptcha
        open={open}
        onCancel={setOpen}
        onSuccess={handlerSuccess}
      />
    </div>
  );
};

export default Login;
