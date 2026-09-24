import { SUCCESS_CODE } from '@/constants/codes.constants';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
});
