import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  finishBusinessLogin,
  getBusinessRequestAuth,
  restoreBusinessAuthSession,
} from './businessAuth';

const originalBase = process.env.BASE_URL;
const originalDevFlag = process.env.NUWAX_UMI_DEV_SERVER;
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
  vi.unstubAllGlobals();
  process.env.BASE_URL = originalBase;
  if (originalDevFlag === undefined) delete process.env.NUWAX_UMI_DEV_SERVER;
  else process.env.NUWAX_UMI_DEV_SERVER = originalDevFlag;
  if (originalToken === null) localStorage.removeItem('ACCESS_TOKEN');
  else localStorage.setItem('ACCESS_TOKEN', originalToken);
});

describe('业务鉴权环境', () => {
  it.each([
    'http://localhost:3000',
    'http://localhost:3333',
    'http://127.0.0.1:4200',
  ])('Umi 开发服务 %s 登录后保留 Token，启动恢复不清理它', async (origin) => {
    process.env.NUWAX_UMI_DEV_SERVER = 'true';
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
    process.env.NUWAX_UMI_DEV_SERVER = 'true';
    setPage('http://localhost:3001');
    localStorage.setItem('ACCESS_TOKEN', 'stale-token');
    expect(await finishBusinessLogin(undefined)).toBe('missing-dev-token');
    expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
  });

  it('Nuwax 宿主即使加载 Umi 开发服务也只同步 Cookie', async () => {
    process.env.NUWAX_UMI_DEV_SERVER = 'true';
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
      process.env.NUWAX_UMI_DEV_SERVER = 'false';
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
});
