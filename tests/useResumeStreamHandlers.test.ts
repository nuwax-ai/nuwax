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
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  describe('恢复流滚动合帧', () => {
    beforeEach(() => {
      vi.useFakeTimers({
        toFake: [
          'setTimeout',
          'clearTimeout',
          'requestAnimationFrame',
          'cancelAnimationFrame',
        ],
      });
    });

    afterEach(() => {
      cleanup();
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    const createScrollFixture = () => {
      const element = document.createElement('div') as HTMLDivElement & {
        __isProgrammaticScroll?: boolean;
      };
      element.scrollTo = vi.fn();
      Object.defineProperty(element, 'scrollHeight', { value: 800 });
      const messageViewRef = { current: element };
      const allowAutoScrollRef = { current: true };
      const handleChangeMessageList = vi.fn();
      const onTerminalEvent = vi.fn();
      const hook = renderHook(() =>
        useResumeStreamHandlers({
          setMessageList: vi.fn(),
          handleChangeMessageList,
          messageViewRef,
          allowAutoScrollRef,
          onTerminalEvent,
        }),
      );
      act(() => hook.result.current.resumeConversationStream(1001, []));
      return {
        ...hook,
        element,
        messageViewRef,
        allowAutoScrollRef,
        handleChangeMessageList,
        onTerminalEvent,
        handlers: mockCreateSSEConnection.mock.calls[0][0],
      };
    };

    const chunk = {
      eventType: ConversationEventTypeEnum.MESSAGE,
      data: { text: 'chunk' },
    };

    it('同帧的全部事件立即按序送达，滚动只执行一次且可在下一帧继续', () => {
      const fixture = createScrollFixture();
      const requestFrame = vi.spyOn(globalThis, 'requestAnimationFrame');
      const events = Array.from({ length: 20 }, (_, index) => ({
        ...chunk,
        data: { text: String(index) },
      }));
      act(() => events.forEach((event) => fixture.handlers.onMessage(event)));

      expect(fixture.handleChangeMessageList).toHaveBeenCalledTimes(20);
      expect(
        fixture.handleChangeMessageList.mock.calls.map((call) => call[1]),
      ).toEqual(events);
      expect(requestFrame).toHaveBeenCalledTimes(1);
      expect(fixture.element.scrollTo).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);
      expect(fixture.element.scrollTo).toHaveBeenCalledWith({
        top: 800,
        behavior: 'instant',
      });
      expect(fixture.element.__isProgrammaticScroll).toBe(true);

      act(() => fixture.handlers.onMessage(chunk));
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(2);
      act(() => vi.advanceTimersByTime(100));
      expect(fixture.element.__isProgrammaticScroll).toBe(false);
    });

    it('帧执行前关闭自动滚动时不强制置底，恢复开关后仍能滚动', () => {
      const fixture = createScrollFixture();
      act(() => fixture.handlers.onMessage(chunk));
      fixture.allowAutoScrollRef.current = false;
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).not.toHaveBeenCalled();

      fixture.allowAutoScrollRef.current = true;
      act(() => fixture.handlers.onMessage(chunk));
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);
    });

    it('切会话取消旧帧，旧连接尾包也不会排入新会话的滚动', () => {
      const fixture = createScrollFixture();
      act(() => fixture.handlers.onMessage(chunk));
      act(() => fixture.result.current.resumeConversationStream(1002, []));
      const nextHandlers = mockCreateSSEConnection.mock.calls[1][0];
      act(() => fixture.handlers.onMessage(chunk));
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).not.toHaveBeenCalled();

      act(() => nextHandlers.onMessage(chunk));
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);
    });

    it.each(['abort', 'unmount'] as const)(
      '%s 清理待执行帧和程序滚动标记定时器',
      (action) => {
        const fixture = createScrollFixture();
        act(() => fixture.handlers.onMessage(chunk));
        act(() => vi.advanceTimersByTime(20));
        expect(fixture.element.__isProgrammaticScroll).toBe(true);
        act(() => fixture.handlers.onMessage(chunk));
        act(() => {
          if (action === 'abort') fixture.result.current.abortResumeStream();
          if (action === 'unmount') fixture.unmount();
        });
        expect(fixture.element.__isProgrammaticScroll).toBe(false);
        act(() => vi.advanceTimersByTime(200));
        expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
      },
    );

    it('FINAL_RESULT 后同步关闭仍执行最后一帧，关闭后的尾包不再排滚动', () => {
      const fixture = createScrollFixture();
      const finalResult = {
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        data: { success: true },
      };
      act(() => {
        fixture.handlers.onMessage(finalResult);
        fixture.handlers.onClose();
      });
      expect(fixture.onTerminalEvent).toHaveBeenCalledWith(1001, finalResult);
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);
      expect(fixture.element.__isProgrammaticScroll).toBe(true);

      act(() => fixture.handlers.onMessage(chunk));
      act(() => vi.advanceTimersByTime(100));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);
      expect(fixture.element.__isProgrammaticScroll).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('连续多帧滚动不延长已有的 100ms 程序滚动标记窗口', () => {
      const fixture = createScrollFixture();
      for (let index = 0; index < 5; index += 1) {
        act(() => fixture.handlers.onMessage(chunk));
        act(() => vi.advanceTimersByTime(20));
        expect(fixture.element.__isProgrammaticScroll).toBe(true);
      }
      act(() => fixture.handlers.onMessage(chunk));
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(6);
      expect(fixture.element.__isProgrammaticScroll).toBe(false);

      act(() => fixture.result.current.abortResumeStream());
      expect(vi.getTimerCount()).toBe(0);
    });

    it('终态立即处理；ERROR 取消旧帧且不重新排入，FINAL_RESULT 仍允许当前帧置底', () => {
      const fixture = createScrollFixture();
      const finalResult = {
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        data: { success: true },
      };
      act(() => fixture.handlers.onMessage(finalResult));
      expect(fixture.onTerminalEvent).toHaveBeenCalledWith(1001, finalResult);
      act(() => vi.advanceTimersByTime(20));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);

      act(() => fixture.handlers.onMessage(chunk));
      const error = { eventType: ConversationEventTypeEnum.ERROR };
      act(() => fixture.handlers.onMessage(error));
      expect(fixture.onTerminalEvent).toHaveBeenCalledWith(1001, error);
      expect(abortSse).toHaveBeenCalledTimes(1);
      expect(fixture.handleChangeMessageList).toHaveBeenCalledTimes(3);
      act(() => vi.advanceTimersByTime(200));
      expect(fixture.element.scrollTo).toHaveBeenCalledTimes(1);
    });
  });

  describe('新增干预回调（onTerminalEvent / onStreamClosed / onStreamError）', () => {
    it('sub onMessage 收到 FINAL_RESULT 时调用 onTerminalEvent', () => {
      const onTerminalEvent = vi.fn();
      const { result } = renderHook(() =>
        useResumeStreamHandlers({
          setMessageList: vi.fn(),
          handleChangeMessageList: vi.fn(),
          messageViewRef: { current: null },
          allowAutoScrollRef: { current: false },
          onTerminalEvent,
        }),
      );

      act(() => {
        result.current.resumeConversationStream(999, [
          { role: AssistantRoleEnum.USER, text: '问', id: 'u1' },
        ] as MessageInfo[]);
      });

      const handlers = mockCreateSSEConnection.mock.calls[0][0];
      act(() => {
        handlers.onMessage({
          eventType: ConversationEventTypeEnum.FINAL_RESULT,
          requestId: 'req-1',
          data: { success: true, outputText: '结果' },
          completed: true,
        });
      });

      expect(onTerminalEvent).toHaveBeenCalledWith(999, {
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        requestId: 'req-1',
        data: { success: true, outputText: '结果' },
        completed: true,
      });
    });

    it('sub onMessage 收到 ERROR 时调用 onTerminalEvent', () => {
      const onTerminalEvent = vi.fn();
      const { result } = renderHook(() =>
        useResumeStreamHandlers({
          setMessageList: vi.fn(),
          handleChangeMessageList: vi.fn(),
          messageViewRef: { current: null },
          allowAutoScrollRef: { current: false },
          onTerminalEvent,
        }),
      );

      act(() => {
        result.current.resumeConversationStream(888, [
          { role: AssistantRoleEnum.USER, text: '问', id: 'u2' },
        ] as MessageInfo[]);
      });

      const handlers = mockCreateSSEConnection.mock.calls[0][0];
      act(() => {
        handlers.onMessage({
          eventType: ConversationEventTypeEnum.ERROR,
          requestId: 'req-err',
          error: 'Internal error',
        });
      });

      expect(onTerminalEvent).toHaveBeenCalledWith(888, {
        eventType: ConversationEventTypeEnum.ERROR,
        requestId: 'req-err',
        error: 'Internal error',
      });
    });

    it('sub onMessage 收到 MESSAGE 时不调用 onTerminalEvent', () => {
      const onTerminalEvent = vi.fn();
      const { result } = renderHook(() =>
        useResumeStreamHandlers({
          setMessageList: vi.fn(),
          handleChangeMessageList: vi.fn(),
          messageViewRef: { current: null },
          allowAutoScrollRef: { current: false },
          onTerminalEvent,
        }),
      );

      act(() => {
        result.current.resumeConversationStream(777, [
          { role: AssistantRoleEnum.USER, text: '问', id: 'u3' },
        ] as MessageInfo[]);
      });

      const handlers = mockCreateSSEConnection.mock.calls[0][0];
      act(() => {
        handlers.onMessage({
          eventType: ConversationEventTypeEnum.MESSAGE,
          requestId: 'req-msg',
          data: { type: 'THINK', text: '思考中', finished: false },
        });
      });

      expect(onTerminalEvent).not.toHaveBeenCalled();
    });

    it('sub onClose 时调用 onStreamClosed 并传入占位 id', () => {
      const onStreamClosed = vi.fn();
      const { result } = renderHook(() =>
        useResumeStreamHandlers({
          setMessageList: vi.fn(),
          handleChangeMessageList: vi.fn(),
          messageViewRef: { current: null },
          allowAutoScrollRef: { current: false },
          onStreamClosed,
        }),
      );

      act(() => {
        result.current.resumeConversationStream(666, [
          { role: AssistantRoleEnum.USER, text: '问', id: 'u4' },
        ] as MessageInfo[]);
      });

      const handlers = mockCreateSSEConnection.mock.calls[0][0];
      act(() => {
        handlers.onClose();
      });

      expect(onStreamClosed).toHaveBeenCalledWith(expect.any(String));
    });

    it('sub onerror 时调用 onStreamError 并传入占位 id', () => {
      const onStreamError = vi.fn();
      const { result } = renderHook(() =>
        useResumeStreamHandlers({
          setMessageList: vi.fn(),
          handleChangeMessageList: vi.fn(),
          messageViewRef: { current: null },
          allowAutoScrollRef: { current: false },
          onStreamError,
        }),
      );

      act(() => {
        result.current.resumeConversationStream(555, [
          { role: AssistantRoleEnum.USER, text: '问', id: 'u5' },
        ] as MessageInfo[]);
      });

      const handlers = mockCreateSSEConnection.mock.calls[0][0];
      act(() => {
        handlers.onError(new TypeError('network error'));
      });

      expect(onStreamError).toHaveBeenCalledWith(expect.any(String));
    });
  });
});
