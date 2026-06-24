import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';
import { reconcileMcpAskHydratedMessageList } from './reconcileMcpAskHydratedStatus';

const askInteraction = {
  input: {
    toolName: 'nuwax_ask_question' as const,
    schemaVersion: 'nuwax.mcp_ask.v2',
    requestId: 'ask-1',
    revision: 1,
    sessionId: 'session-1',
    title: '历史表单',
    ui: {
      version: 'nuwax.interaction.v2',
      presentation: 'inline' as const,
      title: '历史表单',
      fields: [],
    },
  },
  toolCallId: 'call-1',
  responseStatus: 'pending' as const,
};

describe('reconcileMcpAskHydratedMessageList', () => {
  it('marks pending interactions as submitted when resume message exists', () => {
    const askMessage = {
      id: 'assistant-ask',
      mcpAskInteractions: [askInteraction],
    } as MessageInfo;

    const resumeMessage = {
      id: 'user-resume',
      text: '我已填写「历史表单」，表单内容如下：\n\n主题：AI',
    } as MessageInfo;

    const [reconciled] = reconcileMcpAskHydratedMessageList(
      [askMessage],
      [askMessage, resumeMessage],
    );

    expect(reconciled.mcpAskInteractions?.[0].responseStatus).toBe('submitted');
  });

  it('keeps pending interactions when no resume message exists', () => {
    const askMessage = {
      id: 'assistant-ask',
      mcpAskInteractions: [askInteraction],
    } as MessageInfo;

    const [reconciled] = reconcileMcpAskHydratedMessageList([askMessage]);

    expect(reconciled.mcpAskInteractions?.[0].responseStatus).toBe('pending');
  });
});
