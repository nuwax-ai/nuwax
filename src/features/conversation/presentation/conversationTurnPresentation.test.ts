import { AssistantRoleEnum, MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';
import { projectConversationTurns } from './conversationTurnPresentation';

const message = (patch: Partial<MessageInfo>): MessageInfo =>
  ({
    id: patch.id || 'message',
    role: AssistantRoleEnum.ASSISTANT,
    text: '',
    time: '2026-08-30T00:00:00Z',
    componentExecutedList: [],
    ...patch,
  } as MessageInfo);

describe('projectConversationTurns', () => {
  it('按 USER 边界切轮，并在 requestId 改变时切分缺少 USER 的分页半轮', () => {
    const presentations = projectConversationTurns([
      message({ id: 'partial', requestId: 'old', text: 'old process' }),
      message({ id: 'user', role: AssistantRoleEnum.USER, text: 'question' }),
      message({ id: 'a1', requestId: 'new', text: 'thinking' }),
      message({ id: 'a2', requestId: 'new', text: 'answer' }),
      message({ id: 'next', requestId: 'newer', text: 'next turn' }),
    ]);

    expect(presentations.map((item) => item.kind)).toEqual([
      'turn',
      'message',
      'turn',
      'turn',
    ]);
    expect(presentations[2]).toMatchObject({ key: 'turn-new' });
    expect(presentations[3]).toMatchObject({ key: 'turn-newer' });
  });

  it('finalResult.outputText 作为常显 summary，其余内容进入过程区', () => {
    const [turn] = projectConversationTurns([
      message({
        id: 'assistant',
        requestId: 'req-1',
        status: MessageStatusEnum.Complete,
        think: '先分析',
        text: [
          '<markdown-custom-process executeId="tool-1" name="read" type="ToolCall" status="FINISHED"></markdown-custom-process>',
          '中间说明',
          '最终结论',
        ].join('\n\n'),
        finalResult: {
          outputText: '最终结论',
          startTime: 1000,
          endTime: 4100,
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
    ]);

    expect(turn.kind).toBe('turn');
    if (turn.kind !== 'turn') return;
    expect(turn.summaryMarkdown).toBe('最终结论');
    expect(turn.processMarkdown).toContain('中间说明');
    expect(turn.processMarkdown).toContain('markdown-custom-think');
    expect(turn.processMarkdown).not.toMatch(/最终结论\s*$/);
    expect(turn.metrics).toMatchObject({
      toolCallCount: 1,
      startedAt: 1000,
      endedAt: 4100,
    });
  });

  it('没有 finalResult 时取终态最后一条 CHAT/ANSWER，并对工具 executeId 去重', () => {
    const tag = (status: string) =>
      `<markdown-custom-process executeId="same" name="bash" type="ToolCall" status="${status}"></markdown-custom-process>`;
    const [turn] = projectConversationTurns([
      message({ id: 'process', requestId: 'req', text: tag('EXECUTING') }),
      message({
        id: 'answer',
        requestId: 'req',
        type: MessageModeEnum.ANSWER,
        status: MessageStatusEnum.Complete,
        text: `${tag('FINISHED')}\n\n完成摘要`,
      }),
    ]);

    expect(turn.kind).toBe('turn');
    if (turn.kind !== 'turn') return;
    expect(turn.summaryMarkdown).toBe('完成摘要');
    expect(turn.metrics.toolCallCount).toBe(1);
  });

  it('聚合组开标签（markdown-custom-process-group）不计入工具数', () => {
    const [turn] = projectConversationTurns([
      message({
        id: 'assistant',
        requestId: 'req-group',
        status: MessageStatusEnum.Complete,
        text: [
          '<div><markdown-custom-process-group name="proc-group" terminal="true">',
          '<markdown-custom-process executeId="tool-1" name="read" type="ToolCall" status="FINISHED"></markdown-custom-process>',
          '<markdown-custom-process executeId="tool-2" name="write" type="ToolCall" status="FINISHED"></markdown-custom-process>',
          '</markdown-custom-process-group></div>',
          '汇总正文',
        ].join('\n'),
        finalResult: {
          outputText: '汇总正文',
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
    ]);

    expect(turn.kind).toBe('turn');
    if (turn.kind !== 'turn') return;
    expect(turn.metrics.toolCallCount).toBe(2);
  });

  it('纯文本终态只有最终 summary，不制造空折叠区', () => {
    const [turn] = projectConversationTurns([
      message({
        id: 'answer',
        status: MessageStatusEnum.Complete,
        text: '直接回答',
      }),
    ]);
    expect(turn).toMatchObject({
      kind: 'turn',
      processMarkdown: '',
      summaryMarkdown: '直接回答',
    });
  });
});
