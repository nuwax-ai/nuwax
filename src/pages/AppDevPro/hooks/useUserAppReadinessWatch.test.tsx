import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { readiness } = vi.hoisted(() => ({
  readiness: vi.fn(),
}));

vi.mock('../services/appDevPro', () => ({
  apiUserAppReadiness: (...args: unknown[]) => readiness(...args),
  isUserAppReadinessAccessible: (
    data?: { ready?: boolean; status?: string } | null,
  ) => !!data && data.status === 'ready' && data.ready === true,
}));

vi.mock('../services/appDb', () => ({
  UserAppDbEnvEnum: { Dev: 'dev', Prod: 'prod' },
}));

import { UserAppDbEnvEnum } from '../services/appDb';
import { useUserAppReadinessWatch } from './useUserAppReadinessWatch';

const payload = (containerStatus: string) => ({
  code: '0000',
  data: {
    ready: false,
    status: 'starting',
    container: { status: containerStatus },
  },
});

describe('ensure 之后的容器 running 等待', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('主动探测还不是 running 时，忽略旧回包，等后续轮询', async () => {
    const responses: Array<(value: unknown) => void> = [];
    readiness.mockImplementation(
      () =>
        new Promise((resolve) => {
          responses.push(resolve);
        }),
    );

    const { result } = renderHook(() =>
      useUserAppReadinessWatch(9, UserAppDbEnvEnum.Dev, true),
    );

    let pending!: Promise<boolean>;
    act(() => {
      pending = result.current.waitUntilContainerRunning(UserAppDbEnvEnum.Dev);
      result.current.continuePolling();
    });

    let released = false;
    void pending.then((running) => {
      if (running) {
        released = true;
      }
    });

    // ensure 之前已经发出的回包，即使容器是 running 也不能放行
    await act(async () => {
      responses[0]?.(payload('running'));
      await Promise.resolve();
    });
    expect(released).toBe(false);

    // 重打的这一次还在启动
    await act(async () => {
      responses[1]?.(payload('starting'));
      await Promise.resolve();
    });
    expect(released).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await act(async () => {
      responses[2]?.(payload('running'));
      await Promise.resolve();
    });
    await act(async () => {
      await expect(pending).resolves.toBe(true);
    });
    expect(released).toBe(true);
  });

  it('下一次轮询才返回应用状态，当前槽位不算', async () => {
    const responses: Array<(value: unknown) => void> = [];
    readiness.mockImplementation(
      () =>
        new Promise((resolve) => {
          responses.push(resolve);
        }),
    );
    const { result } = renderHook(() =>
      useUserAppReadinessWatch(9, UserAppDbEnvEnum.Dev, true),
    );

    await act(async () => {
      responses[0]?.({
        code: '0000',
        data: {
          ready: false,
          status: 'starting',
          container: { status: 'running' },
        },
      });
      await Promise.resolve();
    });

    let next!: Promise<{ status?: string } | null>;
    act(() => {
      next = result.current.waitForNextPoll(UserAppDbEnvEnum.Dev);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await act(async () => {
      responses[1]?.({
        code: '0000',
        data: {
          ready: true,
          status: 'ready',
          container: { status: 'running' },
        },
      });
      await Promise.resolve();
    });
    await act(async () => {
      await expect(next).resolves.toMatchObject({ status: 'ready' });
    });
  });
});
