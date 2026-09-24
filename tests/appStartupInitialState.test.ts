import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initI18n: vi.fn(),
  getUserInfo: vi.fn(),
  syncLangFromUserInfo: vi.fn(),
  queryMenus: vi.fn(),
  initialState: vi.fn(),
}));

vi.mock('umi', () => ({
  history: { location: { pathname: '/' } },
  useModel: mocks.initialState,
}));
vi.mock('@openuidev/devtools', () => ({ OpenUIDevtools: () => null }));
vi.mock('@/components/business-component/AppStartup/index.less', () => ({
  default: {},
}));
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
  hostBridge: { auth: { syncSession: vi.fn().mockResolvedValue(true) } },
  isDesktopHost: () => false,
  syncShellAvoidanceCss: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  initI18n: mocks.initI18n,
  syncLangFromUserInfo: mocks.syncLangFromUserInfo,
}));
vi.mock('@/services/userService', () => ({
  UserService: { getUserInfo: mocks.getUserInfo },
}));
vi.mock('@/services/menuService', () => ({ apiQueryMenus: mocks.queryMenus }));

import { getInitialState, innerProvider } from '@/app';

describe('首屏初始数据失败可恢复', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/home');
    localStorage.clear();
    mocks.initI18n.mockResolvedValue(undefined);
    mocks.getUserInfo.mockResolvedValue({ id: 1 });
    mocks.syncLangFromUserInfo.mockResolvedValue(undefined);
    mocks.queryMenus.mockResolvedValue({ code: '0000', data: [{ id: 1 }] });
    mocks.initialState.mockReturnValue({ error: undefined });
  });

  it.each(['getUserInfo', 'syncLangFromUserInfo', 'queryMenus'] as const)(
    '%s 意外失败交给启动兜底，Cookie 模式清除旧 token',
    async (step) => {
      localStorage.setItem('ACCESS_TOKEN', 'existing-token');
      const failure = new Error('server payload must not appear in UI');
      mocks[step].mockRejectedValue(failure);
      await expect(getInitialState()).rejects.toBe(failure);
      expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
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
