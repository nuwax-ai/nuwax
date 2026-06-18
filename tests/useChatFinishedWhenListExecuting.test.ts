/**
 * useChatFinishedWhenListExecuting hook 测试
 */
import { useChatFinishedWhenListExecuting } from '@/hooks/useChatFinishedWhenListExecuting';
import { TaskStatus } from '@/types/enums/agent';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEventBusOn, mockEventBusOff } = vi.hoisted(() => ({
  mockEventBusOn: vi.fn(),
  mockEventBusOff: vi.fn(),
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: vi.fn(),
}));

vi.mock('@/constants/codes.constants', () => ({
  SUCCESS_CODE: '0000',
}));

vi.mock('@/utils/eventBus', () => ({
  default: {
    on: mockEventBusOn,
    off: mockEventBusOff,
  },
}));

vi.mock('@/constants/event.constants', () => ({
  EVENT_TYPE: { ChatFinished: 'chat_finished' },
}));

describe('useChatFinishedWhenListExecuting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('列表无 EXECUTING 时不订阅', () => {
    const onChatFinished = vi.fn();
    renderHook(() =>
      useChatFinishedWhenListExecuting({
        conversationList: [{ taskStatus: TaskStatus.COMPLETE }],
        onChatFinished,
      }),
    );
    expect(mockEventBusOn).not.toHaveBeenCalled();
  });

  it('列表含 EXECUTING 时订阅，卸载时取消', () => {
    const onChatFinished = vi.fn();
    const { unmount } = renderHook(() =>
      useChatFinishedWhenListExecuting({
        conversationList: [{ taskStatus: TaskStatus.EXECUTING }],
        onChatFinished,
      }),
    );

    expect(mockEventBusOn).toHaveBeenCalledWith(
      'chat_finished',
      onChatFinished,
    );

    unmount();
    expect(mockEventBusOff).toHaveBeenCalledWith(
      'chat_finished',
      onChatFinished,
    );
  });

  it('enabled=false 时不订阅', () => {
    const onChatFinished = vi.fn();
    renderHook(() =>
      useChatFinishedWhenListExecuting({
        conversationList: [{ taskStatus: TaskStatus.EXECUTING }],
        onChatFinished,
        enabled: false,
      }),
    );
    expect(mockEventBusOn).not.toHaveBeenCalled();
  });
});
