/**
 * 会话流式/执行态判定 helper 测试
 */
import {
  isTaskExecuting,
  selectQueueGate,
  selectSessionActive,
  shouldShowSessionSuggest,
  shouldShowTaskExecutingWait,
} from '@/features/conversation/domain/runtimeSelectors';
import {
  hasActiveStreamingInMessages,
  hasExecutingProcessingInMessages,
  isSessionStreamBusy,
} from '@/hooks/useExecutingTaskStatusPoll';
import { TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';

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

describe('hasExecutingProcessingInMessages', () => {
  it('最近消息含 EXECUTING processing 时返回 true', () => {
    expect(
      hasExecutingProcessingInMessages([
        {
          processingList: [{ status: ProcessingEnum.EXECUTING }],
        } as any,
      ]),
    ).toBe(true);
  });

  it('无执行中 processing 时返回 false', () => {
    expect(
      hasExecutingProcessingInMessages([
        {
          status: null,
          processingList: [{ status: ProcessingEnum.FINISHED }],
        } as any,
      ]),
    ).toBe(false);
  });
});

describe('isSessionStreamBusy', () => {
  // 1f8c77bd9 架构解耦：工具状态（processingList EXECUTING）不再驱动会话 busy——
  // 单个工具 FINISHED 丢失不再卡死按钮（1678835）。工具状态仅影响 UI 展示。
  it('processing 仍在执行但不参与 busy 判定（末条非流式即空闲）', () => {
    expect(
      isSessionStreamBusy([
        {
          status: null,
          processingList: [{ status: ProcessingEnum.EXECUTING }],
        } as any,
      ]),
    ).toBe(false);
  });

  it('末条 Loading/Incomplete 时仍视为忙碌（流式信号）', () => {
    expect(
      isSessionStreamBusy([{ status: MessageStatusEnum.Incomplete } as any]),
    ).toBe(true);
  });
});

describe('conversation runtime selectors', () => {
  const completeMessages = [{ status: MessageStatusEnum.Complete } as any];

  it('任务状态与流式活跃态保持两个维度，再由 session selector 合并', () => {
    expect(isTaskExecuting(TaskStatus.EXECUTING)).toBe(true);
    expect(isSessionStreamBusy(completeMessages)).toBe(false);
    expect(
      selectSessionActive(false, completeMessages, TaskStatus.EXECUTING),
    ).toBe(true);
  });

  it('队列门禁：任务/流阻塞入队，Intervention 只额外阻塞消费', () => {
    expect(
      selectQueueGate(false, completeMessages, TaskStatus.COMPLETE, true),
    ).toMatchObject({
      streamActive: false,
      taskExecuting: false,
      enqueueBlocked: false,
      consumeBlocked: true,
    });
  });

  it('任务等待横幅仅在 EXECUTING 且最后消息没有流式输出时展示', () => {
    expect(
      shouldShowTaskExecutingWait(TaskStatus.EXECUTING, completeMessages),
    ).toBe(true);
    expect(
      shouldShowTaskExecutingWait(TaskStatus.EXECUTING, [
        { status: MessageStatusEnum.Loading } as any,
      ]),
    ).toBe(false);
  });

  it('suggest 只在有消息、无队列且流已结束时展示', () => {
    expect(shouldShowSessionSuggest(completeMessages, false, false)).toBe(true);
    expect(shouldShowSessionSuggest(completeMessages, true, false)).toBe(false);
    expect(shouldShowSessionSuggest(completeMessages, false, true)).toBe(false);
  });
});
