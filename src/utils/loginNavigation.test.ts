import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigateAfterLogin, replaceLoginStep } from './loginNavigation';

// 使用浏览器 History，而非只断言导航函数的 mock 入参。
const history = {
  replace(url: string, state?: Record<string, unknown>) {
    window.history.replaceState(state ?? null, '', url);
  },
  go(delta: number) {
    window.history.go(delta);
  },
};

function enterLogin(redirect = '-1') {
  window.history.replaceState(null, '', '/entry');
  window.history.pushState(null, '', '/workspace?tab=agents#current');
  window.history.pushState(
    null,
    '',
    `/login?redirect=${encodeURIComponent(redirect)}`,
  );
}

function waitForBackNavigation() {
  return new Promise<void>((resolve) => {
    window.addEventListener('popstate', () => resolve(), { once: true });
  });
}

describe('登录步骤导航', () => {
  const navigateToAuthUrl = vi.fn();

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => window.history.replaceState(null, '', '/'));

  it.each(['password', 'code'] as const)(
    '%s 登录成功的 -1 返回原业务页面，不返回登录步骤',
    async (method) => {
      enterLogin();
      if (method === 'code') {
        replaceLoginStep(history, 'verify-code', '-1', {
          phoneOrEmail: 'test@example.com',
        });
        expect(window.location.pathname).toBe('/verify-code');
        expect(window.history.state).toEqual({
          phoneOrEmail: 'test@example.com',
        });
      }

      const navigation = waitForBackNavigation();
      navigateAfterLogin(history, '-1', null, navigateToAuthUrl);
      await navigation;

      expect(
        window.location.pathname +
          window.location.search +
          window.location.hash,
      ).toBe('/workspace?tab=agents#current');
      expect(navigateToAuthUrl).not.toHaveBeenCalled();
    },
  );

  it('验证码页面返回登录后再进入验证码，仍保持原业务偏移', async () => {
    enterLogin();
    const originalLength = window.history.length;
    replaceLoginStep(history, 'verify-code', '-1');
    replaceLoginStep(history, 'login', '-1');
    expect(window.location.pathname + window.location.search).toBe(
      '/login?redirect=-1',
    );
    replaceLoginStep(history, 'verify-code', '-1');
    expect(window.history.length).toBe(originalLength);

    const navigation = waitForBackNavigation();
    navigateAfterLogin(history, '-1', null, navigateToAuthUrl);
    await navigation;
    expect(window.location.pathname).toBe('/workspace');
  });

  it('验证码登录保留 -2 的业务历史偏移，优先于后端跳转', async () => {
    enterLogin('-2');
    replaceLoginStep(history, 'verify-code', '-2');

    const navigation = waitForBackNavigation();
    navigateAfterLogin(
      history,
      '-2',
      'https://tenant.example/home',
      navigateToAuthUrl,
    );
    await navigation;
    expect(window.location.pathname).toBe('/entry');
    expect(navigateToAuthUrl).not.toHaveBeenCalled();
  });

  it('显式业务路径在登录步骤往返中保留查询和 hash', () => {
    const redirect = '/workspace?tab=agents#current';
    enterLogin(redirect);
    replaceLoginStep(history, 'verify-code', redirect);
    replaceLoginStep(history, 'login', redirect);
    expect(new URLSearchParams(window.location.search).get('redirect')).toBe(
      redirect,
    );
    replaceLoginStep(history, 'verify-code', redirect);
    navigateAfterLogin(history, redirect, null, navigateToAuthUrl);
    expect(
      window.location.pathname + window.location.search + window.location.hash,
    ).toBe(redirect);
  });

  it('后端绝对地址仍优先于显式业务路径，交给宿主认证导航', () => {
    enterLogin('/workspace');
    const target = 'https://tenant.example/workspace?tab=agents';
    navigateAfterLogin(history, '/workspace', target, navigateToAuthUrl);
    expect(navigateToAuthUrl).toHaveBeenCalledWith(target);
  });

  it('没有 redirect 时替换到首页', () => {
    enterLogin();
    replaceLoginStep(history, 'verify-code', null);
    expect(window.location.pathname + window.location.search).toBe(
      '/verify-code',
    );
    navigateAfterLogin(history, null, null, navigateToAuthUrl);
    expect(window.location.pathname).toBe('/');
  });
});
