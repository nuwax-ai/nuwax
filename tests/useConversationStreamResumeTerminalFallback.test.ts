/**
 * useConversationStreamResume（features/conversation 生产路径）sub 关闭终态确认测试。
 *
 * 覆盖禅道 bug2520 修复：sub 恢复秒关、本地消息无法自证终态
 * （terminal.confirmed source=snapshot-fallback）时，终态写回前必须先拉
 * 全量快照静默归并（onConversationSnapshot），否则重进会话后末轮
 * assistant 输出断档，只能等 30s 终态轮询退避或切页可见性才补齐。
 */
import { useConversationStreamResume } from '@/features/conversation/react/useConversationStreamResume';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUseRequest,
  mockEventBusEmit,
  mockFetchConversationSnapshot,
  mockFetchConversationTaskStatus,
  mockEmitConversationListTaskStatus,
  mockGetHostVisibility,
  mockSubscribeHostVisibility,
} = vi.hoisted(() => ({
  mockUseRequest: vi.fn(),
  mockEventBusEmit: vi.fn(),
  mockFetchConversationSnapshot: vi.fn(),
  mockFetchConversationTaskStatus: vi.fn(),
  mockEmitConversationListTaskStatus: vi.fn(),
  mockGetHostVisibility: vi.fn(() => true),
  mockSubscribeHostVisibility: vi.fn(() => () => {}),
}));

vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

vi.mock('@/utils/eventBus', () => ({
  default: { emit: mockEventBusEmit, on: vi.fn(), off: vi.fn() },
}));

// 全量 stub：真实模块经 services 引入 umi 传递依赖，会破坏非 umi 测试环境
// （与 conversationRuntimeSession.test.ts 同法 mock）
vi.mock('@/utils/conversationTaskStatusSync', () => ({
  fetchConversationSnapshot: (...args: unknown[]) =>
    mockFetchConversationSnapshot(...args),
  fetchConversationTaskStatus: (...args: unknown[]) =>
    mockFetchConversationTaskStatus(...args),
  emitConversationListTaskStatus: (...args: unknown[]) =>
    mockEmitConversationListTaskStatus(...args),
}));

vi.mock('@/services/hostVisibility', () => ({
  getHostVisibility: () => mockGetHostVisibility(),
  subscribeHostVisibility: (
    ...args: Parameters<typeof mockSubscribeHostVisibility>
  ) => mockSubscribeHostVisibility(...args),
}));

vi.mock('@/utils/logger', () => {
  const noop = { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return {
    createLogger: () => noop,
    conversationResumeLogger: noop,
    conversationPollLogger: noop,
    conversationErrorTerminalLogger: noop,
  };
});

// 基线版 home.constants 经 i18nRuntime→umi 传递依赖破坏非 umi 测试环境
//（与 conversationRuntimeSession.test.ts 同法 mock）
vi.mock('@/constants/home.constants', () => ({
  GLOBAL_POLLING_INTERVAL: 5000,
}));

describe('useConversationStreamResume sub 关闭终态确认(bug2520)', () => {
  let subOnClose: (() => Promise<void>) | undefined;
  const runPolling = vi.fn();
  const cancelPolling = vi.fn();

  /** 重进 EXECUTING 会话的典型列表：末轮 user 已落库、assistant 输出未回放 */
  const messageList: MessageInfo[] = [
    {
      id: 1,
      role: AssistantRoleEnum.ASSISTANT,
      status: 'Complete',
      text: '上一轮回答',
    } as never,
    {
      id: 2,
      role: AssistantRoleEnum.USER,
      status: 'Complete',
      text: '最新问题',
    } as never,
  ];

  const renderResumeHook = (overrides: Record<string, unknown> = {}) =>
    renderHook(() => {
      // 注意:不在 render 回调里重置 subOnClose——React 18 并发模式下 render
      // 函数可能双调用,重置会把首次 render 捕获的 onClose 吞掉
      return useConversationStreamResume({
        conversationId: 1001,
        taskStatus: TaskStatus.EXECUTING,
        isLocallyStreaming: false,
        isAwaitingChatTerminal: false,
        messageList,
        resumeStream: vi.fn((_id, _list, onClose) => {
          subOnClose = onClose;
        }),
        abortSub: vi.fn(),
        onConversationSnapshot: overrides.onConversationSnapshot as never,
        onTerminalTaskStatus: overrides.onTerminalTaskStatus as never,
        resumeDebugSource: 'test',
        ...overrides,
      } as never);
    });

  beforeEach(() => {
    subOnClose = undefined;
    vi.clearAllMocks();
    mockGetHostVisibility.mockReturnValue(true);
    mockUseRequest.mockImplementation((_service: unknown, options: any) => {
      options?.onSuccess?.(undefined);
      return { run: runPolling, cancel: cancelPolling };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('秒关 fallback 终态：先补拉快照归并，再写终态（bug2520）', async () => {
    const snapshotCalls: unknown[] = [];
    const terminalCalls: (string | undefined)[] = [];
    mockFetchConversationTaskStatus.mockResolvedValue(TaskStatus.COMPLETE);
    mockFetchConversationSnapshot.mockImplementation(async () => {
      // 快照返回服务端已落库的完整末轮消息
      return {
        id: 1001,
        taskStatus: TaskStatus.COMPLETE,
        messageList: [
          ...messageList,
          {
            id: 3,
            role: AssistantRoleEnum.ASSISTANT,
            status: 'Complete',
            text: '服务端完整回答',
            finalResult: { success: true },
          },
        ],
      } as never;
    });

    const { result } = renderResumeHook({
      onConversationSnapshot: (snapshot: unknown) =>
        snapshotCalls.push(snapshot),
      onTerminalTaskStatus: (status: string | undefined) =>
        terminalCalls.push(status),
    });
    expect(result.current).toBeUndefined();
    // entry effect：EXECUTING 会话应已订阅 sub 并捕获 onClose
    expect(subOnClose).toBeTypeOf('function');

    await act(async () => {
      await subOnClose?.();
    });

    // 本地无 finalResult → 走 snapshot-fallback：必须先拉快照归并再写终态
    expect(mockFetchConversationTaskStatus).toHaveBeenCalledWith(1001);
    expect(mockFetchConversationSnapshot).toHaveBeenCalledWith(1001);
    expect(snapshotCalls).toHaveLength(1);
    expect(terminalCalls).toEqual([TaskStatus.COMPLETE]);
    expect(mockEmitConversationListTaskStatus).toHaveBeenCalledWith(
      1001,
      TaskStatus.COMPLETE,
    );
  });

  it('本地 finalResult 可自证终态：不额外拉快照（避免闪烁回归）', async () => {
    const snapshotCalls: unknown[] = [];
    const terminalCalls: (string | undefined)[] = [];
    mockFetchConversationTaskStatus.mockResolvedValue(TaskStatus.COMPLETE);
    mockFetchConversationSnapshot.mockResolvedValue(undefined);

    renderResumeHook({
      onConversationSnapshot: (snapshot: unknown) =>
        snapshotCalls.push(snapshot),
      onTerminalTaskStatus: (status: string | undefined) =>
        terminalCalls.push(status),
      messageList: [
        {
          id: 1,
          role: AssistantRoleEnum.USER,
          status: 'Complete',
          text: '问题',
        } as never,
        {
          id: 2,
          role: AssistantRoleEnum.ASSISTANT,
          status: 'Complete',
          text: '完整回答',
          finalResult: { success: true },
        } as never,
      ],
    });
    expect(subOnClose).toBeTypeOf('function');

    await act(async () => {
      await subOnClose?.();
    });

    // local-message 路径：sub 已回放完整输出，无需补拉快照
    expect(mockFetchConversationSnapshot).not.toHaveBeenCalled();
    expect(snapshotCalls).toHaveLength(0);
    expect(terminalCalls).toEqual([TaskStatus.COMPLETE]);
  });

  it('fallback 快照等待期间切会话：旧回调不得把终态写给新会话', async () => {
    let resolveSnapshot: ((value: unknown) => void) | undefined;
    const terminalCalls: (string | undefined)[] = [];
    mockFetchConversationTaskStatus.mockResolvedValue(TaskStatus.COMPLETE);
    mockFetchConversationSnapshot.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSnapshot = resolve;
        }),
    );

    const resumeStream = vi.fn(
      (_id: number, _list: MessageInfo[], onClose: () => Promise<void>) => {
        subOnClose = onClose;
      },
    );
    const abortSub = vi.fn();
    const { rerender } = renderHook(
      ({ conversationId }: { conversationId: number }) =>
        useConversationStreamResume({
          conversationId,
          taskStatus: TaskStatus.EXECUTING,
          isLocallyStreaming: false,
          isAwaitingChatTerminal: false,
          messageList,
          resumeStream,
          abortSub,
          onConversationSnapshot: vi.fn(),
          onTerminalTaskStatus: (status: string | undefined) =>
            terminalCalls.push(status),
          resumeDebugSource: 'test',
        } as never),
      { initialProps: { conversationId: 1001 } },
    );
    const oldOnClose = subOnClose;
    expect(oldOnClose).toBeTypeOf('function');

    let closePromise: Promise<void> | undefined;
    await act(async () => {
      closePromise = oldOnClose?.();
      await Promise.resolve();
    });
    expect(mockFetchConversationSnapshot).toHaveBeenCalledWith(1001);

    rerender({ conversationId: 2002 });
    resolveSnapshot?.({
      id: 1001,
      taskStatus: TaskStatus.COMPLETE,
      messageList,
    });
    await act(async () => {
      await closePromise;
    });

    expect(terminalCalls).toEqual([]);
    expect(mockEmitConversationListTaskStatus).not.toHaveBeenCalledWith(
      1001,
      TaskStatus.COMPLETE,
    );
  });
});
