/**
 * useConversationStreamResume 轮询终态写回测试
 */
import { useConversationStreamResume } from '@/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume';
import { TaskStatus } from '@/types/enums/agent';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseRequest, mockEventBusEmit } = vi.hoisted(() => ({
  mockUseRequest: vi.fn(),
  mockEventBusEmit: vi.fn(),
}));

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
  fetchConversationTaskStatus: vi.fn(),
}));

describe('useConversationStreamResume', () => {
  let onSuccess: ((status: TaskStatus | undefined) => void) | undefined;
  let runPolling: ReturnType<typeof vi.fn>;
  let cancelPolling: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onSuccess = undefined;
    runPolling = vi.fn();
    cancelPolling = vi.fn();
    mockUseRequest.mockImplementation((_service, options) => {
      onSuccess = options?.onSuccess;
      return { run: runPolling, cancel: cancelPolling };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

    onSuccess?.(TaskStatus.COMPLETE);
    expect(onTerminalTaskStatus).toHaveBeenCalledWith(TaskStatus.COMPLETE);
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
      onSuccess?.(TaskStatus.EXECUTING);
    });
    expect(onTerminalTaskStatus).not.toHaveBeenCalled();
  });

  it('轮询发现 EXECUTING 时先 reload 历史，再订阅 sub，关闭后恢复轮询并刷新列表', async () => {
    const reloadedList = [{ id: 'user-1', text: 'from other tab' }] as any[];
    const reloadHistoryAsync = vi.fn().mockResolvedValue(reloadedList);
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
      onSuccess?.(TaskStatus.EXECUTING);
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
    expect(reloadHistoryAsync).toHaveBeenCalledWith(1555404);
    expect(resumeStream).toHaveBeenCalledWith(
      1555404,
      reloadedList,
      expect.any(Function),
    );

    await act(async () => {
      await subOnClose?.();
    });

    expect(runPolling).toHaveBeenCalled();
    expect(reloadHistoryAsync).toHaveBeenCalledTimes(2);
    expect(mockEventBusEmit).toHaveBeenCalledWith('refresh_conversation_list', {
      conversationId: 1555404,
      reason: 'stream-closed',
    });
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
      onSuccess?.(TaskStatus.EXECUTING);
    });

    expect(resumeStream).not.toHaveBeenCalled();
  });
});
