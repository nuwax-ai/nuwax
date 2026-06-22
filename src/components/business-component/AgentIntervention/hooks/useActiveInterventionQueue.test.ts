import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { useActiveInterventionQueue } from './useActiveInterventionQueue';

function createAskInteraction(
  overrides: Partial<McpAskInteraction> = {},
): McpAskInteraction {
  return {
    input: {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwax.mcp_ask.v1',
      requestId: 'ask-1',
      revision: 1,
      sessionId: 'session-1',
      title: '毕业论文 PPT 前置信息收集',
      ui: {
        version: 'nuwax.interaction.v1',
        presentation: 'wizard',
        title: '毕业论文 PPT 前置信息收集',
        schema: {
          type: 'object',
          properties: {},
        },
      },
    },
    toolCallId: 'call-ask-1',
    responseStatus: 'pending',
    ...overrides,
  };
}

function createAcpPermissionInteraction(
  status: AcpPermissionInteraction['responseStatus'] = 'pending',
  rawInput: Record<string, unknown> = {
    schemaVersion: 'nuwax.mcp_ask.v1',
    requestId: 'ask-1',
  },
): AcpPermissionInteraction {
  return {
    intervention: {
      id: 'itv-ask-permission',
      revision: 1,
      kind: 'approval',
      status: 'pending',
      sessionId: 'session-1',
      source: 'acp_permission',
      engine: 'nuwaxcode',
      protocol: 'acp',
      callbackTarget: { kind: 'electron', targetId: '' },
      schemaRef: '',
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: 'session-1',
          toolCall: {
            toolCallId: 'call-ask-1',
            title: 'mcp__ask-question__nuwax_ask_question',
            kind: 'other',
            status: 'pending',
            rawInput,
          },
          options: [
            {
              optionId: 'allow',
              kind: 'allow_once',
              name: 'Allow',
            },
          ],
        },
      },
      createdAt: 100,
    },
    responseStatus: status,
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

  it('hides ask/question while matching ACP permission is pending', () => {
    const messageList = [
      {
        id: 'assistant-ask',
        index: 1,
        mcpAskInteractions: [createAskInteraction()],
        acpPermissionInteractions: [createAcpPermissionInteraction('pending')],
      },
    ] as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('acp_permission');
  });

  it('shows ask/question after matching ACP permission is submitted', () => {
    const messageList = [
      {
        id: 'assistant-ask',
        index: 1,
        mcpAskInteractions: [createAskInteraction()],
        acpPermissionInteractions: [
          createAcpPermissionInteraction('submitted'),
        ],
      },
    ] as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('mcp_ask');
  });

  it('drops a failed ACP permission so later approvals can proceed', () => {
    const failed = createAcpPermissionInteraction('failed');
    failed.intervention.id = 'itv-failed';
    failed.intervention.acp.request.toolCall.toolCallId = 'call-failed';

    const pending = createAcpPermissionInteraction('pending');
    pending.intervention.id = 'itv-pending';
    pending.intervention.createdAt = 200;
    pending.intervention.acp.request.toolCall.toolCallId = 'call-pending';

    const messageList = [
      {
        id: 'assistant',
        index: 1,
        acpPermissionInteractions: [failed, pending],
      },
    ] as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    // The failed approval must leave the queue; only the later pending one stays.
    expect(result.current).toHaveLength(1);
    expect(result.current[0].interaction.intervention.id).toBe('itv-pending');
  });

  it('keeps ask/question visible when pending ACP permission is unrelated', () => {
    const unrelatedPermission = createAcpPermissionInteraction('pending', {
      command: 'ls',
    });
    unrelatedPermission.intervention.acp.request.toolCall.toolCallId =
      'call-bash-1';

    const messageList = [
      {
        id: 'assistant-ask',
        index: 1,
        mcpAskInteractions: [createAskInteraction()],
        acpPermissionInteractions: [unrelatedPermission],
      },
    ] as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(2);
    expect(result.current.map((item) => item.kind)).toEqual([
      'acp_permission',
      'mcp_ask',
    ]);
  });
});
