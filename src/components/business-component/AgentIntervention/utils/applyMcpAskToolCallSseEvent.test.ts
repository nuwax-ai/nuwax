import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';
import { applyMcpAskToolCallSseEvent } from './applyMcpAskToolCallSseEvent';

const baseAskInput = {
  schemaVersion: 'nuwax.mcp_ask.v2',
  requestId: 'ask-1',
  revision: 1,
  sessionId: 'session-1',
  title: 'Need input',
  ui: {
    version: 'nuwax.interaction.v2',
    presentation: 'inline',
    title: 'Need input',
    fields: [{ name: 'choice', title: '选项', widget: 'text' }],
  },
};

describe('applyMcpAskToolCallSseEvent', () => {
  it('accepts backend PROCESSING tool calls for nuwax_ask_question', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          executeId: 'tool-call-1',
          result: {
            executeId: 'tool-call-1',
            input: {
              ...baseAskInput,
              toolName: 'nuwax_ask_question',
            },
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.toolCallId).toBe('tool-call-1');
    expect(patched?.mcpAskInteractions?.[0]?.input.toolName).toBe(
      'nuwax_ask_question',
    );
  });

  it('defaults missing toolName to nuwax_ask_question', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call',
        data: {
          toolCallId: 'tool-call-2',
          rawInput: baseAskInput,
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.input.toolName).toBe(
      'nuwax_ask_question',
    );
  });

  it('accepts backend-wrapped tool_call progress events', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'agentSessionUpdate',
          subType: 'tool_call',
          data: {
            tool_call_id: 'tool-call-3',
            raw_input: {
              ...baseAskInput,
              requestId: 'ask-3',
              toolName: 'nuwax_ask_question',
            },
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.toolCallId).toBe('tool-call-3');
    expect(patched?.mcpAskInteractions?.[0]?.input.requestId).toBe('ask-3');
  });

  it('accepts tool_call_update in-progress events with MCP Ask raw input', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'agentSessionUpdate',
          subType: 'tool_call_update',
          data: {
            toolCallId: 'tool-call-4',
            status: 'in_progress',
            rawInput: {
              ...baseAskInput,
              requestId: 'ask-4',
              toolName: 'nuwax_ask_question',
            },
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.toolCallId).toBe('tool-call-4');
    expect(patched?.mcpAskInteractions?.[0]?.input.requestId).toBe('ask-4');
  });

  it('keeps an active MCP Ask interaction when the MCP call completes pending user input', () => {
    const currentMessage = {
      id: 'msg-1',
      mcpAskInteractions: [
        {
          input: {
            ...baseAskInput,
            requestId: 'ask-5',
            toolName: 'nuwax_ask_question',
          },
          toolCallId: 'tool-call-5',
          responseStatus: 'pending',
        },
      ],
    };

    const patched = applyMcpAskToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'agentSessionUpdate',
          subType: 'tool_call_update',
          data: {
            toolCallId: 'tool-call-5',
            status: 'completed',
            rawInput: {
              ...baseAskInput,
              requestId: 'ask-5',
              toolName: 'nuwax_ask_question',
            },
          },
        },
      } as any,
      currentMessage as any,
    );

    expect(patched).toBeNull();
  });

  it('creates an MCP Ask card from a completed tool_call_update if that is the first event received', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'agentSessionUpdate',
          subType: 'tool_call_update',
          data: {
            toolCallId: 'tool-call-6',
            status: 'completed',
            rawInput: {
              ...baseAskInput,
              requestId: 'ask-6',
              toolName: 'nuwax_ask_question',
            },
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.toolCallId).toBe('tool-call-6');
    expect(patched?.mcpAskInteractions?.[0]?.input.requestId).toBe('ask-6');
  });

  it('accepts rawInput nested under data.ext', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call',
        data: {
          toolCallId: 'tool-call-7',
          ext: {
            rawInput: {
              ...baseAskInput,
              requestId: 'ask-7',
              toolName: 'nuwax_ask_question',
            },
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.toolCallId).toBe('tool-call-7');
    expect(patched?.mcpAskInteractions?.[0]?.input.requestId).toBe('ask-7');
  });

  it('accepts agent input missing schemaVersion when ui.version is present', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          name: 'ask-question__nuwax_ask_question',
          type: 'ToolCall',
          status: 'EXECUTING',
          result: {
            executeId: 'call-775',
            input: {
              requestId: 'weather-plan-confirm-5',
              revision: 1,
              sessionId: 'weather-dev',
              title: '确认方案',
              ui: {
                version: 'nuwax.interaction.v2',
                presentation: 'modal',
                title: '确认方案',
                fields: [{ name: 'confirm', title: '确认', widget: 'text' }],
              },
            },
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.input.schemaVersion).toBe(
      'nuwax.mcp_ask.v2',
    );
    expect(patched?.mcpAskInteractions?.[0]?.input.requestId).toBe(
      'weather-plan-confirm-5',
    );
  });

  it('prefers canonical input from result.data structuredContent over agent result.input', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          name: 'ask-question__nuwax_ask_question',
          type: 'ToolCall',
          status: 'FINISHED',
          result: {
            executeId: 'call-775',
            input: {
              requestId: 'weather-plan-confirm-5',
              revision: 1,
              sessionId: 'weather-dev',
              title: 'agent title',
              ui: {
                version: 'nuwax.interaction.v2',
                presentation: 'modal',
                title: 'agent title',
                fields: [{ name: 'confirm', title: '确认', widget: 'text' }],
              },
            },
            data: [
              {
                type: 'content',
                content: {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'pending',
                    requestId: 'weather-plan-confirm-5',
                    revision: 1,
                    message: 'presented',
                    input: {
                      toolName: 'nuwax_ask_question',
                      schemaVersion: 'nuwax.mcp_ask.v2',
                      requestId: 'weather-plan-confirm-5',
                      revision: 1,
                      sessionId: 'weather-dev',
                      title: 'canonical title',
                      ui: {
                        version: 'nuwax.interaction.v2',
                        presentation: 'modal',
                        title: 'canonical title',
                        fields: [
                          { name: 'confirm', title: '确认', widget: 'text' },
                        ],
                      },
                    },
                  }),
                },
              },
            ],
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.input.title).toBe(
      'canonical title',
    );
    expect(patched?.mcpAskInteractions?.[0]?.input.toolName).toBe(
      'nuwax_ask_question',
    );
  });
});
