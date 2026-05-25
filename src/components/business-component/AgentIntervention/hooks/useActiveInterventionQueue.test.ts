import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { useActiveInterventionQueue } from './useActiveInterventionQueue';

function createAskInteraction(): McpAskInteraction {
  return {
    input: {
      toolName: 'nuwax_ask_question',
      requestId: 'ask-1',
      title: '毕业论文 PPT 前置信息收集',
      prompt: '请填写',
      schema: {},
      ui: {},
    },
    responseStatus: 'pending',
  };
}

describe('useActiveInterventionQueue', () => {
  it('does not show an ask/question interaction after its resume message exists', () => {
    const askInteraction = createAskInteraction();
    const messageList = [
      {
        id: 'assistant-ask',
        index: 1,
        mcpAskInteractions: [askInteraction],
      },
      {
        id: 'user-resume',
        index: 2,
        text: '我已填写「毕业论文 PPT 前置信息收集」，表单内容如下：\n\n```json\n{}\n```',
      },
    ] as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(0);
  });

  it('filters resolved ask/question interactions even when backend indexes are out of order', () => {
    const askInteraction = createAskInteraction();
    const messageList = [
      {
        id: 'user-resume',
        index: 1,
        text: '我已填写「毕业论文 PPT 前置信息收集」，表单内容如下：\n\n```json\n{}\n```',
      },
      {
        id: 'assistant-ask',
        index: 2,
        mcpAskInteractions: [askInteraction],
      },
    ] as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(0);
  });

  it('keeps an unanswered ask/question interaction active', () => {
    const messageList = [
      {
        id: 'assistant-ask',
        index: 1,
        mcpAskInteractions: [createAskInteraction()],
      },
    ] as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('mcp_ask');
  });
});
