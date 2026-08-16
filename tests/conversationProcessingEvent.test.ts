import { reduceProcessingEvent } from '@/features/conversation/domain/reduceProcessingEvent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it, vi } from 'vitest';

const processing = (
  value: Omit<Partial<ProcessingInfo>, 'result'> & { result?: unknown },
): ProcessingInfo => value as unknown as ProcessingInfo;

describe('reduceProcessingEvent', () => {
  it('从 result 提升 executeId，并结束思考态、写入 Loading 消息', () => {
    const currentMessage = {
      id: 'assistant-1',
      text: 'before',
      thinkingFinished: false,
    } as MessageInfo;
    const renderer = vi.fn((text, item) => `${text}:${item.executeId}`);

    const result = reduceProcessingEvent(
      currentMessage,
      processing({
        name: 'tool',
        status: ProcessingEnum.EXECUTING,
        result: { executeId: 'execute-1' },
      }),
      renderer,
    );

    expect(result.processing.executeId).toBe('execute-1');
    expect(result.message).toMatchObject({
      text: 'before:execute-1',
      thinkingFinished: true,
      status: MessageStatusEnum.Loading,
      processingList: [{ executeId: 'execute-1' }],
    });
    expect(renderer).toHaveBeenCalledWith(
      'before',
      expect.objectContaining({ executeId: 'execute-1' }),
    );
  });

  it('同 executeId 更新原 processing，不追加重复项', () => {
    const currentMessage = {
      id: 'assistant-1',
      text: '',
      processingList: [
        processing({
          executeId: 'execute-1',
          status: ProcessingEnum.EXECUTING,
        }),
      ],
    } as MessageInfo;

    const result = reduceProcessingEvent(
      currentMessage,
      processing({
        executeId: 'execute-1',
        status: ProcessingEnum.FINISHED,
      }),
      (text) => text,
    );

    expect(result.message.processingList).toHaveLength(1);
    expect(result.message.processingList?.[0].status).toBe(
      ProcessingEnum.FINISHED,
    );
  });

  it('不修改原始 SSE processing payload', () => {
    const incoming = processing({
      status: ProcessingEnum.EXECUTING,
      result: { executeId: 'execute-1' },
    });

    const result = reduceProcessingEvent(
      { id: 'assistant-1' } as MessageInfo,
      incoming,
      (text) => text,
    );

    expect(incoming.executeId).toBeUndefined();
    expect(result.processing).not.toBe(incoming);
  });
});
