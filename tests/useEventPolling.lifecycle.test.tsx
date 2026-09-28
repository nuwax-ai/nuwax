import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { collect, clear, emit } = vi.hoisted(() => ({
  collect: vi.fn(),
  clear: vi.fn(),
  emit: vi.fn(),
}));
vi.mock('umi', async () => {
  const { useRealUmiRequest } = await import('./helpers/useRealUmiRequest');
  return { useRequest: useRealUmiRequest };
});
vi.mock('@/services/event', () => ({
  apiCollectEvent: collect,
  apiClearEvent: clear,
}));
vi.mock('@/services/account', () => ({ apiUserInfo: vi.fn() }));
vi.mock('@/utils/router', () => ({
  isChatTemp: () => false,
  redirectToLogin: vi.fn(),
}));
vi.mock('@/utils/authNavigation', () => ({ navigateToAuthUrl: vi.fn() }));
vi.mock('@/constants/home.constants', () => ({
  APP_VERSION: 'appVersion',
  GLOBAL_POLLING_INTERVAL: 5000,
  USER_INFO: 'userInfo',
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/eventBus', () => ({
  default: { emit },
  EVENT_NAMES: { AUTH_SESSION_CLEARED: 'auth_session_cleared' },
}));
vi.mock('antd', () => ({
  Modal: { useModal: () => [{ confirm: vi.fn() }, null] },
}));

import useEventPolling from '@/hooks/useEventPolling';
import {
  __resetForTest,
  handleHostActivityPayload,
} from '@/services/hostVisibility';
import { UserService } from '@/services/userService';
import { EVENT_NAMES } from '@/utils/eventBus';

const empty = { code: '0000', data: { hasEvent: false, eventList: [] } };
const events = {
  code: '0000',
  data: {
    hasEvent: true,
    eventList: [{ type: 'test-event', event: { id: 1 } }],
  },
};
const login = () => UserService.saveUserInfoToStorage({ id: 1 });
const emissionsFor = (type: string) =>
  emit.mock.calls.filter(([eventName]) => eventName === type);

describe('全局通知真实 React / Umi request 生命周期', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    __resetForTest();
    UserService.clearUserInfo();
    collect.mockResolvedValue(empty);
    clear.mockResolvedValue({ code: '0000' });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('未登录挂载不首跑，也不在可见页反复重试', async () => {
    renderHook(() => useEventPolling());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(collect).not.toHaveBeenCalled();
  });

  it('已登录保持正常轮询，宿主隐藏与 document 隐藏暂停，恢复立即查询', async () => {
    login();
    renderHook(() => useEventPolling());
    await act(async () => {
      await Promise.resolve();
    });
    expect(collect).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(collect).toHaveBeenCalledTimes(2);
    act(() => handleHostActivityPayload({ visible: false }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(collect).toHaveBeenCalledTimes(2);
    await act(async () => {
      handleHostActivityPayload({ visible: true });
    });
    expect(collect).toHaveBeenCalledTimes(3);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(collect).toHaveBeenCalledTimes(3);
    hidden.mockReturnValue(false);
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(collect).toHaveBeenCalledTimes(4);
  });

  it.each(['logout', 'unmount'])(
    '事件清理在 %s 后迟到完成不会复活轮询',
    async (ending) => {
      login();
      collect.mockResolvedValue(events);
      let resolve!: (value: object) => void;
      clear.mockReturnValue(
        new Promise((done) => {
          resolve = done;
        }),
      );
      const { unmount } = renderHook(() => useEventPolling());
      await act(async () => {
        await Promise.resolve();
      });
      expect(emissionsFor('test-event')).toHaveLength(1);
      expect(clear).toHaveBeenCalledTimes(1);
      act(() => {
        if (ending === 'logout') UserService.logout();
        else unmount();
      });
      await act(async () => {
        resolve({ code: '0000' });
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(collect).toHaveBeenCalledTimes(1);
      expect(emissionsFor('test-event')).toHaveLength(1);
      expect(emissionsFor(EVENT_NAMES.AUTH_SESSION_CLEARED)).toHaveLength(
        ending === 'logout' ? 1 : 0,
      );
    },
  );

  it('旧登录会话的 clear 不能干扰重新登录后的轮询', async () => {
    login();
    collect.mockResolvedValueOnce(events).mockResolvedValue(empty);
    let resolve!: (value: object) => void;
    clear.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderHook(() => useEventPolling());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      UserService.logout();
      login();
    });
    expect(emissionsFor(EVENT_NAMES.AUTH_SESSION_CLEARED)).toHaveLength(1);
    expect(emissionsFor('test-event')).toHaveLength(1);
    expect(collect).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolve({ code: '0000' });
      await Promise.resolve();
    });
    expect(collect).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(collect).toHaveBeenCalledTimes(3);
  });

  it('清理期间隐藏再恢复，清理完成后继续查询且不并发', async () => {
    login();
    collect.mockResolvedValueOnce(events).mockResolvedValue(empty);
    let resolve!: (value: object) => void;
    clear.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    renderHook(() => useEventPolling());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      handleHostActivityPayload({ visible: false });
      handleHostActivityPayload({ visible: true });
    });
    expect(collect).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve({ code: '0000' });
      await Promise.resolve();
    });
    expect(collect).toHaveBeenCalledTimes(2);
  });
});
