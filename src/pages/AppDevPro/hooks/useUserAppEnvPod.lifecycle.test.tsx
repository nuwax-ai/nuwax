import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { ensurePod, keepalivePod } = vi.hoisted(() => ({
  ensurePod: vi.fn(),
  keepalivePod: vi.fn(),
}));
vi.mock('@/services/vncDesktop', () => ({
  apiEnsurePod: (...args: unknown[]) => ensurePod(...args),
  apiKeepalivePod: (...args: unknown[]) => keepalivePod(...args),
  isEnsurePodThrottledError: (error: unknown) => error === 'throttled',
}));
vi.mock('../services/appDb', () => ({
  UserAppDbEnvEnum: { Dev: 'dev', Prod: 'prod' },
}));

import {
  __resetForTest,
  handleHostActivityPayload,
} from '@/services/hostVisibility';
import { UserAppDbEnvEnum } from '../services/appDb';
import { useUserAppEnvPod } from './useUserAppEnvPod';

describe('环境保活真实 React / ahooks 生命周期', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetForTest();
    vi.useFakeTimers();
    keepalivePod.mockResolvedValue({ code: '0000' });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each(['success', 'throttled'])(
    '卸载后的迟到 %s 不得重新启动保活',
    async (outcome) => {
      let resolve!: (value: object) => void;
      let reject!: (error: unknown) => void;
      ensurePod.mockReturnValue(
        new Promise((done, fail) => {
          resolve = done;
          reject = fail;
        }),
      );
      const { result, unmount } = renderHook(() =>
        useUserAppEnvPod(7001, UserAppDbEnvEnum.Dev),
      );
      let pending!: Promise<boolean>;
      act(() => {
        pending = result.current.ensure();
      });
      unmount();
      await act(async () => {
        if (outcome === 'success') resolve({ code: '0000' });
        else reject('throttled');
        expect(await pending).toBe(false);
        await vi.advanceTimersByTimeAsync(120_000);
      });
      expect(keepalivePod).not.toHaveBeenCalled();
    },
  );

  it('正常接入保留 60 秒保活，卸载后停止后续查询', async () => {
    ensurePod.mockResolvedValue({ code: '0000' });
    const { result, unmount } = renderHook(() =>
      useUserAppEnvPod(7001, UserAppDbEnvEnum.Dev),
    );
    await act(async () => {
      expect(await result.current.ensure()).toBe(true);
    });
    expect(keepalivePod).toHaveBeenCalledTimes(1);
    // 宿主 UI 暂停不取消运行任务所需的容器心跳。
    act(() => handleHostActivityPayload({ visible: false }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(keepalivePod).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });
    expect(keepalivePod).toHaveBeenCalledTimes(2);
  });
});
