import { apiAgentConversation } from '@/services/agentConfig';
import { AgentComponentTypeEnum, MessageTypeEnum } from '@/types/enums/agent';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInitialConversationAutoSend } from './useInitialConversationAutoSend';

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: vi.fn(),
}));

const queryConversation = vi.mocked(apiAgentConversation);

describe('useInitialConversationAutoSend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('查询空会话后只自动发送一次完整路由上下文', async () => {
    queryConversation.mockResolvedValue({ data: { messageList: [] } } as never);
    const onMessageSend = vi.fn();
    const getEffectiveSandboxId = vi.fn().mockReturnValue('computer-1');
    const routeState = {
      message: 'build it',
      files: [
        {
          uid: 'file-1',
          name: 'spec.md',
          url: 'https://example.test/spec.md',
          type: 'text/markdown',
          size: 128,
        },
      ],
      infos: [{ id: 2, type: AgentComponentTypeEnum.Workflow }],
      skillIds: [3],
      modelId: 4,
      agentMode: 'ask' as const,
    };

    const { rerender } = renderHook(() =>
      useInitialConversationAutoSend({
        conversationId: 7001,
        routeState,
        getEffectiveSandboxId,
        onMessageSend,
      }),
    );
    rerender();

    await waitFor(() => expect(onMessageSend).toHaveBeenCalledTimes(1));
    expect(queryConversation).toHaveBeenCalledTimes(1);
    expect(onMessageSend).toHaveBeenCalledWith({
      id: 7001,
      messageInfo: 'build it',
      files: [
        {
          uid: 'file-1',
          name: 'spec.md',
          url: 'https://example.test/spec.md',
          type: 'text/markdown',
          size: 128,
        },
      ],
      infos: [{ id: 2, type: AgentComponentTypeEnum.Workflow }],
      sandboxId: 'computer-1',
      debug: true,
      isSync: false,
      skillIds: [3],
      modelId: 4,
      agentMode: 'ask',
      data: { messageList: [] },
    });
  });

  it('会话已有用户消息时不自动重发', async () => {
    queryConversation.mockResolvedValue({
      data: { messageList: [{ messageType: MessageTypeEnum.USER }] },
    } as never);
    const onMessageSend = vi.fn();

    renderHook(() =>
      useInitialConversationAutoSend({
        conversationId: 7001,
        routeState: { message: 'do not duplicate' },
        getEffectiveSandboxId: () => '-1',
        onMessageSend,
      }),
    );

    await waitFor(() => expect(queryConversation).toHaveBeenCalledTimes(1));
    expect(onMessageSend).not.toHaveBeenCalled();
  });

  it('详情查询失败时仍以路由上下文兜底发送', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queryConversation.mockRejectedValue(new Error('network'));
    const onMessageSend = vi.fn();

    renderHook(() =>
      useInitialConversationAutoSend({
        conversationId: 7001,
        routeState: {
          files: [
            {
              uid: 'file-2',
              name: 'only-file.md',
              url: 'https://example.test/only-file.md',
              type: 'text/markdown',
              size: 64,
            },
          ],
        },
        getEffectiveSandboxId: () => 'fallback-computer',
        onMessageSend,
      }),
    );

    await waitFor(() => expect(onMessageSend).toHaveBeenCalledTimes(1));
    expect(onMessageSend).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7001,
        messageInfo: '',
        sandboxId: 'fallback-computer',
        data: null,
      }),
    );
    errorSpy.mockRestore();
  });
});
