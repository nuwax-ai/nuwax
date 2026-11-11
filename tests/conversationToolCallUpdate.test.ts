import type { ToolCallInfo } from '@/types/interfaces/appDev';
import {
  parseConversationHistoryContent,
  updateToolCallInMessages,
} from '@/utils/chatUtils';
import {
  insertToolCallBlock,
  insertToolCallUpdateBlock,
} from '@/utils/markdownProcess';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

const tool: ToolCallInfo = {
  toolCallId: 'server.[1]',
  title: 'node server.js',
  kind: 'execute',
  status: 'in_progress',
  rawInput: { command: 'node server.js' },
  timestamp: '2026-11-11T05:28:56Z',
};
const payload = (text: string) =>
  JSON.parse(decodeURIComponent(text.match(/data="([^"]*)"/)![1]));

describe('AppDev 工具更新归并', () => {
  it('不同 session 的同名工具不能互相覆盖', () => {
    const base = parseConversationHistoryContent(
      JSON.stringify({ text: '当前回答' }),
      'ASSISTANT',
    )[0];
    const previous = {
      ...base,
      id: 'old',
      requestId: 'old',
      sessionId: 'old-session',
      text: insertToolCallBlock('', tool.toolCallId, tool),
    };
    const current = {
      ...base,
      id: 'new',
      requestId: 'new',
      sessionId: 'new-session',
    };
    const updated = updateToolCallInMessages(
      [previous, current],
      'new',
      tool.toolCallId,
      { status: 'completed' },
    );
    expect(updated[0]).toBe(previous);
    expect(updated[1].text).toContain('当前回答\n\n<div>');
  });

  it('迟到的部分更新保留原位置和命令，并清理旧格式重复块', () => {
    const original =
      insertToolCallBlock('开始\n\n', tool.toolCallId, tool) + '最终回答';
    const duplicate = insertToolCallBlock('', tool.toolCallId, tool);
    const updated = insertToolCallUpdateBlock(
      original + duplicate,
      tool.toolCallId,
      { status: 'completed', title: undefined, content: '服务输出' },
    );
    expect(updated.match(/<appdev-toolcall /g)).toHaveLength(1);
    expect(updated.indexOf('<appdev-toolcall')).toBeLessThan(
      updated.indexOf('最终回答'),
    );
    expect(payload(updated)).toMatchObject({
      ...tool,
      status: 'completed',
      content: '服务输出',
    });
    expect(
      insertToolCallUpdateBlock('最终回答', 'unknown', { status: 'completed' }),
    ).toContain('最终回答\n\n<div>');
  });

  it('历史回放中最终回答后的更新也归并到原调用', () => {
    const messages = parseConversationHistoryContent(
      JSON.stringify({
        events: [
          { event: 'tool_call', data: { data: tool } },
          {
            event: 'agent_message_chunk',
            data: { data: { text: '最终回答' } },
          },
          {
            event: 'tool_call_update',
            data: {
              data: { toolCallId: tool.toolCallId, status: 'completed' },
            },
          },
        ],
      }),
      'ASSISTANT',
    );
    const text = messages[0].text;
    expect(text.match(/<appdev-toolcall /g)).toHaveLength(1);
    expect(text.endsWith('最终回答')).toBe(true);
    expect(payload(text)).toMatchObject({
      title: tool.title,
      rawInput: tool.rawInput,
      status: 'completed',
    });
    // 新会话没有原工具时，只能回退当前消息，不能沿用其他会话的归属。
    const fresh = [
      { ...messages[0], id: 'new', requestId: 'new', text: '新会话' },
    ];
    expect(
      updateToolCallInMessages(fresh, 'new', tool.toolCallId, {
        status: 'completed',
      })[0].text,
    ).toContain('新会话\n\n<div>');
  });
});
