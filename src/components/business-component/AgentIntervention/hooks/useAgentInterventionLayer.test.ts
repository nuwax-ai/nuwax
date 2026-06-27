import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgentInterventionLayer } from './useAgentInterventionLayer';

const conversationInfoHandlers = {
  respondAcpPermission: vi.fn(),
  respondMcpAsk: vi.fn().mockResolvedValue('resume-from-conversation-info'),
  runStopConversation: vi.fn().mockResolvedValue(undefined),
  isConversationActive: true,
};

vi.mock('umi', () => ({
  useModel: () => conversationInfoHandlers,
}));

describe('useAgentInterventionLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const runStopConversation = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAgentInterventionLayer({
        conversationId: 99,
        messageList: [],
        onSendMessage,
        interventionHandlers: {
          respondAcpPermission: vi.fn(),
          respondMcpAsk,
          runStopConversation,
          isConversationActive: true,
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
    expect(runStopConversation).toHaveBeenCalledWith('99');
    expect(onSendMessage).toHaveBeenCalledWith('resume-from-preview');
  });
});
