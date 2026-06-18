/**
 * useExecutingTaskStatusPoll hook 测试
 */
import {
  hasActiveStreamingInMessages,
  hasExecutingProcessingInRecentMessages,
  isSessionStreamBusy,
  useExecutingTaskStatusPoll,
} from '@/hooks/useExecutingTaskStatusPoll';
import { TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
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

describe('hasExecutingProcessingInRecentMessages', () => {
  it('最近消息含 EXECUTING processing 时返回 true', () => {
    expect(
      hasExecutingProcessingInRecentMessages([
        {
          processingList: [{ status: ProcessingEnum.EXECUTING }],
        } as any,
      ]),
    ).toBe(true);
  });

  it('无执行中 processing 时返回 false', () => {
    expect(
      hasExecutingProcessingInRecentMessages([
        {
          status: null,
          processingList: [{ status: ProcessingEnum.FINISHED }],
        } as any,
      ]),
    ).toBe(false);
  });
});

describe('isSessionStreamBusy', () => {
  it('status 为 null 但 processing 执行中时仍视为忙碌', () => {
    expect(
      isSessionStreamBusy([
        {
          status: null,
          processingList: [{ status: ProcessingEnum.EXECUTING }],
        } as any,
      ]),
    ).toBe(true);
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

  it('流式或 processing 执行中时不轮询', () => {
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

    const onSync2 = vi.fn();
    renderHook(() =>
      useExecutingTaskStatusPoll({
        conversationId: 1553028,
        taskStatus: TaskStatus.EXECUTING,
        messageList: [
          {
            status: null,
            processingList: [{ status: ProcessingEnum.EXECUTING }],
          } as any,
        ],
        onSync: onSync2,
      }),
    );
    expect(onSync2).not.toHaveBeenCalled();
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
