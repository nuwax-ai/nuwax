/**
 * useResumeStreamHandlers sub 流式恢复 handlers 测试
 */
import { useResumeStreamHandlers } from '@/hooks/useResumeStreamHandlers';
import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateSSEConnection } = vi.hoisted(() => ({
  mockCreateSSEConnection: vi.fn(),
}));

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: (...args: unknown[]) => mockCreateSSEConnection(...args),
}));

vi.mock('@/constants/common.constants', () => ({
  CONVERSATION_CHAT_SUB_URL: '/api/agent/conversation/chat/sub',
}));

vi.mock('@/constants/home.constants', () => ({
  ACCESS_TOKEN: 'ACCESS_TOKEN',
}));

describe('useResumeStreamHandlers', () => {
  let abortSse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    abortSse = vi.fn();
    mockCreateSSEConnection.mockReturnValue(abortSse);
    localStorage.clear();
  });

  it('订阅 sub 时追加新的 assistant 占位，不复用历史残留 Incomplete 消息', () => {
    let list: MessageInfo[] = [
      {
        id: 'old-incomplete',
        text: 'old',
        status: MessageStatusEnum.Incomplete,
      } as MessageInfo,
    ];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });
    const handleChangeMessageList = vi.fn();
    const resetResumeMessageState = vi.fn();

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList,
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
        resetResumeMessageState,
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1001, list);
    });

    expect(resetResumeMessageState).toHaveBeenCalledTimes(1);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('old-incomplete');
    expect(list[1].id).not.toBe('old-incomplete');
    expect(list[1].status).toBe(MessageStatusEnum.Loading);
  });

  it('把 sub chunk 转发给最新 handleChangeMessageList，并使用恢复占位 id', () => {
    let list: MessageInfo[] = [];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });
    const firstHandle = vi.fn();
    const latestHandle = vi.fn();

    const { result, rerender } = renderHook(
      ({ handleChangeMessageList }) =>
        useResumeStreamHandlers({
          setMessageList,
          handleChangeMessageList,
          messageViewRef: { current: null },
          allowAutoScrollRef: { current: false },
        } as any),
      {
        initialProps: { handleChangeMessageList: firstHandle },
      },
    );

    act(() => {
      result.current.resumeConversationStream(1002, list);
    });
    const placeholderId = list[0].id;

    rerender({ handleChangeMessageList: latestHandle });

    const sseOptions = mockCreateSSEConnection.mock.calls[0][0];
    const chunk = {
      eventType: ConversationEventTypeEnum.MESSAGE,
      data: { text: 'hello' },
    };
    act(() => {
      sseOptions.onMessage(chunk);
    });

    expect(firstHandle).not.toHaveBeenCalled();
    expect(latestHandle).toHaveBeenCalledWith(
      { conversationId: 1002 },
      chunk,
      placeholderId,
    );
  });

  it('sub 收到 ERROR 时主动中断连接，关闭时重置恢复状态并回调 onClose', () => {
    let list: MessageInfo[] = [];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });
    const resetResumeMessageState = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList: vi.fn(),
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
        resetResumeMessageState,
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1003, list, onClose);
    });

    const sseOptions = mockCreateSSEConnection.mock.calls[0][0];
    act(() => {
      sseOptions.onMessage({ eventType: ConversationEventTypeEnum.ERROR });
    });

    expect(abortSse).toHaveBeenCalled();

    act(() => {
      sseOptions.onClose();
    });

    expect(resetResumeMessageState).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalled();
  });
});
