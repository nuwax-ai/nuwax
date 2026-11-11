import {
  reduceConversationEvent,
  type ConversationEventReducerAdapters,
} from '@/features/conversation/domain/reduceConversationEvent';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

const owner = (): MessageInfo =>
  ({
    id: 'assistant-owner',
    role: AssistantRoleEnum.ASSISTANT,
    messageType: MessageTypeEnum.ASSISTANT,
    text: '',
    think: '',
    status: MessageStatusEnum.Loading,
  } as MessageInfo);

const event = (
  eventType: ConversationEventTypeEnum,
  data: unknown,
  requestId = 'request-1',
): ConversationChatResponse =>
  ({ eventType, data, requestId } as ConversationChatResponse);

const adapters: ConversationEventReducerAdapters = {
  renderProcessingBlock: (text: string, processing: ProcessingInfo) =>
    `${text}<process:${processing.executeId}>`,
  reconcileFinalMessage: (message: MessageInfo) => message,
};

describe('reduceConversationEvent', () => {
  it.each(['live', 'history'])(
    '迟到工具更新归回 %s 原消息，保留完成态与下一轮正文',
    (source) => {
      const tool = {
        executeId: 'server-1',
        type: 'ToolCall',
        name: 'node server.js',
        status: ProcessingEnum.EXECUTING,
      } as ProcessingInfo;
      const original = {
        ...owner(),
        status: MessageStatusEnum.Complete,
        text: getCustomBlock('', tool) + '最终回答',
        processingList: source === 'live' ? [tool] : [],
        componentExecutedList:
          source === 'history'
            ? [{ ...tool, status: ProcessingEnum.EXECUTING }]
            : [],
      } as MessageInfo;
      const next = { ...owner(), id: 'next-assistant', text: '下一轮正在回答' };
      const result = reduceConversationEvent(
        { messages: [original, next], activeOutputMessageId: 'next-output' },
        next.id,
        event(ConversationEventTypeEnum.PROCESSING, {
          ...tool,
          status: ProcessingEnum.FINISHED,
        }),
        { ...adapters, renderProcessingBlock: getCustomBlock },
      );
      expect(result.messages[0].text).toContain('status="FINISHED"');
      expect(
        result.messages[0].text?.match(/<markdown-custom-process /g),
      ).toHaveLength(1);
      expect(result.messages[0].text?.endsWith('最终回答')).toBe(true);
      expect(result.messages[0].status).toBe(MessageStatusEnum.Complete);
      expect(result.messages[1]).toBe(next);
      expect(result.activeOutputMessageId).toBe('next-output');
      expect(original.text).toContain('status="EXECUTING"');
    },
  );

  it('其他工具已经完成时，同 id 状态和标题仍在原位更新', () => {
    const tool = {
      executeId: 'server-1',
      type: 'ToolCall',
      name: 'server',
      status: ProcessingEnum.EXECUTING,
    } as ProcessingInfo;
    const text =
      getCustomBlock(getCustomBlock('', tool), {
        ...tool,
        executeId: 'other',
        status: ProcessingEnum.FINISHED,
      }) + '\n\n  原文缩进';
    const updated = getCustomBlock(text, {
      ...tool,
      name: 'node server.js',
      status: ProcessingEnum.FINISHED,
    });
    expect(updated).toContain(
      'executeId="server-1" type="ToolCall" status="FINISHED" name="node%20server.js"',
    );
    expect(updated.endsWith('\n\n  原文缩进')).toBe(true);
    expect(updated.indexOf('server-1')).toBeLessThan(updated.indexOf('other'));
  });

  it('T04：PROCESSING → MESSAGE → FINAL_RESULT 保持统一投影与终态', () => {
    let projection = {
      messages: [owner()],
      activeOutputMessageId: '',
    };

    projection = reduceConversationEvent(
      projection,
      'assistant-owner',
      event(ConversationEventTypeEnum.PROCESSING, {
        status: ProcessingEnum.EXECUTING,
        result: { executeId: 'execute-1' },
      }),
      adapters,
    );
    expect(projection.messages[0]).toMatchObject({
      status: MessageStatusEnum.Loading,
      thinkingFinished: true,
      processingList: [{ executeId: 'execute-1' }],
    });

    projection = reduceConversationEvent(
      projection,
      'assistant-owner',
      event(ConversationEventTypeEnum.MESSAGE, {
        id: 'output-1',
        type: MessageModeEnum.CHAT,
        text: 'answer',
        finished: true,
      }),
      adapters,
    );
    expect(projection.messages[0].status).toBe(MessageStatusEnum.Complete);
    expect(projection.activeOutputMessageId).toBe('output-1');

    const terminal = reduceConversationEvent(
      projection,
      'assistant-owner',
      event(ConversationEventTypeEnum.FINAL_RESULT, {
        success: true,
        outputText: 'answer',
        error: '',
      }),
      adapters,
    );
    expect(terminal.messages[0]).toMatchObject({
      status: MessageStatusEnum.Complete,
      requestId: 'request-1',
    });
    expect(terminal.activeOutputMessageId).toBe('');
    expect(terminal.taskStatus).toBe(TaskStatus.COMPLETE);
  });

  it('T03：多个 assistant 输出保持插入行和 owner 身份', () => {
    const first = reduceConversationEvent(
      { messages: [owner()], activeOutputMessageId: '' },
      'assistant-owner',
      event(ConversationEventTypeEnum.MESSAGE, {
        id: 'output-1',
        type: MessageModeEnum.CHAT,
        text: 'A',
        finished: false,
      }),
      adapters,
    );
    const second = reduceConversationEvent(
      first,
      'assistant-owner',
      event(ConversationEventTypeEnum.MESSAGE, {
        id: 'output-2',
        type: MessageModeEnum.CHAT,
        text: 'B',
        finished: true,
      }),
      adapters,
    );

    expect(second.messages.map((message) => message.id)).toEqual([
      'output-2',
      'assistant-owner',
    ]);
  });

  it('T05：协议 ERROR 投影 Error 消息并返回 FAILED', () => {
    const result = reduceConversationEvent(
      { messages: [owner()], activeOutputMessageId: 'output-1' },
      'assistant-owner',
      event(ConversationEventTypeEnum.ERROR, {}),
      adapters,
    );

    expect(result.messages[0]).toMatchObject({
      status: MessageStatusEnum.Error,
      thinkingFinished: true,
    });
    expect(result.activeOutputMessageId).toBe('output-1');
    expect(result.taskStatus).toBe(TaskStatus.FAILED);
  });
});
