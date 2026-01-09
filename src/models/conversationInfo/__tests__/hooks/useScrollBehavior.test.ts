/**
 * useScrollBehavior Hook 测试
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollBehavior } from '../../hooks/useScrollBehavior';

describe('useScrollBehavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useScrollBehavior());

    expect(result.current.messageViewRef.current).toBeNull();
    expect(result.current.allowAutoScrollRef.current).toBe(true);
    expect(result.current.showScrollBtn).toBe(false);
  });

  it('should update showScrollBtn', () => {
    const { result } = renderHook(() => useScrollBehavior());

    act(() => {
      result.current.setShowScrollBtn(true);
    });

    expect(result.current.showScrollBtn).toBe(true);
  });

  it('should not scroll when allowAutoScrollRef is false', () => {
    const { result } = renderHook(() => useScrollBehavior());
    const mockScrollTo = vi.fn();

    result.current.messageViewRef.current = {
      scrollTo: mockScrollTo,
      scrollHeight: 1000,
    } as any;

    result.current.allowAutoScrollRef.current = false;

    act(() => {
      result.current.messageViewScrollToBottom();
    });

    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('should scroll when allowAutoScrollRef is true', () => {
    const { result } = renderHook(() => useScrollBehavior());
    const mockScrollTo = vi.fn();

    result.current.messageViewRef.current = {
      scrollTo: mockScrollTo,
      scrollHeight: 1000,
    } as any;

    act(() => {
      result.current.messageViewScrollToBottom();
    });

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: 'smooth',
    });
  });

  it('should call scroll with delay in handleScrollBottom', () => {
    const { result } = renderHook(() => useScrollBehavior());
    const mockScrollTo = vi.fn();

    result.current.messageViewRef.current = {
      scrollTo: mockScrollTo,
      scrollHeight: 1000,
    } as any;

    act(() => {
      result.current.handleScrollBottom();
    });

    expect(mockScrollTo).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockScrollTo).toHaveBeenCalled();
  });

  it('should not scroll in handleScrollBottom when auto scroll disabled', () => {
    const { result } = renderHook(() => useScrollBehavior());
    const mockScrollTo = vi.fn();

    result.current.messageViewRef.current = {
      scrollTo: mockScrollTo,
      scrollHeight: 1000,
    } as any;

    result.current.allowAutoScrollRef.current = false;

    act(() => {
      result.current.handleScrollBottom();
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockScrollTo).not.toHaveBeenCalled();
  });
});
