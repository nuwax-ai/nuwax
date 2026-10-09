import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUrlRetry } from './useUrlRetry';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe('VNC retry cancellation', () => {
  it('does not restore a retry timer from an in-flight check after reset', async () => {
    vi.useFakeTimers();
    let finish!: (value: { ok: boolean; status: number }) => void;
    const checkFn = () =>
      new Promise<{ ok: boolean; status: number }>((resolve) => {
        finish = resolve;
      });
    const retry = vi.fn();
    const { result } = renderHook(() => useUrlRetry({ checkFn }));
    const pending = result.current.checkWithRetry('/old-document', retry);
    act(() => {
      result.current.resetRetry();
    });
    finish({ ok: false, status: 404 });
    expect(await pending).toMatchObject({
      cancelled: true,
      shouldRetry: false,
    });
    await vi.advanceTimersByTimeAsync(60000);
    expect(retry).not.toHaveBeenCalled();
  });
});
