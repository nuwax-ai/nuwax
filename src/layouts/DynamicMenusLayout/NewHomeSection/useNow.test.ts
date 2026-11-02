import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-26T10:00:00'));
  vi.resetModules();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('模块闲置和停表后重新挂载均立即返回当前时间', async () => {
  const { useNow } = await import('./useNow');
  vi.setSystemTime(new Date('2026-10-26T11:00:00'));
  const first = renderHook(() => useNow());
  expect(first.result.current).toBe(Date.now());
  first.unmount();
  expect(vi.getTimerCount()).toBe(0);

  vi.setSystemTime(new Date('2026-10-26T13:00:00'));
  const second = renderHook(() => useNow());
  expect(second.result.current).toBe(Date.now());
});

it('多行共用一个30秒时钟，最后一行卸载才停表', async () => {
  const { useNow } = await import('./useNow');
  const first = renderHook(() => useNow());
  const second = renderHook(() => useNow());
  expect(vi.getTimerCount()).toBe(1);
  act(() => vi.advanceTimersByTime(30_000));
  expect(first.result.current).toBe(Date.now());
  expect(second.result.current).toBe(first.result.current);
  first.unmount();
  expect(vi.getTimerCount()).toBe(1);
  act(() => vi.advanceTimersByTime(30_000));
  expect(second.result.current).toBe(Date.now());
  second.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
