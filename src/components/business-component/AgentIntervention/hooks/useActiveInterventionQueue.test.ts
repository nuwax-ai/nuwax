import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { buildMcpAskRequestIdMarker } from '../utils/mcpAskResumeMessage';
import { useActiveInterventionQueue } from './useActiveInterventionQueue';

function createAskInteraction(
  overrides: Partial<McpAskInteraction> = {},
): McpAskInteraction {
  return {
    input: {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwax.mcp_ask.v2',
      requestId: 'ask-1',
      revision: 1,
      sessionId: 'session-1',
      title: '毕业论文 PPT 前置信息收集',
      ui: {
        version: 'nuwax.interaction.v2',
        presentation: 'wizard',
        title: '毕业论文 PPT 前置信息收集',
        fields: [],
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
    ] as unknown as MessageInfo[];

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
    ] as unknown as MessageInfo[];

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
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('mcp_ask');
  });

  it('prefers the latest message that still has an active intervention', () => {
    const permission = createAcpPermissionInteraction('pending', {
      filePath: '/tmp/a.txt',
    });
    permission.executeId = 'exec-write-1';
    const messageList = [
      {
        id: 'assistant-with-approval',
        index: 1,
        status: 'loading',
        acpPermissionInteractions: [permission],
      },
      {
        id: 'later-message-without-approval',
        index: 2,
        status: 'complete',
        text: 'later message',
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('acp_permission');
  });

  it('hides ask/question while matching ACP permission is pending', () => {
    const messageList = [
      {
        id: 'assistant-ask',
        index: 1,
        mcpAskInteractions: [createAskInteraction()],
        acpPermissionInteractions: [createAcpPermissionInteraction('pending')],
      },
    ] as unknown as MessageInfo[];

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
    ] as unknown as MessageInfo[];

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
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    // The failed approval must leave the queue; only the later pending one stays.
    expect(result.current).toHaveLength(1);
    expect((result.current[0] as any).interaction.intervention.id).toBe(
      'itv-pending',
    );
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
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(2);
    expect(result.current.map((item) => item.kind)).toEqual([
      'acp_permission',
      'mcp_ask',
    ]);
  });

  it('keeps the approval whose executeId matches the latest processing focus', () => {
    // 当前焦点 executeId = 最新 processingList 末尾的 executeId；审批不再受此影响，始终渲染
    const interaction = createAcpPermissionInteraction('pending');
    interaction.executeId = 'exec-1';
    const messageList = [
      {
        id: 'assistant',
        index: 1,
        acpPermissionInteractions: [interaction],
        processingList: [{ executeId: 'exec-1' }] as any,
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
  });

  it('keeps the approval card even when its executeId is no longer the focus', () => {
    // 最新 processing 已推进到另一个 executeId → 仍保留弹窗队列，不再按 executeId 精确关闭
    const interaction = createAcpPermissionInteraction('pending');
    interaction.executeId = 'exec-old';
    const messageList = [
      {
        id: 'assistant',
        index: 1,
        acpPermissionInteractions: [interaction],
        processingList: [
          { executeId: 'exec-old' },
          { executeId: 'exec-new' },
        ] as any,
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
  });

  it('keeps a fresh approval before its tool processing block arrives', () => {
    const interaction = createAcpPermissionInteraction('pending');
    interaction.executeId = 'exec-edit';
    const messageList = [
      {
        id: 'assistant',
        index: 1,
        acpPermissionInteractions: [interaction],
        processingList: [{ executeId: 'exec-previous' }] as any,
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('acp_permission');
    if (result.current[0].kind === 'acp_permission') {
      expect(result.current[0].interaction.executeId).toBe('exec-edit');
    }
  });

  it('keeps an approval with unknown executeId (fallback, no false close)', () => {
    // 无 processingList / 审批无 executeId 时无法判定过期 → 保守显示，避免误关
    const messageList = [
      {
        id: 'assistant',
        index: 1,
        acpPermissionInteractions: [createAcpPermissionInteraction('pending')],
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
  });

  it('keeps a pending approval visible even if the host message becomes complete', () => {
    const interaction = createAcpPermissionInteraction('pending');
    interaction.executeId = 'exec-approval';
    const messageList = [
      {
        id: 'assistant',
        index: 1,
        status: 'complete',
        acpPermissionInteractions: [interaction],
        processingList: [{ executeId: 'exec-approval' }] as any,
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('acp_permission');
  });

  it('keeps multiple pending approvals instead of hiding earlier ones', () => {
    const first = createAcpPermissionInteraction('pending', {
      filePath: '/tmp/a.txt',
    });
    first.intervention.id = 'itv-first';
    first.intervention.createdAt = 100;
    first.intervention.acp.request.toolCall.toolCallId = 'call-first';
    first.executeId = 'exec-first';

    const second = createAcpPermissionInteraction('pending', {
      filePath: '/tmp/b.txt',
    });
    second.intervention.id = 'itv-second';
    second.intervention.createdAt = 200;
    second.intervention.acp.request.toolCall.toolCallId = 'call-second';
    second.executeId = 'exec-second';

    const messageList = [
      {
        id: 'assistant-1',
        index: 1,
        status: 'complete',
        acpPermissionInteractions: [first],
        processingList: [{ executeId: 'exec-first' }] as any,
      },
      {
        id: 'assistant-2',
        index: 2,
        status: 'loading',
        acpPermissionInteractions: [second],
        processingList: [{ executeId: 'exec-second' }] as any,
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(2);
    expect(
      result.current.map((item) =>
        item.kind === 'acp_permission'
          ? item.interaction.intervention.id
          : item.interaction.input.requestId,
      ),
    ).toEqual(['itv-first', 'itv-second']);
  });

  it('closes the dock after the approval is answered', () => {
    // 审批已应答(submitted)，不再 pending → DockPanel 关闭
    const messageList = [
      {
        id: 'assistant',
        index: 1,
        acpPermissionInteractions: [
          createAcpPermissionInteraction('submitted'),
        ],
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(0);
  });

  it('keeps a second ask active after the first same-title ask was answered', () => {
    const sharedTitle = '补充回复';
    const firstAsk = createAskInteraction({
      input: {
        ...createAskInteraction().input,
        requestId: 'ask-first',
        title: sharedTitle,
        ui: {
          ...createAskInteraction().input.ui,
          title: sharedTitle,
        },
      },
      responseStatus: 'submitted',
    });
    const secondAsk = createAskInteraction({
      input: {
        ...createAskInteraction().input,
        requestId: 'ask-second',
        title: sharedTitle,
        ui: {
          ...createAskInteraction().input.ui,
          title: sharedTitle,
        },
      },
      toolCallId: 'call-ask-2',
      responseStatus: 'pending',
    });
    const resumeText = `我已填写「${sharedTitle}」，表单内容如下：\n选项：test${buildMcpAskRequestIdMarker(
      'ask-first',
    )}`;
    const messageList = [
      {
        id: 'assistant-ask',
        index: 1,
        mcpAskInteractions: [firstAsk, secondAsk],
      },
      {
        id: 'user-resume',
        index: 2,
        text: resumeText,
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].kind).toBe('mcp_ask');
    if (result.current[0].kind === 'mcp_ask') {
      expect(result.current[0].interaction.input.requestId).toBe('ask-second');
    }
  });

  it('keeps a later ask active when an earlier assistant message had legacy same-title resume', () => {
    const sharedTitle = '补充回复';
    const firstAsk = createAskInteraction({
      input: {
        ...createAskInteraction().input,
        requestId: 'ask-first',
        title: sharedTitle,
        ui: {
          ...createAskInteraction().input.ui,
          title: sharedTitle,
        },
      },
      responseStatus: 'submitted',
    });
    const secondAsk = createAskInteraction({
      input: {
        ...createAskInteraction().input,
        requestId: 'ask-second',
        title: sharedTitle,
        ui: {
          ...createAskInteraction().input.ui,
          title: sharedTitle,
        },
      },
      toolCallId: 'call-ask-2',
      responseStatus: 'pending',
    });
    const messageList = [
      {
        id: 'assistant-ask-1',
        index: 2,
        mcpAskInteractions: [firstAsk],
      },
      {
        id: 'user-resume',
        index: 3,
        text: `我已填写「${sharedTitle}」，表单内容如下：\n选项：test`,
      },
      {
        id: 'assistant-ask-2',
        index: 4,
        mcpAskInteractions: [secondAsk],
      },
    ] as unknown as MessageInfo[];

    const { result } = renderHook(() =>
      useActiveInterventionQueue(messageList),
    );

    expect(result.current).toHaveLength(1);
    if (result.current[0].kind === 'mcp_ask') {
      expect(result.current[0].interaction.input.requestId).toBe('ask-second');
    }
  });
});
