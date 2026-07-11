import useMarkdownRender from '@/hooks/useMarkdownRender';
import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const GAP_TIME = 100;

const createMarkdownRefMock = () =>
  ({
    push: vi.fn(),
    clear: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  } as unknown as MarkdownCMDRef);

const flushMarkdownTimer = () => {
  act(() => {
    vi.advanceTimersByTime(GAP_TIME);
  });
};

describe('useMarkdownRender', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('按 answer 增量推送新增内容', () => {
    const { result, rerender } = renderHook(
      ({ answer }) =>
        useMarkdownRender({
          id: 'message-1',
          answer,
          thinking: '',
        }),
      {
        initialProps: { answer: 'hello' },
      },
    );
    const markdownRef = createMarkdownRefMock();
    result.current.markdownRef.current = markdownRef;

    flushMarkdownTimer();
    expect(markdownRef.push).toHaveBeenCalledWith('hello', 'answer');

    rerender({ answer: 'hello world' });
    flushMarkdownTimer();

    expect(markdownRef.push).toHaveBeenLastCalledWith(' world', 'answer');
    expect(markdownRef.clear).not.toHaveBeenCalled();
  });

  it('answer 不是旧内容前缀时全量清空后重推 thinking 和 answer', () => {
    const { result, rerender } = renderHook(
      ({ answer, thinking }) =>
        useMarkdownRender({
          id: 'message-1',
          answer,
          thinking,
        }),
      {
        initialProps: { answer: 'old answer', thinking: '' },
      },
    );
    const markdownRef = createMarkdownRefMock();
    result.current.markdownRef.current = markdownRef;

    flushMarkdownTimer();
    rerender({ answer: 'new answer', thinking: 'new thinking' });
    flushMarkdownTimer();

    expect(markdownRef.clear).toHaveBeenCalledTimes(1);
    expect(markdownRef.push).toHaveBeenCalledWith('new thinking', 'thinking');
    expect(markdownRef.push).toHaveBeenCalledWith('new answer', 'answer');
  });

  it('依赖变化时取消上一轮尚未执行的延迟推送', () => {
    const { result, rerender } = renderHook(
      ({ answer }) =>
        useMarkdownRender({
          id: 'message-1',
          answer,
          thinking: '',
        }),
      {
        initialProps: { answer: 'stale answer' },
      },
    );
    const markdownRef = createMarkdownRefMock();
    result.current.markdownRef.current = markdownRef;

    rerender({ answer: 'fresh answer' });
    flushMarkdownTimer();

    expect(markdownRef.push).toHaveBeenCalledTimes(1);
    expect(markdownRef.push).toHaveBeenCalledWith('fresh answer', 'answer');
  });

  it('卸载后取消延迟推送，且不再调用 MarkdownCMD.clear', () => {
    const { result, unmount } = renderHook(() =>
      useMarkdownRender({
        id: 'message-1',
        answer: 'pending answer',
        thinking: '',
      }),
    );
    const markdownRef = createMarkdownRefMock();
    result.current.markdownRef.current = markdownRef;

    unmount();
    flushMarkdownTimer();

    expect(markdownRef.push).not.toHaveBeenCalled();
    expect(markdownRef.clear).not.toHaveBeenCalled();
  });

  it('message id 和内容同时变化时，清空旧渲染状态后推送新消息完整内容', () => {
    const { result, rerender } = renderHook(
      ({ id, answer }) =>
        useMarkdownRender({
          id,
          answer,
          thinking: '',
        }),
      {
        initialProps: { id: 'message-1', answer: 'old answer' },
      },
    );
    const markdownRef = createMarkdownRefMock();
    result.current.markdownRef.current = markdownRef;

    flushMarkdownTimer();
    vi.clearAllMocks();

    rerender({ id: 'message-2', answer: 'new answer' });
    flushMarkdownTimer();

    expect(result.current.messageIdRef.current).toBe('message-2');
    expect(markdownRef.clear).toHaveBeenCalledTimes(1);
    expect(markdownRef.push).toHaveBeenCalledTimes(1);
    expect(markdownRef.push).toHaveBeenCalledWith('new answer', 'answer');
  });
});
