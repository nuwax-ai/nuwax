import { DefaultSelectedEnum } from '@/types/enums/agent';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgentInterventionLayer } from './useAgentInterventionLayer';

const conversationInfoHandlers = {
  respondAcpPermission: vi.fn(),
  respondMcpAsk: vi
    .fn()
    .mockResolvedValue({ text: 'resume-from-conversation-info' }),
};

vi.mock('umi', () => ({
  useModel: () => conversationInfoHandlers,
}));

describe('useAgentInterventionLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    conversationInfoHandlers.respondMcpAsk.mockResolvedValue({
      text: 'resume-from-conversation-info',
    });
  });
  it('uses conversationInfo handlers by default', async () => {
    const onSendMessage = vi.fn();
    const { result } = renderHook(() =>
      useAgentInterventionLayer({
        conversationId: 1,
        messageList: [],
        onSendMessage,
      }),
    );

    await act(async () => {
      await result.current.chatLayerProps.onRespondMcpAsk?.(
        {
          input: { requestId: 'ask-1', toolName: 'nuwax_ask_question' },
          toolCallId: 'tc-1',
          responseStatus: 'pending',
        } as any,
        { action: 'submit', formData: {} },
      );
    });

    expect(conversationInfoHandlers.respondMcpAsk).toHaveBeenCalled();
    expect(onSendMessage).toHaveBeenCalledWith(
      'resume-from-conversation-info',
      undefined,
    );
  });

  it('uses injected interventionHandlers for isolated session sources', async () => {
    const onSendMessage = vi.fn();
    const respondMcpAsk = vi
      .fn()
      .mockResolvedValue({ text: 'resume-from-preview' });

    const { result } = renderHook(() =>
      useAgentInterventionLayer({
        conversationId: 99,
        messageList: [],
        onSendMessage,
        interventionHandlers: {
          respondAcpPermission: vi.fn(),
          respondMcpAsk,
        },
      }),
    );

    await act(async () => {
      await result.current.chatLayerProps.onRespondMcpAsk?.(
        {
          input: { requestId: 'ask-2', toolName: 'nuwax_ask_question' },
          toolCallId: 'tc-2',
          responseStatus: 'pending',
        } as any,
        { action: 'submit', formData: {} },
      );
    });

    expect(respondMcpAsk).toHaveBeenCalled();
    expect(conversationInfoHandlers.respondMcpAsk).not.toHaveBeenCalled();
    expect(onSendMessage).toHaveBeenCalledWith(
      'resume-from-preview',
      undefined,
    );
  });

  it('syncs agentMode cache between sessions of the same agent', () => {
    const createHook = () =>
      renderHook(() =>
        useAgentInterventionLayer({
          conversationId: 1,
          agentId: 1001,
          messageList: [],
          allowChooseMode: DefaultSelectedEnum.Yes,
          onSendMessage: vi.fn(),
        }),
      );

    const first = createHook();
    const second = createHook();

    expect(first.result.current.agentMode).toBe('yolo');
    expect(second.result.current.agentMode).toBe('yolo');

    act(() => {
      first.result.current.agentModeInputProps.onAgentModeChange('ask');
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'nuwax_agent_mode_cache',
        }),
      );
    });

    expect(first.result.current.agentMode).toBe('ask');
    expect(second.result.current.agentMode).toBe('ask');
    expect(
      JSON.parse(localStorage.getItem('nuwax_agent_mode_cache') || '{}'),
    ).toMatchObject({
      agents: {
        '1001': 'ask',
      },
    });
  });

  it('keeps agentMode cache isolated between different agents', () => {
    const first = renderHook(() =>
      useAgentInterventionLayer({
        conversationId: 1,
        agentId: 1001,
        messageList: [],
        allowChooseMode: DefaultSelectedEnum.Yes,
        onSendMessage: vi.fn(),
      }),
    );
    const second = renderHook(() =>
      useAgentInterventionLayer({
        conversationId: 2,
        agentId: 1002,
        messageList: [],
        allowChooseMode: DefaultSelectedEnum.Yes,
        onSendMessage: vi.fn(),
      }),
    );

    act(() => {
      first.result.current.agentModeInputProps.onAgentModeChange('ask');
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'nuwax_agent_mode_cache',
        }),
      );
    });

    expect(first.result.current.agentMode).toBe('ask');
    expect(second.result.current.agentMode).toBe('yolo');
  });

  const switchModeInteraction = (toolCallKind = 'switch_mode') =>
    ({
      intervention: {
        id: 'itv-plan',
        revision: 1,
        kind: 'approval',
        status: 'pending',
        sessionId: 'sess-1',
        source: 'acp_permission',
        engine: 'claude-code',
        protocol: 'acp',
        callbackTarget: { kind: 'electron', targetId: 'tgt-1' },
        schemaRef: 'acp/permission/v1',
        acp: {
          method: 'session/request_permission',
          request: {
            sessionId: 'sess-1',
            toolCall: {
              toolCallId: 'tc-1',
              title: 'Ready to code?',
              kind: toolCallKind,
            },
            options: [],
          },
        },
        createdAt: Date.now(),
      },
      responseStatus: 'pending',
    } as any);

  const renderModeEnabledLayer = () =>
    renderHook(() =>
      useAgentInterventionLayer({
        conversationId: 1,
        agentId: 2001,
        messageList: [],
        allowChooseMode: DefaultSelectedEnum.Yes,
        onSendMessage: vi.fn(),
      }),
    );

  it('maps switch_mode approval (auto) back to previous business yolo and persists', () => {
    const { result } = renderModeEnabledLayer();

    // 计划阶段：档位停在 plan（stash 切换前档位 yolo）
    act(() => {
      result.current.agentModeInputProps.onAgentModeChange('plan');
    });
    expect(result.current.agentMode).toBe('plan');

    act(() => {
      result.current.chatLayerProps.onRespondAcpPermission?.(
        switchModeInteraction(),
        { outcome: { outcome: 'selected', optionId: 'auto' } },
      );
    });

    // 批准 auto：业务档位回写为切 plan 前的 yolo（下一轮 chat 不再把引擎推回 plan）
    expect(result.current.agentMode).toBe('yolo');
    expect(conversationInfoHandlers.respondAcpPermission).toHaveBeenCalledWith(
      expect.anything(),
      { outcome: { outcome: 'selected', optionId: 'auto' } },
    );
    expect(
      JSON.parse(localStorage.getItem('nuwax_agent_mode_cache') || '{}'),
    ).toMatchObject({ agents: { '2001': 'yolo' } });
  });

  it('maps switch_mode approval back to previous business ask', () => {
    // 预置：切 plan 前档位为 ask
    localStorage.setItem(
      'nuwax_agent_mode_cache',
      JSON.stringify({ version: 1, agents: { '2001': 'ask' } }),
    );
    const { result } = renderModeEnabledLayer();

    act(() => {
      result.current.agentModeInputProps.onAgentModeChange('plan');
    });

    act(() => {
      result.current.chatLayerProps.onRespondAcpPermission?.(
        switchModeInteraction(),
        { outcome: { outcome: 'selected', optionId: 'default' } },
      );
    });

    // 批准：回写切 plan 前的 ask，本地不自动放行
    expect(result.current.agentMode).toBe('ask');
    expect(
      JSON.parse(localStorage.getItem('nuwax_agent_mode_cache') || '{}'),
    ).toMatchObject({ agents: { '2001': 'ask' } });
  });

  it('falls back to option semantics when no previous mode is recorded', () => {
    // 无 previousModes 记录（如旧版本缓存）：按选项语义折算（default→ask）
    localStorage.setItem(
      'nuwax_agent_mode_cache',
      JSON.stringify({ version: 1, agents: { '2001': 'plan' } }),
    );
    const { result } = renderModeEnabledLayer();

    act(() => {
      result.current.chatLayerProps.onRespondAcpPermission?.(
        switchModeInteraction(),
        { outcome: { outcome: 'selected', optionId: 'default' } },
      );
    });

    expect(result.current.agentMode).toBe('ask');
  });

  it('switch_mode revision text responds reject and sends the text as a new message', async () => {
    const onSendMessage = vi.fn();
    const { result } = renderHook(() =>
      useAgentInterventionLayer({
        conversationId: 1,
        agentId: 2001,
        messageList: [],
        allowChooseMode: DefaultSelectedEnum.Yes,
        onSendMessage,
      }),
    );

    act(() => {
      result.current.agentModeInputProps.onAgentModeChange('plan');
    });

    await act(async () => {
      await result.current.chatLayerProps.onRespondAcpPermission?.(
        switchModeInteraction(),
        { outcome: { outcome: 'selected', optionId: 'plan' } },
        { revisionText: '把第 2 步拆细' },
      );
    });

    // 应答「否，继续完善计划」+ 修订意见作为新消息发出（引擎留在 plan 修订）
    expect(conversationInfoHandlers.respondAcpPermission).toHaveBeenCalledWith(
      expect.anything(),
      { outcome: { outcome: 'selected', optionId: 'plan' } },
    );
    expect(onSendMessage).toHaveBeenCalledWith('把第 2 步拆细');
    expect(result.current.agentMode).toBe('plan');
  });

  it('keeps plan mode when switch_mode approval keeps planning', () => {
    const { result } = renderModeEnabledLayer();

    act(() => {
      result.current.agentModeInputProps.onAgentModeChange('plan');
    });

    act(() => {
      result.current.chatLayerProps.onRespondAcpPermission?.(
        switchModeInteraction(),
        { outcome: { outcome: 'selected', optionId: 'plan' } },
      );
    });

    expect(result.current.agentMode).toBe('plan');
  });

  it('does not touch agentMode on cancelled or non-switch approvals', () => {
    const { result } = renderModeEnabledLayer();

    act(() => {
      result.current.agentModeInputProps.onAgentModeChange('plan');
    });

    act(() => {
      result.current.chatLayerProps.onRespondAcpPermission?.(
        switchModeInteraction(),
        { outcome: { outcome: 'cancelled' } },
      );
    });
    expect(result.current.agentMode).toBe('plan');

    act(() => {
      result.current.chatLayerProps.onRespondAcpPermission?.(
        switchModeInteraction('execute'),
        { outcome: { outcome: 'selected', optionId: 'allow' } },
      );
    });
    expect(result.current.agentMode).toBe('plan');
  });
});
