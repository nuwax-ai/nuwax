import AliyunCaptcha from '@/components/AliyunCaptcha';
import ConditionRender from '@/components/ConditionRender';
import SiteFooter from '@/components/SiteFooter';
import { ACCESS_TOKEN, EXPIRE_DATE, PHONE } from '@/constants/home.constants';
import { apiLogin } from '@/services/account';
import { LoginTypeEnum } from '@/types/enums/login';
import type { ILoginResult, LoginFieldType } from '@/types/interfaces/login';
import { isValidEmail, isValidPhone, validatePassword } from '@/utils/common';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Checkbox, Form, FormProps, Input, Modal, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useNavigate, useRequest } from 'umi';
import styles from './index.less';
import SiteProtocol from './SiteProtocol';

const cx = classNames.bind(styles);

const { confirm } = Modal;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<LoginTypeEnum>(LoginTypeEnum.Code);
  const [checked, setChecked] = useState<boolean>(true);
  const [form] = Form.useForm();
  const [needAliyuanCaptcha, setNeedAliyuanCaptcha] = useState<boolean>(false);
  const { tenantConfigInfo, runTenantConfig } = useModel('tenantConfigInfo');
  // 使用 useRef 存储最新的 submittable 值
  const submittableRef = useRef<boolean>(false);
  const captchaVerifyParamRef = useRef<string>('');

  // Watch all values
  const values = Form.useWatch([], form);

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => {
        submittableRef.current = true;
      })
      .catch(() => {
        submittableRef.current = false;
      });
  }, [form, values]);

  const { run } = useRequest(apiLogin, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ILoginResult, params: LoginFieldType[]) => {
      const { expireDate, token } = result;
      localStorage.setItem(ACCESS_TOKEN, token);
      localStorage.setItem(EXPIRE_DATE, expireDate);
      localStorage.setItem(PHONE, params[0].phoneOrEmail);
      navigate('/', { replace: true });
      //message.success('登录成功');
    },
  });

  useEffect(() => {
    // 租户配置信息查询接口
    runTenantConfig();
  }, []);

  // 账号密码登录
  const handlerPasswordLogin = (captchaVerifyParam: string) => {
    // 为了避免 formValues 为 undefined 的情况，添加空值检查
    const { phoneOrEmail, areaCode, password } = form.getFieldsValue() || {};
    run({ phoneOrEmail, areaCode, password, captchaVerifyParam });
  };

  // 验证码登录
  const handlerCodeLogin = (captchaVerifyParam: string) => {
    // 为了避免 formValues 为 undefined 的情况，添加空值检查
    const { phoneOrEmail, areaCode } = form.getFieldsValue() || {};
    history.push('/verify-code', {
      phoneOrEmail,
      areaCode,
      authType: tenantConfigInfo.authType,
      captchaVerifyParam,
    });
  };

  const handlerSuccess = () => {
    // 使用 ref 中存储的最新值，而不是闭包中捕获的旧值
    if (!submittableRef.current || !checked) {
      console.log('submit condition not met:', {
        submittable: submittableRef.current,
        checked,
      });
      return;
    }
    console.log(
      'handlerSuccess running with submittable:',
      submittableRef.current,
    );
    const captchaVerifyParam = captchaVerifyParamRef.current;
    if (loginType === LoginTypeEnum.Password) {
      handlerPasswordLogin(captchaVerifyParam);
    } else {
      handlerCodeLogin(captchaVerifyParam);
    }
  };

  const onFinish: FormProps<LoginFieldType>['onFinish'] = () => {
    if (!checked) {
      return confirm({
        title: '服务协议及隐私保护',
        icon: <ExclamationCircleFilled />,
        content: <SiteProtocol />,
        okText: '同意',
        cancelText: '不同意',
        onOk() {
          setChecked(true);
          handlerSuccess();
        },
      });
    }
    if (!needAliyuanCaptcha) {
      handlerSuccess();
    }
  };

  const handlerLink = () => {
    const type =
      loginType === LoginTypeEnum.Password
        ? LoginTypeEnum.Code
        : LoginTypeEnum.Password;
    setLoginType(type);
  };
  const captchaButtonId = 'aliyun-captcha-button';
  const selectBefore = (
    <Form.Item name="areaCode" noStyle>
      <Select style={{ width: 80 }}>
        <Select.Option value="86">+86</Select.Option>
      </Select>
    </Form.Item>
  );
  useEffect(() => {
    if (
      tenantConfigInfo &&
      tenantConfigInfo.captchaSceneId !== '' &&
      tenantConfigInfo.captchaPrefix !== '' &&
      tenantConfigInfo.openCaptcha
    ) {
      setNeedAliyuanCaptcha(true);
    } else {
      setNeedAliyuanCaptcha(false);
    }
  }, [tenantConfigInfo]);

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
          <h3 className={cx(styles.title)}>{`欢迎使用${
            tenantConfigInfo?.siteName || ''
          }`}</h3>
        </Form.Item>
        <Form.Item
          name="phoneOrEmail"
          rules={[
            {
              required: true,
              message:
                tenantConfigInfo && tenantConfigInfo.authType === 3
                  ? '请输入邮箱验证码!'
                  : '请输入手机号码!',
            },
            {
              validator(_, value) {
                if (!value) return Promise.resolve();
                if (tenantConfigInfo && tenantConfigInfo.authType === 3) {
                  return isValidEmail(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('请输入正确的邮箱账号!'));
                } else {
                  return isValidPhone(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('请输入正确的手机号码!'));
                }
              },
            },
          ]}
        >
          {tenantConfigInfo && tenantConfigInfo.authType === 3 ? (
            <Input placeholder="请输入邮箱号码" size={'large'} />
          ) : (
            <Input
              placeholder="请输入手机号"
              addonBefore={selectBefore}
              size={'large'}
            />
          )}
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
                size={'large'}
                type="password"
                autoComplete="off"
                placeholder="请输入6位以上密码"
              />
            </Form.Item>
          )}
          <Form.Item className={cx('mb-16')}>
            <Checkbox
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            >
              <SiteProtocol />
            </Checkbox>
          </Form.Item>
          <Form.Item className={cx(styles.login)}>
            <Button
              className={cx(styles.btn)}
              block
              type="primary"
              htmlType="submit"
              id="aliyun-captcha-button"
            >
              {loginType === LoginTypeEnum.Password ? '登录' : '下一步'}
            </Button>
          </Form.Item>
          <Form.Item className={cx(styles['code-login'])}>
            <a className={'cursor-pointer'} onClick={handlerLink}>
              {loginType === LoginTypeEnum.Password
                ? '验证码登录/注册'
                : '密码登录'}
            </a>
          </Form.Item>
        </Form.Item>
      </Form>
      {needAliyuanCaptcha && (
        <AliyunCaptcha
          config={tenantConfigInfo}
          doAction={(captchaVerifyParam) => {
            captchaVerifyParamRef.current = captchaVerifyParam;
            handlerSuccess();
          }}
          elementId={captchaButtonId}
        />
      )}
      {/* <ModalSliderCaptcha
        open={open}
        onCancel={setOpen}
        onSuccess={handlerSuccess}
      /> */}
      <SiteFooter />
    </div>
  );
};

export default Login;
