import ImMenuBadge from '@/components/business-component/ImMenuBadge';
import {
  imUnreadState,
  subscribeImEvents,
  subscribeNativeImUnread,
} from '@/services/imEventBridge';
import type { HostImUnreadSnapshot } from '@/types/interfaces/im';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { OpenTypeEnum } from '@/types/menuPermission/menu-manage';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({
  loggedIn: true,
  listeners: new Set<() => void>(),
}));
vi.mock('@/services/userService', () => ({
  getCurrentLoginStatus: () => auth.loggedIn,
  subscribeLoginStatus: (listener: () => void) => {
    auth.listeners.add(listener);
    return () => auth.listeners.delete(listener);
  },
}));

const originalBridge = window.NuwaClawBridge;
const originalIm = window.__im;
const disposers: Array<() => void> = [];
const snapshot = (
  total: number,
  revision = 1,
  sessionGeneration = 1,
  dndTotal = 0,
): HostImUnreadSnapshot => ({ total, revision, sessionGeneration, dndTotal });
const menu = {
  code: 'message',
  path: '/instant-message',
  openType: OpenTypeEnum.CurrentTab,
} as MenuItemDto;
function install(total = 126) {
  let listener!: (value: HostImUnreadSnapshot | null) => void;
  const off = vi.fn();
  const read = vi.fn(async () => snapshot(total));
  const on = vi.fn((callback: typeof listener) => {
    listener = callback;
    return off;
  });
  const context = vi.fn(async () => ({
    businessOrigin: 'https://business.example',
    gatewayOrigin: window.location.origin,
    loadMode: 'gateway' as const,
  }));
  window.NuwaClawBridge = {
    host: { getProduct: () => 'nuwax' },
    auth: { getContext: context },
    im: { getUnreadSnapshot: read, onUnreadChanged: on },
  };
  return {
    read,
    on,
    off,
    context,
    emit: (value: HostImUnreadSnapshot | null) => listener(value),
  };
}
async function start(h: ReturnType<typeof install>) {
  disposers.push(subscribeNativeImUnread());
  await waitFor(() => expect(h.read).toHaveBeenCalledOnce());
}
function login(value: boolean) {
  act(() => {
    auth.loggedIn = value;
    auth.listeners.forEach((listener) => listener());
  });
}
beforeEach(() => {
  auth.loggedIn = true;
  window.__im = undefined;
});
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  cleanup();
  auth.listeners.clear();
  window.NuwaClawBridge = originalBridge;
  window.__im = originalIm;
});

describe('商业壳菜单未读', () => {
  it('未打开 IM 页面也读到已有未读；0 隐藏、99 显示 99、超过 99 显示 99+', async () => {
    const h = install();
    await start(h);
    const view = render(<ImMenuBadge menu={menu} />);
    await waitFor(() => expect(view.getByText('99+')).toBeInTheDocument());
    expect(window.__im).toBeUndefined();
    expect(h.on.mock.invocationCallOrder[0]).toBeLessThan(
      h.read.mock.invocationCallOrder[0],
    );
    act(() => h.emit(snapshot(99, 2)));
    expect(view.getByTitle('99')).toHaveAttribute('data-show', 'true');
    act(() => h.emit(snapshot(0, 3)));
    expect(view.container.querySelector('[data-show="true"]')).toBeNull();
    expect(imUnreadState.getSnapshot()).toBe(0);
    act(() => h.emit(snapshot(3, 4, 1, 2)));
    expect(view.getByTitle('5')).toHaveAttribute('data-show', 'true');
    act(() => h.emit(snapshot(1, 1)));
    expect(imUnreadState.getSnapshot()).toBe(5);
  });

  it('新账号代次优先；旧代次、非法计数不覆盖当前值', async () => {
    const h = install(5);
    await start(h);
    act(() => h.emit(snapshot(7, 1, 2)));
    act(() => h.emit(snapshot(99, 999, 1)));
    act(() => h.emit(snapshot(-1, 2, 2)));
    expect(imUnreadState.getSnapshot()).toBe(7);
  });

  it.each([null, snapshot(8, 2)])(
    '推送 %j 先到时，迟到的初始化快照不覆盖它',
    async (pushed) => {
      const h = install();
      let resolve!: (value: HostImUnreadSnapshot) => void;
      h.read.mockImplementation(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      );
      await start(h);
      act(() => h.emit(pushed));
      await act(async () => resolve(snapshot(126)));
      expect(imUnreadState.getSnapshot()).toBe(pushed?.total ?? 0);
    },
  );

  it('登出/清会话立即退订清零，旧回调和旧快照不能串到重新登录账号', async () => {
    const h = install(5);
    await start(h);
    const old = h.on.mock.calls[0][0];
    act(() => eventBus.emit(EVENT_NAMES.AUTH_SESSION_CLEARED));
    expect(h.off).toHaveBeenCalledOnce();
    expect(imUnreadState.getSnapshot()).toBe(0);
    act(() => old(snapshot(99, 999)));
    expect(imUnreadState.getSnapshot()).toBe(0);
    login(false);
    login(true);
    await waitFor(() => expect(h.read).toHaveBeenCalledTimes(2));
    act(() => h.emit(snapshot(2, 1, 2)));
    act(() => old(snapshot(98, 999)));
    expect(imUnreadState.getSnapshot()).toBe(2);
    login(false);
    expect(imUnreadState.getSnapshot()).toBe(0);
  });

  it('IM 挂载和卸载不覆盖壳层未读，仍保留自定义事件', async () => {
    const h = install(5);
    await start(h);
    const onUnreadChange = vi.fn(() => () => {});
    const onCustomEvent = vi.fn(() => () => {});
    window.__im = {
      onUnreadChange,
      onCustomEvent,
      getSnapshot: () => ({
        connState: 'connected',
        connected: true,
        unreadTotal: 99,
        userId: '1',
      }),
    };
    const off = subscribeImEvents();
    expect(onCustomEvent).toHaveBeenCalledOnce();
    expect(onUnreadChange).not.toHaveBeenCalled();
    off();
    expect(imUnreadState.getSnapshot()).toBe(5);
  });

  it.each(['nuwaclaw', 'browser'])('%s 不注册商业未读桥', (product) => {
    const h = install();
    window.NuwaClawBridge!.host!.getProduct = () => product;
    const dispose = subscribeNativeImUnread();
    dispose();
    expect(h.context).not.toHaveBeenCalled();
    expect(h.read).not.toHaveBeenCalled();
    expect(h.on).not.toHaveBeenCalled();
  });

  it('握手途中登出或卸载，不登记推送或读取快照', async () => {
    const h = install();
    let resolve!: (value: Awaited<ReturnType<typeof h.context>>) => void;
    h.context.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const dispose = subscribeNativeImUnread();
    login(false);
    dispose();
    await act(async () =>
      resolve({
        businessOrigin: 'https://business.example',
        gatewayOrigin: window.location.origin,
        loadMode: 'gateway',
      }),
    );
    expect(h.read).not.toHaveBeenCalled();
    expect(h.on).not.toHaveBeenCalled();
  });
});
