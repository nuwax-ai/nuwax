/**
 * 会话流式/执行态判定 helper 测试
 */
import {
  hasActiveStreamingInMessages,
  hasExecutingProcessingInRecentMessages,
  isSessionStreamBusy,
} from '@/hooks/useExecutingTaskStatusPoll';
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
