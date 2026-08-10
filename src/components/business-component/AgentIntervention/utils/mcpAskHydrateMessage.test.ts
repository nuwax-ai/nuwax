import { describe, expect, it } from 'vitest';
import {
  hydrateMcpAskInteractionsFromExecutedComponents,
  hydrateMcpAskInteractionsInMessageList,
  prependAndHydrateMcpAskMessageList,
} from './mcpAskHydrateMessage';

const askInput = {
  schemaVersion: 'nuwax.mcp_ask.v2',
  requestId: 'ask-history-1',
  revision: 1,
  sessionId: 'session-1',
  title: '历史表单',
  ui: {
    version: 'nuwax.interaction.v2',
    presentation: 'inline',
    title: '历史表单',
    fields: [{ name: 'topic', title: '主题', widget: 'text', required: true }],
  },
};

describe('hydrateMcpAskInteractionsFromExecutedComponents', () => {
  it('hydrates successful persisted tool calls as pending', () => {
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
    expect(message.mcpAskInteractions?.[0].responseStatus).toBe('pending');
  });

  it('restores an ASK_QUESTION persisted in result.data after refresh', () => {
    const message = hydrateMcpAskInteractionsFromExecutedComponents({
      id: 'msg-ask-result-data',
      componentExecutedList: [
        {
          status: 'FINISHED',
          subEventType: 'ASK_QUESTION',
          result: {
            data: { ...askInput, toolName: 'nuwax_ask_question' },
          },
        },
      ],
    } as any);

    expect(message.mcpAskInteractions).toHaveLength(1);
    expect(message.mcpAskInteractions?.[0]).toMatchObject({
      toolCallId: askInput.requestId,
      responseStatus: 'pending',
      input: { requestId: askInput.requestId },
    });
  });

  // 历史会话接口偶发把 ASK_QUESTION 的 result.data 序列化成 JSON 字符串
  // （外层 wrapper: status/requestId/message + input 表单），不 parse 则 DockPanel 无法恢复。
  it('restores ASK_QUESTION when result.data is a JSON string wrapper', () => {
    const message = hydrateMcpAskInteractionsFromExecutedComponents({
      id: 'msg-ask-result-data-string',
      componentExecutedList: [
        {
          name: '补充询问',
          status: 'FINISHED',
          subEventType: 'ASK_QUESTION',
          type: 'Event',
          result: {
            data: JSON.stringify({
              status: 'pending',
              requestId: askInput.requestId,
              revision: 1,
              message:
                'The question has been presented to the user. Stop this turn now.',
              input: { ...askInput, toolName: 'nuwax_ask_question' },
            }),
            executeId: 'call_3a798dc3162b4f63bdfaa183',
            success: true,
            type: 'Event',
          },
        },
      ],
    } as any);

    expect(message.mcpAskInteractions).toHaveLength(1);
    expect(message.mcpAskInteractions?.[0]).toMatchObject({
      toolCallId: 'call_3a798dc3162b4f63bdfaa183',
      responseStatus: 'pending',
      input: { requestId: askInput.requestId },
    });
  });

  it('ignores non-JSON string result.data and falls back to result.input', () => {
    const message = hydrateMcpAskInteractionsFromExecutedComponents({
      id: 'msg-ask-result-data-plain-string',
      componentExecutedList: [
        {
          status: 'FINISHED',
          result: {
            data: 'not-a-json-payload',
            input: { ...askInput, toolName: 'nuwax_ask_question' },
          },
        },
      ],
    } as any);

    expect(message.mcpAskInteractions?.[0]?.input.requestId).toBe(
      askInput.requestId,
    );
  });

  it('uses result.input when result.data is ordinary tool output', () => {
    const message = hydrateMcpAskInteractionsFromExecutedComponents({
      id: 'msg-tool-output',
      componentExecutedList: [
        {
          status: 'FINISHED',
          result: {
            executeId: 'call-with-output',
            data: { output: 'ordinary tool output' },
            input: { ...askInput, toolName: 'nuwax_ask_question' },
          },
        },
      ],
    } as any);

    expect(message.mcpAskInteractions?.[0]?.input.requestId).toBe(
      askInput.requestId,
    );
  });

  it('keeps the latest same-title ask pending after an older form was submitted', () => {
    const firstAsk = {
      id: 'assistant-ask-first',
      index: 1,
      componentExecutedList: [
        {
          status: 'FINISHED',
          result: {
            executeId: 'call-first',
            input: {
              ...askInput,
              requestId: 'ask-first',
              toolName: 'nuwax_ask_question',
            },
          },
        },
      ],
    };
    const firstResume = {
      id: 'user-resume-first',
      index: 2,
      text: '我已填写「历史表单」，表单内容如下：\n\n主题：AI',
    };
    const latestAsk = {
      id: 'assistant-ask-latest',
      index: 3,
      componentExecutedList: [
        {
          status: 'FINISHED',
          result: {
            executeId: 'call-latest',
            input: {
              ...askInput,
              requestId: 'ask-latest',
              toolName: 'nuwax_ask_question',
            },
          },
        },
      ],
    };

    const result = hydrateMcpAskInteractionsInMessageList([
      firstAsk,
      firstResume,
      latestAsk,
    ] as any);

    expect(result[0].mcpAskInteractions?.[0].responseStatus).toBe('submitted');
    expect(result[2].mcpAskInteractions?.[0].responseStatus).toBe('pending');
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
