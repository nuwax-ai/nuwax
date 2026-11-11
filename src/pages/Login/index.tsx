import AliyunCaptcha, {
  CAPTCHA_SAFETY_INTERVAL_MS,
  type AliyunCaptchaRef,
  type CaptchaVerificationContext,
} from '@/components/AliyunCaptcha';
import AppStartup from '@/components/business-component/AppStartup';
import ImageCaptcha, {
  imageCaptchaRules,
  type ImageCaptchaRef,
  type ImageCaptchaValue,
} from '@/components/business-component/ImageCaptcha';
import SiteFooter from '@/components/SiteFooter';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EXPIRE_DATE, PHONE } from '@/constants/home.constants';
import { apiLogin } from '@/services/account';
import { apiAuthIdpLoginList } from '@/services/authIdp';
import { dict, initI18n, syncLangFromUserInfo } from '@/services/i18nRuntime';
import { unifiedThemeService } from '@/services/unifiedThemeService';
import { UserService } from '@/services/userService';
import { LoginTypeEnum } from '@/types/enums/login';
import type { AuthIdpLoginItem } from '@/types/interfaces/authIdp';
import type { LoginFieldType } from '@/types/interfaces/login';
import type { QrLoginResult } from '@/types/interfaces/qrLogin';
import {
  filterIdpByUa,
  IDP_RETURN_PATH_KEY,
  resolveIdpRedirect,
  shouldAutoRedirect,
} from '@/utils/authIdp';
import { navigateToAuthUrl } from '@/utils/authNavigation';
import { finishBusinessLogin } from '@/utils/businessAuth';
import { isValidEmail, isValidPhone, validatePassword } from '@/utils/common';
import { hostBridge, isDesktopHost } from '@/utils/hostBridge';
import {
  completeDesktopIdpReturn,
  startIdpNavigation,
} from '@/utils/idpNavigation';
import { isLoginCodeInvalidError } from '@/utils/loginErrorHumanize';
import { navigateAfterLogin, replaceLoginStep } from '@/utils/loginNavigation';
import {
  DesktopOutlined,
  DownOutlined,
  ExclamationCircleFilled,
  QrcodeOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Checkbox,
  ConfigProvider,
  Form,
  FormProps,
  Input,
  message,
  Modal,
  Segmented,
  Space,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useSearchParams } from 'umi';
import BasicLayout from './BasicLayout';
import IdpLoginButtons from './IdpLoginButtons';
import styles from './index.less';
import LoginLangSwitcher from './LoginLangSwitcher';
import QrCodeLogin from './QrCodeLogin';
import SiteProtocol from './SiteProtocol';

const { Title } = Typography;

type SegmentedItemType = { label: React.ReactNode; value: string };

interface CaptchaLoginRound {
  loginType: LoginTypeEnum;
  armedAt: number;
  claimed: boolean;
  awaitingSecondary: boolean;
  lastParam?: string;
}

const loginWithPassword = async (params: LoginFieldType) =>
  (await apiLogin(params)).data;

const cx = classNames.bind(styles);

const { confirm } = Modal;

/** 图形验证码表单值 → 接口参数（未开启时表单无此字段，返回空对象） */
const pickImageCaptcha = (value?: ImageCaptchaValue) =>
  value?.captchaId
    ? { captchaId: value.captchaId, captchaCode: value.captchaCode }
    : {};

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
  const [accountLoginType, setLoginType] = useState<LoginTypeEnum>(
    LoginTypeEnum.Password,
  );
  const [showAccountLogin, setShowAccountLogin] = useState(false);
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
  /**
   * 监听验证码弹窗状态：弹窗关闭且未进入提交态时释放登录锁。
   */
  const captchaPopupWatcherTimerRef = useRef<number | null>(null);
  const captchaPopupCancelCleanupRef = useRef<(() => void) | null>(null);
  const captchaRef = useRef<AliyunCaptchaRef>(null);
  /** SDK 已交出实例，且已等待初始化后的安全间隔。 */
  const captchaReadyRef = useRef(false);
  const [captchaInitFailed, setCaptchaInitFailed] = useState(false);
  const captchaLoginPendingRef = useRef(false);
  const [captchaWaiting, setCaptchaWaiting] = useState(false);
  const captchaLoginRoundRef = useRef<CaptchaLoginRound | null>(null);
  const CAPTCHA_ROUND_SETTLE_MS = 500;
  /** 已点登录、正在等验证码。请求自己的 loading 要等接口发出才为 true */
  const [captchaSubmitting, setCaptchaSubmitting] = useState(false);
  const [captchaGeneration, setCaptchaGeneration] = useState(0);
  const [captchaRequested, setCaptchaRequested] = useState(false);
  const imageCaptchaRef = useRef<ImageCaptchaRef>(null);
  const [checked, setChecked] = useState<boolean>(true);
  const [qrConfirming, setQrConfirming] = useState(false);
  const [form] = Form.useForm();
  const { loadEnd, tenantConfigInfo, runTenantConfig } =
    useModel('tenantConfigInfo');
  const { loadMenus } = useModel('menuModel');
  const needImageCaptcha = tenantConfigInfo?.openImageCaptcha === 1;
  const qrLoginEnabled = tenantConfigInfo?.openQrLogin === 1;
  const loginType =
    qrLoginEnabled && !showAccountLogin
      ? LoginTypeEnum.QrCode
      : accountLoginType;

  useEffect(() => {
    loginTypeRef.current = loginType;
    // 配置关闭时扫码面板已卸载，释放确认态，恢复账号登录操作。
    if (!qrLoginEnabled) setQrConfirming(false);
  }, [loginType, qrLoginEnabled]);

  // ---- 企业登录（仅 nuwaclaw/nuwax 壳内可见）：切换客户端后端域名并重新初始化 ----
  const [enterpriseOpen, setEnterpriseOpen] = useState<boolean>(false);
  const [enterpriseDomain, setEnterpriseDomain] = useState<string>('');
  const [enterpriseSwitching, setEnterpriseSwitching] =
    useState<boolean>(false);
  const [enterpriseError, setEnterpriseError] = useState<string>('');

  const handleEnterpriseConfirm = async () => {
    const domain = enterpriseDomain.trim().replace(/\/+$/, '');
    if (!domain) {
      setEnterpriseError(dict('PC.Pages.Login.enterpriseDomainRequired'));
      return;
    }
    const origin = /^https?:\/\//i.test(domain) ? domain : `https://${domain}`;
    setEnterpriseSwitching(true);
    setEnterpriseError('');
    try {
      // HTTPS 登录页探测 HTTP 企业地址会被混合内容策略拦截，no-cors 也无法
      // 绕过；直接调用客户端统一切域接口，由宿主校验地址并重新初始化。
      const res = await hostBridge.auth.configureServerHost(origin);
      if (!res.success) {
        setEnterpriseError(
          dict('PC.Pages.Login.enterpriseSwitchFailed', res.error ?? ''),
        );
        return;
      }
      // 成功：壳将停服务并重载 webview 到新域（本页随重载销毁，无需再操作）
      setEnterpriseOpen(false);
    } finally {
      setEnterpriseSwitching(false);
    }
  };

  const redirectAfterCaptchaCallback = (
    responseRedirectUrl?: string | null,
  ) => {
    // 必须在验证码回调返回给 SDK 后再卸载登录页，避免 SDK 的成功收尾访问
    // 已移除的验证码弹窗节点。setTimeout 会在当前 Promise 回调链结束后执行。
    window.setTimeout(() => {
      navigateAfterLogin(
        history,
        searchParams.get('redirect'),
        responseRedirectUrl,
        navigateToAuthUrl,
      );
    }, 0);
  };

  const completeLogin = async (
    result: Pick<QrLoginResult, 'token' | 'expireDate'> & {
      redirect?: string | null;
    },
    account?: string,
    isCurrent: () => boolean = () => true,
  ) => {
    const authResult = await finishBusinessLogin(result.token);
    if (!isCurrent()) return;
    if (authResult !== 'ready') {
      throw new Error(
        dict(
          authResult === 'missing-dev-token'
            ? 'PC.Pages.Login.missingDevToken'
            : 'PC.Pages.Login.hostSessionSyncFailed',
        ),
      );
    }
    if (result.expireDate) localStorage.setItem(EXPIRE_DATE, result.expireDate);
    if (account) localStorage.setItem(PHONE, account);
    else localStorage.removeItem(PHONE);
    try {
      const latestUserInfo = await UserService.refreshUserInfo();
      if (!isCurrent()) return;
      if (!account && (latestUserInfo?.phone || latestUserInfo?.email)) {
        localStorage.setItem(
          PHONE,
          latestUserInfo.phone || latestUserInfo.email,
        );
      }
      await syncLangFromUserInfo(latestUserInfo);
    } catch (error) {
      console.error('[Login] Sync language after login failed:', error);
    }
    if (!isCurrent()) return;
    await loadMenus(true);
    if (!isCurrent()) return;
    await initI18n(true);
    if (!isCurrent()) return;
    redirectAfterCaptchaCallback(result.redirect);
  };

  const { runAsync: runPasswordLogin, loading } = useRequest(
    loginWithPassword,
    {
      manual: true,
      debounceWait: 300,
      onError: (error: any) => {
        console.error('[Login] Request Error:', error);
        // SDK 的 refresh() 在 deviceToken（无弹出 DOM）模式下会崩溃并触发新 callback 形成死循环
        // 图形验证码按一次性处理：失败后换一张
        imageCaptchaRef.current?.refresh();
      },
    },
  );

  const clearCaptchaPopupWatcher = () => {
    captchaPopupCancelCleanupRef.current?.();
    captchaPopupCancelCleanupRef.current = null;
    if (captchaPopupWatcherTimerRef.current !== null) {
      window.clearInterval(captchaPopupWatcherTimerRef.current);
      captchaPopupWatcherTimerRef.current = null;
    }
  };

  const resetCaptchaLogin = (resetReady = false, updateUI = true) => {
    captchaLoginRoundRef.current = null;
    captchaLoginPendingRef.current = false;
    isVerifyingRef.current = false;
    loginTriggerLockRef.current = false;
    lastLoginTriggerAtRef.current = 0;
    if (resetReady) {
      captchaReadyRef.current = false;
    }
    clearCaptchaPopupWatcher();
    if (updateUI) {
      setCaptchaSubmitting(false);
      setCaptchaWaiting(false);
    }
  };

  /**
   * 判断验证码 DOM 节点在页面中是否真正可见
   */
  const isElementVisible = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    try {
      const computedStyle = window.getComputedStyle(el);
      if (
        computedStyle.display === 'none' ||
        computedStyle.visibility === 'hidden' ||
        computedStyle.opacity === '0'
      ) {
        return false;
      }
      return (
        el.offsetWidth > 0 ||
        el.offsetHeight > 0 ||
        el.getClientRects().length > 0
      );
    } catch {
      return false;
    }
  };

  const startCaptchaPopupWatcher = (round: CaptchaLoginRound) => {
    clearCaptchaPopupWatcher();
    const startedAt = Date.now();
    let hasBeenVisible = false;
    let cancelTimer: number | undefined;
    const cancelRound = () => {
      if (captchaLoginRoundRef.current === round && !isVerifyingRef.current) {
        resetCaptchaLogin(true);
        setCaptchaGeneration((value) => value + 1);
      }
    };
    const handleCancelClick = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        (target.closest('#aliyunCaptcha-btn-close') ||
          target.id === 'aliyunCaptcha-mask')
      ) {
        // 先让 SDK 完成关闭事件，再销毁实例，避免其事件处理访问已移除节点。
        window.clearTimeout(cancelTimer);
        cancelTimer = window.setTimeout(cancelRound, 0);
      }
    };
    document.addEventListener('click', handleCancelClick, true);
    captchaPopupCancelCleanupRef.current = () => {
      window.clearTimeout(cancelTimer);
      document.removeEventListener('click', handleCancelClick, true);
    };

    captchaPopupWatcherTimerRef.current = window.setInterval(() => {
      const popupEl = document.getElementById('aliyunCaptcha-window-popup');
      const maskEl = document.getElementById('aliyunCaptcha-mask');

      const isPopupVisible = isElementVisible(popupEl);
      const isMaskVisible = isElementVisible(maskEl);
      const isVisible = isPopupVisible || isMaskVisible;

      if (isVisible) {
        hasBeenVisible = true;
      }

      // 弹窗收起也可能是滑动完成，不能据此取消等待中的验证回调。
      const isInitTimeout =
        !hasBeenVisible &&
        Date.now() - startedAt > (round.awaitingSecondary ? 12000 : 3000);
      const isMaxTimeout = Date.now() - startedAt > 2 * 60 * 1000;

      if (isInitTimeout || isMaxTimeout) {
        cancelRound();
        clearCaptchaPopupWatcher();
      }
    }, 300);
  };

  useEffect(() => {
    // 认证闪断会短暂进入登录页；若用户已显式选择主题，不应在这里再次删除，
    // 否则 style3 会回落为经典风格，工作台详情随即误走 bare 而非 page-container。
    unifiedThemeService.clearUserThemeConfig({ preserveExplicitChoice: true });
    runTenantConfig();
    // 登录页无侧栏，撤销壳顶栏「展开/收起」按钮的可用态：该状态由
    // DynamicMenusLayout 推送（layout:false 页从不推），壳本地态跨 webview
    // 重载不重置，登出/闪断后残留 true 会把按钮带进登录页（无桥自动 no-op）。
    hostBridge.layout.setSecondMenuAvailable(false);
  }, []);

  // ---- 三方登录（CAS / OAuth2 / 微信）：桌面回调先同步受信 Cookie 会话 ----
  const [idpItems, setIdpItems] = useState<AuthIdpLoginItem[]>([]);
  // 列表返回前不渲染表单，避免自动跳转前表单闪一下
  const [idpReady, setIdpReady] = useState(false);
  const [idpNavigating, setIdpNavigating] = useState(false);
  const idpError = searchParams.get('idpError');

  const getIdpRedirect = () =>
    resolveIdpRedirect(
      searchParams.get('redirect'),
      sessionStorage.getItem(IDP_RETURN_PATH_KEY),
    );

  useEffect(() => {
    let cancelled = false;
    let redirectStarted = false;
    const loadIdps = async () => {
      const returned = await completeDesktopIdpReturn();
      if (cancelled || returned === 'started' || returned === 'cancelled')
        return;
      if (returned === 'failed') {
        message.error(dict('PC.Pages.Login.hostSessionSyncFailed'));
        setIdpReady(true);
        return;
      }
      return (
        apiAuthIdpLoginList()
          .then(async (res) => {
            if (cancelled || res?.code !== SUCCESS_CODE || !res.data) return;
            const { items = [], autoRedirectIdpId } = res.data;
            if (
              shouldAutoRedirect({
                autoRedirectIdpId,
                search: window.location.search,
              })
            ) {
              const result = await startIdpNavigation({
                providerId: autoRedirectIdpId as number,
                redirect: getIdpRedirect(),
                replace: true,
              });
              redirectStarted = result === 'started' || result === 'cancelled';
              if (!cancelled && result === 'failed') {
                setIdpItems(filterIdpByUa(items, navigator.userAgent));
                message.error(dict('PC.Pages.Login.hostSessionSyncFailed'));
              }
              return;
            }
            setIdpItems(filterIdpByUa(items, navigator.userAgent));
          })
          // 列表失败回落普通登录
          .catch(() => undefined)
          .finally(() => {
            if (!cancelled && !redirectStarted) setIdpReady(true);
          })
      );
    };
    void loadIdps().catch(() => {
      if (!cancelled) setIdpReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const startIdpLogin = (item: AuthIdpLoginItem) => {
    if (idpNavigating) return;
    const go = async () => {
      setLoginType(LoginTypeEnum.Password);
      setShowAccountLogin(true);
      loginTypeRef.current = LoginTypeEnum.Password;
      setIdpNavigating(true);
      const result = await startIdpNavigation({
        providerId: item.id,
        redirect: getIdpRedirect(),
      });
      if (result !== 'started') setIdpNavigating(false);
      if (result === 'failed')
        message.error(dict('PC.Pages.Login.hostSessionSyncFailed'));
    };
    if (checked) {
      void go().catch(() => setIdpNavigating(false));
      return;
    }
    // 与账号登录一致：未勾选协议先确认
    confirm({
      title: dict('PC.Pages.Login.serviceAgreementTitle'),
      icon: <ExclamationCircleFilled />,
      content: <SiteProtocol />,
      okText: dict('PC.Pages.Login.serviceAgreementAgree'),
      cancelText: dict('PC.Pages.Login.serviceAgreementDisagree'),
      onOk() {
        setChecked(true);
        return go();
      },
    });
  };

  useEffect(() => {
    return () => {
      resetCaptchaLogin(true, false);
    };
  }, []);

  const getPhoneOrEmailRules = () => {
    if (loginType === LoginTypeEnum.Password) {
      return [
        {
          required: true,
          whitespace: true,
          message: dict('PC.Pages.Login.inputUnifiedAccountRequired'),
        },
      ];
    }

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

  const needAliyunCaptcha = Boolean(tenantConfigInfo?.openCaptcha);

  const handlerPasswordLogin = async (
    captchaVerifyParam: string,
    isCurrent: () => boolean = () => true,
  ) => {
    const { phoneOrEmail, password, imageCaptcha } = form.getFieldsValue();
    const param = captchaVerifyParam.trim();
    if (needAliyunCaptcha && !param)
      return { captchaResult: false, bizResult: true };
    try {
      const result = await runPasswordLogin({
        phoneOrEmail,
        password,
        captchaVerifyParam: param,
        ...pickImageCaptcha(imageCaptcha),
      });
      if (isCurrent()) {
        try {
          await completeLogin(result, phoneOrEmail, isCurrent);
        } catch (error) {
          if (isCurrent())
            message.error(
              error instanceof Error
                ? error.message
                : dict('PC.Pages.Login.hostSessionSyncFailed'),
            );
        }
      }
    } catch (error) {
      // 验证失败须反馈给 SDK，允许无痕验证进入二次验证流程。
      const failure = error as {
        message?: string;
        info?: { message?: string };
      };
      return {
        captchaResult: !isLoginCodeInvalidError(
          failure?.info?.message ?? failure?.message,
        ),
        bizResult: false,
      };
    }
    return { captchaResult: true, bizResult: true };
  };

  /**
   * 验证码登录：获取 captchaVerifyParam 后跳转至验证码输入页，
   * 由下一页真正消费 token。
   */
  const handlerCodeLogin = async (
    captchaVerifyParam: string,
  ): Promise<{ captchaResult: boolean; bizResult: boolean }> => {
    const {
      phoneOrEmail,
      areaCode = '86',
      imageCaptcha,
    } = form.getFieldsValue() || {};
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
    // 与 redirectAfterCaptchaCallback 一致：先返回验证结果给 SDK，再延迟导航，
    // 避免 SDK 成功收尾未完成时登录页已卸载触发 destroyCaptcha，
    // 导致 SDK 访问已销毁节点（innerHTML 空引用）
    window.setTimeout(() => {
      replaceLoginStep(history, 'verify-code', redirect, {
        phoneOrEmail,
        areaCode,
        authType: tenantConfigInfo.authType,
        captchaVerifyParam: normalizedCaptchaParam,
        // 首次发码沿用登录页输入的图形验证码
        ...pickImageCaptcha(imageCaptcha),
      });
    }, 0);
    return { captchaResult: true, bizResult: true };
  };

  const handleCaptchaVerify = async (
    param: string,
    context: CaptchaVerificationContext,
  ) => {
    const round = captchaLoginRoundRef.current;
    const ignored = { captchaResult: true, bizResult: true };
    if (
      !round ||
      round.claimed ||
      round.lastParam === param ||
      !context.isCurrent()
    )
      return ignored;
    round.claimed = true;
    round.lastParam = param;
    isVerifyingRef.current = true;
    const isCurrent = () =>
      captchaLoginRoundRef.current === round &&
      loginTypeRef.current === round.loginType &&
      context.isCurrent();
    let awaitingSecondary = false;
    try {
      const now = Date.now();
      const remaining = Math.max(
        CAPTCHA_ROUND_SETTLE_MS - (now - round.armedAt),
        CAPTCHA_SAFETY_INTERVAL_MS - (now - (window.__captchaInitAt || 0)),
      );
      if (remaining > 0)
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, remaining);
        });
      if (!isCurrent()) return ignored;
      clearCaptchaPopupWatcher();
      const result =
        round.loginType === LoginTypeEnum.Password
          ? await handlerPasswordLogin(param, isCurrent)
          : await handlerCodeLogin(param);
      if (isCurrent() && !result.captchaResult) {
        // 无痕未通过后保留这次登录意图，滑块的新参数仍由同一轮自动提交。
        awaitingSecondary = true;
        round.awaitingSecondary = true;
        round.claimed = false;
        round.armedAt = Date.now();
        startCaptchaPopupWatcher(round);
      }
      return result;
    } finally {
      if (captchaLoginRoundRef.current === round) {
        if (awaitingSecondary) isVerifyingRef.current = false;
        else resetCaptchaLogin();
      }
    }
  };

  const triggerCaptchaPopup = () => {
    if (
      !captchaReadyRef.current ||
      loginTypeRef.current === LoginTypeEnum.QrCode
    ) {
      resetCaptchaLogin();
      return;
    }
    const round: CaptchaLoginRound = {
      loginType: loginTypeRef.current,
      armedAt: Date.now(),
      claimed: false,
      awaitingSecondary: false,
    };
    captchaLoginRoundRef.current = round;
    const button = document.getElementById('aliyun-captcha-login');
    if (button) button.click();
    else captchaRef.current?.show?.();
    startCaptchaPopupWatcher(round);
  };

  const doLogin = () => {
    if (loading || captchaSubmitting || captchaLoginPendingRef.current) return;
    const now = Date.now();
    if (
      loginTriggerLockRef.current ||
      now - lastLoginTriggerAtRef.current < 800
    )
      return;
    if (needAliyunCaptcha && captchaInitFailed) return;

    loginTriggerLockRef.current = true;
    lastLoginTriggerAtRef.current = now;
    if (needAliyunCaptcha) {
      if (!captchaReadyRef.current) {
        // 只等待这次主动提交，就绪后继续；切换、失败和卸载均会取消它。
        captchaLoginPendingRef.current = true;
        setCaptchaWaiting(true);
        return;
      }
      setCaptchaSubmitting(true);
      triggerCaptchaPopup();
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
    if (Number(value) === LoginTypeEnum.QrCode && !qrLoginEnabled) return;
    const select = () => {
      const nextType = Number(value);
      resetCaptchaLogin(
        nextType === LoginTypeEnum.QrCode ||
          loginTypeRef.current === LoginTypeEnum.QrCode,
      );
      setShowAccountLogin(nextType !== LoginTypeEnum.QrCode);
      // 单独保留账号登录方式，扫码往返后仍回到用户上次选择的密码/验证码页。
      if (nextType !== LoginTypeEnum.QrCode) setLoginType(nextType);
      loginTypeRef.current = nextType;
    };
    if (Number(value) === LoginTypeEnum.QrCode && !checked) {
      confirm({
        title: dict('PC.Pages.Login.serviceAgreementTitle'),
        icon: <ExclamationCircleFilled />,
        content: <SiteProtocol />,
        okText: dict('PC.Pages.Login.serviceAgreementAgree'),
        cancelText: dict('PC.Pages.Login.serviceAgreementDisagree'),
        onOk() {
          setChecked(true);
          select();
        },
      });
      return;
    }
    select();
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
  const switchLoginLabel = dict(
    loginType === LoginTypeEnum.QrCode
      ? 'PC.Pages.Login.switchToAccountLogin'
      : 'PC.Pages.Login.switchToQrLogin',
  );

  useEffect(() => {
    if (loadEnd && idpReady && loginType !== LoginTypeEnum.QrCode) {
      setCaptchaRequested(true);
    }
  }, [loadEnd, idpReady, loginType]);

  // 配置和登录方式就绪后一次呈现整页，避免先露出左侧介绍、再补表单。
  if (!loadEnd || !idpReady) return <AppStartup />;

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
          {loadEnd && idpReady && (
            <div
              className={cx(styles['login-form-box'], {
                [styles['with-qr-switch']]: qrLoginEnabled,
              })}
            >
              {qrLoginEnabled && (
                <Tooltip title={switchLoginLabel} placement="leftTop">
                  <button
                    type="button"
                    className={styles['login-mode-switch']}
                    aria-label={switchLoginLabel}
                    disabled={
                      qrConfirming ||
                      loading ||
                      captchaSubmitting ||
                      idpNavigating
                    }
                    onClick={() =>
                      handleChangeType(
                        (loginType === LoginTypeEnum.QrCode
                          ? accountLoginType
                          : LoginTypeEnum.QrCode) + '',
                      )
                    }
                  >
                    {loginType === LoginTypeEnum.QrCode ? (
                      <DesktopOutlined aria-hidden />
                    ) : (
                      <QrcodeOutlined aria-hidden />
                    )}
                  </button>
                </Tooltip>
              )}
              {idpError && (
                <Alert
                  type="error"
                  showIcon
                  closable
                  className={cx(styles['idp-error'])}
                  message={idpError}
                />
              )}
              {loginType !== LoginTypeEnum.QrCode && (
                <Segmented
                  className={cx(styles.segmented)}
                  options={options}
                  value={loginType + ''}
                  onChange={handleChangeType}
                  disabled={loading || captchaSubmitting || idpNavigating}
                  block
                />
              )}
              {loginType === LoginTypeEnum.QrCode ? (
                checked ? (
                  <QrCodeLogin
                    logoUrl={tenantConfigInfo?.siteLogo}
                    onSuccess={(result, isCurrent) =>
                      completeLogin(result, undefined, isCurrent)
                    }
                    onConfirmingChange={setQrConfirming}
                  />
                ) : (
                  <Button
                    block
                    className={styles['qr-agreement']}
                    onClick={() => handleChangeType(LoginTypeEnum.QrCode + '')}
                  >
                    {dict('PC.Pages.Login.qrLogin')}
                  </Button>
                )
              ) : (
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
                  <Form.Item>
                    {loginType === LoginTypeEnum.Password ||
                    tenantConfigInfo?.authType === 3 ? (
                      <Form.Item
                        name="phoneOrEmail"
                        noStyle
                        rules={getPhoneOrEmailRules()}
                      >
                        <Input
                          rootClassName={cx(styles.input)}
                          placeholder={dict(
                            loginType === LoginTypeEnum.Password
                              ? 'PC.Pages.Login.inputUnifiedAccountPlaceholder'
                              : 'PC.Pages.Login.inputEmailPlaceholder',
                          )}
                        />
                      </Form.Item>
                    ) : (
                      <Space.Compact
                        block
                        className={cx(styles['phone-input-compact'])}
                      >
                        <div
                          className={cx(
                            styles.icon,
                            'flex',
                            'flex-row',
                            'items-center',
                          )}
                        >
                          +86
                          <DownOutlined
                            style={{ marginLeft: 6, fontSize: '14px' }}
                          />
                        </div>
                        <Form.Item
                          name="phoneOrEmail"
                          noStyle
                          rules={getPhoneOrEmailRules()}
                        >
                          <Input
                            placeholder={dict(
                              'PC.Pages.Login.inputPhonePlaceholder',
                            )}
                            rootClassName={cx(
                              styles.input,
                              styles['current-input'],
                            )}
                          />
                        </Form.Item>
                      </Space.Compact>
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
                  {needImageCaptcha && (
                    <Form.Item name="imageCaptcha" rules={imageCaptchaRules()}>
                      <ImageCaptcha
                        ref={imageCaptchaRef}
                        inputClassName={cx(styles.input)}
                      />
                    </Form.Item>
                  )}

                  {needAliyunCaptcha && captchaInitFailed && (
                    <Alert
                      type="error"
                      showIcon
                      message={dict('PC.Pages.Login.captchaError')}
                      action={
                        <Button
                          type="link"
                          onClick={() => window.location.reload()}
                        >
                          {dict('PC.Common.Global.refresh')}
                        </Button>
                      }
                    />
                  )}
                  <Form.Item className={cx(styles.login)}>
                    <Button
                      className={cx(styles.btn)}
                      block
                      type="primary"
                      htmlType="submit"
                      loading={loading || captchaSubmitting || captchaWaiting}
                    >
                      {loginType === LoginTypeEnum.Password
                        ? dict('PC.Pages.Login.login')
                        : dict('PC.Pages.Login.nextStep')}
                    </Button>
                  </Form.Item>
                </Form>
              )}
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
                  disabled={qrConfirming}
                  style={{ marginRight: 5 }}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <SiteProtocol
                  onToggle={() => {
                    if (!qrConfirming) setChecked(!checked);
                  }}
                />
              </div>

              <IdpLoginButtons
                items={idpItems}
                onSelect={startIdpLogin}
                disabled={idpNavigating || qrConfirming}
                trailingAction={
                  // 仅商业桌面宿主可见；保留无第三方登录时的企业入口。
                  isDesktopHost() && (
                    <Button
                      type="link"
                      size="small"
                      disabled={qrConfirming}
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => {
                        setLoginType(LoginTypeEnum.Password);
                        setShowAccountLogin(true);
                        loginTypeRef.current = LoginTypeEnum.Password;
                        setEnterpriseError('');
                        setEnterpriseOpen(true);
                      }}
                    >
                      {dict('PC.Pages.Login.enterpriseLogin')}
                    </Button>
                  )
                }
              />

              <Modal
                title={dict('PC.Pages.Login.enterpriseLoginTitle')}
                open={enterpriseOpen}
                onCancel={() => {
                  if (!enterpriseSwitching) setEnterpriseOpen(false);
                }}
                onOk={handleEnterpriseConfirm}
                okText={dict('PC.Pages.Login.enterpriseSwitchConfirm')}
                confirmLoading={enterpriseSwitching}
                okButtonProps={{ disabled: !enterpriseDomain.trim() }}
                destroyOnHidden
              >
                <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
                  {dict('PC.Pages.Login.enterpriseLoginHint')}
                </div>
                <Input
                  value={enterpriseDomain}
                  onChange={(e) => {
                    setEnterpriseDomain(e.target.value);
                    setEnterpriseError('');
                  }}
                  onPressEnter={handleEnterpriseConfirm}
                  disabled={enterpriseSwitching}
                  placeholder={dict(
                    'PC.Pages.Login.enterpriseDomainPlaceholder',
                  )}
                  allowClear
                />
                {enterpriseError && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#ff4d4f' }}>
                    {enterpriseError}
                  </div>
                )}
              </Modal>

              <div className={styles['login-form-footer']}>
                <SiteFooter
                  text={tenantConfigInfo?.pageFooterText}
                ></SiteFooter>
                {(captchaRequested || loginType !== LoginTypeEnum.QrCode) && (
                  <>
                    <Button
                      id="aliyun-captcha-login"
                      style={{ display: 'none' }}
                    />
                    <AliyunCaptcha
                      key={captchaGeneration}
                      active={loginType !== LoginTypeEnum.QrCode}
                      config={tenantConfigInfo}
                      onVerify={handleCaptchaVerify}
                      onInitError={() => {
                        resetCaptchaLogin(true);
                        setCaptchaInitFailed(true);
                      }}
                      onReadyChange={(ready) => {
                        if (ready) {
                          captchaReadyRef.current = true;
                          setCaptchaInitFailed(false);
                          if (captchaLoginPendingRef.current) {
                            captchaLoginPendingRef.current = false;
                            setCaptchaWaiting(false);
                            setCaptchaSubmitting(true);
                            triggerCaptchaPopup();
                          }
                        } else resetCaptchaLogin(true);
                      }}
                      elementId="aliyun-captcha-login"
                      ref={captchaRef}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </BasicLayout>
    </ConfigProvider>
  );
};

export default Login;
