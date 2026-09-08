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

  it('会话活跃时不直发而是入队（拦截语义由 queueGate 承担，与队列特性开关无关）', () => {
    const { result } = renderHook(() =>
      useChatMessageQueue({
        isConversationActive: true,
        messageList: [],
        conversationId: 'conv-1',
        sendMessage,
      }),
    );

    act(() => {
      result.current.trySend('被拦截');
    });

    // 真实合同：活跃（streamActive）→ 不直发，进入队列等待空闲消费
    expect(sendMessage).not.toHaveBeenCalled();
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].text).toBe('被拦截');
  });

  it('连续快速发送：活跃态更新前均直发，更新后入队（乐观锁由调用方状态承接）', () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useChatMessageQueue({
          isConversationActive: active,
          messageList: [],
          conversationId: 'conv-1',
          sendMessage,
        }),
      { initialProps: { active: false } },
    );

    // 第一条直发后、调用方尚未把 isConversationActive 置 true 前，第二条仍直发
    act(() => {
      result.current.trySend('第一条');
      result.current.trySend('第二条');
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);

    // 调用方（model/页面）将活跃态抬起后，后续发送进入队列
    rerender({ active: true });
    act(() => {
      result.current.trySend('第三条');
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].text).toBe('第三条');
  });
});
