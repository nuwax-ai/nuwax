/**
 * useConversationStreamResume 轮询终态写回测试
 */
import { useConversationStreamResume } from '@/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseRequest, mockEventBusEmit, mockPollLoggerInfo } = vi.hoisted(
  () => ({
    mockUseRequest: vi.fn(),
    mockEventBusEmit: vi.fn(),
    mockPollLoggerInfo: vi.fn(),
  }),
);

vi.mock('@/utils/logger', () => {
  const noopLogger = {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    createLogger: () => noopLogger,
    createAlwaysLogger: () => noopLogger,
    logger: noopLogger,
    conversationResumeLogger: noopLogger,
    conversationPollLogger: { ...noopLogger, info: mockPollLoggerInfo },
    conversationErrorTerminalLogger: noopLogger,
  };
});

vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

vi.mock('@/utils/eventBus', () => ({
  default: {
    emit: mockEventBusEmit,
  },
}));

vi.mock('@/constants/event.constants', () => ({
  EVENT_TYPE: {
    UpdateConversationListTaskStatus: 'update_conversation_list_task_status',
    RefreshConversationList: 'refresh_conversation_list',
  },
}));

vi.mock('@/constants/home.constants', () => ({
  GLOBAL_POLLING_INTERVAL: 1000,
}));

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  emitConversationListTaskStatus: vi.fn(),
  fetchConversationSnapshot: vi.fn(),
  fetchConversationTaskStatus: vi.fn(),
  resolveTaskStatusFromMessageLists: vi.fn(),
}));

import {
  fetchConversationSnapshot,
  fetchConversationTaskStatus,
  resolveTaskStatusFromMessageLists,
} from '@/utils/conversationTaskStatusSync';

describe('useConversationStreamResume', () => {
  let onSuccess:
    | ((snapshot: { id: number; taskStatus: TaskStatus } | undefined) => void)
    | undefined;
  let runPolling: ReturnType<typeof vi.fn>;
  let cancelPolling: ReturnType<typeof vi.fn>;
  let useRequestOptions: any;

  beforeEach(() => {
    vi.clearAllMocks();
    onSuccess = undefined;
    useRequestOptions = undefined;
    runPolling = vi.fn();
    cancelPolling = vi.fn();
    mockUseRequest.mockImplementation((_service, options) => {
      useRequestOptions = options;
      onSuccess = options?.onSuccess;
      return { run: runPolling, cancel: cancelPolling };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const emitPollingStatus = (status: TaskStatus, messageList?: any[]) => {
    onSuccess?.({ id: 1555404, taskStatus: status, messageList } as any);
  };

  it('轮询 onSuccess 收到 COMPLETE 时调用 onTerminalTaskStatus', () => {
    const onTerminalTaskStatus = vi.fn();
    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.EXECUTING,
        isLocallyStreaming: false,
        resumeStream: vi.fn(),
        onTerminalTaskStatus,
      }),
    );

    emitPollingStatus(TaskStatus.COMPLETE);
    expect(onTerminalTaskStatus).toHaveBeenCalledWith(TaskStatus.COMPLETE);
  });

  it('每次轮询都同步当前会话的完整快照', () => {
    const onConversationSnapshot = vi.fn();
    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        resumeStream: vi.fn(),
        onConversationSnapshot,
      }),
    );
    const snapshot = {
      id: 1555404,
      taskStatus: TaskStatus.COMPLETE,
      messageList: [{ id: 2, text: 'new message' }],
    } as any;

    onSuccess?.(snapshot);

    expect(onConversationSnapshot).toHaveBeenCalledWith(snapshot);
  });

  it('本地流已结束但聊天终态未到时仍禁止轮询', () => {
    const { rerender } = renderHook(
      ({ awaitingTerminal }) =>
        useConversationStreamResume({
          conversationId: 1555404,
          taskStatus: TaskStatus.COMPLETE,
          isLocallyStreaming: false,
          isAwaitingChatTerminal: awaitingTerminal,
          resumeStream: vi.fn(),
        }),
      { initialProps: { awaitingTerminal: true } },
    );

    expect(useRequestOptions.ready).toBe(false);

    rerender({ awaitingTerminal: false });

    expect(useRequestOptions.ready).toBe(true);
  });

  it('历史快照最后一条为 USER 时不覆盖当前消息列表', () => {
    const onConversationSnapshot = vi.fn();
    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        isAwaitingChatTerminal: false,
        resumeStream: vi.fn(),
        onConversationSnapshot,
      }),
    );

    emitPollingStatus(TaskStatus.COMPLETE, [
      {
        id: 'persisted-user',
        role: AssistantRoleEnum.USER,
        text: '尚未落库 assistant 的用户消息',
      },
    ]);

    expect(onConversationSnapshot).not.toHaveBeenCalled();
  });

  it('轮询在途时开始发送会取消轮询并丢弃旧回包', () => {
    const onConversationSnapshot = vi.fn();
    const onTerminalTaskStatus = vi.fn();
    const { rerender } = renderHook(
      ({ streaming }) =>
        useConversationStreamResume({
          conversationId: 1555404,
          taskStatus: TaskStatus.COMPLETE,
          isLocallyStreaming: streaming,
          resumeStream: vi.fn(),
          onConversationSnapshot,
          onTerminalTaskStatus,
        }),
      { initialProps: { streaming: false } },
    );

    rerender({ streaming: true });
    emitPollingStatus(TaskStatus.COMPLETE, [{ id: 2, text: 'stale message' }]);

    expect(cancelPolling).toHaveBeenCalled();
    expect(onConversationSnapshot).not.toHaveBeenCalled();
    expect(onTerminalTaskStatus).not.toHaveBeenCalled();

    // 两条关键日志用于线上/开发环境自证：取消轮询 + 丢弃旧回包
    const loggedMessages = mockPollLoggerInfo.mock.calls.map(([msg]) => msg);
    expect(loggedMessages).toContain('cancel polling: local send started');
    expect(loggedMessages).toContain('discard stale snapshot');
  });

  it('可见性恢复请求在途时开始发送会丢弃旧回包', async () => {
    let resolveSnapshot!: (snapshot: any) => void;
    const snapshotPromise = new Promise<any>((resolve) => {
      resolveSnapshot = resolve;
    });
    (fetchConversationSnapshot as any).mockReturnValueOnce(snapshotPromise);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

    const onConversationSnapshot = vi.fn();
    const onTerminalTaskStatus = vi.fn();
    const resumeStream = vi.fn();
    const { rerender } = renderHook(
      ({ streaming }) =>
        useConversationStreamResume({
          conversationId: 1555404,
          taskStatus: TaskStatus.COMPLETE,
          isLocallyStreaming: streaming,
          resumeStream,
          onConversationSnapshot,
          onTerminalTaskStatus,
        }),
      { initialProps: { streaming: false } },
    );

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(fetchConversationSnapshot).toHaveBeenCalledWith(1555404);

    rerender({ streaming: true });
    await act(async () => {
      resolveSnapshot({
        id: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        messageList: [{ id: 2, text: 'stale message' }],
      });
      await snapshotPromise;
    });

    expect(onConversationSnapshot).not.toHaveBeenCalled();
    expect(onTerminalTaskStatus).not.toHaveBeenCalled();
    expect(resumeStream).not.toHaveBeenCalled();
  });

  it('可见性恢复请求在途时忽略重复 visibilitychange', async () => {
    let resolveSnapshot!: (snapshot: any) => void;
    const snapshotPromise = new Promise<any>((resolve) => {
      resolveSnapshot = resolve;
    });
    (fetchConversationSnapshot as any).mockReturnValue(snapshotPromise);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        isAwaitingChatTerminal: false,
        resumeStream: vi.fn(),
      }),
    );

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSnapshot({
        id: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        messageList: [],
      });
      await snapshotPromise;
    });
  });

  it('轮询 onSuccess 收到 EXECUTING 时不写回', () => {
    const onTerminalTaskStatus = vi.fn();
    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        resumeStream: vi.fn(),
        onTerminalTaskStatus,
      }),
    );

    act(() => {
      emitPollingStatus(TaskStatus.EXECUTING);
    });
    expect(onTerminalTaskStatus).not.toHaveBeenCalled();
  });

  it('轮询发现 EXECUTING 时复用快照订阅 sub，不重复 reload 历史', async () => {
    const polledList = [
      { id: 'user-1', role: AssistantRoleEnum.USER, text: 'from other tab' },
    ] as any[];
    const reloadHistoryAsync = vi.fn();
    let subOnClose: (() => void | Promise<void>) | undefined;
    const resumeStream = vi.fn((_id, _list, onClose) => {
      subOnClose = onClose;
    });

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        messageList: [],
        reloadHistoryAsync,
        resumeStream,
      }),
    );

    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING, polledList);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(cancelPolling).toHaveBeenCalled();
    expect(mockEventBusEmit).toHaveBeenCalledWith(
      'update_conversation_list_task_status',
      {
        conversationId: 1555404,
        taskStatus: TaskStatus.EXECUTING,
      },
    );
    expect(reloadHistoryAsync).not.toHaveBeenCalled();
    expect(resumeStream).toHaveBeenCalledWith(
      1555404,
      polledList,
      expect.any(Function),
      'unified-chat-session',
    );

    await act(async () => {
      await subOnClose?.();
    });

    expect(runPolling).toHaveBeenCalled();
    expect(reloadHistoryAsync).not.toHaveBeenCalled();
    expect(mockEventBusEmit).toHaveBeenCalledWith('refresh_conversation_list', {
      conversationId: 1555404,
      reason: 'stream-closed',
    });
  });

  it('轮询快照尚未包含本轮消息时保持轮询，不触发 reload 或 sub', async () => {
    const currentList = [
      { id: 'old-user', role: AssistantRoleEnum.USER, text: 'old' },
      {
        id: 'old-assistant',
        role: AssistantRoleEnum.ASSISTANT,
        text: 'old answer',
        status: MessageStatusEnum.Complete,
      },
    ] as any[];
    const reloadHistoryAsync = vi.fn();
    const resumeStream = vi.fn();

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        messageList: currentList,
        reloadHistoryAsync,
        resumeStream,
      }),
    );

    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING, [...currentList]);
      await Promise.resolve();
    });

    expect(cancelPolling).not.toHaveBeenCalled();
    expect(reloadHistoryAsync).not.toHaveBeenCalled();
    expect(resumeStream).not.toHaveBeenCalled();
  });

  it('开启等待新 user 时，reload 快照未包含新 user 会短暂重试后再订阅 sub', async () => {
    vi.useFakeTimers();
    const currentList = [
      { id: 'old-user', role: 'USER', text: 'old' },
      { id: 'old-assistant', role: 'ASSISTANT', text: 'old answer' },
    ] as any[];
    const staleList = [...currentList];
    const reloadedList = [
      ...currentList,
      { id: 'new-user', role: 'USER', text: 'external prompt' },
    ] as any[];
    const reloadHistoryAsync = vi
      .fn()
      .mockResolvedValueOnce(staleList)
      .mockResolvedValueOnce(reloadedList);
    const resumeStream = vi.fn();

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        messageList: currentList,
        reloadHistoryAsync,
        waitForHistoryUserBeforeResume: true,
        resumeStream,
      }),
    );

    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
    });

    expect(resumeStream).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
      await Promise.resolve();
    });

    expect(reloadHistoryAsync).toHaveBeenCalledTimes(2);
    expect(resumeStream).toHaveBeenCalledWith(
      1555404,
      reloadedList,
      expect.any(Function),
      'unified-chat-session',
    );
  });

  it('默认等待历史 user；重试后仍没有 user 时不订阅 sub，恢复轮询等待下一次 reload', async () => {
    vi.useFakeTimers();
    const currentList = [
      { id: 'old-user', role: AssistantRoleEnum.USER, text: 'old' },
      {
        id: 'old-assistant',
        role: AssistantRoleEnum.ASSISTANT,
        text: 'old answer',
        status: MessageStatusEnum.Complete,
      },
    ] as any[];
    const reloadHistoryAsync = vi.fn().mockResolvedValue([...currentList]);
    const resumeStream = vi.fn();

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: false,
        messageList: currentList,
        reloadHistoryAsync,
        resumeStream,
      }),
    );

    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
    });

    expect(resumeStream).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4950);
      await Promise.resolve();
    });

    expect(reloadHistoryAsync).toHaveBeenCalledTimes(7);
    expect(resumeStream).not.toHaveBeenCalled();
    expect(runPolling).toHaveBeenCalled();
  });

  it('sub 关闭后从消息 finalResult 解析终态并写回', async () => {
    const localMessageList = [
      {
        id: 'assistant-1',
        finalResult: { success: true, outputText: 'done' },
      },
    ] as any[];
    const reloadHistoryAsync = vi.fn().mockResolvedValue([]);
    const onTerminalTaskStatus = vi.fn();
    let subOnClose: (() => void | Promise<void>) | undefined;
    const resumeStream = vi.fn((_id, _list, onClose) => {
      subOnClose = onClose;
    });

    // 让 mock 反映真实解析契约：列表含 finalResult.success 的 assistant → COMPLETE，
    // 否则返回 undefined（交由 fetchConversationTaskStatus 兜底）。这样 finalResult 内容真正驱动结果。
    (resolveTaskStatusFromMessageLists as any).mockImplementation(
      (...lists: any[]) => {
        for (const list of lists) {
          if (list?.some((m: any) => m?.finalResult?.success)) {
            return TaskStatus.COMPLETE;
          }
        }
        return undefined;
      },
    );

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.EXECUTING,
        isLocallyStreaming: false,
        messageList: localMessageList,
        reloadHistoryAsync,
        waitForHistoryUserBeforeResume: false,
        resumeStream,
        onTerminalTaskStatus,
      }),
    );

    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await subOnClose?.();
    });

    expect(resolveTaskStatusFromMessageLists).toHaveBeenCalledWith(
      localMessageList,
    );
    expect(onTerminalTaskStatus).toHaveBeenCalledWith(TaskStatus.COMPLETE);
    expect(fetchConversationTaskStatus).not.toHaveBeenCalled();
    expect(runPolling).toHaveBeenCalled();
  });

  it('sub 关闭后消息解析失败时兜底 fetchConversationTaskStatus', async () => {
    const reloadHistoryAsync = vi.fn().mockResolvedValue([]);
    const onTerminalTaskStatus = vi.fn();
    let subOnClose: (() => void | Promise<void>) | undefined;
    const resumeStream = vi.fn((_id, _list, onClose) => {
      subOnClose = onClose;
    });

    (resolveTaskStatusFromMessageLists as any).mockReturnValue(undefined);
    (fetchConversationTaskStatus as any).mockResolvedValue(TaskStatus.COMPLETE);

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.EXECUTING,
        isLocallyStreaming: false,
        messageList: [],
        reloadHistoryAsync,
        waitForHistoryUserBeforeResume: false,
        resumeStream,
        onTerminalTaskStatus,
      }),
    );

    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await subOnClose?.();
    });

    expect(fetchConversationTaskStatus).toHaveBeenCalledWith(1555404);
    expect(onTerminalTaskStatus).toHaveBeenCalledWith(TaskStatus.COMPLETE);
    expect(runPolling).toHaveBeenCalled();
  });

  it('本地 live 流式活跃时，即使轮询返回 EXECUTING 也不重复订阅 sub', () => {
    const resumeStream = vi.fn();

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.COMPLETE,
        isLocallyStreaming: true,
        resumeStream,
      }),
    );

    act(() => {
      emitPollingStatus(TaskStatus.EXECUTING);
    });

    expect(resumeStream).not.toHaveBeenCalled();
  });

  it('sub 秒关后进入失败退避：窗口内跳过重订阅，窗口过后允许，且连续失败指数退避', async () => {
    vi.useFakeTimers();
    const reloadHistoryAsync = vi.fn().mockResolvedValue([]);
    let subOnClose: (() => void | Promise<void>) | undefined;
    const resumeStream = vi.fn((_id, _list, onClose) => {
      subOnClose = onClose;
    });
    (resolveTaskStatusFromMessageLists as any).mockReturnValue(undefined);
    (fetchConversationTaskStatus as any).mockResolvedValue(
      TaskStatus.EXECUTING,
    );

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.EXECUTING,
        isLocallyStreaming: false,
        messageList: [],
        reloadHistoryAsync,
        waitForHistoryUserBeforeResume: false,
        resumeStream,
      }),
    );

    // 第一次订阅建立（t=0）
    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resumeStream).toHaveBeenCalledTimes(1);

    // 秒关（存活 < 3s）→ 计入失败，基础退避 2s
    await act(async () => {
      await subOnClose?.();
    });

    // 退避窗口内（t≈0 < 2s）轮询再报 EXECUTING → 拦截，不再订阅
    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resumeStream).toHaveBeenCalledTimes(1);

    // 退避窗口过后（t=2.1s）→ 允许第二次订阅
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resumeStream).toHaveBeenCalledTimes(2);

    // 第二次仍秒关 → 连续失败 count=2，退避指数增长至 4s
    await act(async () => {
      await subOnClose?.();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3900);
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resumeStream).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resumeStream).toHaveBeenCalledTimes(3);
  });

  it('sub 长连接存活后正常关闭不计入失败，可立即重订阅', async () => {
    vi.useFakeTimers();
    const reloadHistoryAsync = vi.fn().mockResolvedValue([]);
    let subOnClose: (() => void | Promise<void>) | undefined;
    const resumeStream = vi.fn((_id, _list, onClose) => {
      subOnClose = onClose;
    });
    (resolveTaskStatusFromMessageLists as any).mockReturnValue(undefined);
    (fetchConversationTaskStatus as any).mockResolvedValue(
      TaskStatus.EXECUTING,
    );

    renderHook(() =>
      useConversationStreamResume({
        conversationId: 1555404,
        taskStatus: TaskStatus.EXECUTING,
        isLocallyStreaming: false,
        messageList: [],
        reloadHistoryAsync,
        waitForHistoryUserBeforeResume: false,
        resumeStream,
      }),
    );

    // 第一次订阅建立（t=0）
    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resumeStream).toHaveBeenCalledTimes(1);

    // 存活 10s 后正常关闭 → 不计失败、无退避
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
      await subOnClose?.();
    });

    // 立即再报 EXECUTING → 允许重订阅
    await act(async () => {
      emitPollingStatus(TaskStatus.EXECUTING);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resumeStream).toHaveBeenCalledTimes(2);
  });
});
