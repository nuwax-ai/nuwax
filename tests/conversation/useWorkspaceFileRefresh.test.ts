import { useWorkspaceFileRefresh } from '@/features/conversation/react/useWorkspaceFileRefresh';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('cached runtime file refresh resource', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('the first exposed callback works after inactive becomes active', () => {
    const refresh = vi.fn();
    const { result, rerender } = renderHook(
      ({ active }) =>
        useWorkspaceFileRefresh({ active, conversationId: 123, refresh }),
      { initialProps: { active: false } },
    );
    const cachedResource = result.current;
    act(() => cachedResource(123));
    expect(refresh).not.toHaveBeenCalled();
    rerender({ active: true });
    act(() => {
      cachedResource(123);
      vi.advanceTimersByTime(2000);
    });
    expect(refresh).toHaveBeenCalledOnce();
    expect(result.current).toBe(cachedResource);
  });

  it('the cached callback uses the new conversation and rejects the old one', () => {
    const firstRefresh = vi.fn();
    const secondRefresh = vi.fn();
    const { result, rerender } = renderHook(
      ({ conversationId, refresh }) =>
        useWorkspaceFileRefresh({ active: true, conversationId, refresh }),
      { initialProps: { conversationId: 123, refresh: firstRefresh } },
    );
    const cachedResource = result.current;
    rerender({ conversationId: 124, refresh: secondRefresh });
    act(() => {
      cachedResource(123);
      cachedResource(124);
      vi.advanceTimersByTime(2000);
    });
    expect(firstRefresh).not.toHaveBeenCalled();
    expect(secondRefresh).toHaveBeenCalledOnce();
    expect(result.current).toBe(cachedResource);
  });

  it('cancels an old queued trailing refresh on conversation switch and accepts the new one', () => {
    const refresh = vi.fn();
    const { result, rerender } = renderHook(
      ({ conversationId }) =>
        useWorkspaceFileRefresh({ active: true, conversationId, refresh }),
      { initialProps: { conversationId: 123 } },
    );
    const cachedResource = result.current;
    act(() => {
      cachedResource(123);
      cachedResource(123);
    });
    expect(refresh).toHaveBeenCalledOnce();
    rerender({ conversationId: 124 });
    act(() => vi.advanceTimersByTime(2000));
    expect(refresh).toHaveBeenCalledOnce();
    act(() => cachedResource(124));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('drops queued and later callbacks while inactive or after unmount', () => {
    const refresh = vi.fn();
    const { result, rerender, unmount } = renderHook(
      ({ active }) =>
        useWorkspaceFileRefresh({ active, conversationId: 123, refresh }),
      { initialProps: { active: true } },
    );
    const cachedResource = result.current;
    act(() => {
      cachedResource(123);
      cachedResource(123);
    });
    rerender({ active: false });
    act(() => {
      cachedResource(123);
      vi.advanceTimersByTime(2000);
    });
    expect(refresh).toHaveBeenCalledOnce();
    rerender({ active: true });
    unmount();
    act(() => {
      cachedResource(123);
      vi.advanceTimersByTime(2000);
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
