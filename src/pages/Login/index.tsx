import AliyunCaptcha, { AliyunCaptchaRef } from '@/components/AliyunCaptcha';
import SiteFooter from '@/components/SiteFooter';
import { ACCESS_TOKEN, EXPIRE_DATE, PHONE } from '@/constants/home.constants';
import useRequestPromiseBridge from '@/hooks/useRequestPromiseBridge';
import { apiLogin } from '@/services/account';
import { dict, initI18n, syncLangFromUserInfo } from '@/services/i18nRuntime';
import { unifiedThemeService } from '@/services/unifiedThemeService';
import { UserService } from '@/services/userService';
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
  Tooltip,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useSearchParams } from 'umi';
import BasicLayout from './BasicLayout';
import styles from './index.less';
import LoginLangSwitcher from './LoginLangSwitcher';
import SiteProtocol from './SiteProtocol';

const { Title } = Typography;

type SegmentedItemType = { label: React.ReactNode; value: string };

const cx = classNames.bind(styles);

const { confirm } = Modal;

/**
 * 智能溢出检测 Tooltip 组件
 * 只有当文本宽度不足显示省略号时，鼠标移入才显示 Tooltip
 */
const EllipsisTooltip: React.FC<{ title: string; children: string }> = ({
  title,
  children,
}) => {
  const [isOverflow, setIsOverflow] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const checkOverflow = () => {
    const el = textRef.current;
    if (el) {
      setIsOverflow(el.scrollWidth > el.offsetWidth);
    }
  };

  return (
    <Tooltip
      title={isOverflow ? title : null}
      color="#fff"
      styles={{ body: { color: '#000' } }}
    >
      <div
        ref={textRef}
        className={styles['segmented-item-text']}
        onMouseEnter={checkOverflow}
      >
        {children}
      </div>
    </Tooltip>
  );
};

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loginType, setLoginType] = useState<LoginTypeEnum>(
    LoginTypeEnum.Password,
  );
  const loginTypeRef = useRef<LoginTypeEnum>(LoginTypeEnum.Password);
  /**
   * 防止快速重复点击导致重复触发验证码弹窗。
   * 在 captchaVerifyCallback 调用时释放，或由 popup watcher 在弹窗关闭后释放。
   */
  const loginTriggerLockRef = useRef<boolean>(false);
  const lastLoginTriggerAtRef = useRef<number>(0);
  /**
   * 防止 SDK 多次调用 captchaVerifyCallback 导致并发登录请求。
   */
  const isVerifyingRef = useRef<boolean>(false);
  /** 检测到 SDK 自动验证（deviceToken 格式）时跳过验证码校验 */
  const captchaFallbackRef = useRef<boolean>(false);
  /**
   * 监听验证码弹窗状态：弹窗关闭且未进入提交态时释放登录锁。
   */
  const captchaPopupWatcherTimerRef = useRef<number | null>(null);
  const captchaDelayTimerRef = useRef<number | null>(null);
  const captchaRef = useRef<AliyunCaptchaRef>(null);
  const [checked, setChecked] = useState<boolean>(true);
  const [form] = Form.useForm();
  const { loadEnd, tenantConfigInfo, runTenantConfig } =
    useModel('tenantConfigInfo');
  const { loadMenus } = useModel('menuModel');

  const { runWithPromise: runPasswordLogin, loading } = useRequestPromiseBridge(
    apiLogin,
    {
      manual: true,
      normalizeUnknownError: true,
      debounceInterval: 300,
      onSuccess: async (result: ILoginResult, params: LoginFieldType[]) => {
        const { expireDate, token, redirect: responseRedirectUrl } = result;
        localStorage.setItem(ACCESS_TOKEN, token);
        localStorage.setItem(EXPIRE_DATE, expireDate);
        localStorage.setItem(PHONE, params[0].phoneOrEmail);
        try {
          const latestUserInfo = await UserService.refreshUserInfo();
          await syncLangFromUserInfo(latestUserInfo);
        } catch (error) {
          console.error('[Login] Sync language after login failed:', error);
        }
        await loadMenus(true);
        await initI18n(true);
        const redirect = decodeURIComponent(searchParams.get('redirect') || '');
        if (isWeakNumber(redirect)) {
          history.go(Number(redirect));
        } else if (responseRedirectUrl && responseRedirectUrl.includes('://')) {
          window.location.href = responseRedirectUrl;
        } else if (redirect) {
          history.replace(redirect);
        } else {
          history.replace('/');
        }
      },
      onError: (error: any) => {
        console.error('[Login] Request Error:', error);
        // SDK 的 refresh() 在 deviceToken（无弹出 DOM）模式下会崩溃并触发新 callback 形成死循环
      },
    },
  );

  const clearCaptchaPopupWatcher = () => {
    if (captchaPopupWatcherTimerRef.current !== null) {
      window.clearInterval(captchaPopupWatcherTimerRef.current);
      captchaPopupWatcherTimerRef.current = null;
    }
  };

  const startCaptchaPopupWatcher = () => {
    clearCaptchaPopupWatcher();
    const startedAt = Date.now();
    captchaPopupWatcherTimerRef.current = window.setInterval(() => {
      const hasCaptchaPopup =
        !!document.getElementById('aliyunCaptcha-window-popup') ||
        !!document.getElementById('aliyunCaptcha-mask');

      if (!hasCaptchaPopup) {
        loginTriggerLockRef.current = false;
        clearCaptchaPopupWatcher();
        return;
      }

      // 极端兜底：防止异常情况下 watcher 长驻
      if (Date.now() - startedAt > 2 * 60 * 1000) {
        loginTriggerLockRef.current = false;
        clearCaptchaPopupWatcher();
      }
    }, 500);
  };

  useEffect(() => {
    unifiedThemeService.clearUserThemeConfig();
    runTenantConfig();
  }, []);

  useEffect(() => {
    return () => {
      clearCaptchaPopupWatcher();
      if (captchaDelayTimerRef.current !== null) {
        window.clearTimeout(captchaDelayTimerRef.current);
        captchaDelayTimerRef.current = null;
      }
    };
  }, []);

  const getPhoneOrEmailRules = () => {
    const isEmailAuth = tenantConfigInfo?.authType === 3;
    return [
      {
        required: true,
        message: isEmailAuth
          ? dict('PC.Pages.Login.inputEmailRequired')
          : dict('PC.Pages.Login.inputPhoneRequired'),
      },
      {
        validator(_: any, value: string) {
          if (!value) return Promise.resolve();
          if (isEmailAuth) {
            return isValidEmail(value)
              ? Promise.resolve()
              : Promise.reject(new Error(dict('PC.Pages.Login.invalidEmail')));
          } else {
            return isValidPhone(value)
              ? Promise.resolve()
              : Promise.reject(new Error(dict('PC.Pages.Login.invalidPhone')));
          }
        },
      },
    ];
  };

  const passwordRules = [
    {
      required: true,
      message: dict('PC.Pages.Login.passwordRequired'),
    },
    {
      validator(_: any, value: string) {
        if (!value || validatePassword(value)) {
          return Promise.resolve();
        }
        return Promise.reject(
          new Error(dict('PC.Pages.Login.invalidPassword')),
        );
      },
    },
  ];

  /**
   * 密码登录：在 captchaVerifyCallback 内调用，直接发起登录请求。
   *
   * 参考阿里云官方 demo，captchaVerifyCallback 应始终返回
   * { captchaResult: true, bizResult: true }，避免 SDK 因 bizResult=false
   * 而自动刷新验证码（导致登录后仍产生新的校验码请求）。
   * 业务成功/失败通过 onSuccess/onError 回调中的 UI 反馈（message、导航等）处理。
   */
  const handlerPasswordLogin = async (
    captchaVerifyParam: string,
  ): Promise<{ captchaResult: boolean; bizResult: boolean }> => {
    console.log(
      '[Login handlerPasswordLogin] raw param length:',
      captchaVerifyParam?.length,
      'preview:',
      captchaVerifyParam?.substring(0, 100),
    );
    const {
      phoneOrEmail,
      areaCode = '86',
      password,
    } = form.getFieldsValue() || {};
    const normalizedCaptchaParam =
      typeof captchaVerifyParam === 'string' ? captchaVerifyParam.trim() : '';

    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha &&
      !captchaFallbackRef.current
    );

    if (needAliyunCaptcha && !normalizedCaptchaParam) {
      console.warn('[Login] password-login-blocked-empty-captcha', {
        account: phoneOrEmail,
      });
      return { captchaResult: false, bizResult: true };
    }

    try {
      await runPasswordLogin({
        phoneOrEmail,
        areaCode,
        password,
        captchaVerifyParam: normalizedCaptchaParam,
      });
      // onSuccess 处理导航，登录成功
      return { captchaResult: true, bizResult: true };
    } catch {
      // 登录失败由 onError 回调处理 UI 反馈，不通过 bizResult 通知 SDK
      return { captchaResult: true, bizResult: true };
    }
  };

  /**
   * 验证码登录：获取 captchaVerifyParam 后跳转至验证码输入页，
   * 由下一页真正消费 token。
   */
  const handlerCodeLogin = async (
    captchaVerifyParam: string,
  ): Promise<{ captchaResult: boolean; bizResult: boolean }> => {
    const { phoneOrEmail, areaCode = '86' } = form.getFieldsValue() || {};
    const normalizedCaptchaParam =
      typeof captchaVerifyParam === 'string' ? captchaVerifyParam.trim() : '';

    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );

    if (needAliyunCaptcha && !normalizedCaptchaParam) {
      console.warn('[Login] code-login-blocked-empty-captcha', {
        account: phoneOrEmail,
      });
      return { captchaResult: false, bizResult: false };
    }

    const redirect = searchParams.get('redirect');
    const path = redirect
      ? `/verify-code?redirect=${encodeURIComponent(redirect)}`
      : '/verify-code';
    history.push(path, {
      phoneOrEmail,
      areaCode,
      authType: tenantConfigInfo.authType,
      captchaVerifyParam: normalizedCaptchaParam,
    });
    return { captchaResult: true, bizResult: true };
  };

  /**
   * 传给 AliyunCaptcha 的 onVerify 回调。
   * SDK 验证通过后调用此函数，在此处发起业务请求并返回真实结果。
   * SDK 据此决定是否显示验证码错误并调用 onBizResultCallback。
   */
  const handleCaptchaVerify = async (captchaVerifyParam: string) => {
    console.log(
      '[Login handleCaptchaVerify] param length:',
      captchaVerifyParam?.length,
      'preview:',
      captchaVerifyParam?.substring(0, 150),
    );

    // 检测 SDK 自动验证（deviceToken JSON 格式，非用户滑动验证）
    const isDeviceTokenFallback =
      captchaVerifyParam?.startsWith('{"sceneId"') &&
      captchaVerifyParam.length > 500;
    if (isDeviceTokenFallback) {
      // deviceToken 格式走正常路径发送给后端（后端支持此格式），
      // 仅跳过前端 needAliyunCaptcha 的空字符串拦截（captchaFallbackRef）
      if (isVerifyingRef.current) {
        console.log(
          '[Login handleCaptchaVerify] deviceToken path locked, skip',
        );
        return { captchaResult: true, bizResult: true };
      }
      isVerifyingRef.current = true;
      captchaFallbackRef.current = true;
      console.log(
        '[Login handleCaptchaVerify] deviceToken auto-verify, pass-through to backend',
      );
      try {
        if (loginTypeRef.current === LoginTypeEnum.Password) {
          return await handlerPasswordLogin(captchaVerifyParam);
        }
        return await handlerCodeLogin(captchaVerifyParam);
      } finally {
        captchaFallbackRef.current = false;
        isVerifyingRef.current = false;
        // 释放触发锁并清理 popup watcher，避免登录按钮锁死
        loginTriggerLockRef.current = false;
        clearCaptchaPopupWatcher();
      }
    }

    if (isVerifyingRef.current) {
      console.log('[Login handleCaptchaVerify] isVerifyingRef locked, skip');
      return { captchaResult: true, bizResult: true };
    }
    isVerifyingRef.current = true;

    // 验证码已通过，立即释放触发锁并清除 popup watcher
    loginTriggerLockRef.current = false;
    clearCaptchaPopupWatcher();

    try {
      if (loginTypeRef.current === LoginTypeEnum.Password) {
        return await handlerPasswordLogin(captchaVerifyParam);
      }
      return await handlerCodeLogin(captchaVerifyParam);
    } finally {
      isVerifyingRef.current = false;
    }
  };

  const doLogin = () => {
    if (loading) return;

    const now = Date.now();
    if (
      loginTriggerLockRef.current ||
      now - lastLoginTriggerAtRef.current < 800
    ) {
      return;
    }

    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );

    // 保障 initAliyunCaptcha 与验证请求之间 ≥2s，确保图片资源预加载完成
    if (needAliyunCaptcha) {
      const initAt = window.__captchaInitAt || 0;
      const gap = now - initAt;
      if (gap < 2000) {
        const delay = 2000 - gap;
        loginTriggerLockRef.current = true;
        lastLoginTriggerAtRef.current = now;
        captchaDelayTimerRef.current = window.setTimeout(() => {
          captchaDelayTimerRef.current = null;
          captchaRef.current?.show?.();
          startCaptchaPopupWatcher();
        }, delay);
        return;
      }
    }

    loginTriggerLockRef.current = true;
    lastLoginTriggerAtRef.current = now;

    console.log(
      '[Login doLogin] needAliyunCaptcha:',
      needAliyunCaptcha,
      'captchaSceneId:',
      captchaSceneId,
      'openCaptcha:',
      openCaptcha,
    );

    if (needAliyunCaptcha) {
      captchaRef.current?.show?.();
      startCaptchaPopupWatcher();
    } else {
      const handler =
        loginTypeRef.current === LoginTypeEnum.Password
          ? handlerPasswordLogin('')
          : handlerCodeLogin('');
      handler.finally(() => {
        loginTriggerLockRef.current = false;
      });
    }
  };

  const onFinish: FormProps<LoginFieldType>['onFinish'] = () => {
    if (!checked) {
      return confirm({
        title: dict('PC.Pages.Login.serviceAgreementTitle'),
        icon: <ExclamationCircleFilled />,
        content: <SiteProtocol />,
        okText: dict('PC.Pages.Login.serviceAgreementAgree'),
        cancelText: dict('PC.Pages.Login.serviceAgreementDisagree'),
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
  const options: SegmentedItemType[] = [
    {
      label: (
        <EllipsisTooltip title={dict('PC.Pages.Login.passwordLogin')}>
          {dict('PC.Pages.Login.passwordLogin')}
        </EllipsisTooltip>
      ),
      value: LoginTypeEnum.Password + '',
    },
    {
      label: (
        <EllipsisTooltip title={dict('PC.Pages.Login.codeLoginOrRegister')}>
          {dict('PC.Pages.Login.codeLoginOrRegister')}
        </EllipsisTooltip>
      ),
      value: LoginTypeEnum.Code + '',
    },
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
      <LoginLangSwitcher />
      <BasicLayout>
        <div>
          {loadEnd && (
            <div className={cx(styles['login-form-box'])}>
              <Segmented
                className={cx(styles.segmented)}
                options={options}
                value={loginType + ''}
                onChange={handleChangeType}
                block
              />
              <Form
                form={form}
                validateTrigger="onBlur"
                initialValues={{ areaCode: '86' }}
                rootClassName={cx(styles.form, 'flex', 'flex-col')}
                name="login"
                onFinish={onFinish}
              >
                <Form.Item>
                  <Title level={3} style={{ marginTop: 48 }}>
                    {dict(
                      'PC.Pages.Login.welcome',
                      tenantConfigInfo?.siteName || '',
                    )}
                  </Title>
                </Form.Item>
                <Form.Item name="phoneOrEmail" rules={getPhoneOrEmailRules()}>
                  {tenantConfigInfo?.authType === 3 ? (
                    <Input
                      rootClassName={cx(styles.input)}
                      placeholder={dict('PC.Pages.Login.inputEmailPlaceholder')}
                    />
                  ) : (
                    <Input
                      placeholder={dict('PC.Pages.Login.inputPhonePlaceholder')}
                      rootClassName={cx(styles.input, styles['current-input'])}
                      addonBefore={
                        <div className={cx(styles.icon, 'flex', 'flex-col')}>
                          +86
                          <DownOutlined
                            style={{ marginLeft: 15, fontSize: '14px' }}
                          />
                        </div>
                      }
                    />
                  )}
                </Form.Item>
                {loginType === LoginTypeEnum.Password && (
                  <Form.Item name="password" rules={passwordRules}>
                    <Input.Password
                      rootClassName={cx(styles.input)}
                      autoComplete="off"
                      placeholder={dict(
                        'PC.Pages.Login.inputPasswordPlaceholder',
                      )}
                    />
                  </Form.Item>
                )}

                <Form.Item className={cx(styles.login)}>
                  <Button
                    className={cx(styles.btn)}
                    block
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                  >
                    {loginType === LoginTypeEnum.Password
                      ? dict('PC.Pages.Login.login')
                      : dict('PC.Pages.Login.nextStep')}
                  </Button>
                </Form.Item>
                <Form.Item
                  className={cx('mb-16')}
                  style={{ marginTop: '-10px' }}
                >
                  <div
                    className={cx(
                      'flex',
                      'flex-row',
                      'items-start',
                      styles['protocol-wrapper'],
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      style={{ marginRight: 5 }}
                      onChange={(e) => setChecked(e.target.checked)}
                    />
                    <SiteProtocol onToggle={() => setChecked(!checked)} />
                  </div>
                </Form.Item>
              </Form>

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  padding: '0 64px',
                  width: '100%',
                }}
              >
                <SiteFooter
                  text={tenantConfigInfo?.pageFooterText}
                ></SiteFooter>
                <Button id="aliyun-captcha-login" style={{ display: 'none' }} />
                <AliyunCaptcha
                  config={tenantConfigInfo}
                  onVerify={handleCaptchaVerify}
                  elementId="aliyun-captcha-login"
                  ref={captchaRef}
                />
              </div>
            </div>
          )}
        </div>
      </BasicLayout>
    </ConfigProvider>
  );
};

export default Login;
