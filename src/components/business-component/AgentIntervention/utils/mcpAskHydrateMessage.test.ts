import { describe, expect, it } from 'vitest';
import {
  hydrateMcpAskInteractionsFromExecutedComponents,
  hydrateMcpAskInteractionsInMessageList,
  prependAndHydrateMcpAskMessageList,
} from './mcpAskHydrateMessage';

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
  it('hydrates successful persisted tool calls as submitted', () => {
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
    expect(message.mcpAskInteractions?.[0].responseStatus).toBe('submitted');
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

describe('hydrateMcpAskInteractionsInMessageList', () => {
  it('resolves pending asks using resume messages from already loaded batches', () => {
    const olderAskMessage = {
      id: 'assistant-ask',
      index: 1,
      componentExecutedList: [
        {
          status: 'EXECUTING',
          result: { executeId: 'call-1' },
          input: { ...askInput, toolName: 'nuwax_ask_question' },
        },
      ],
    };

    const newerResumeMessage = {
      id: 'user-resume',
      index: 2,
      text: '我已填写「历史表单」，表单内容如下：\n\n主题：AI',
    };

    const mergedContext = [olderAskMessage, newerResumeMessage] as any[];
    const hydratedOlderBatch = hydrateMcpAskInteractionsInMessageList(
      [olderAskMessage as any],
      mergedContext,
    );

    expect(hydratedOlderBatch[0].mcpAskInteractions?.[0].responseStatus).toBe(
      'submitted',
    );
  });
});

describe('prependAndHydrateMcpAskMessageList', () => {
  it('hydrates prepended older messages against the merged context', () => {
    const olderAskMessage = {
      id: 'assistant-ask',
      index: 1,
      componentExecutedList: [
        {
          status: 'EXECUTING',
          result: { executeId: 'call-1' },
          input: { ...askInput, toolName: 'nuwax_ask_question' },
        },
      ],
    };

    const currentMessageList = [
      {
        id: 'user-resume',
        index: 2,
        text: '我已填写「历史表单」，表单内容如下：\n\n主题：AI',
      },
    ] as any[];

    const result = prependAndHydrateMcpAskMessageList(
      [olderAskMessage as any],
      currentMessageList,
    );

    expect(result).toHaveLength(2);
    expect(result[0].mcpAskInteractions?.[0].responseStatus).toBe('submitted');
  });
});
