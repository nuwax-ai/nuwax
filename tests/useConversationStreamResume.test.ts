/**
 * useConversationStreamResume 轮询终态写回测试
 */
import { useConversationStreamResume } from '@/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume';
import { TaskStatus } from '@/types/enums/agent';
import { renderHook } from '@testing-library/react';
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

  beforeEach(() => {
    vi.clearAllMocks();
    onSuccess = undefined;
    mockUseRequest.mockImplementation((_service, options) => {
      onSuccess = options?.onSuccess;
      return { run: vi.fn(), cancel: vi.fn() };
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

    onSuccess?.(TaskStatus.EXECUTING);
    expect(onTerminalTaskStatus).not.toHaveBeenCalled();
  });
});
