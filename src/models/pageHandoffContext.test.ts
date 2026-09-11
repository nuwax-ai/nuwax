import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import usePageHandoffContext from './pageHandoffContext';

describe('pageHandoffContext', () => {
  it('消费不存在的上下文时不更新 contextMap', () => {
    const { result } = renderHook(() => usePageHandoffContext());
    const initialContextMap = result.current.contextMap;

    let consumed: unknown;
    act(() => {
      consumed = result.current.consumeContext('missing-context');
    });

    expect(consumed).toBeUndefined();
    expect(result.current.contextMap).toBe(initialContextMap);
  });

  it('消费已有上下文后只清理一次', () => {
    const { result } = renderHook(() => usePageHandoffContext());

    act(() => {
      result.current.setContext('existing-context', { id: 1 });
    });

    let consumed: unknown;
    act(() => {
      consumed = result.current.consumeContext('existing-context');
    });

    expect(consumed).toEqual({ id: 1 });
    expect(result.current.contextMap).toEqual({});

    const contextMapAfterConsume = result.current.contextMap;
    act(() => {
      result.current.consumeContext('existing-context');
    });
    expect(result.current.contextMap).toBe(contextMapAfterConsume);
  });
});
