/**
 * useExecutingTaskStatusPoll hook 测试
 */
import {
  hasActiveStreamingInMessages,
  useExecutingTaskStatusPoll,
} from '@/hooks/useExecutingTaskStatusPoll';
import { TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('hasActiveStreamingInMessages', () => {
  it('最后一条 Loading/Incomplete 时返回 true', () => {
    expect(
      hasActiveStreamingInMessages([
        { status: MessageStatusEnum.Complete } as any,
        { status: MessageStatusEnum.Loading } as any,
      ]),
    ).toBe(true);
  });

  it('无流式状态时返回 false', () => {
    expect(
      hasActiveStreamingInMessages([
        { status: MessageStatusEnum.Complete } as any,
      ]),
    ).toBe(false);
    expect(hasActiveStreamingInMessages([])).toBe(false);
  });
});

describe('useExecutingTaskStatusPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('EXECUTING 且无流式时立即 sync 并轮询', () => {
    const onSync = vi.fn();
    renderHook(() =>
      useExecutingTaskStatusPoll({
        conversationId: 1553027,
        taskStatus: TaskStatus.EXECUTING,
        messageList: [{ status: MessageStatusEnum.Complete } as any],
        onSync,
      }),
    );

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onSync).toHaveBeenCalledWith(1553027);

    vi.advanceTimersByTime(5000);
    expect(onSync).toHaveBeenCalledTimes(2);
  });

  it('流式进行中不轮询', () => {
    const onSync = vi.fn();
    renderHook(() =>
      useExecutingTaskStatusPoll({
        conversationId: 1553027,
        taskStatus: TaskStatus.EXECUTING,
        messageList: [{ status: MessageStatusEnum.Incomplete } as any],
        onSync,
      }),
    );
    expect(onSync).not.toHaveBeenCalled();
  });

  it('非 EXECUTING 不轮询', () => {
    const onSync = vi.fn();
    renderHook(() =>
      useExecutingTaskStatusPoll({
        conversationId: 1553027,
        taskStatus: TaskStatus.COMPLETE,
        messageList: [],
        onSync,
      }),
    );
    expect(onSync).not.toHaveBeenCalled();
  });
});
