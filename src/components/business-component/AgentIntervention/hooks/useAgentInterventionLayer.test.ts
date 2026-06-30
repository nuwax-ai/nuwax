import { DefaultSelectedEnum } from '@/types/enums/agent';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgentInterventionLayer } from './useAgentInterventionLayer';

const conversationInfoHandlers = {
  respondAcpPermission: vi.fn(),
  respondMcpAsk: vi.fn().mockResolvedValue('resume-from-conversation-info'),
};

vi.mock('umi', () => ({
  useModel: () => conversationInfoHandlers,
}));

describe('useAgentInterventionLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    conversationInfoHandlers.respondMcpAsk.mockResolvedValue(
      'resume-from-conversation-info',
    );
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
    expect(onSendMessage).toHaveBeenCalledWith('resume-from-conversation-info');
  });

  it('uses injected interventionHandlers for isolated session sources', async () => {
    const onSendMessage = vi.fn();
    const respondMcpAsk = vi.fn().mockResolvedValue('resume-from-preview');

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
    expect(onSendMessage).toHaveBeenCalledWith('resume-from-preview');
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
});
