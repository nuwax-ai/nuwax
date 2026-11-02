import {
  AGENT_NOT_EXIST,
  AGENT_SERVICE_RUNNING,
  REDIRECT_LOGIN,
  SANDBOX_TEST_ERROR,
  USER_NO_LOGIN,
  USERAPP_OPERATION_IN_PROGRESS,
} from '@/constants/codes.constants';
import { I18N_STORAGE_KEYS } from '@/constants/i18n.constants';
import { STORAGE_KEYS } from '@/constants/theme.constants';
import { createRequire } from 'module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 使用 Umi 实际依赖的 Axios，通过 adapter 隔离网络。
const require = createRequire(import.meta.url);
const umiRequire = createRequire(require.resolve('@umijs/max'));
const pluginsRequire = createRequire(
  umiRequire.resolve('@umijs/plugins/package.json'),
);
const axios = pluginsRequire('axios');

const mocks = vi.hoisted(() => ({
  clearHostAuth: vi.fn().mockResolvedValue(undefined),
  clearLoginStatusCache: vi.fn(),
  redirectToLogin: vi.fn(),
  navigateToAuthUrl: vi.fn().mockResolvedValue(undefined),
  warning: vi.fn(),
  error: vi.fn(),
  getBusinessRequestAuth: vi.fn(),
  clearMicroAppDevSession: vi.fn(),
  emit: vi.fn(),
  isConversationMockPage: vi.fn().mockReturnValue(false),
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
  clearMicroAppDevSession: mocks.clearMicroAppDevSession,
}));
vi.mock('@/utils/eventBus', () => ({
  default: { emit: mocks.emit },
  EVENT_NAMES: { AUTH_SESSION_CLEARED: 'auth_session_cleared' },
}));
vi.mock('@/utils/isConversationMockPage', () => ({
  isConversationMockPage: mocks.isConversationMockPage,
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

async function handleHttp401() {
  return requestConfig.errorConfig!.errorHandler!(
    { response: { status: 401 }, config: { url: pollingUrl } },
    {},
  );
}

function runAxiosRequest(data: any, httpError?: any, options: any = {}) {
  const instance = axios.create({
    adapter: async (config: any) => {
      if (httpError) {
        httpError.config = config;
        throw httpError;
      }
      return { data, config, status: 200, statusText: 'OK', headers: {} };
    },
  });

  // 与 Umi plugin-request 一致：自定义响应拦截器先执行，失败后同步调用 errorHandler。
  for (const interceptor of requestConfig.responseInterceptors!) {
    instance.interceptors.response.use(interceptor);
  }
  instance.interceptors.response.use((response: any) => {
    if (response.data?.success === false) {
      requestConfig.errorConfig!.errorThrower!(response.data);
    }
    return response;
  });

  const opts = { url: '/api/userapp/private/list/1', ...options };
  return instance.request(opts).catch((error: any) => {
    requestConfig.errorConfig!.errorHandler!(error, opts);
    throw error;
  });
}

function expectErrorHandlerToThrow(error: any, opts: any = {}) {
  let thrownError: unknown;
  try {
    requestConfig.errorConfig!.errorHandler!(error, opts);
  } catch (caughtError) {
    thrownError = caughtError;
  }
  // Umi catch 同步调用处理器；抛出原对象同时验证没有遗留被忽略的 rejected Promise。
  expect(error).toBeDefined();
  expect(thrownError).toBe(error);
}

function expectNoLogout() {
  expect(mocks.clearMicroAppDevSession).not.toHaveBeenCalled();
  expect(mocks.emit).not.toHaveBeenCalled();
  expect(mocks.clearHostAuth).not.toHaveBeenCalled();
  expect(mocks.clearLoginStatusCache).not.toHaveBeenCalled();
  expect(mocks.redirectToLogin).not.toHaveBeenCalled();
  expect(mocks.navigateToAuthUrl).not.toHaveBeenCalled();
  expect(localStorage.getItem('login-form-draft')).toBe('keep-me');
  expect(localStorage.getItem(I18N_STORAGE_KEYS.ACTIVE_LANG)).toBe('zh-cn');
  expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBe('dark');
}

describe('匿名登录步骤的全局认证错误处理', () => {
  describe('显式后台轮询全静默', () => {
    it.each(['4010', '4011', '5000', '9999'])(
      '业务错误 %s 保持失败且不提示、不清会话、不导航',
      async (code) => {
        window.history.replaceState({}, '', '/workspace');
        await expect(
          runAxiosRequest(
            { code, message: 'poll failed', success: false, data: null },
            undefined,
            { url: '/api/credit/summary', silentPolling: true },
          ),
        ).rejects.toMatchObject({ info: { code } });
        expectNoLogout();
        expect(mocks.warning).not.toHaveBeenCalled();
        expect(mocks.error).not.toHaveBeenCalled();
      },
    );

    it.each([401, 500, 503])(
      'HTTP %s 仍交给轮询重试且无全局副作用',
      async (status) => {
        const failure = { response: { status } };
        await expect(
          runAxiosRequest(undefined, failure, { silentPolling: true }),
        ).rejects.toBe(failure);
        expectNoLogout();
        expect(mocks.warning).not.toHaveBeenCalled();
        expect(mocks.error).not.toHaveBeenCalled();
      },
    );

    it('网络错误仍被消费为失败，成功响应保持原数据', async () => {
      const failure = new TypeError('Failed to fetch');
      await expect(
        runAxiosRequest(undefined, failure, { silentPolling: true }),
      ).rejects.toBe(failure);
      expectNoLogout();
      expect(mocks.warning).not.toHaveBeenCalled();
      expect(mocks.error).not.toHaveBeenCalled();
      const data = { code: '0000', success: true, data: { totalCredit: 42 } };
      await expect(
        runAxiosRequest(data, undefined, { silentPolling: true }),
      ).resolves.toMatchObject({ data });
    });
  });
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.isConversationMockPage.mockReturnValue(false);
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
        await expect(handleHttp401()).rejects.toMatchObject({
          response: { status: 401 },
          config: { url: pollingUrl },
        });
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
          expect(mocks.clearMicroAppDevSession).toHaveBeenCalledOnce();
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
          expect(mocks.clearMicroAppDevSession).toHaveBeenCalledOnce();
          expect(mocks.emit).toHaveBeenCalledOnce();
          expect(mocks.emit).toHaveBeenCalledWith('auth_session_cleared');
          expect(mocks.clearHostAuth).toHaveBeenCalledOnce();
          expect(mocks.clearLoginStatusCache).toHaveBeenCalledOnce();
          expect(mocks.navigateToAuthUrl).toHaveBeenCalledWith(loginUrl);
        },
      );

      it('HTTP 401 清会话并回登录页', async () => {
        window.history.replaceState({}, '', pathname);
        await expect(handleHttp401()).rejects.toMatchObject({
          response: { status: 401 },
          config: { url: pollingUrl },
        });
        expect(mocks.clearHostAuth).toHaveBeenCalledOnce();
        expect(mocks.clearLoginStatusCache).toHaveBeenCalledOnce();
        expect(mocks.redirectToLogin).toHaveBeenCalledWith(-1);
        expect(mocks.clearMicroAppDevSession).toHaveBeenCalledOnce();
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
      ).rejects.toMatchObject({
        name: 'BizError',
        info: { code: '4290', message: '发送过于频繁' },
      });
      expect(mocks.warning).toHaveBeenCalledWith('发送过于频繁');
      expectNoLogout();
    },
  );

  describe('操作进行中（ERR_OPERATION_IN_PROGRESS）不弹全局提示', () => {
    it.each(entryPoints)(
      '%s 对四个 start / restart 接口的 ERR_OPERATION_IN_PROGRESS 只抛错不提示',
      async (entryPoint) => {
        for (const url of [
          '/api/userapp/dev/start',
          '/api/userapp/dev/restart',
          '/api/userapp/prod/start',
          '/api/userapp/prod/restart',
        ]) {
          await expect(
            handleBusinessError(
              entryPoint,
              USERAPP_OPERATION_IN_PROGRESS,
              url,
              '应用存在未完成的操作',
            ),
          ).rejects.toMatchObject({
            name: 'BizError',
            info: {
              code: USERAPP_OPERATION_IN_PROGRESS,
              message: '应用存在未完成的操作',
            },
          });
        }
        expect(mocks.warning).not.toHaveBeenCalled();
        expect(mocks.error).not.toHaveBeenCalled();
      },
    );

    it('第几次调用、opts 里有没有请求信息，都不提示', () => {
      const error = requestConfig.errorConfig!.errorThrower!({
        code: USERAPP_OPERATION_IN_PROGRESS,
        message: '应用存在未完成的操作',
        success: false,
        data: null,
      } as any);
      expectErrorHandlerToThrow(error, {});
      expect(mocks.warning).not.toHaveBeenCalled();
      expect(mocks.error).not.toHaveBeenCalled();
    });

    it.each(entryPoints)(
      '%s 对其他接口的 ERR_OPERATION_IN_PROGRESS 同样不提示',
      async (entryPoint) => {
        await expect(
          handleBusinessError(
            entryPoint,
            USERAPP_OPERATION_IN_PROGRESS,
            '/api/other/operation',
            '应用存在未完成的操作',
          ),
        ).rejects.toMatchObject({ name: 'BizError' });
        expect(mocks.warning).not.toHaveBeenCalled();
        expect(mocks.error).not.toHaveBeenCalled();
      },
    );

    it.each(entryPoints)(
      '%s 对 start / restart 接口的其他业务失败仍提示',
      async (entryPoint) => {
        await expect(
          handleBusinessError(
            entryPoint,
            '5000',
            '/api/userapp/prod/restart',
            '重启失败',
          ),
        ).rejects.toMatchObject({ name: 'BizError' });
        expect(mocks.warning).toHaveBeenCalledWith('重启失败');
      },
    );
  });

  describe('登录链路验证码失效报错的人话化（NW-049）', () => {
    it.each(entryPoints)(
      '%s 将发码接口的「校验参数异常」转为引导重发的提示',
      async (entryPoint) => {
        await expect(
          handleBusinessError(
            entryPoint,
            '4000',
            '/api/user/code/send',
            '校验参数异常',
          ),
        ).rejects.toMatchObject({
          name: 'BizError',
          info: { message: '校验参数异常' },
        });
        // 原始开发向文案不得直接暴露给用户；抛给调用方的错误仍保留原文
        expect(mocks.warning).not.toHaveBeenCalledWith('校验参数异常');
        expect(mocks.warning).toHaveBeenCalledWith(
          'PC.Pages.VerifyCode.sendFailedRetry',
        );
      },
    );

    it.each(entryPoints)(
      '%s 将验证码登录接口的「校验参数异常」转为引导重新获取的提示',
      async (entryPoint) => {
        await expect(
          handleBusinessError(
            entryPoint,
            '4000',
            '/api/user/codeLogin',
            '校验参数异常',
          ),
        ).rejects.toMatchObject({
          name: 'BizError',
          info: { message: '校验参数异常' },
        });
        expect(mocks.warning).not.toHaveBeenCalledWith('校验参数异常');
        expect(mocks.warning).toHaveBeenCalledWith(
          'PC.Pages.VerifyCode.codeInvalidTip',
        );
      },
    );

    it.each(entryPoints)(
      '%s 对非登录发码链路接口的同类报错保持原文案',
      async (entryPoint) => {
        await expect(
          handleBusinessError(
            entryPoint,
            '4000',
            '/api/user/passwordLogin',
            '校验参数异常',
          ),
        ).rejects.toMatchObject({
          name: 'BizError',
          info: { message: '校验参数异常' },
        });
        expect(mocks.warning).toHaveBeenCalledWith('校验参数异常');
      },
    );
  });

  describe('失败请求向调用方保留原始错误', () => {
    it('业务权限拒绝保留 code、message、tid 和原错误对象', () => {
      const error = requestConfig.errorConfig!.errorThrower!({
        code: '4030',
        message: '您没有此空间数据的访问权限！',
        success: false,
        data: null,
        displayCode: 'USERAPP_FORBIDDEN',
        debugInfo: 'permission denied',
        tid: 'permission-trace',
      });

      expectErrorHandlerToThrow(error);
      expect(error).toMatchObject({
        name: 'BizError',
        info: {
          code: '4030',
          message: '您没有此空间数据的访问权限！',
          tid: 'permission-trace',
        },
      });
      expectNoLogout();
    });

    it.each([
      AGENT_SERVICE_RUNNING,
      AGENT_NOT_EXIST,
      SANDBOX_TEST_ERROR,
      '5000',
    ])('业务失败 %s 仍抛出同一个错误对象', (code) => {
      const error = requestConfig.errorConfig!.errorThrower!({
        code,
        message: '业务请求失败',
        success: false,
        data: null,
      });

      expectErrorHandlerToThrow(error);
      expectNoLogout();
    });

    it.each([
      {
        response: { status: 403 },
        config: { url: '/api/userapp/private/list/1' },
      },
      { request: {}, message: 'timeout', config: { url: '/api/data' } },
      { message: 'Network Error', config: { url: '/api/data' } },
    ])('HTTP、超时和网络失败保留原始错误 %j', (error) => {
      expectErrorHandlerToThrow(error);
      expectNoLogout();
    });

    it.each(['4030', '4290', '5000', '9999'])(
      'Axios 响应链拒绝业务失败 %s',
      async (code) => {
        await expect(
          runAxiosRequest({
            code,
            message: '应用请求失败',
            success: false,
            data: null,
            tid: 'axios-trace',
          }),
        ).rejects.toMatchObject({
          name: 'BizError',
          info: { code, message: '应用请求失败', tid: 'axios-trace' },
        });
        // 响应拦截器及 Umi catch 重复调用时仍只显示一次提示。
        expect(mocks.warning).toHaveBeenCalledTimes(1);
        expectNoLogout();
      },
    );

    it.each([403, 500, 502, 503])(
      '普通 Axios HTTP %s 拒绝原错误且不清会话或跳登录',
      async (status) => {
        const error = Object.assign(
          new Error(`Request failed with status ${status}`),
          { response: { status } },
        );
        await expect(runAxiosRequest(undefined, error)).rejects.toBe(error);
        expect(error.response.status).toBe(status);
        expectNoLogout();
      },
    );
  });

  describe('保留原有静默和调用方自处理策略', () => {
    it('request interceptor 透传 skipErrorHandler 到响应 config', () => {
      const result = (requestConfig.requestInterceptors![0] as any)(
        '/api/userapp/private/list/1',
        { skipErrorHandler: true, headers: {} },
      );

      expect(result.options.skipErrorHandler).toBe(true);
    });

    it('skipErrorHandler 仍返回业务失败响应，由调用方解析 envelope', async () => {
      const response = {
        data: { code: '4030', message: '无权限', success: false, data: null },
        config: { url: '/api/userapp/private/list/1', skipErrorHandler: true },
      };

      await expect(
        (requestConfig.responseInterceptors![0] as any)(response),
      ).resolves.toBe(response);
      expect(mocks.warning).not.toHaveBeenCalled();
      expectNoLogout();
    });

    it('静默接口的非认证失败仍返回响应且不弹提示', async () => {
      const response = {
        data: { code: '5000', message: '轮询失败', success: false, data: null },
        config: { url: pollingUrl },
      };

      await expect(
        (requestConfig.responseInterceptors![0] as any)(response),
      ).resolves.toBe(response);
      expect(mocks.warning).not.toHaveBeenCalled();
      expectNoLogout();
    });

    it('skipErrorHandler 不能跳过 HTTP 401 的认证失效处理', () => {
      window.history.replaceState({}, '', '/workspace');
      const error = {
        response: { status: 401 },
        config: { url: pollingUrl, skipErrorHandler: true },
      };

      expectErrorHandlerToThrow(error, { skipErrorHandler: true });
      expect(mocks.clearHostAuth).toHaveBeenCalledOnce();
      expect(mocks.clearLoginStatusCache).toHaveBeenCalledOnce();
      expect(mocks.redirectToLogin).toHaveBeenCalledWith(-1);
    });

    it.each(authCodes)('mock 页业务认证错误 %s 仍不登出', async (code) => {
      mocks.isConversationMockPage.mockReturnValue(true);
      window.history.replaceState({}, '', '/workspace');

      await handleBusinessError('responseInterceptor', code);
      expectNoLogout();
    });
  });
});
