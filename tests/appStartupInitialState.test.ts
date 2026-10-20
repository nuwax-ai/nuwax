import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initI18n: vi.fn(),
  getUserInfo: vi.fn(),
  syncLangFromUserInfo: vi.fn(),
  queryMenus: vi.fn(),
  initialState: vi.fn(),
  loginStatus: null as boolean | null,
  pathname: '/home',
  fetchUserInfoFromServer: vi.fn(),
  setLoginStatusToCache: vi.fn(),
  clearLoginStatusCache: vi.fn(),
  runTenantConfig: vi.fn(),
  redirectToLogin: vi.fn(),
  isRoutePathHidden: vi.fn(),
  hostProduct: null as string | null,
  syncSession: vi.fn(),
}));

vi.mock('umi', () => ({
  history: { location: { pathname: '/' } },
  useModel: mocks.initialState,
  useLocation: () => ({ pathname: mocks.pathname }),
  Outlet: () => React.createElement('div', null, 'business page'),
}));
vi.mock('@openuidev/devtools', () => ({ OpenUIDevtools: () => null }));
vi.mock('@/components/business-component/AppStartup/index.less', () => ({
  default: {},
}));
vi.mock('@/components/custom/Loading/index.less', () => ({ default: {} }));
vi.mock('@/hooks/useEventPolling', () => ({ default: () => null }));
vi.mock('@/services/common', () => ({ request: {} }));
vi.mock('@/services/brandTheme', () => ({}));
vi.mock('@/services/unifiedThemeService', () => ({}));
vi.mock('@/layouts/workbenchHistoryBase', () => ({}));
vi.mock('@/features/client-shell', () => ({
  DesktopShellPreviewChrome: () => null,
  initClientShell: vi.fn(),
}));
vi.mock('@/utils/i18nAdapters', () => ({}));
vi.mock('@/utils/conversationV2Rollout', () => ({
  migrateConversationDefaultsToV2: vi.fn(),
}));
vi.mock('@/utils/directorySyncEvents', () => ({}));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    auth: { syncSession: mocks.syncSession },
    host: { getProduct: () => mocks.hostProduct },
  },
  isDesktopHost: () => false,
  syncShellAvoidanceCss: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  initI18n: mocks.initI18n,
  syncLangFromUserInfo: mocks.syncLangFromUserInfo,
}));
vi.mock('@/services/userService', () => ({
  UserService: {
    getUserInfo: mocks.getUserInfo,
    fetchUserInfoFromServer: mocks.fetchUserInfoFromServer,
  },
  getLoginStatusFromCache: () => mocks.loginStatus,
  setLoginStatusToCache: mocks.setLoginStatusToCache,
  clearLoginStatusCache: mocks.clearLoginStatusCache,
}));
vi.mock('@/services/menuService', () => ({ apiQueryMenus: mocks.queryMenus }));
vi.mock('@/utils/router', () => ({ redirectToLogin: mocks.redirectToLogin }));
vi.mock('@/utils/permission', () => ({
  isRoutePathHidden: mocks.isRoutePathHidden,
}));
vi.mock('@/pages/403', () => ({
  default: () => React.createElement('div', null, 'no permission'),
}));

import { getInitialState, innerProvider } from '@/app';
import AuthWithLoading from '@/wrappers/authWithLoading';

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/home');
  localStorage.clear();
  mocks.loginStatus = null;
  mocks.pathname = '/home';
  mocks.hostProduct = null;
  mocks.syncSession.mockResolvedValue(true);
  mocks.initI18n.mockResolvedValue(undefined);
  mocks.getUserInfo.mockResolvedValue({ id: 1 });
  mocks.fetchUserInfoFromServer.mockResolvedValue({ id: 1 });
  mocks.syncLangFromUserInfo.mockResolvedValue(undefined);
  mocks.queryMenus.mockResolvedValue({ code: '0000', data: [{ id: 1 }] });
  mocks.initialState.mockImplementation((name) =>
    name === 'tenantConfigInfo'
      ? { tenantConfigInfo: {}, runTenantConfig: mocks.runTenantConfig }
      : { error: undefined },
  );
  mocks.setLoginStatusToCache.mockImplementation((status: boolean) => {
    mocks.loginStatus = status;
  });
  mocks.clearLoginStatusCache.mockImplementation(() => {
    mocks.loginStatus = null;
  });
  mocks.isRoutePathHidden.mockReturnValue(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('首屏初始数据失败可恢复', () => {
  it('客户端宿主验证服务异常交给启动重试，不按未登录跳转', async () => {
    mocks.hostProduct = 'nuwax';
    mocks.syncSession.mockRejectedValue(
      new Error('Cookie session validation unavailable'),
    );
    await expect(getInitialState()).rejects.toThrow(
      'Cookie session validation unavailable',
    );
    expect(mocks.getUserInfo).not.toHaveBeenCalled();
    expect(mocks.clearLoginStatusCache).not.toHaveBeenCalled();
    expect(mocks.redirectToLogin).not.toHaveBeenCalled();
  });
  it.each(['getUserInfo', 'syncLangFromUserInfo', 'queryMenus'] as const)(
    '%s 意外失败交给启动兜底，Cookie 模式清除旧 token',
    async (step) => {
      localStorage.setItem('ACCESS_TOKEN', 'existing-token');
      const failure = new Error('server payload must not appear in UI');
      mocks[step].mockRejectedValue(failure);
      await expect(getInitialState()).rejects.toBe(failure);
      expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
      expect(mocks.setLoginStatusToCache).not.toHaveBeenCalled();
    },
  );

  it('i18n 初始化失败交给启动兜底，不继续执行鉴权流程', async () => {
    const failure = new Error('i18n failed');
    mocks.initI18n.mockRejectedValue(failure);
    await expect(getInitialState()).rejects.toBe(failure);
    expect(mocks.getUserInfo).not.toHaveBeenCalled();
  });

  it('请求层无 reason 拒绝也必须形成可见错误态', async () => {
    mocks.queryMenus.mockRejectedValue(undefined);
    await expect(getInitialState()).rejects.toThrow('App startup failed');
  });

  it('菜单意外业务失败不能吞为空菜单', async () => {
    mocks.queryMenus.mockResolvedValue({
      code: '9999',
      message: 'private payload',
    });
    await expect(getInitialState()).rejects.toThrow(
      'App startup menu request failed',
    );
  });

  it.each(['4010', '4011'])(
    '菜单 %s 已由业务处理，不遮挡登录跳转',
    async (code) => {
      mocks.queryMenus.mockResolvedValue({ code });
      await expect(getInitialState()).resolves.toEqual({ menuData: [] });
      expect(mocks.setLoginStatusToCache).not.toHaveBeenCalled();
    },
  );

  it('Umi 初始状态错误遮挡业务页面但不展示服务 payload', () => {
    mocks.initialState.mockReturnValue({ error: new Error('private payload') });
    render(innerProvider(React.createElement('div', null, 'business page')));
    expect(screen.getByRole('alert')).toHaveTextContent('应用加载失败');
    expect(screen.queryByText('private payload')).not.toBeInTheDocument();
    expect(screen.queryByText('business page')).not.toBeInTheDocument();
  });

  it('正常初始状态仍渲染原业务页面', () => {
    render(innerProvider(React.createElement('div', null, 'business page')));
    expect(screen.getByText('business page')).toBeInTheDocument();
  });

  it('正常结果保持菜单合同；已处理的未登录不变成启动错误', async () => {
    await expect(getInitialState()).resolves.toEqual({ menuData: [{ id: 1 }] });
    mocks.getUserInfo.mockResolvedValue(null);
    mocks.queryMenus.mockClear();
    await expect(getInitialState()).resolves.toEqual({ menuData: [] });
    expect(mocks.queryMenus).not.toHaveBeenCalled();
  });

  it('pending 请求由原请求自然恢复，不启动重复请求', async () => {
    let resolve: ((value: { id: number }) => void) | undefined;
    mocks.getUserInfo.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const result = getInitialState();
    await vi.waitFor(() => expect(mocks.getUserInfo).toHaveBeenCalledOnce());
    expect(mocks.queryMenus).not.toHaveBeenCalled();
    resolve?.({ id: 1 });
    await expect(result).resolves.toEqual({ menuData: [{ id: 1 }] });
    expect(mocks.getUserInfo).toHaveBeenCalledOnce();
    expect(mocks.queryMenus).toHaveBeenCalledOnce();
  });
});

describe('首屏启动与鉴权加载衔接', () => {
  it('初始化完成后首帧直接进入业务页，不再挂第二个加载页或重复校验', async () => {
    await getInitialState();
    expect(mocks.setLoginStatusToCache).toHaveBeenCalledWith(true);
    const html = renderToStaticMarkup(React.createElement(AuthWithLoading));
    expect(html).toContain('business page');
    expect(html).not.toContain('正在加载应用');

    render(React.createElement(AuthWithLoading));
    expect(screen.getByText('business page')).toBeInTheDocument();
    expect(mocks.fetchUserInfoFromServer).not.toHaveBeenCalled();
    expect(mocks.runTenantConfig).toHaveBeenCalledOnce();
  });

  it('已有有效登录缓存时，首帧不闪加载页', () => {
    mocks.loginStatus = true;
    const html = renderToStaticMarkup(React.createElement(AuthWithLoading));
    expect(html).toContain('business page');
    expect(html).not.toContain('正在加载应用');
    expect(html).not.toContain('PC.Common.Global.loading');
  });

  it('缺少登录缓存时沿用启动提示，校验完成立即显示页面，不强制等 500ms', async () => {
    vi.useFakeTimers();
    let resolve: (value: { id: number }) => void = () => {};
    mocks.fetchUserInfoFromServer.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    render(React.createElement(AuthWithLoading));
    expect(screen.getByRole('status')).toHaveTextContent('正在加载应用');
    expect(screen.queryByText('business page')).not.toBeInTheDocument();

    await act(async () => resolve({ id: 1 }));
    expect(screen.getByText('business page')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(mocks.fetchUserInfoFromServer).toHaveBeenCalledOnce();
  });

  it('认证失效交给服务层导航，路由不重复覆盖登录目标或露出业务页面', async () => {
    mocks.loginStatus = false;
    mocks.fetchUserInfoFromServer.mockResolvedValue(null);
    render(React.createElement(AuthWithLoading));
    await act(async () => {});
    expect(mocks.fetchUserInfoFromServer).toHaveBeenCalledOnce();
    expect(mocks.fetchUserInfoFromServer).toHaveBeenCalledWith();
    expect(mocks.redirectToLogin).not.toHaveBeenCalled();
    expect(screen.queryByText('business page')).not.toBeInTheDocument();
  });

  it('网络校验失败显示重试入口，保留会话且不露出业务页面', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.fetchUserInfoFromServer.mockRejectedValue(
      new Error('network failed'),
    );
    render(React.createElement(AuthWithLoading));
    await act(async () => {});
    expect(mocks.clearLoginStatusCache).not.toHaveBeenCalled();
    expect(mocks.redirectToLogin).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('应用加载失败');
    expect(
      screen.getByRole('button', { name: '重新加载' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('business page')).not.toBeInTheDocument();
  });

  it('鉴权期间卸载后，迟到响应不写缓存或触发跳转', async () => {
    let resolve: (value: { id: number }) => void = () => {};
    mocks.fetchUserInfoFromServer.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { unmount } = render(React.createElement(AuthWithLoading));
    unmount();
    await act(async () => resolve({ id: 1 }));
    expect(mocks.setLoginStatusToCache).not.toHaveBeenCalled();
    expect(mocks.redirectToLogin).not.toHaveBeenCalled();
  });

  it('免鉴权页面直接渲染，不额外校验登录', () => {
    mocks.pathname = '/login';
    render(React.createElement(AuthWithLoading));
    expect(screen.getByText('business page')).toBeInTheDocument();
    expect(mocks.fetchUserInfoFromServer).not.toHaveBeenCalled();
  });

  it('复用启动结果后仍保留租户页面权限限制', async () => {
    await getInitialState();
    mocks.isRoutePathHidden.mockReturnValue(true);
    render(React.createElement(AuthWithLoading));
    expect(screen.getByText('no permission')).toBeInTheDocument();
    expect(screen.queryByText('business page')).not.toBeInTheDocument();
  });
});
