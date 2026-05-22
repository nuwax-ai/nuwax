import { describe, expect, it } from 'vitest';
import { hydrateMcpAskInteractionsFromExecutedComponents } from './hydrate-message';

const askInput = {
  schemaVersion: 'nuwaclaw.mcp_ask.v1',
  requestId: 'ask-history-1',
  revision: 1,
  sessionId: 'session-1',
  title: '历史表单',
  ui: {
    version: 'nuwaclaw.interaction.v1',
    presentation: 'inline',
    title: '历史表单',
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', title: '主题' },
      },
      required: ['topic'],
    },
  },
};

describe('hydrateMcpAskInteractionsFromExecutedComponents', () => {
  it('hydrates pending ask/question forms from successful persisted tool calls', () => {
    const message = hydrateMcpAskInteractionsFromExecutedComponents({
      id: 'msg-1',
      componentExecutedList: [
        {
          status: 'SUCCESS',
          result: {
            success: true,
            executeId: 'call-1',
          },
          input: {
            ...askInput,
            toolName: 'nuwax_ask_question',
          },
        },
      ],
    } as any);

    expect(message.mcpAskInteractions).toHaveLength(1);
    expect(message.mcpAskInteractions?.[0].toolCallId).toBe('call-1');
    expect(message.mcpAskInteractions?.[0].input.requestId).toBe(
      'ask-history-1',
    );
  });

  it('does not hydrate failed timed-out ask/question calls', () => {
    const message = hydrateMcpAskInteractionsFromExecutedComponents({
      id: 'msg-1',
      componentExecutedList: [
        {
          status: 'FAILED',
          result: {
            success: false,
            executeId: 'call-1',
          },
          input: {
            ...askInput,
            toolName: 'nuwax_ask_question',
          },
        },
      ],
    } as any);

    expect(message.mcpAskInteractions).toBeUndefined();
  });
});
