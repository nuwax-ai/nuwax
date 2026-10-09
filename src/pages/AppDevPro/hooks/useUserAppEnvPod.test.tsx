import { SUCCESS_CODE } from '@/constants/codes.constants';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAppDbEnvEnum } from '../services/appDb';
import { useUserAppEnvPod } from './useUserAppEnvPod';

const { mockEnsurePod, mockRunKeepalive, mockStopKeepalive } = vi.hoisted(
  () => ({
    mockEnsurePod: vi.fn(),
    mockRunKeepalive: vi.fn(),
    mockStopKeepalive: vi.fn(),
  }),
);

vi.mock('@/services/vncDesktop', () => ({
  apiEnsurePod: (...args: unknown[]) => mockEnsurePod(...args),
  apiKeepalivePod: vi.fn(),
  isEnsurePodThrottledError: () => false,
}));

vi.mock('../services/appDb', () => ({
  UserAppDbEnvEnum: { Dev: 'dev', Prod: 'prod' },
}));

vi.mock('ahooks', () => ({
  useRequest: () => ({
    run: mockRunKeepalive,
    cancel: mockStopKeepalive,
  }),
}));

describe('useUserAppEnvPod 常驻实例可见性', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('隐藏时停止容器保活，拒绝新 ensure；重新激活后可恢复', async () => {
    mockEnsurePod.mockResolvedValue({ code: SUCCESS_CODE });
    const { result, rerender } = renderHook(
      ({ active }) => useUserAppEnvPod(7001, UserAppDbEnvEnum.Dev, active),
      { initialProps: { active: true } },
    );

    await act(async () => {
      expect(await result.current.ensure()).toBe(true);
    });
    expect(mockEnsurePod).toHaveBeenCalledTimes(1);
    expect(mockRunKeepalive).toHaveBeenCalledWith(7001);

    rerender({ active: false });
    expect(mockStopKeepalive).toHaveBeenCalled();
    await act(async () => {
      expect(await result.current.ensure()).toBe(false);
    });
    expect(mockEnsurePod).toHaveBeenCalledTimes(1);

    rerender({ active: true });
    await act(async () => {
      expect(await result.current.ensure()).toBe(true);
    });
    expect(mockEnsurePod).toHaveBeenCalledTimes(2);
  });

  it('deferRunning 时接口成功只保持启动中，确认容器 running 后才保活', async () => {
    mockEnsurePod.mockResolvedValue({ code: SUCCESS_CODE });
    const { result } = renderHook(() =>
      useUserAppEnvPod(7001, UserAppDbEnvEnum.Dev),
    );

    await act(async () => {
      expect(await result.current.ensure(true, { deferRunning: true })).toBe(
        true,
      );
    });
    expect(result.current.status).toBe('starting');
    expect(mockRunKeepalive).not.toHaveBeenCalled();

    act(() => {
      result.current.confirmContainerRunning();
    });
    expect(result.current.status).toBe('running');
    expect(mockRunKeepalive).toHaveBeenCalledTimes(1);
    expect(mockRunKeepalive).toHaveBeenCalledWith(7001);
  });

  it('启动中可以先保活，确认 running 后不重复启动轮询', async () => {
    mockEnsurePod.mockResolvedValue({ code: SUCCESS_CODE });
    const { result } = renderHook(() =>
      useUserAppEnvPod(7001, UserAppDbEnvEnum.Dev),
    );

    await act(async () => {
      expect(await result.current.ensure(true, { deferRunning: true })).toBe(
        true,
      );
    });
    act(() => {
      result.current.keepAliveWhileStarting();
    });
    expect(result.current.status).toBe('starting');
    expect(mockRunKeepalive).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.confirmContainerRunning();
    });
    expect(result.current.status).toBe('running');
    expect(mockRunKeepalive).toHaveBeenCalledTimes(1);
  });
});
