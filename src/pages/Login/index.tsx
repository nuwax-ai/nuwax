import { ACCESS_TOKEN, EXPIRE_DATE, PHONE } from '@/constants/home.constants';
import { apiLogin } from '@/services/account';
import { LoginTypeEnum } from '@/types/enums/login';
import type { ILoginResult, LoginFieldType } from '@/types/interfaces/login';
import {
  isValidEmail,
  isValidPhone,
  isWeakNumber,
  validatePassword,
} from '@/utils/common';
import { DownOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  ConfigProvider,
  Form,
  FormProps,
  Input,
  Modal,
  Segmented,
  theme,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useRequest, useSearchParams } from 'umi';
import BasicLayout from './BasicLayout';
import styles from './index.less';
import SiteProtocol from './SiteProtocol';

const { Title } = Typography;

type SegmentedItemType = { label: string; value: string };

const cx = classNames.bind(styles);

const { confirm } = Modal;

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loginType, setLoginType] = useState<LoginTypeEnum>(
    LoginTypeEnum.Password,
  );
  const loginTypeRef = useRef<LoginTypeEnum>(LoginTypeEnum.Password);
  const [checked, setChecked] = useState<boolean>(true);
  const [form] = Form.useForm();
  const { loadEnd, tenantConfigInfo, runTenantConfig } =
    useModel('tenantConfigInfo');

  const { run, loading } = useRequest(apiLogin, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ILoginResult, params: LoginFieldType[]) => {
      const { expireDate, token, redirect: responseRedirectUrl } = result;
      localStorage.setItem(ACCESS_TOKEN, token);
      localStorage.setItem(EXPIRE_DATE, expireDate);
      localStorage.setItem(PHONE, params[0].phoneOrEmail);
      const redirect = decodeURIComponent(searchParams.get('redirect') || '');
      console.info('login:redirect', redirect, responseRedirectUrl);
      if (isWeakNumber(redirect)) {
        history.go(Number(redirect));
      } else if (responseRedirectUrl && responseRedirectUrl.includes('://')) {
        // 注意没有考虑 "//" url 的情况
        window.location.href = responseRedirectUrl;
      } else if (redirect) {
        history.replace(redirect);
      } else {
        history.replace('/');
      }
    },
  });

  useEffect(() => {
    // 租户配置信息查询接口
    runTenantConfig();
  }, []);

  // 表单验证规则 - 抽取为常量避免重复
  const getPhoneOrEmailRules = () => {
    const isEmailAuth = tenantConfigInfo?.authType === 3;
    return [
      {
        required: true,
        message: isEmailAuth ? '请输入邮箱地址!' : '请输入手机号码!',
      },
      {
        validator(_: any, value: string) {
          if (!value) return Promise.resolve();
          if (isEmailAuth) {
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
    ];
  };

  const passwordRules = [
    { required: true, message: '请输入6位以上密码!' },
    {
      validator(_: any, value: string) {
        if (!value || validatePassword(value)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('请输入正确格式的密码!'));
      },
    },
  ];

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

  // 使用 useCallback 包装 handlerSuccess，确保捕获最新的 loginType 值
  const handlerSuccess = (captchaVerifyParam: string = '') => {
    // 每次调用时都使用最新的 loginType 值
    if (loginTypeRef.current === LoginTypeEnum.Password) {
      handlerPasswordLogin(captchaVerifyParam);
    } else {
      handlerCodeLogin(captchaVerifyParam);
    }
  }; // loginType 作为依赖项

  const doLogin = () => {
    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    // 只有同时满足三个条件才启用验证码：场景ID存在、身份标存在、开启验证码
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );
    // 如果需要阿里云验证码，则点击按钮触发验证码
    if (needAliyunCaptcha) {
      document.getElementById('aliyun-captcha-login')?.click();
    } else {
      //不需要阿里云验证码，直接执行登录/验证码逻辑
      handlerSuccess();
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
          doLogin();
        },
      });
    }
    doLogin();
  };

  const handleChangeType = (value: string) => {
    setLoginType(Number(value));
    loginTypeRef.current = Number(value);
  };
  const { token } = theme.useToken();
  // const selectBefore = (
  //   <Form.Item name="areaCode" noStyle>
  //     <Select style={{ width: 80 }}>
  //       <Select.Option value="86">+86</Select.Option>
  //     </Select>
  //   </Form.Item>
  // );
  // 分段器切换登录方式
  const options: SegmentedItemType[] = [
    { label: '密码登录', value: LoginTypeEnum.Password + '' },
    { label: '手机号登录', value: LoginTypeEnum.Code + '' },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {},
        components: {
          Segmented: {
            itemSelectedColor: token.colorPrimary,
            itemHoverBg: 'transparent',
            itemActiveBg: 'transparent',
            trackBg: token.colorFillTertiary,
            itemColor: token.colorTextTertiary,
            itemHoverColor: token.colorPrimary,
          },
        },
      }}
    >
      <BasicLayout>
        <div>
          {loadEnd && (
            <div className={cx(styles['login-form-box'])}>
              {tenantConfigInfo?.authType !== 3 && (
                <Segmented
                  options={options}
                  value={loginType + ''}
                  onChange={handleChangeType}
                  size="large"
                  block
                />
              )}
              <Form
                form={form}
                validateTrigger="onBlur"
                initialValues={{ areaCode: '86' }}
                rootClassName={cx(styles.form, 'flex', 'flex-col')}
                name="login"
                onFinish={onFinish}
              >
                <Form.Item>
                  <Title level={2} style={{ marginTop: 72 }}>
                    {`欢迎使用${tenantConfigInfo?.siteName || ''}`}
                  </Title>
                </Form.Item>
                <Form.Item name="phoneOrEmail" rules={getPhoneOrEmailRules()}>
                  {tenantConfigInfo?.authType === 3 ? (
                    <Input placeholder="请输入邮箱地址" size={'large'} />
                  ) : (
                    <Input
                      placeholder="请输入手机号"
                      addonBefore={
                        <div className={cx(styles.icon, 'flex', 'flex-col')}>
                          +86
                          <DownOutlined
                            style={{ marginLeft: 10, fontSize: '14px' }}
                          />
                        </div>
                      }
                      size={'large'}
                    />
                  )}
                </Form.Item>
                {loginType === LoginTypeEnum.Password && (
                  <Form.Item name="password" rules={passwordRules}>
                    <Input
                      size={'large'}
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
                    size="large"
                    loading={loading}
                  >
                    {loginType === LoginTypeEnum.Password ? '登录' : '下一步'}
                  </Button>
                </Form.Item>
                <Form.Item
                  className={cx('mb-16')}
                  style={{ marginTop: '-10px' }}
                >
                  <Checkbox
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  >
                    <SiteProtocol />
                  </Checkbox>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </BasicLayout>
    </ConfigProvider>
  );
};

export default Login;
