import { reduceTerminalEvent } from '@/features/conversation/domain/reduceTerminalEvent';
import { ConversationEventTypeEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  ConversationFinalResult,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it, vi } from 'vitest';

const assistant = (value: Partial<MessageInfo> = {}): MessageInfo =>
  ({ id: 'assistant-1', text: '', ...value } as MessageInfo);

const finalEvent = (
  value: Partial<ConversationFinalResult>,
): ConversationChatResponse =>
  ({
    eventType: ConversationEventTypeEnum.FINAL_RESULT,
    requestId: 'request-1',
    data: { success: true, outputText: '', error: '', ...value },
  } as ConversationChatResponse);

describe('reduceTerminalEvent', () => {
  it('FINAL_RESULT 完成所属消息并返回协议任务终态', () => {
    const reconcile = vi.fn((message: MessageInfo) => ({
      ...message,
      processingList: [],
    }));
    const event = finalEvent({ success: true, outputText: 'done' });

    const result = reduceTerminalEvent(
      [assistant({ text: 'answer' })],
      'assistant-1',
      event,
      reconcile,
    );

    expect(result.message).toMatchObject({
      text: 'answer',
      thinkingFinished: true,
      status: MessageStatusEnum.Complete,
      requestId: 'request-1',
      finalResult: event.data,
    });
    expect(result.taskStatus).toBe(TaskStatus.COMPLETE);
    expect(result.removed).toBe(false);
  });

  it('用户主动取消且没有任何输出时删除乐观 assistant', () => {
    const result = reduceTerminalEvent(
      [assistant()],
      'assistant-1',
      finalEvent({
        success: false,
        error: '用户主动取消任务',
        outputText: '',
      }),
      (message) => message,
    );

    expect(result.messages).toEqual([]);
    expect(result.message).toBeUndefined();
    expect(result.removed).toBe(true);
  });

  it('ERROR 将所属消息置为 Error，并返回 FAILED 意图', () => {
    const result = reduceTerminalEvent(
      [assistant({ thinkingFinished: false })],
      'assistant-1',
      {
        eventType: ConversationEventTypeEnum.ERROR,
        requestId: 'request-error',
        data: {},
      } as ConversationChatResponse,
      (message) => message,
    );

    expect(result.message).toMatchObject({
      thinkingFinished: true,
      status: MessageStatusEnum.Error,
    });
    expect(result.taskStatus).toBe(TaskStatus.FAILED);
  });
});
