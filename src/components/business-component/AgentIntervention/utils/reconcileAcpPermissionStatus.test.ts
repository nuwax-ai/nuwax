import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it, vi } from 'vitest';
import type { AcpPermissionInteraction } from '../types/acpIntervention';

vi.mock('./mcpAskResumeMessage', () => ({
  hasMcpAskResumeMessage: vi.fn(() => false),
}));

import { hasMcpAskResumeMessage } from './mcpAskResumeMessage';
import {
  isIdempotentAcpPermissionResolveError,
  reconcileAcpPermissionStatusesInMessageList,
  reconcileMessageAcpPermissionStatuses,
} from './reconcileAcpPermissionStatus';

function createAcpInteraction(
  overrides: Partial<AcpPermissionInteraction> = {},
): AcpPermissionInteraction {
  return {
    intervention: {
      id: 'itv-1',
      revision: 1,
      kind: 'approval',
      status: 'pending',
      sessionId: 'sess-1',
      source: 'acp_permission',
      engine: 'nuwaxcode',
      protocol: 'acp',
      callbackTarget: { kind: 'electron', targetId: '' },
      schemaRef: '',
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: 'sess-1',
          toolCall: {
            toolCallId: 'call-1',
            title: 'write',
            kind: 'edit',
            status: 'pending',
            rawInput: { filePath: '/tmp/a.txt' },
          },
          options: [],
        },
      },
      createdAt: 100,
    },
    responseStatus: 'pending',
    executeId: 'call-1',
    ...overrides,
  } as AcpPermissionInteraction;
}

describe('reconcileAcpPermissionStatus', () => {
  it('marks pending permission as submitted when matching tool finished in processingList', () => {
    const message = {
      id: 'assistant',
      acpPermissionInteractions: [createAcpInteraction()],
      processingList: [
        {
          executeId: 'call-1',
          name: 'write',
          type: AgentComponentTypeEnum.ToolCall,
          status: ProcessingEnum.FINISHED,
          result: null,
          targetId: -1,
          cardBindConfig: null,
          subEventType: null,
        },
      ],
    } as unknown as MessageInfo;

    const reconciled = reconcileMessageAcpPermissionStatuses(message);
    expect(reconciled.acpPermissionInteractions?.[0].responseStatus).toBe(
      'submitted',
    );
  });

  it('marks permission submitted when MCP ask resume exists for linked requestId', () => {
    vi.mocked(hasMcpAskResumeMessage).mockReturnValueOnce(true);

    const askPermission = createAcpInteraction({
      intervention: {
        ...createAcpInteraction().intervention,
        acp: {
          method: 'session/request_permission',
          request: {
            sessionId: 'sess-1',
            toolCall: {
              toolCallId: 'call-ask',
              title: 'ask',
              kind: 'other',
              status: 'pending',
              rawInput: {
                schemaVersion: 'nuwax.mcp_ask.v1',
                requestId: 'ask-1',
                title: '毕业论文 PPT 前置信息收集',
                ui: {
                  version: 'nuwax.interaction.v1',
                  presentation: 'inline',
                  title: '毕业论文 PPT 前置信息收集',
                  fields: [],
                },
              },
            },
            options: [],
          },
        },
      },
      executeId: 'call-ask',
    });

    const messageList = [
      {
        id: 'assistant',
        acpPermissionInteractions: [askPermission],
      },
      {
        id: 'user-resume',
        text: '我已填写「毕业论文 PPT 前置信息收集」',
      },
    ] as unknown as MessageInfo[];

    const reconciled = reconcileAcpPermissionStatusesInMessageList(messageList);
    expect(reconciled[0].acpPermissionInteractions?.[0].responseStatus).toBe(
      'submitted',
    );
  });

  it('sub replay leaves only one pending after reconcile when one tool finished', () => {
    const first = createAcpInteraction({
      intervention: {
        ...createAcpInteraction().intervention,
        id: 'itv-first',
        createdAt: 100,
        acp: {
          method: 'session/request_permission',
          request: {
            sessionId: 'sess-1',
            toolCall: {
              toolCallId: 'call-first',
              title: 'a',
              kind: 'edit',
              status: 'pending',
              rawInput: {},
            },
            options: [],
          },
        },
      },
      executeId: 'call-first',
    });
    const second = createAcpInteraction({
      intervention: {
        ...createAcpInteraction().intervention,
        id: 'itv-second',
        createdAt: 200,
        acp: {
          method: 'session/request_permission',
          request: {
            sessionId: 'sess-1',
            toolCall: {
              toolCallId: 'call-second',
              title: 'b',
              kind: 'edit',
              status: 'pending',
              rawInput: {},
            },
            options: [],
          },
        },
      },
      executeId: 'call-second',
    });

    const messageList = [
      {
        id: 'assistant',
        acpPermissionInteractions: [first, second],
        processingList: [
          {
            executeId: 'call-first',
            status: ProcessingEnum.FINISHED,
          },
        ],
      },
    ] as unknown as MessageInfo[];

    const reconciled = reconcileAcpPermissionStatusesInMessageList(messageList);
    const pending = reconciled[0].acpPermissionInteractions?.filter(
      (item) => item.responseStatus === 'pending',
    );
    expect(pending).toHaveLength(1);
    expect(pending?.[0].intervention.id).toBe('itv-second');
  });

  it('keeps still-pending permission when tool has not finished', () => {
    const message = {
      id: 'assistant',
      acpPermissionInteractions: [createAcpInteraction()],
      processingList: [
        {
          executeId: 'call-1',
          name: 'write',
          type: AgentComponentTypeEnum.ToolCall,
          status: ProcessingEnum.EXECUTING,
          result: null,
          targetId: -1,
          cardBindConfig: null,
          subEventType: null,
        },
      ],
    } as unknown as MessageInfo;

    const reconciled = reconcileMessageAcpPermissionStatuses(message);
    expect(reconciled.acpPermissionInteractions?.[0].responseStatus).toBe(
      'pending',
    );
  });

  it('detects idempotent resolve errors', () => {
    expect(
      isIdempotentAcpPermissionResolveError(
        new Error('pending permission not found'),
      ),
    ).toBe(true);
    expect(isIdempotentAcpPermissionResolveError('already_resolved')).toBe(
      true,
    );
    expect(isIdempotentAcpPermissionResolveError('network timeout')).toBe(
      false,
    );
  });
});
