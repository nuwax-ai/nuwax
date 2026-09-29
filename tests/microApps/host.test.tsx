import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  auth: vi.fn(async () => true),
  expire: vi.fn(async () => undefined),
  loggedIn: true,
  loginListeners: new Set<() => void>(),
  collect: vi.fn(),
  clear: vi.fn(),
  history: {
    push: vi.fn(),
    replace: vi.fn(),
    location: { pathname: '/repo', search: '', hash: '' },
  },
}));
vi.mock('qiankun', () => ({ loadMicroApp: mocks.load }));
vi.mock('umi', async () => {
  const { useRealUmiRequest } = await import('../helpers/useRealUmiRequest');
  return { history: mocks.history, useRequest: useRealUmiRequest };
});
vi.mock('@/services/userService', () => ({
  getCurrentLoginStatus: () => mocks.loggedIn,
  subscribeLoginStatus: (listener: () => void) => {
    mocks.loginListeners.add(listener);
    return () => mocks.loginListeners.delete(listener);
  },
}));
vi.mock('@/services/event', () => ({
  apiCollectEvent: mocks.collect,
  apiClearEvent: mocks.clear,
}));
vi.mock('@/utils/businessAuth', () => ({
  prepareMicroAppAuthSession: mocks.auth,
}));
vi.mock('@/services/microAppAuth', () => ({
  expireMicroAppSession: mocks.expire,
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));
vi.mock('@/layouts/MicroAppHost/index.less', () => ({
  default: { container: 'micro-app-container' },
}));

import useEventPolling from '@/hooks/useEventPolling';
import MicroAppHost from '@/layouts/MicroAppHost';
import { microAppHostStore } from '@/layouts/MicroAppHost/store';
import { imUnreadState } from '@/services/imEventBridge';
import type { ImCustomEvent, ImUnreadEvent } from '@/types/interfaces/im';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';

const originalIm = window.__im;
const emptyBatch = { code: '0000', data: { hasEvent: false, eventList: [] } };
const finished: ImCustomEvent = {
  eventId: 'plat-evt-1-fa358c88-6901-47aa-8b49-767ee6f84b03',
  eventType: 'chat_finished',
  payload: {
    status: 'COMPLETE',
    conversationId: '1694593',
    requestId: '1baa8b26e86b475894f96597c321f698',
  },
  ts: 1790683041908,
};

function installImBridge(initialTotal = 0) {
  let total = initialTotal;
  const customSubscribers = new Set<(event: ImCustomEvent) => void>();
  const unreadSubscribers = new Set<(event: ImUnreadEvent) => void>();
  const customOff = vi.fn();
  const unreadOff = vi.fn();
  const onCustomEvent = vi.fn((callback: (event: ImCustomEvent) => void) => {
    customSubscribers.add(callback);
    return () => {
      customOff();
      customSubscribers.delete(callback);
    };
  });
  const onUnreadChange = vi.fn((callback: (event: ImUnreadEvent) => void) => {
    unreadSubscribers.add(callback);
    return () => {
      unreadOff();
      unreadSubscribers.delete(callback);
    };
  });
  window.__im = {
    onCustomEvent,
    customEventSubscriberCount: () => customSubscribers.size,
    onUnreadChange,
    getSnapshot: () => ({
      connState: 'connected',
      connected: true,
      unreadTotal: total,
      userId: '1',
    }),
  };
  return {
    onCustomEvent,
    onUnreadChange,
    customOff,
    unreadOff,
    emit(event = finished) {
      [...customSubscribers].forEach((callback) => callback(event));
    },
    unread(next: number) {
      total = next;
      [...unreadSubscribers].forEach((callback) => callback({ total: next }));
    },
  };
}

function activateMessage() {
  microAppHostStore.activate({
    name: 'nuwax-im-web',
    path: '/instant-message',
  });
}

beforeEach(() => {
  mocks.load.mockReset();
  mocks.auth.mockResolvedValue(true);
  mocks.history.push.mockClear();
  mocks.history.replace.mockClear();
  mocks.expire.mockClear();
  mocks.loggedIn = true;
  mocks.loginListeners.clear();
  mocks.collect.mockReset().mockResolvedValue(emptyBatch);
  mocks.clear.mockReset().mockResolvedValue({ code: '0000' });
  delete window.__im;
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
  eventBus.clear();
  window.__im = originalIm;
  vi.restoreAllMocks();
});

describe('IM 事件桥与未读展示生命周期', () => {
  it('只在已登录且消息挂载完成后订阅，读取未读快照初值', async () => {
    const bridge = installImBridge(120);
    let finishMount!: () => void;
    mocks.load.mockImplementationOnce(() => ({
      mountPromise: new Promise<void>((resolve) => {
        finishMount = resolve;
      }),
      unmount: vi.fn(async () => undefined),
    }));
    activateMessage();
    render(<MicroAppHost />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledOnce());
    expect(bridge.onCustomEvent).not.toHaveBeenCalled();
    expect(bridge.onUnreadChange).not.toHaveBeenCalled();
    await act(async () => finishMount());
    expect(bridge.onCustomEvent).toHaveBeenCalledOnce();
    expect(bridge.onUnreadChange).toHaveBeenCalledOnce();
    expect(imUnreadState.getSnapshot()).toBe(120);
  });

  it('未登录或其它微应用不注册消息监听', async () => {
    const bridge = installImBridge();
    mocks.loggedIn = false;
    activateMessage();
    const view = render(<MicroAppHost />);
    await waitFor(() => expect(view.queryByRole('status')).toBeNull());
    expect(bridge.onCustomEvent).not.toHaveBeenCalled();
    act(() => microAppHostStore.invalidateAll());
    mocks.loggedIn = true;
    act(() =>
      microAppHostStore.activate({ name: 'nuwax-repo-web', path: '/repo' }),
    );
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    expect(bridge.onCustomEvent).not.toHaveBeenCalled();
  });

  it('切换菜单保留唯一订阅，隐藏时仍分发所有自定义事件及未读变化', async () => {
    const bridge = installImBridge(1);
    const paid = vi.fn();
    eventBus.on('order_paid', paid);
    activateMessage();
    render(<MicroAppHost />);
    await waitFor(() => expect(bridge.onCustomEvent).toHaveBeenCalledOnce());
    act(() => microAppHostStore.deactivate('nuwax-im-web'));
    const payload = { orderId: 'order-1' };
    act(() => {
      bridge.emit({ eventId: 'paid-1', eventType: 'order_paid', payload });
      bridge.unread(100);
    });
    expect(paid).toHaveBeenCalledWith(payload);
    expect(imUnreadState.getSnapshot()).toBe(100);
    act(activateMessage);
    expect(bridge.onCustomEvent).toHaveBeenCalledOnce();
    expect(bridge.onUnreadChange).toHaveBeenCalledOnce();
    expect(bridge.customOff).not.toHaveBeenCalled();
    expect(mocks.collect).not.toHaveBeenCalled();
    expect(mocks.clear).not.toHaveBeenCalled();
  });

  it.each(['login-expired', 'session-cleared', 'unmount'])(
    '%s 立即退订并归零，旧回调在重新登录后仍不生效',
    async (ending) => {
      const bridge = installImBridge(12);
      const receive = vi.fn();
      eventBus.on(finished.eventType, receive);
      activateMessage();
      const view = render(<MicroAppHost />);
      await waitFor(() => expect(bridge.onCustomEvent).toHaveBeenCalledOnce());
      const oldEvent = bridge.onCustomEvent.mock.calls[0][0];
      const oldUnread = bridge.onUnreadChange.mock.calls[0][0];
      act(() => {
        if (ending === 'login-expired') {
          mocks.loggedIn = false;
          mocks.loginListeners.forEach((listener) => listener());
        } else if (ending === 'session-cleared') {
          eventBus.emit(EVENT_NAMES.AUTH_SESSION_CLEARED);
        } else view.unmount();
      });
      expect(bridge.customOff).toHaveBeenCalledOnce();
      expect(bridge.unreadOff).toHaveBeenCalledOnce();
      expect(imUnreadState.getSnapshot()).toBe(0);
      mocks.loggedIn = true;
      act(() => {
        oldEvent(finished);
        oldUnread({ total: 200 });
      });
      expect(receive).not.toHaveBeenCalled();
      expect(imUnreadState.getSnapshot()).toBe(0);
    },
  );

  it('显式重建重新订阅，旧挂载回调不能污染新挂载', async () => {
    const bridge = installImBridge(4);
    const receive = vi.fn();
    eventBus.on(finished.eventType, receive);
    activateMessage();
    render(<MicroAppHost />);
    await waitFor(() => expect(bridge.onCustomEvent).toHaveBeenCalledOnce());
    const oldEvent = bridge.onCustomEvent.mock.calls[0][0];
    const oldUnread = bridge.onUnreadChange.mock.calls[0][0];
    act(() => microAppHostStore.reload('nuwax-im-web'));
    await waitFor(() => expect(bridge.onCustomEvent).toHaveBeenCalledTimes(2));
    expect(window.__im?.customEventSubscriberCount?.()).toBe(1);
    expect(bridge.customOff).toHaveBeenCalledOnce();
    act(() => {
      oldEvent(finished);
      oldUnread({ total: 200 });
      bridge.emit();
    });
    expect(receive).toHaveBeenCalledOnce();
    expect(imUnreadState.getSnapshot()).toBe(4);
  });

  it('挂载结果在卸载后迟到，不注册监听', async () => {
    const bridge = installImBridge();
    let finishMount!: () => void;
    mocks.load.mockImplementationOnce(() => ({
      mountPromise: new Promise<void>((resolve) => {
        finishMount = resolve;
      }),
      unmount: vi.fn(async () => undefined),
    }));
    activateMessage();
    const view = render(<MicroAppHost />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledOnce());
    view.unmount();
    await act(async () => finishMount());
    expect(bridge.onCustomEvent).not.toHaveBeenCalled();
  });

  it('同一 payload 从两路进入处理器，只有 batch 清理，clear 在途不阻塞 IM', async () => {
    const bridge = installImBridge();
    const receive = vi.fn();
    eventBus.on(finished.eventType, receive);
    let finishBatch!: (value: object) => void;
    let finishClear!: (value: object) => void;
    mocks.collect.mockReturnValueOnce(
      new Promise((resolve) => {
        finishBatch = resolve;
      }),
    );
    mocks.clear.mockReturnValueOnce(
      new Promise((resolve) => {
        finishClear = resolve;
      }),
    );
    renderHook(() => useEventPolling());
    activateMessage();
    render(<MicroAppHost />);
    await waitFor(() => expect(bridge.onCustomEvent).toHaveBeenCalledOnce());
    act(() => bridge.emit());
    expect(receive).toHaveBeenCalledWith(finished.payload);
    expect(mocks.collect).toHaveBeenCalledOnce();
    expect(mocks.clear).not.toHaveBeenCalled();
    await act(async () =>
      finishBatch({
        code: '0000',
        data: {
          hasEvent: true,
          eventList: [{ type: finished.eventType, event: finished.payload }],
        },
      }),
    );
    expect(receive).toHaveBeenCalledTimes(2);
    expect(mocks.clear).toHaveBeenCalledOnce();
    act(() => bridge.emit());
    expect(receive).toHaveBeenCalledTimes(3);
    expect(
      receive.mock.calls.every(([payload]) => payload === finished.payload),
    ).toBe(true);
    expect(mocks.clear).toHaveBeenCalledOnce();
    await act(async () => finishClear({ code: '0000' }));
  });
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
