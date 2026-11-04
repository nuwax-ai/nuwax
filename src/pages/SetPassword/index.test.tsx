import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setPassword: vi.fn(),
  loadMenus: vi.fn(),
  navigate: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  search: '',
  state: null as { responseRedirectUrl?: string } | null,
}));

vi.mock('umi', () => ({
  history: { replace: mocks.replace, go: mocks.go },
  useLocation: () => ({ state: mocks.state }),
  useSearchParams: () => [new URLSearchParams(mocks.search)],
  useModel: (name: string) =>
    name === 'menuModel'
      ? { loadMenus: mocks.loadMenus }
      : { setTitle: vi.fn() },
}));
vi.mock('@/services/account', () => ({ apiSetPassword: mocks.setPassword }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/authNavigation', () => ({
  navigateToAuthUrl: mocks.navigate,
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/pages/Login/BasicLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./index.less', () => ({ default: {} }));

import SetPassword from './index';

async function submit() {
  fireEvent.change(document.querySelector('#login_password')!, {
    target: { value: 'Fixture123!' },
  });
  fireEvent.change(document.querySelector('#login_confirmPassword')!, {
    target: { value: 'Fixture123!' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'PC.Common.Global.confirm' }),
  );
}

describe('首次设置密码续接登录', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setPassword.mockReset().mockResolvedValue({ data: null });
    mocks.loadMenus.mockReset().mockResolvedValue(undefined);
    mocks.state = null;
    mocks.search = new URLSearchParams({
      redirect: '/auth/bind-or-register?token=fixture%2Bvalue%2525',
    }).toString();
  });

  it('请求失败留在本页，重试成功后完整返回绑定页', async () => {
    mocks.setPassword.mockRejectedValueOnce(new Error('fixture rejected'));
    render(<SetPassword />);
    await submit();
    await waitFor(() => expect(mocks.setPassword).toHaveBeenCalledTimes(1));
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.loadMenus).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'PC.Common.Global.confirm' }),
      ).not.toHaveClass('ant-btn-loading'),
    );
    await submit();
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith(
        '/auth/bind-or-register?token=fixture%2Bvalue%2525',
      ),
    );
    expect(mocks.setPassword).toHaveBeenCalledTimes(2);
    expect(mocks.loadMenus).toHaveBeenCalledTimes(1);
  });

  it('后端登录响应的跳转通过 history state 续接', async () => {
    mocks.state = { responseRedirectUrl: 'https://tenant.example/accepted' };
    render(<SetPassword />);
    await submit();
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith(
        'https://tenant.example/accepted',
      ),
    );
  });

  it('菜单收尾失败不泄漏异步回调拒绝，保留本页且不导航', async () => {
    mocks.loadMenus.mockRejectedValueOnce(new Error('fixture menus offline'));
    render(<SetPassword />);
    await submit();
    await waitFor(() => expect(mocks.loadMenus).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'PC.Common.Global.confirm' }),
      ).not.toHaveClass('ant-btn-loading'),
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
