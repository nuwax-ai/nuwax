import { reduceMessageEvent } from '@/features/conversation/domain/reduceMessageEvent';
import {
  appendThinkChunk,
  finalizeThinkBlock,
  hasOpenThinkBlock,
} from '@/plugins/ds-markdown-think';
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

  // ── 思考内联标签 Adapter（runtime 轨与旧线共用 plugins/ds-markdown-think 协议）──

  const thinkBlockAdapter = {
    hasOpenThinkBlock,
    appendThinkChunk,
    finalizeThinkBlock,
  };

  it('注入思考标签 Adapter 时 THINK 分片按流式位置写入 text 内联块', () => {
    const first = reduceMessageEvent(
      [assistantMessage()],
      'optimistic-assistant',
      '',
      chunk({ id: 'think-1', type: MessageModeEnum.THINK, text: '第一轮思考' }),
      thinkBlockAdapter,
    );

    expect(first.messages[0].text).toContain('markdown-custom-think');
    expect(first.messages[0].text).toContain(encodeURIComponent('第一轮思考'));
    expect(first.messages[0].thinkBlocks).toEqual(['第一轮思考']);
    expect(first.messages[0].think).toBe('第一轮思考');

    const second = reduceMessageEvent(
      first.messages,
      'optimistic-assistant',
      '',
      chunk({ id: 'answer-1', text: '正文', finished: true }),
      thinkBlockAdapter,
    );

    // 正文到达即超越思考轮：标签收口为 finished，正文保持在其后
    expect(second.messages[0].text).toContain('status="finished"');
    expect(
      second.messages[0].text.indexOf('markdown-custom-think'),
    ).toBeLessThan(second.messages[0].text.indexOf('正文'));
  });

  it('多轮思考各自成块：收口后再 THINK 开启第二轮', () => {
    let state = reduceMessageEvent(
      [assistantMessage()],
      'optimistic-assistant',
      '',
      chunk({ id: 'think-1', type: MessageModeEnum.THINK, text: '第一轮' }),
      thinkBlockAdapter,
    );
    state = reduceMessageEvent(
      state.messages,
      'optimistic-assistant',
      '',
      chunk({ id: 'answer-1', text: '中间正文', finished: true }),
      thinkBlockAdapter,
    );
    state = reduceMessageEvent(
      state.messages,
      'optimistic-assistant',
      '',
      chunk({ id: 'think-2', type: MessageModeEnum.THINK, text: '第二轮' }),
      thinkBlockAdapter,
    );

    expect(state.messages[0].thinkBlocks).toEqual(['第一轮', '第二轮']);
    const tagCount = (
      state.messages[0].text.match(/<markdown-custom-think/g) || []
    ).length;
    expect(tagCount).toBe(2);
  });

  it('不注入 Adapter 时保持旧投影行为（text 不写思考标签）', () => {
    const result = reduceMessageEvent(
      [assistantMessage()],
      'optimistic-assistant',
      '',
      chunk({ id: 'think-1', type: MessageModeEnum.THINK, text: '思考' }),
    );

    expect(result.messages[0].text).toBe('');
    expect(result.messages[0].think).toBe('思考');
  });
});
