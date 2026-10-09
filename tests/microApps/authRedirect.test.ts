import {
  expireMicroAppSession,
  resolveMicroAppAuthTarget,
} from '@/services/microAppAuth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  navigate: vi.fn(),
  clearLogin: vi.fn(),
  clearHost: vi.fn(async (): Promise<void> => {}),
}));
vi.mock('@/utils/authNavigation', () => ({
  navigateToAuthUrl: mocks.navigate,
}));
vi.mock('@/utils/authStorageCleanup', () => ({
  clearStoragePreservingUserPrefs: mocks.clear,
}));
vi.mock('@/services/userService', () => ({
  clearLoginStatusCache: mocks.clearLogin,
}));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { auth: { clear: mocks.clearHost } },
}));

beforeEach(() => {
  vi.unstubAllEnvs();
  mocks.clear.mockClear();
  mocks.navigate.mockClear();
  mocks.clearLogin.mockClear();
  mocks.clearHost.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe('微应用认证交还宿主', () => {
  it('平台 SSO 支持 https 跨域，拒绝脚本/凭证/控制字符目标', () => {
    expect(
      resolveMicroAppAuthTarget('https://sso.example/login?return=%2Frepo'),
    ).toBe('https://sso.example/login?return=%2Frepo');
    for (const raw of [
      'javascript:alert(1)',
      '//sso.example/login',
      'https://user@sso.example/login',
      'https://sso.example/\nlogin',
      'http://sso.example/login',
    ]) {
      expect(resolveMicroAppAuthTarget(raw)).toBeNull();
    }
  });

  it('普通浏览器开发环境的业务域登录目标回到本地主站', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('BASE_URL', 'https://business.example');
    expect(
      resolveMicroAppAuthTarget(
        'https://business.example/login?return=%2Frepo#auth',
      ),
    ).toBe(`${window.location.origin}/login?return=%2Frepo#auth`);
  });

  it('失效时先清主站会话及微应用，非法目标不改变会话', async () => {
    await expireMicroAppSession('javascript:alert(1)');
    expect(mocks.clear).not.toHaveBeenCalled();
    await expireMicroAppSession('https://business.example/login');
    expect(mocks.clear).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith(
      'https://business.example/login',
    );
    expect(mocks.clearHost).toHaveBeenCalledTimes(1);
    expect(mocks.clearLogin).toHaveBeenCalledTimes(1);
    expect(mocks.clear.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.navigate.mock.invocationCallOrder[0],
    );
  });

  it('宿主清理尚未返回时用户完成导航，旧失效事件不覆盖新页面', async () => {
    let finishClear!: () => void;
    mocks.clearHost.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishClear = resolve;
        }),
    );
    const pending = expireMicroAppSession('https://business.example/login');
    window.history.replaceState({}, '', '/home?new-session=1');
    finishClear();
    await pending;
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
