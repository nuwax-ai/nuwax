/**
 * useResumeStreamHandlers sub 流式恢复 handlers 测试
 */
import { useResumeStreamHandlers } from '@/hooks/useResumeStreamHandlers';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
} from '@/types/enums/agent';
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

  it('基于 reload 后的当前快照追加 assistant 占位，避免挂到旧 prev 尾部', () => {
    let list: MessageInfo[] = [{ id: 1, text: 'old' } as MessageInfo];
    const reloaded = [
      { id: 1, text: 'old' },
      { id: 2, text: 'external user' },
    ] as MessageInfo[];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList: vi.fn(),
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1001, reloaded);
    });

    expect(list).toHaveLength(3);
    expect(list[0].id).toBe(1);
    expect(list[1].id).toBe(2);
    expect(list[2].status).toBe(MessageStatusEnum.Loading);
  });

  it('reload 快照比旧 prev 短但包含新 user 时，仍以 reload 快照作为占位基底', () => {
    let list: MessageInfo[] = [
      { id: 1, role: AssistantRoleEnum.USER, text: 'old' },
      {
        id: 'old-local-assistant',
        role: AssistantRoleEnum.ASSISTANT,
        text: 'stale local assistant',
        status: MessageStatusEnum.Incomplete,
      },
    ] as MessageInfo[];
    const reloaded = [
      { id: 1, role: AssistantRoleEnum.USER, text: 'old' },
      { id: 2, role: AssistantRoleEnum.USER, text: 'external user' },
    ] as MessageInfo[];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList: vi.fn(),
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1001, reloaded);
    });

    expect(list).toHaveLength(3);
    expect(list[0].id).toBe(1);
    expect(list[1]).toMatchObject({
      id: 2,
      role: AssistantRoleEnum.USER,
      text: 'external user',
    });
    expect(list[2]).toMatchObject({
      role: AssistantRoleEnum.ASSISTANT,
      status: MessageStatusEnum.Loading,
    });
  });

  it('reload 快照已包含落库完成 assistant 时不再创建 sub 占位，避免重复气泡', () => {
    const list: MessageInfo[] = [
      {
        id: 'user-1',
        role: AssistantRoleEnum.USER,
        text: '你好',
      } as MessageInfo,
      {
        id: '9a10df5d095a4c8786609f830af91743',
        role: AssistantRoleEnum.ASSISTANT,
        text: '你好！',
        status: MessageStatusEnum.Complete,
      } as MessageInfo,
    ];
    const setMessageList = vi.fn();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList: vi.fn(),
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1001, list, onClose);
    });

    expect(setMessageList).not.toHaveBeenCalled();
    expect(mockCreateSSEConnection).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
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

  it('sub 收到 USER message 时插入到当前 assistant 占位前，不转发给 assistant 拼接', () => {
    let list: MessageInfo[] = [];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });
    const handleChangeMessageList = vi.fn();

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList,
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1002, list);
    });
    const placeholderId = list[0].id;

    const sseOptions = mockCreateSSEConnection.mock.calls[0][0];
    act(() => {
      sseOptions.onMessage({
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          id: 'persisted-user-2',
          role: AssistantRoleEnum.USER,
          messageType: 'USER',
          type: 'CHAT',
          text: '使用 flow-debugger 再测试一轮',
          finished: true,
        },
      });
    });

    expect(handleChangeMessageList).not.toHaveBeenCalled();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({
      id: 'persisted-user-2',
      role: AssistantRoleEnum.USER,
      text: '使用 flow-debugger 再测试一轮',
    });
    expect(list[1].id).toBe(placeholderId);
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

  it('同会话重入复用已有 sub 连接不重建；不同会话才 abort 旧连接', () => {
    let list: MessageInfo[] = [];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList: vi.fn(),
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1001, list);
    });
    expect(mockCreateSSEConnection).toHaveBeenCalledTimes(1);

    // 同会话重入：不 abort 旧连接、不新建连接
    act(() => {
      result.current.resumeConversationStream(1001, list);
    });
    expect(abortSse).not.toHaveBeenCalled();
    expect(mockCreateSSEConnection).toHaveBeenCalledTimes(1);

    // 连接关闭后（onClose 清理订阅标记）：同会话可重新订阅
    const sseOptions = mockCreateSSEConnection.mock.calls[0][0];
    act(() => {
      sseOptions.onClose();
    });
    act(() => {
      result.current.resumeConversationStream(1001, list);
    });
    expect(mockCreateSSEConnection).toHaveBeenCalledTimes(2);

    // 不同会话：abort 旧连接并新建
    act(() => {
      result.current.resumeConversationStream(1002, list);
    });
    expect(abortSse).toHaveBeenCalledTimes(1);
    expect(mockCreateSSEConnection).toHaveBeenCalledTimes(3);
  });

  it('切换 sub run 后忽略旧连接迟到的 message，只消费当前 run', () => {
    let list: MessageInfo[] = [];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });
    const handleChangeMessageList = vi.fn();
    mockCreateSSEConnection.mockImplementation(() => vi.fn());

    const { result } = renderHook(() =>
      useResumeStreamHandlers({
        setMessageList,
        handleChangeMessageList,
        messageViewRef: { current: null },
        allowAutoScrollRef: { current: false },
      } as any),
    );

    act(() => {
      result.current.resumeConversationStream(1001, list);
    });
    const firstOptions = mockCreateSSEConnection.mock.calls[0][0];

    act(() => {
      result.current.resumeConversationStream(1002, list);
    });
    const secondOptions = mockCreateSSEConnection.mock.calls[1][0];

    const staleChunk = {
      eventType: ConversationEventTypeEnum.MESSAGE,
      data: { text: 'stale' },
    };
    const currentChunk = {
      eventType: ConversationEventTypeEnum.MESSAGE,
      data: { text: 'current' },
    };
    act(() => {
      firstOptions.onMessage(staleChunk);
      secondOptions.onMessage(currentChunk);
    });

    expect(handleChangeMessageList).toHaveBeenCalledTimes(1);
    expect(handleChangeMessageList).toHaveBeenCalledWith(
      { conversationId: 1002 },
      currentChunk,
      expect.any(String),
    );
  });

  it('旧 sub 的迟到 close 不清除新连接所有权，也不触发旧会话收尾', () => {
    let list: MessageInfo[] = [];
    const setMessageList = vi.fn((updater) => {
      list = typeof updater === 'function' ? updater(list) : updater;
    });
    const resetResumeMessageState = vi.fn();
    const firstOnClose = vi.fn();
    const secondOnClose = vi.fn();
    mockCreateSSEConnection.mockImplementation(() => vi.fn());

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
      result.current.resumeConversationStream(1001, list, firstOnClose);
    });
    const firstOptions = mockCreateSSEConnection.mock.calls[0][0];
    act(() => {
      result.current.resumeConversationStream(1002, list, secondOnClose);
    });
    const secondOptions = mockCreateSSEConnection.mock.calls[1][0];

    act(() => {
      firstOptions.onClose();
      result.current.resumeConversationStream(1002, list, secondOnClose);
    });

    expect(firstOnClose).not.toHaveBeenCalled();
    expect(secondOnClose).not.toHaveBeenCalled();
    expect(mockCreateSSEConnection).toHaveBeenCalledTimes(2);
    expect(resetResumeMessageState).toHaveBeenCalledTimes(2);

    act(() => {
      secondOptions.onClose();
    });

    expect(secondOnClose).toHaveBeenCalledTimes(1);
    expect(resetResumeMessageState).toHaveBeenCalledTimes(3);
  });
});
