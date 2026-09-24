import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  finishBusinessLogin,
  getBusinessRequestAuth,
  restoreBusinessAuthSession,
} from './businessAuth';
import { resetDesktopShellPreviewRuntimeForTest } from './desktopShellPreview';
import { isDesktopHost } from './hostBridge';

const originalBase = process.env.BASE_URL;
const originalNodeEnv = process.env.NODE_ENV;
const originalToken = localStorage.getItem('ACCESS_TOKEN');

function setPage(origin: string, bridge?: object): void {
  const url = new URL(origin);
  vi.stubGlobal('window', {
    location: {
      origin: url.origin,
      hostname: url.hostname,
      port: url.port,
      search: '',
    },
    ...(bridge ? { NuwaClawBridge: bridge } : {}),
  });
}

afterEach(() => {
  resetDesktopShellPreviewRuntimeForTest();
  vi.unstubAllGlobals();
  process.env.BASE_URL = originalBase;
  process.env.NODE_ENV = originalNodeEnv;
  if (originalToken === null) localStorage.removeItem('ACCESS_TOKEN');
  else localStorage.setItem('ACCESS_TOKEN', originalToken);
});

describe('业务鉴权环境', () => {
  it.each([
    'http://localhost:3000',
    'http://localhost:3333',
    'http://127.0.0.1:4200',
  ])('Umi 开发服务 %s 登录后保留 Token，启动恢复不清理它', async (origin) => {
    process.env.NODE_ENV = 'development';
    setPage(origin);
    process.env.BASE_URL = 'https://biz.example.com';

    expect(await finishBusinessLogin('new-token')).toBe('ready');
    expect(await restoreBusinessAuthSession()).toBe(true);
    expect(localStorage.getItem('ACCESS_TOKEN')).toBe('new-token');
    expect(
      getBusinessRequestAuth('https://biz.example.com/api/user/getLoginInfo'),
    ).toEqual({
      credentials: 'same-origin',
      headers: { Authorization: 'Bearer new-token' },
    });
    expect(getBusinessRequestAuth('https://other.example.com/api')).toEqual({
      credentials: 'same-origin',
      headers: {},
    });
    expect(getBusinessRequestAuth(`${new URL(origin).origin}/api`)).toEqual({
      credentials: 'same-origin',
      headers: {},
    });
  });

  it('本地调试登录没有返回 Token 时清理旧 Token 并保持未登录', async () => {
    process.env.NODE_ENV = 'development';
    setPage('http://localhost:3001');
    localStorage.setItem('ACCESS_TOKEN', 'stale-token');
    expect(await finishBusinessLogin(undefined)).toBe('missing-dev-token');
    expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
    expect(await restoreBusinessAuthSession()).toBe(false);
  });

  it('本地浏览器的桌面外观预览仍使用 Token，不清理登录态', async () => {
    process.env.NODE_ENV = 'development';
    setPage('http://localhost:3000');
    window.location.search = '?__desktop_shell_preview=windows';
    process.env.BASE_URL = 'https://biz.example.com';
    localStorage.setItem('ACCESS_TOKEN', 'dev-token');

    expect(isDesktopHost()).toBe(true);
    expect(getBusinessRequestAuth('https://biz.example.com/api')).toEqual({
      credentials: 'same-origin',
      headers: { Authorization: 'Bearer dev-token' },
    });
    expect(await restoreBusinessAuthSession()).toBe(true);
    expect(localStorage.getItem('ACCESS_TOKEN')).toBe('dev-token');
  });

  it('Nuwax 宿主即使加载 Umi 开发服务也只同步 Cookie', async () => {
    process.env.NODE_ENV = 'development';
    const syncSession = vi.fn(async () => true);
    setPage('http://localhost:3003', {
      host: { getProduct: () => 'nuwax' },
      auth: { syncSession },
    });
    process.env.BASE_URL = 'https://biz.example.com';
    localStorage.setItem('ACCESS_TOKEN', 'old-token');

    expect(await finishBusinessLogin('backend-token')).toBe('ready');
    expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
    expect(syncSession).toHaveBeenCalledOnce();
    expect(getBusinessRequestAuth('https://biz.example.com/api')).toEqual({
      credentials: 'include',
      headers: {},
    });
    expect(await restoreBusinessAuthSession()).toBe(true);
    expect(syncSession).toHaveBeenCalledTimes(2);
  });

  it.each(['http://localhost:3000', 'https://biz.example.com'])(
    '非 Umi 开发服务的 %s 使用浏览器 Cookie，不发送旧 Token',
    async (origin) => {
      process.env.NODE_ENV = 'production';
      setPage(origin);
      process.env.BASE_URL = 'https://biz.example.com';
      localStorage.setItem('ACCESS_TOKEN', 'old-token');

      expect(await finishBusinessLogin('backend-token')).toBe('ready');
      expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
      expect(getBusinessRequestAuth('https://biz.example.com/api')).toEqual({
        credentials: 'include',
        headers: {},
      });
    },
  );

  describe('业务 Cookie 请求范围（合并自 businessCookie）', () => {
    it('线上同源：相对路径与业务域名带 Cookie，其它域名 omit', () => {
      process.env.NODE_ENV = 'production';
      setPage('https://biz.example.com');
      process.env.BASE_URL = '';

      expect(
        getBusinessRequestAuth('/api/user/getLoginInfo').credentials,
      ).toBe('include');
      expect(
        getBusinessRequestAuth('https://biz.example.com/api/f/image').credentials,
      ).toBe('include');
      expect(
        getBusinessRequestAuth('https://other.example.com/api/f/image')
          .credentials,
      ).toBe('omit');
    });

    it('本地配置的跨源业务 API 域名才带 Cookie', () => {
      process.env.NODE_ENV = 'production';
      setPage('http://localhost:3000');
      process.env.BASE_URL = 'https://biz.example.com';

      expect(
        getBusinessRequestAuth('https://biz.example.com/api/user/getLoginInfo')
          .credentials,
      ).toBe('include');
      expect(getBusinessRequestAuth('http://localhost:3000/other').credentials).toBe(
        'omit',
      );
    });

    it('受保护图片地址保持真实 URL，由 Cookie 鉴权加载', () => {
      process.env.NODE_ENV = 'production';
      setPage('https://biz.example.com');
      process.env.BASE_URL = '';

      expect(useAuthProtectedImageSrc('/api/f/image.png').displaySrc).toBe(
        '/api/f/image.png',
      );
    });
  });
});
