import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';
import { applyMcpAskToolCallSseEvent } from './applyMcpAskToolCallSseEvent';

const baseAskInput = {
  schemaVersion: 'nuwaclaw.mcp_ask.v1',
  requestId: 'ask-1',
  revision: 1,
  sessionId: 'session-1',
  title: 'Need input',
  ui: {
    version: 'nuwaclaw.interaction.v1',
    presentation: 'inline',
    title: 'Need input',
    schema: { type: 'object', properties: {} },
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

  it('accepts nuwax namespace schema aliases during migration', () => {
    const patched = applyMcpAskToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call',
        data: {
          toolCallId: 'tool-call-8',
          rawInput: {
            ...baseAskInput,
            schemaVersion: 'nuwax.mcp_ask.v1',
            requestId: 'ask-8',
            toolName: 'nuwax_ask_question',
            ui: {
              ...baseAskInput.ui,
              version: 'nuwax.interaction.v1',
            },
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.mcpAskInteractions?.[0]?.toolCallId).toBe('tool-call-8');
    expect(patched?.mcpAskInteractions?.[0]?.input.requestId).toBe('ask-8');
  });
});
