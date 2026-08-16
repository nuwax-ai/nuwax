import { reduceMessageEvent } from '@/features/conversation/domain/reduceMessageEvent';
import {
  AssistantRoleEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatMessage,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

const assistantMessage = (id = 'optimistic-assistant'): MessageInfo =>
  ({
    id,
    role: AssistantRoleEnum.ASSISTANT,
    messageType: MessageTypeEnum.ASSISTANT,
    text: '',
    think: '',
    status: MessageStatusEnum.Loading,
  } as MessageInfo);

const chunk = (
  value: Partial<ConversationChatMessage>,
): ConversationChatMessage =>
  ({
    id: 'output-1',
    text: '',
    think: '',
    type: MessageModeEnum.CHAT,
    finished: false,
    ...value,
  } as ConversationChatMessage);

describe('reduceMessageEvent', () => {
  it('THINK 与正文分别维护思考态和消息状态', () => {
    const thinking = reduceMessageEvent(
      [assistantMessage()],
      'optimistic-assistant',
      '',
      chunk({
        id: 'think-1',
        type: MessageModeEnum.THINK,
        text: '分析中',
      }),
    );

    expect(thinking.messages[0]).toMatchObject({
      think: '分析中',
      thinkingFinished: false,
      status: MessageStatusEnum.Incomplete,
    });
    expect(thinking.activeOutputMessageId).toBe('');

    const answer = reduceMessageEvent(
      thinking.messages,
      'optimistic-assistant',
      thinking.activeOutputMessageId,
      chunk({ id: 'answer-1', text: '完成', finished: true }),
    );
    expect(answer.messages[0]).toMatchObject({
      text: '完成',
      thinkingFinished: true,
      status: MessageStatusEnum.Complete,
    });
    expect(answer.activeOutputMessageId).toBe('answer-1');
  });

  it('QUESTION finished 保持历史合同：隐藏消息运行状态', () => {
    const result = reduceMessageEvent(
      [assistantMessage()],
      'optimistic-assistant',
      '',
      chunk({
        id: 'question-1',
        type: MessageModeEnum.QUESTION,
        text: '请选择',
        finished: true,
      }),
    );

    expect(result.messages[0].status).toBeNull();
    expect(result.activeOutputMessageId).toBe('');
  });

  it('T03：新输出 ID 的 finished 消息插入新 assistant 行，不覆盖乐观占位', () => {
    const first = reduceMessageEvent(
      [assistantMessage()],
      'optimistic-assistant',
      '',
      chunk({ id: 'output-1', text: '第一段', finished: false }),
    );
    const second = reduceMessageEvent(
      first.messages,
      'optimistic-assistant',
      first.activeOutputMessageId,
      chunk({ id: 'output-2', text: '第二段', finished: true }),
    );

    expect(second.messages).toHaveLength(2);
    expect(second.messages.map((message) => message.id)).toEqual([
      'output-2',
      'optimistic-assistant',
    ]);
    expect(second.messages[0].text).toBe('第一段第二段');
    expect(second.activeOutputMessageId).toBe('output-1');
  });

  it('目标乐观消息不存在时不修改列表或输出 ID', () => {
    const messages = [assistantMessage('another-message')];
    const result = reduceMessageEvent(
      messages,
      'missing-message',
      'output-1',
      chunk({ text: 'ignored' }),
    );

    expect(result.applied).toBe(false);
    expect(result.messages).toBe(messages);
    expect(result.activeOutputMessageId).toBe('output-1');
  });
});
