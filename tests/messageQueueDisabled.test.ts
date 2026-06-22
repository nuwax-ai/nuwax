/**
 * 消息队列功能关闭时的发送拦截测试
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/constants/feature.constants', () => ({
  ENABLE_CHAT_MESSAGE_QUEUE: false,
}));

import { useChatMessageQueue } from '@/components/business-component/MessageQueue/useChatMessageQueue';

describe('消息队列关闭时的发送拦截', () => {
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendMessage = vi.fn();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('会话空闲时直发', () => {
    const { result } = renderHook(() =>
      useChatMessageQueue({
        isConversationActive: false,
        messageList: [],
        conversationId: 'conv-1',
        sendMessage,
        runStopConversation: vi.fn(),
      }),
    );

    act(() => {
      result.current.trySend('第一条');
    });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      '第一条',
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(result.current.queue).toHaveLength(0);
  });

  it('会话活跃时不发送也不入队', () => {
    const { result } = renderHook(() =>
      useChatMessageQueue({
        isConversationActive: true,
        messageList: [],
        conversationId: 'conv-1',
        sendMessage,
        runStopConversation: vi.fn(),
      }),
    );

    act(() => {
      result.current.trySend('被拦截');
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(result.current.queue).toHaveLength(0);
  });

  it('连续快速发送时第二条被乐观锁拦截', () => {
    const { result } = renderHook(() =>
      useChatMessageQueue({
        isConversationActive: false,
        messageList: [],
        conversationId: 'conv-1',
        sendMessage,
        runStopConversation: vi.fn(),
      }),
    );

    act(() => {
      result.current.trySend('第一条');
      result.current.trySend('第二条');
    });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      '第一条',
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });
});
