import { REDIRECT_LOGIN, USER_NO_LOGIN } from '@/constants/codes.constants';
import { I18N_STORAGE_KEYS } from '@/constants/i18n.constants';
import { STORAGE_KEYS } from '@/constants/theme.constants';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearHostAuth: vi.fn().mockResolvedValue(undefined),
  clearLoginStatusCache: vi.fn(),
  redirectToLogin: vi.fn(),
  navigateToAuthUrl: vi.fn().mockResolvedValue(undefined),
  warning: vi.fn(),
  error: vi.fn(),
  getBusinessRequestAuth: vi.fn(),
}));

// 隔离 umi 传递依赖；实际运行 common 的请求、错误处理和响应拦截器。
vi.mock('@/services/userService', () => ({
  clearLoginStatusCache: mocks.clearLoginStatusCache,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/router', () => ({ redirectToLogin: mocks.redirectToLogin }));
vi.mock('@/utils/authNavigation', () => ({
  navigateToAuthUrl: mocks.navigateToAuthUrl,
}));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { auth: { clear: mocks.clearHostAuth } },
}));
vi.mock('@/utils/businessAuth', () => ({
  getBusinessRequestAuth: mocks.getBusinessRequestAuth,
}));
vi.mock('@/utils/isConversationMockPage', () => ({
  isConversationMockPage: () => false,
}));
vi.mock('antd', () => ({
  message: { warning: mocks.warning, error: mocks.error },
  Modal: { warning: vi.fn() },
}));

let requestConfig: typeof import('./common')['request'];
const pollingUrl = '/api/notify/event/collect/batch';
const loginUrl = 'https://nuwax.example/login';
const authCodes = [USER_NO_LOGIN, REDIRECT_LOGIN];
const entryPoints = ['errorHandler', 'responseInterceptor'] as const;

async function handleBusinessError(
  entryPoint: (typeof entryPoints)[number],
  code: string,
  url = pollingUrl,
  errorMessage = loginUrl,
) {
  const data = { code, message: errorMessage, success: false, data: null };
  const response = { data, config: { url } };
  if (entryPoint === 'responseInterceptor') {
    return (requestConfig.responseInterceptors![0] as any)(response);
  }
  const error = requestConfig.errorConfig!.errorThrower!(data);
  return requestConfig.errorConfig!.errorHandler!(error, { config: { url } });
}

function handleHttp401() {
  return requestConfig.errorConfig!.errorHandler!(
    { response: { status: 401 }, config: { url: pollingUrl } },
    {},
  );
}

function expectNoLogout() {
  expect(mocks.clearHostAuth).not.toHaveBeenCalled();
  expect(mocks.clearLoginStatusCache).not.toHaveBeenCalled();
  expect(mocks.redirectToLogin).not.toHaveBeenCalled();
  expect(mocks.navigateToAuthUrl).not.toHaveBeenCalled();
  expect(localStorage.getItem('login-form-draft')).toBe('keep-me');
  expect(localStorage.getItem(I18N_STORAGE_KEYS.ACTIVE_LANG)).toBe('zh-cn');
  expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBe('dark');
}

describe('匿名登录步骤的全局认证错误处理', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.getBusinessRequestAuth.mockReturnValue({
      credentials: 'include',
      headers: {},
    });
    vi.useFakeTimers();
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem('login-form-draft', 'keep-me');
    localStorage.setItem(I18N_STORAGE_KEYS.ACTIVE_LANG, 'zh-cn');
    localStorage.setItem(STORAGE_KEYS.USER_THEME_CONFIG, 'dark');
    requestConfig = (await import('./common')).request;
  });

  afterEach(() => {
    // common 初始化的去重缓存清理 interval 不得泄漏到其他测试。
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  describe('请求拦截器的 Axios cookie 策略', () => {
    it('include 开启 withCredentials 并保留认证头和调用方选项', () => {
      const url = 'https://nuwax.example/api/user/login';
      mocks.getBusinessRequestAuth.mockReturnValue({
        credentials: 'include',
        headers: { Authorization: 'Bearer business-token' },
      });

      const result = (requestConfig.requestInterceptors![0] as any)(url, {
        method: 'POST',
        withCredentials: false,
        headers: {
          'X-Request-Id': 'login-test',
          Authorization: 'caller-token',
        },
      });

      expect(mocks.getBusinessRequestAuth).toHaveBeenCalledWith(url);
      expect(result).toEqual({
        url,
        options: {
          method: 'POST',
          credentials: 'include',
          withCredentials: true,
          headers: {
            'X-Request-Id': 'login-test',
            Authorization: 'Bearer business-token',
          },
        },
      });
    });

    it.each(['omit', 'same-origin'] as const)(
      '%s 关闭 withCredentials，覆盖调用方的 cookie 开关',
      (credentials) => {
        const url = 'https://external.example/api/data';
        mocks.getBusinessRequestAuth.mockReturnValue({
          credentials,
          headers: {},
        });

        const result = (requestConfig.requestInterceptors![0] as any)(url, {
          withCredentials: true,
          headers: { 'X-Request-Id': 'external-test' },
        });

        expect(result).toEqual({
          url,
          options: {
            credentials,
            withCredentials: false,
            headers: { 'X-Request-Id': 'external-test' },
          },
        });
      },
    );

    it('相对地址仍按 BASE_URL 拼接后判断认证方式', () => {
      const url = '/api/user/getLoginInfo';
      const resolvedUrl = process.env.BASE_URL + url;

      const result = (requestConfig.requestInterceptors![0] as any)(url, {
        headers: {},
      });

      expect(result.url).toBe(resolvedUrl);
      expect(mocks.getBusinessRequestAuth).toHaveBeenCalledWith(resolvedUrl);
    });
  });

  describe.each(['/login', '/verify-code', '/LOGIN/', '/VERIFY-CODE/'])(
    '%s 保留当前登录步骤',
    (pathname) => {
      it.each(entryPoints)(
        '%s 不因 4010/4011 重新导航或登出',
        async (entryPoint) => {
          window.history.replaceState({}, '', `${pathname}?phone=test`);
          for (const code of authCodes) {
            await handleBusinessError(entryPoint, code);
          }
          expectNoLogout();
          expect(mocks.warning).not.toHaveBeenCalled();
        },
      );

      it('HTTP 401 保留步骤且仍拒绝失败请求', async () => {
        window.history.replaceState({}, '', pathname);
        await expect(handleHttp401()).rejects.toBeUndefined();
        expectNoLogout();
        expect(mocks.error).not.toHaveBeenCalled();
      });
    },
  );

  describe.each(['/workspace', '/set-password', '/verify-code-extra'])(
    '%s 仍执行认证失效处理',
    (pathname) => {
      it.each(entryPoints)(
        '%s 的 4010 清会话并回登录页',
        async (entryPoint) => {
          window.history.replaceState({}, '', pathname);
          await handleBusinessError(entryPoint, USER_NO_LOGIN);
          expect(mocks.clearHostAuth).toHaveBeenCalledOnce();
          expect(mocks.clearLoginStatusCache).toHaveBeenCalledOnce();
          expect(mocks.redirectToLogin).toHaveBeenCalledWith(-1);
          expect(localStorage.getItem('login-form-draft')).toBeNull();
          expect(localStorage.getItem(I18N_STORAGE_KEYS.ACTIVE_LANG)).toBe(
            'zh-cn',
          );
          expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBe(
            'dark',
          );
        },
      );

      it.each(entryPoints)(
        '%s 的 4011 清宿主会话并使用认证跳转',
        async (entryPoint) => {
          window.history.replaceState({}, '', pathname);
          await handleBusinessError(entryPoint, REDIRECT_LOGIN);
          expect(mocks.clearHostAuth).toHaveBeenCalledOnce();
          expect(mocks.clearLoginStatusCache).toHaveBeenCalledOnce();
          expect(mocks.navigateToAuthUrl).toHaveBeenCalledWith(loginUrl);
        },
      );

      it('HTTP 401 清会话并回登录页', async () => {
        window.history.replaceState({}, '', pathname);
        await expect(handleHttp401()).rejects.toBeUndefined();
        expect(mocks.clearHostAuth).toHaveBeenCalledOnce();
        expect(mocks.clearLoginStatusCache).toHaveBeenCalledOnce();
        expect(mocks.redirectToLogin).toHaveBeenCalledWith(-1);
        expect(localStorage.getItem('login-form-draft')).toBeNull();
      });
    },
  );

  it.each(entryPoints)(
    '%s 仍提示发送验证码的非认证失败',
    async (entryPoint) => {
      window.history.replaceState({}, '', '/verify-code');
      await expect(
        handleBusinessError(
          entryPoint,
          '4290',
          '/api/user/code/send',
          '发送过于频繁',
        ),
      ).rejects.toBeUndefined();
      expect(mocks.warning).toHaveBeenCalledWith('发送过于频繁');
      expectNoLogout();
    },
  );
});
