import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConversationStopRequest } from './useConversationStopRequest';

describe('V1 停止请求等待', () => {
  it('成功等待终态、重复点击去重，终态或切页清除等待', async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ id, active }) => useConversationStopRequest(id, active, request),
      { initialProps: { id: 1, active: true } },
    );
    await act(async () => {
      const first = result.current.stop(1);
      expect(result.current.stop(1)).toBe(first);
      await first;
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(result.current.isStopping).toBe(true);
    rerender({ id: 1, active: false });
    expect(result.current.isStopping).toBe(false);
    rerender({ id: 2, active: true });
    expect(result.current.isStopping).toBe(false);
  });
  it('旧会话失败与误传旧 ID 不影响当前停止', async () => {
    let reject!: (reason: Error) => void;
    const request = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_, fail) => {
            reject = fail;
          }),
      )
      .mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ id }) => useConversationStopRequest(id, true, request),
      { initialProps: { id: 1 } },
    );
    let old!: Promise<unknown>;
    await act(async () => {
      old = result.current.stop(1);
    });
    rerender({ id: 2 });
    await act(async () => {
      await result.current.stop(1);
      await result.current.stop(2);
    });
    await act(async () => {
      reject(new Error('old'));
      await expect(old).rejects.toThrow('old');
    });
    expect(result.current.isStopping).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('失败后解除锁允许重试', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useConversationStopRequest(1, true, request),
    );
    await act(async () => {
      await expect(result.current.stop(1)).rejects.toThrow('failed');
    });
    expect(result.current.isStopping).toBe(false);
    await act(async () => {
      await result.current.stop(1);
    });
    expect(request).toHaveBeenCalledTimes(2);
  });
});
