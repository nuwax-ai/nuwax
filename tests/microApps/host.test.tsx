import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  auth: vi.fn(async () => true),
  expire: vi.fn(async () => undefined),
  history: {
    push: vi.fn(),
    replace: vi.fn(),
    location: { pathname: '/repo', search: '', hash: '' },
  },
}));
vi.mock('qiankun', () => ({ loadMicroApp: mocks.load }));
vi.mock('umi', () => ({ history: mocks.history }));
vi.mock('@/utils/businessAuth', () => ({
  prepareMicroAppAuthSession: mocks.auth,
}));
vi.mock('@/services/microAppAuth', () => ({
  expireMicroAppSession: mocks.expire,
}));
vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/layouts/MicroAppHost/index.less', () => ({
  default: { container: 'micro-app-container' },
}));

import MicroAppHost from '@/layouts/MicroAppHost';
import { microAppHostStore } from '@/layouts/MicroAppHost/store';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';

beforeEach(() => {
  mocks.load.mockReset();
  mocks.auth.mockResolvedValue(true);
  mocks.history.push.mockClear();
  mocks.history.replace.mockClear();
  mocks.expire.mockClear();
  mocks.load.mockImplementation(() => ({
    mountPromise: Promise.resolve(),
    update: vi.fn(async () => undefined),
    unmount: vi.fn(async () => undefined),
  }));
  microAppHostStore.invalidateAll();
});
afterEach(() => {
  act(() => microAppHostStore.invalidateAll());
  cleanup();
});

describe('持久微应用宿主', () => {
  it('切到主站再回来复用容器和实例，仅同步可见性', async () => {
    microAppHostStore.activate({ name: 'nuwax-repo-web', path: '/repo/doc/a' });
    const view = render(<MicroAppHost />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    const container = view.container.querySelector('[data-micro-app]');
    const handle = mocks.load.mock.results[0].value;
    act(() => microAppHostStore.deactivate('nuwax-repo-web'));
    expect(container).toHaveStyle({ display: 'none' });
    act(() =>
      microAppHostStore.activate({ name: 'nuwax-repo-web', path: '/repo' }),
    );
    await waitFor(() =>
      expect(handle.update).toHaveBeenCalledWith({
        path: '/repo/doc/a',
        active: true,
      }),
    );
    expect(view.container.querySelector('[data-micro-app]')).toBe(container);
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(handle.unmount).not.toHaveBeenCalled();
  });

  it('会话失效后释放常驻应用', async () => {
    microAppHostStore.activate({ name: 'nuwax-repo-web', path: '/repo' });
    const view = render(<MicroAppHost />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    const handle = mocks.load.mock.results[0].value;
    act(() => eventBus.emit(EVENT_NAMES.AUTH_SESSION_CLEARED));
    await waitFor(() => expect(handle.unmount).toHaveBeenCalledTimes(1));
    expect(view.container.querySelector('[data-micro-app]')).toBeNull();
  });

  it('子应用只能在激活时回写自己域内路由', async () => {
    microAppHostStore.activate({ name: 'nuwax-repo-web', path: '/repo' });
    render(<MicroAppHost />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    const navigate = mocks.load.mock.calls[0][0].props.onNavigate;
    navigate('/repo/doc/b');
    navigate('//evil.example/repo/doc/b');
    navigate('/home');
    expect(mocks.history.push).toHaveBeenCalledTimes(1);
    expect(mocks.history.push).toHaveBeenCalledWith('/repo/doc/b');
    act(() => microAppHostStore.deactivate('nuwax-repo-web'));
    navigate('/repo/doc/c');
    expect(mocks.history.push).toHaveBeenCalledTimes(1);
    act(() => microAppHostStore.invalidateAll());
    navigate('/repo/doc/d');
    expect(mocks.history.push).toHaveBeenCalledTimes(1);
  });

  it('失效回调交给主站清理，卸载后晚到的回调不影响新会话', async () => {
    microAppHostStore.activate({
      name: 'nuwax-im-web',
      path: '/instant-message',
    });
    render(<MicroAppHost />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    const expired = mocks.load.mock.calls[0][0].props.onAuthExpired;
    expired('https://example.com/login');
    expect(mocks.expire).toHaveBeenCalledTimes(1);
    act(() => microAppHostStore.invalidateAll());
    expired('https://example.com/login');
    expect(mocks.expire).toHaveBeenCalledTimes(1);
  });

  it('加载失败可重试，重新创建一次有效实例', async () => {
    mocks.load.mockImplementationOnce(() => {
      throw new Error('资源下载失败');
    });
    microAppHostStore.activate({ name: 'nuwax-repo-web', path: '/repo/doc/a' });
    const view = render(<MicroAppHost />);
    await waitFor(() => expect(view.getByRole('alert')).toBeInTheDocument());
    fireEvent.click(view.getByRole('button'));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(view.queryByRole('alert')).toBeNull());
    expect(mocks.load.mock.calls[1][0].props.path).toBe('/repo/doc/a');
  });

  it('同步宿主 Cookie 途中登出，晚到的同步结果不创建应用', async () => {
    let resolveAuth!: (ready: boolean) => void;
    mocks.auth.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          resolveAuth = resolve;
        }),
    );
    microAppHostStore.activate({
      name: 'nuwax-im-web',
      path: '/instant-message',
    });
    render(<MicroAppHost />);
    await waitFor(() => expect(resolveAuth).toBeDefined());
    act(() => eventBus.emit(EVENT_NAMES.AUTH_SESSION_CLEARED));
    await act(async () => resolveAuth(true));
    expect(mocks.load).not.toHaveBeenCalled();
  });
});
