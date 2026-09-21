import {
  useConversationStreamResume,
  type UseConversationStreamResumeOptions,
} from '@/features/conversation/react/useConversationStreamResume';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  fetchConversationSnapshot,
  fetchConversationTaskStatus,
} from '@/utils/conversationTaskStatusSync';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 使用真实 ahooks，覆盖 useRequest 的首次自动请求及 ready 切换。
vi.mock('@/constants/home.constants', () => ({
  GLOBAL_POLLING_INTERVAL: 1000,
}));
vi.mock('@/utils/conversationTaskStatusSync', () => ({
  fetchConversationSnapshot: vi.fn(),
  fetchConversationTaskStatus: vi.fn(),
  emitConversationListTaskStatus: vi.fn(),
}));
vi.mock('@/utils/eventBus', () => ({ default: { emit: vi.fn() } }));
vi.mock('@/utils/logger', () => {
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { conversationPollLogger: logger, conversationResumeLogger: logger };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const user = (id = 'user-1'): MessageInfo =>
  ({
    id,
    role: AssistantRoleEnum.USER,
    text: '运行工具',
    status: MessageStatusEnum.Complete,
  } as MessageInfo);

const snapshot = (id: number, taskStatus = TaskStatus.COMPLETE) =>
  ({
    id,
    taskStatus,
    messageList: [user()],
  } as ConversationInfo);

function options(overrides: Partial<UseConversationStreamResumeOptions> = {}) {
  return {
    conversationId: 101,
    taskStatus: TaskStatus.EXECUTING,
    messageList: [user()],
    reloadHistoryAsync: vi.fn().mockResolvedValue([user()]),
    resumeStream: vi.fn(),
    abortSub: vi.fn(),
    ...overrides,
  } satisfies UseConversationStreamResumeOptions;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('实际恢复 hook 的首次进入', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.mocked(fetchConversationSnapshot).mockImplementation(async (id) =>
      snapshot(Number(id)),
    );
    vi.mocked(fetchConversationTaskStatus).mockResolvedValue(
      TaskStatus.COMPLETE,
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('进入执行中会话只加载一次新历史，恢复期间不并发请求轮询快照', async () => {
    const history = deferred<MessageInfo[]>();
    const deps = options({ reloadHistoryAsync: vi.fn(() => history.promise) });
    renderHook(() => useConversationStreamResume(deps));

    expect(deps.reloadHistoryAsync).toHaveBeenCalledTimes(1);
    expect(fetchConversationSnapshot).not.toHaveBeenCalled();
    expect(deps.resumeStream).not.toHaveBeenCalled();

    await act(async () => {
      history.resolve([user('latest-user')]);
    });
    expect(deps.resumeStream).toHaveBeenCalledWith(
      101,
      [user('latest-user')],
      expect.any(Function),
      'unified-chat-session',
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchConversationSnapshot).not.toHaveBeenCalled();
  });

  it('非执行会话正常发起首次轮询，终态按退避间隔继续（bug 2477 收敛）', async () => {
    const deps = options({ taskStatus: TaskStatus.COMPLETE });
    renderHook(() => useConversationStreamResume(deps));
    await flush();

    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
    expect(deps.reloadHistoryAsync).not.toHaveBeenCalled();
    expect(deps.resumeStream).not.toHaveBeenCalled();
    // 终态退避：常规轮询间隔（此处 mock 为 1s）内不再重复拉取
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
    // 退避间隔（30s）到达后才发出第二次
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(2);
  });

  it('非终态会话维持常规轮询间隔（终态退避不影响执行检测灵敏度）', async () => {
    // taskStatus 未知（非终态）：轮询维持常规间隔；不触发 sub 订阅
    const deps = options({
      taskStatus: undefined,
      resumeStream: vi.fn(),
    });
    renderHook(() => useConversationStreamResume(deps));
    await flush();
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(2);
  });

  it('历史尚未出现本轮 user 时保留重试等待，期间不启动轮询', async () => {
    const previous = [
      user(),
      {
        id: 'assistant-old',
        role: AssistantRoleEnum.ASSISTANT,
        text: '已完成',
        status: MessageStatusEnum.Complete,
      } as MessageInfo,
    ];
    const latest = [...previous, user('user-new')];
    const deps = options({
      messageList: previous,
      reloadHistoryAsync: vi
        .fn()
        .mockResolvedValueOnce(previous)
        .mockResolvedValue(latest),
    });
    renderHook(() => useConversationStreamResume(deps));
    await flush();
    expect(deps.resumeStream).not.toHaveBeenCalled();
    expect(fetchConversationSnapshot).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(deps.reloadHistoryAsync).toHaveBeenCalledTimes(2);
    expect(deps.resumeStream).toHaveBeenCalledWith(
      101,
      latest,
      expect.any(Function),
      expect.any(String),
    );
  });

  it('sub 秒关后恢复轮询，退避结束后仍可重新订阅', async () => {
    vi.mocked(fetchConversationSnapshot).mockResolvedValue(
      snapshot(101, TaskStatus.EXECUTING),
    );
    vi.mocked(fetchConversationTaskStatus).mockResolvedValue(
      TaskStatus.EXECUTING,
    );
    const resumeStream = vi.fn();
    renderHook(() => useConversationStreamResume(options({ resumeStream })));
    await flush();
    expect(resumeStream).toHaveBeenCalledTimes(1);

    await act(async () => {
      await resumeStream.mock.calls[0][2]();
    });
    expect(fetchConversationSnapshot).toHaveBeenCalled();
    expect(resumeStream).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(resumeStream).toHaveBeenCalledTimes(2);
  });

  it('本地流结束后轮询恢复，仍遵守本地发送冷却时间', async () => {
    const deps = options();
    vi.mocked(fetchConversationSnapshot).mockResolvedValue(
      snapshot(101, TaskStatus.EXECUTING),
    );
    const { rerender } = renderHook(
      ({ streaming }) =>
        useConversationStreamResume({ ...deps, isLocallyStreaming: streaming }),
      { initialProps: { streaming: true } },
    );
    expect(fetchConversationSnapshot).not.toHaveBeenCalled();
    expect(deps.resumeStream).not.toHaveBeenCalled();
    rerender({ streaming: false });
    await flush();
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
    expect(deps.resumeStream).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(deps.resumeStream).toHaveBeenCalledTimes(1);
    expect(deps.reloadHistoryAsync).not.toHaveBeenCalled();
  });

  it('切换到执行中会话时不启动重复快照，旧轮询回包不覆盖新会话', async () => {
    const oldSnapshot = deferred<ConversationInfo>();
    vi.mocked(fetchConversationSnapshot).mockReturnValue(oldSnapshot.promise);
    const deps = options({ onConversationSnapshot: vi.fn() });
    const { rerender } = renderHook(
      ({ id, status }) =>
        useConversationStreamResume({
          ...deps,
          conversationId: id,
          taskStatus: status,
        }),
      { initialProps: { id: 100, status: TaskStatus.COMPLETE } },
    );
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
    rerender({ id: 101, status: TaskStatus.EXECUTING });
    await flush();
    expect(deps.reloadHistoryAsync).toHaveBeenCalledTimes(1);
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
    expect(deps.resumeStream).toHaveBeenCalledTimes(1);

    await act(async () => {
      oldSnapshot.resolve(snapshot(100));
    });
    expect(deps.onConversationSnapshot).not.toHaveBeenCalled();
    expect(deps.resumeStream).toHaveBeenCalledTimes(1);
  });

  it('会话 ID 清空再进入同一执行中会话也必须等待 entry 决策', async () => {
    const deps = options();
    const { rerender } = renderHook(
      ({ id }: { id: number | undefined }) =>
        useConversationStreamResume({ ...deps, conversationId: id }),
      { initialProps: { id: 101 as number | undefined } },
    );
    await flush();
    rerender({ id: undefined });
    rerender({ id: 101 });
    await flush();
    expect(deps.reloadHistoryAsync).toHaveBeenCalledTimes(2);
    expect(deps.resumeStream).toHaveBeenCalledTimes(2);
    expect(fetchConversationSnapshot).not.toHaveBeenCalled();
  });

  it('等待本地聊天终态时不轮询，终态收敛后继续查询', async () => {
    const deps = options({ taskStatus: TaskStatus.COMPLETE });
    const { rerender } = renderHook(
      ({ awaiting }) =>
        useConversationStreamResume({
          ...deps,
          isAwaitingChatTerminal: awaiting,
        }),
      { initialProps: { awaiting: true } },
    );
    await flush();
    expect(fetchConversationSnapshot).not.toHaveBeenCalled();
    rerender({ awaiting: false });
    await flush();
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
  });

  it('历史等待耗尽后退出恢复并回到轮询，不永久暂停', async () => {
    const previous = [
      {
        id: 'assistant-old',
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Complete,
      } as MessageInfo,
    ];
    const deps = options({
      messageList: previous,
      reloadHistoryAsync: vi.fn().mockResolvedValue(previous),
    });
    renderHook(() => useConversationStreamResume(deps));
    await flush();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4950);
    });
    expect(deps.reloadHistoryAsync).toHaveBeenCalledTimes(7);
    expect(deps.resumeStream).not.toHaveBeenCalled();
    expect(fetchConversationSnapshot).toHaveBeenCalledTimes(1);
  });
});
