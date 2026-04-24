import AliyunCaptcha from '@/components/AliyunCaptcha';
import SiteFooter from '@/components/SiteFooter';
import { ACCESS_TOKEN, EXPIRE_DATE, PHONE } from '@/constants/home.constants';
import type { CaptchaConsumeControl } from '@/hooks/useCaptchaConsume';
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
   * 记录最近一次提交到登录接口的验证码参数（脱敏日志用途）。
   * 用于确认“请求时使用的是当前最新 token”，避免误复用旧值。
   */
  const latestSubmittedCaptchaRef = useRef<string>('');
  /**
   * 密码登录进行中的并发锁。
   * 避免同一次验证码消费过程中因重复触发导致并发提交。
   */
  const passwordSubmittingRef = useRef<boolean>(false);
  /**
   * 登录入口触发锁（用于防止快速重复点击导致重复触发验证码流程）。
   */
  const loginTriggerLockRef = useRef<boolean>(false);
  /**
   * 记录最近一次点击登录时间，用于短窗口防抖。
   */
  const lastLoginTriggerAtRef = useRef<number>(0);
  /**
   * useRequest loading 的 ref 快照，供定时器内读取最新值，避免闭包拿到旧值。
   */
  const loadingRef = useRef<boolean>(false);
  /**
   * 监听验证码弹窗状态的定时器句柄：
   * - 弹窗关闭且未进入提交态时释放登录锁；
   * - 避免固定 10 秒提前解锁导致二次生成 token。
   */
  const captchaPopupWatcherTimerRef = useRef<number | null>(null);
  const [checked, setChecked] = useState<boolean>(true);
  const [form] = Form.useForm();
  const { loadEnd, tenantConfigInfo, runTenantConfig } =
    useModel('tenantConfigInfo');
  // 菜单数据模型
  const { loadMenus } = useModel('menuModel');

  const { runWithPromise: runPasswordLogin, loading } = useRequestPromiseBridge(
    apiLogin,
    {
      manual: true,
      normalizeUnknownError: true,
      debounceInterval: 300,
      onSuccess: async (result: ILoginResult, params: LoginFieldType[]) => {
        console.info('[Login] password-login-onSuccess', {
          account: params?.[0]?.phoneOrEmail,
        });
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
        // 登录成功后强制刷新菜单数据（可能切换了账号）
        await loadMenus(true);
        // 登录成功后重新初始化语言
        await initI18n(true);
        const redirect = decodeURIComponent(searchParams.get('redirect') || '');
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
      onError: (error: any) => {
        console.info('[Login] password-login-onError', {
          errorType: error?.constructor?.name,
          errorName: error?.name,
          errorMessage:
            error?.message || (error ? String(error) : 'Unknown error'),
          // 完整后端错误上下文
          errorInfo: error?.info ?? null, // { code, displayCode, message, tid, debugInfo }
          flowId: error?._flowId,
        });
        console.error('[Login] Request Error:', error);
      },
    },
  );

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

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

      // 已进入请求阶段时，不由 watcher 释放锁，交由业务流程释放。
      if (passwordSubmittingRef.current || loadingRef.current) {
        return;
      }

      if (!hasCaptchaPopup) {
        loginTriggerLockRef.current = false;
        clearCaptchaPopupWatcher();
        return;
      }

      // 极端兜底：防止异常情况下 watcher 长驻。
      if (Date.now() - startedAt > 2 * 60 * 1000) {
        loginTriggerLockRef.current = false;
        clearCaptchaPopupWatcher();
      }
    }, 500);
  };

  useEffect(() => {
    // 清除主题本地缓存
    unifiedThemeService.clearUserThemeConfig();

    // 租户配置信息查询接口
    runTenantConfig();
  }, []);

  // 表单验证规则 - 抽取为常量避免重复
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

  // 账号密码登录
  const handlerPasswordLogin = (captchaVerifyParam: string) => {
    // 为了避免 formValues 为 undefined 的情况，添加空值检查
    const {
      phoneOrEmail,
      areaCode = '86',
      password,
    } = form.getFieldsValue() || {};
    const normalizedCaptchaParam =
      typeof captchaVerifyParam === 'string' ? captchaVerifyParam.trim() : '';

    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    // 只有同时满足三个条件才启用验证码：场景ID存在、身份标存在、开启验证码
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );

    if (needAliyunCaptcha && !normalizedCaptchaParam) {
      const emptyCaptchaError = new Error(
        'Captcha token is empty while captcha is enabled.',
      );
      console.warn('[Login] password-login-blocked-empty-captcha', {
        account: phoneOrEmail,
        needAliyunCaptcha,
      });
      return Promise.reject(emptyCaptchaError);
    }

    if (passwordSubmittingRef.current) {
      const duplicatedSubmitError = new Error(
        'Password login request is already in progress.',
      );
      console.warn('[Login] password-login-duplicated-submit-blocked', {
        account: phoneOrEmail,
      });
      return Promise.reject(duplicatedSubmitError);
    }

    passwordSubmittingRef.current = true;
    latestSubmittedCaptchaRef.current = normalizedCaptchaParam;

    // console.log('[Login] 密码登录使用验证码参数:', normalizedCaptchaParam);
    console.info('[Login] password-login-run', {
      account: phoneOrEmail,
      captchaParamLen: normalizedCaptchaParam?.length,
      captchaParamType: typeof normalizedCaptchaParam,
      captchaParamIsJSON: (() => {
        try {
          JSON.parse(normalizedCaptchaParam);
          return true;
        } catch {
          return false;
        }
      })(),
    });
    // 返回请求 Promise，让验证码组件可在请求结束后再刷新实例
    return runPasswordLogin({
      phoneOrEmail,
      areaCode,
      password,
      captchaVerifyParam: normalizedCaptchaParam,
    })
      .then((result: ILoginResult | undefined) => {
        // 成功登录时 result 包含 { token, expireDate, ... }
        // 业务错误时 formatResult(result => result?.data) 返回 undefined
        if (!result || !result.token) {
          throw new Error('Login failed');
        }
        return { skipRefresh: true } as CaptchaConsumeControl;
      })
      .finally(() => {
        passwordSubmittingRef.current = false;
      });
  };

  // 验证码登录
  const handlerCodeLogin = (
    captchaVerifyParam: string,
  ): CaptchaConsumeControl => {
    // 为了避免 formValues 为 undefined 的情况，添加空值检查
    const { phoneOrEmail, areaCode = '86' } = form.getFieldsValue() || {};
    const normalizedCaptchaParam =
      typeof captchaVerifyParam === 'string' ? captchaVerifyParam.trim() : '';
    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    // 只有同时满足三个条件才启用验证码：场景ID存在、身份标存在、开启验证码
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );

    if (needAliyunCaptcha && !normalizedCaptchaParam) {
      console.warn('[Login] code-login-blocked-empty-captcha', {
        account: phoneOrEmail,
        needAliyunCaptcha,
      });
      throw new Error('Captcha token is empty while captcha is enabled.');
    }

    // console.log('[Login] 验证码登录使用验证码参数:', normalizedCaptchaParam);
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
    /**
     * 验证码登录为跨页面消费场景：
     * token 会在 VerifyCode 页真正调用发送验证码接口时才消费，
     * 这里必须跳过当前页自动 refresh，避免 token 提前失效。
     */
    return { skipRefresh: true };
  };

  // 使用 useCallback 包装 handlerSuccess，确保捕获最新的 loginType 值
  const handlerSuccess = (captchaVerifyParam: string = '') => {
    loginTriggerLockRef.current = false;
    clearCaptchaPopupWatcher();
    // [使用→登录] captcha SDK 调用 doAction，进入业务逻辑
    console.info('[CaptchaFlow][2-consume-dispatch]', {
      loginType: loginTypeRef.current,
      hasCaptchaParam: !!captchaVerifyParam,
      captchaParamLen: captchaVerifyParam?.length,
    });
    if (loginTypeRef.current === LoginTypeEnum.Password) {
      return handlerPasswordLogin(captchaVerifyParam);
    } else {
      return handlerCodeLogin(captchaVerifyParam);
    }
  }; // loginType 作为依赖项

  const doLogin = () => {
    if (passwordSubmittingRef.current || loading) {
      console.info('[Login] login-trigger-blocked-running-request', {
        passwordSubmitting: passwordSubmittingRef.current,
        useRequestLoading: loading,
      });
      return;
    }
    const now = Date.now();
    if (
      loginTriggerLockRef.current ||
      now - lastLoginTriggerAtRef.current < 800
    ) {
      console.info('[Login] login-trigger-blocked-fast-repeat', {
        lockActive: loginTriggerLockRef.current,
        deltaMs: now - lastLoginTriggerAtRef.current,
      });
      return;
    }
    loginTriggerLockRef.current = true;
    lastLoginTriggerAtRef.current = now;

    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    // 只有同时满足三个条件才启用验证码：场景ID存在、身份标存在、开启验证码
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );
    // console.log('[Login] 执行登录检查:', { needAliyunCaptcha, openCaptcha });
    // 如果需要阿里云验证码，则点击按钮触发验证码
    if (needAliyunCaptcha) {
      document.getElementById('aliyun-captcha-login')?.click();
      startCaptchaPopupWatcher();
    } else {
      //不需要阿里云验证码，直接执行登录/验证码逻辑
      Promise.resolve(handlerSuccess()).finally(() => {
        loginTriggerLockRef.current = false;
        clearCaptchaPopupWatcher();
      });
    }
  };

  useEffect(() => {
    return () => {
      clearCaptchaPopupWatcher();
    };
  }, []);

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
  // 分段器切换登录方式
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
                  doAction={handlerSuccess}
                  elementId="aliyun-captcha-login"
                  refreshOnError={false}
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
