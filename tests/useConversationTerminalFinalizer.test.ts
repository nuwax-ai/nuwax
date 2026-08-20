/**
 * useConversationTerminalFinalizer 统一终态清算 hook 直接测试
 *
 * 该 hook 不拥有 React state，所有依赖通过 options 注入，
 * 用 vi.fn() / 对象字面量 refs 驱动即可测试全部逻辑。
 */
import { useConversationTerminalFinalizer } from '@/hooks/useConversationTerminalFinalizer';
import { ConversationEventTypeEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApplyTerminal, mockEmitListStatus, mockResolveTerminal } =
  vi.hoisted(() => ({
    mockApplyTerminal: vi.fn(),
    mockEmitListStatus: vi.fn(),
    mockResolveTerminal: vi.fn(),
  }));

// conversationTaskStatusSync → services/agentConfig → umi，完全 mock 避免 esbuild/TextEncoder 崩溃
vi.mock('@/utils/conversationTaskStatusSync', () => ({
  applyTerminalTaskStatus: mockApplyTerminal,
  emitConversationListTaskStatus: mockEmitListStatus,
  resolveTerminalTaskStatus: mockResolveTerminal,
  fetchConversationSnapshot: vi.fn(),
  fetchConversationTaskStatus: vi.fn(),
  syncTerminalConversationTaskStatus: vi.fn(),
  createSyncConversationTaskStatus: vi.fn(() => vi.fn()),
  subscribeChatFinishedTaskSync: vi.fn(() => vi.fn()),
  subscribeChatFinished: vi.fn(() => vi.fn()),
  hasExecutingTaskInList: vi.fn(),
  isTerminalTaskStatus: vi.fn(),
  mergeConversationInfoTaskStatus: vi.fn(),
  resolveTaskStatusFromMessageList: vi.fn(),
  resolveTaskStatusFromMessageLists: vi.fn(),
}));

// rAF 同步执行（占位收尾的重算路径）
const rafCallbacks: FrameRequestCallback[] = [];
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
});

interface MockOptions {
  source?: string;
  conversationInfoRef?: { current: ConversationInfo | null };
}

function createMockOptions(overrides: MockOptions = {}) {
  return {
    source: overrides.source ?? 'test',
    conversationInfoRef: overrides.conversationInfoRef ?? { current: null },
    lastSendAtRef: { current: 0 },
    roundTerminalAckRef: { current: false },
    setConversationInfo: vi.fn(),
    setMessageList: vi.fn((updater: (prev: MessageInfo[]) => MessageInfo[]) =>
      updater([]),
    ),
    messageListRef: { current: [] as MessageInfo[] },
    setIsAwaitingChatTerminal: vi.fn(),
    setIsConversationActive: vi.fn(),
  };
}

function flushRaf() {
  const cbs = [...rafCallbacks];
  rafCallbacks.length = 0;
  cbs.forEach((cb) => cb(0));
}

describe('useConversationTerminalFinalizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks.length = 0;
  });

  describe('finalizeConversationTerminal', () => {
    it('终态到达 → 破保活 + 清活跃态 + 清 awaiting + ack + taskStatus 写回', () => {
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeConversationTerminal(
          123,
          TaskStatus.COMPLETE,
          'test',
        );
      });

      expect(opts.lastSendAtRef.current).toBe(0);
      expect(opts.setIsConversationActive).toHaveBeenCalledWith(
        false,
        'terminal-sweep',
      );
      expect(opts.setIsAwaitingChatTerminal).toHaveBeenCalledWith(false);
      expect(opts.roundTerminalAckRef.current).toBe(true);
      expect(mockApplyTerminal).toHaveBeenCalledWith(
        opts.setConversationInfo,
        123,
        TaskStatus.COMPLETE,
      );
    });

    it('undefined / EXECUTING 状态跳过（不动状态机）', () => {
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeConversationTerminal(123, undefined);
        result.current.finalizeConversationTerminal(123, TaskStatus.EXECUTING);
        result.current.finalizeConversationTerminal(
          undefined,
          TaskStatus.COMPLETE,
        );
      });

      expect(opts.setIsConversationActive).not.toHaveBeenCalled();
      expect(opts.setIsAwaitingChatTerminal).not.toHaveBeenCalled();
      expect(mockApplyTerminal).not.toHaveBeenCalled();
    });

    it('跨会话守卫：旧会话的迟到终态不误清当前会话', () => {
      const opts = createMockOptions({
        conversationInfoRef: { current: { id: 999 } as ConversationInfo },
      });
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeConversationTerminal(123, TaskStatus.COMPLETE);
      });

      expect(opts.setIsConversationActive).not.toHaveBeenCalled();
      expect(mockApplyTerminal).not.toHaveBeenCalled();
    });

    it('conversationInfoRef 为 null（未就绪）时放行', () => {
      const opts = createMockOptions({
        conversationInfoRef: { current: null },
      });
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeConversationTerminal(123, TaskStatus.COMPLETE);
      });

      expect(opts.setIsConversationActive).toHaveBeenCalled();
    });

    it('FAILED → 末条消息置 Error + processingList 置 FAILED', () => {
      const messages: MessageInfo[] = [
        { role: 'USER', id: 'u1', text: '问' } as MessageInfo,
        {
          role: 'ASSISTANT',
          id: 'a1',
          text: '',
          status: MessageStatusEnum.Loading,
          processingList: [
            { status: ProcessingEnum.EXECUTING, name: 'tool1' } as never,
          ],
        } as MessageInfo,
      ];
      const opts = createMockOptions();
      opts.messageListRef.current = messages;
      let updatedList: MessageInfo[] = [];
      opts.setMessageList = vi.fn(
        (updater: (prev: MessageInfo[]) => MessageInfo[]) => {
          updatedList = updater(messages);
        },
      );

      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeConversationTerminal(123, TaskStatus.FAILED);
      });

      const tail = updatedList[updatedList.length - 1];
      expect(tail.status).toBe(MessageStatusEnum.Error);
      expect(tail.processingList?.[0].status).toBe(ProcessingEnum.FAILED);
    });
  });

  describe('finalizeChatTerminalEvent', () => {
    it('FINAL_RESULT success=true → COMPLETE 清算', () => {
      mockResolveTerminal.mockReturnValue(TaskStatus.COMPLETE);
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeChatTerminalEvent(123, {
          eventType: ConversationEventTypeEnum.FINAL_RESULT,
          data: { success: true },
          completed: true,
        } as ConversationChatResponse);
      });

      expect(opts.setIsConversationActive).toHaveBeenCalledWith(
        false,
        'terminal-sweep',
      );
      expect(mockApplyTerminal).toHaveBeenCalledWith(
        opts.setConversationInfo,
        123,
        TaskStatus.COMPLETE,
      );
    });

    it('ERROR → FAILED 清算', () => {
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeChatTerminalEvent(123, {
          eventType: ConversationEventTypeEnum.ERROR,
          error: 'Internal error',
        } as ConversationChatResponse);
      });

      expect(mockApplyTerminal).toHaveBeenCalledWith(
        opts.setConversationInfo,
        123,
        TaskStatus.FAILED,
      );
    });

    it('PROCESSING 事件跳过（白名单，1560859 实证）', () => {
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeChatTerminalEvent(123, {
          eventType: ConversationEventTypeEnum.PROCESSING,
          data: { status: 'FINISHED', taskStatus: 'COMPLETE' },
        } as ConversationChatResponse);
      });

      expect(opts.setIsConversationActive).not.toHaveBeenCalled();
      expect(mockApplyTerminal).not.toHaveBeenCalled();
    });

    it('MESSAGE 事件跳过', () => {
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeChatTerminalEvent(123, {
          eventType: ConversationEventTypeEnum.MESSAGE,
          data: { type: 'CHAT', text: '内容', finished: true },
        } as ConversationChatResponse);
      });

      expect(opts.setIsConversationActive).not.toHaveBeenCalled();
    });

    it('HEART_BEAT 事件跳过', () => {
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeChatTerminalEvent(123, {
          eventType: ConversationEventTypeEnum.HEART_BEAT,
        } as ConversationChatResponse);
      });

      expect(opts.setIsConversationActive).not.toHaveBeenCalled();
    });

    it('FINAL_RESULT 解析不出终态（任务冲突）→ 跳过', () => {
      mockResolveTerminal.mockReturnValue(undefined);
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeChatTerminalEvent(123, {
          eventType: ConversationEventTypeEnum.FINAL_RESULT,
          data: { success: false },
          error: 'Agent正在执行任务，请等待当前任务完成后再发送新请求',
        } as ConversationChatResponse);
      });

      expect(opts.setIsConversationActive).not.toHaveBeenCalled();
      expect(mockApplyTerminal).not.toHaveBeenCalled();
    });

    it('cid 或 res 为空 → 直接 return', () => {
      const opts = createMockOptions();
      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeChatTerminalEvent(
          undefined,
          {} as ConversationChatResponse,
        );
        result.current.finalizeChatTerminalEvent(123, undefined);
      });

      expect(opts.setIsConversationActive).not.toHaveBeenCalled();
    });
  });

  describe('finalizeStreamingPlaceholder', () => {
    it('stopped：占位 Loading → Stopped，不动 taskStatus', () => {
      const messages: MessageInfo[] = [
        {
          role: 'ASSISTANT',
          id: 'ph-1',
          status: MessageStatusEnum.Loading,
        } as MessageInfo,
      ];
      const opts = createMockOptions();
      opts.messageListRef.current = messages;
      let updatedList: MessageInfo[] = [];
      opts.setMessageList = vi.fn(
        (updater: (prev: MessageInfo[]) => MessageInfo[]) => {
          updatedList = updater(messages);
        },
      );

      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeStreamingPlaceholder('ph-1', 'stopped');
      });
      flushRaf();

      expect(updatedList[0].status).toBe(MessageStatusEnum.Stopped);
      expect(mockApplyTerminal).not.toHaveBeenCalled();
    });

    it('error：占位 → Error + taskStatus FAILED + 侧栏同步', () => {
      const opts = createMockOptions({
        conversationInfoRef: { current: { id: 456 } as ConversationInfo },
      });
      const messages: MessageInfo[] = [
        {
          role: 'ASSISTANT',
          id: 'ph-2',
          status: MessageStatusEnum.Loading,
        } as MessageInfo,
      ];
      opts.messageListRef.current = messages;
      opts.setMessageList = vi.fn(
        (updater: (prev: MessageInfo[]) => MessageInfo[]) => {
          updater(messages);
        },
      );

      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeStreamingPlaceholder('ph-2', 'error');
      });
      flushRaf();

      expect(mockApplyTerminal).toHaveBeenCalledWith(
        opts.setConversationInfo,
        456,
        TaskStatus.FAILED,
      );
      expect(mockEmitListStatus).toHaveBeenCalledWith(456, TaskStatus.FAILED);
    });

    it('占位 id 不在列表中 → updater 返回原列表（无变更）', () => {
      const opts = createMockOptions();
      const originalList: MessageInfo[] = [
        {
          role: 'ASSISTANT',
          id: 'other',
          status: MessageStatusEnum.Complete,
        } as MessageInfo,
      ];
      let resultList: MessageInfo[] | undefined;
      opts.setMessageList = vi.fn(
        (updater: (prev: MessageInfo[]) => MessageInfo[]) => {
          resultList = updater(originalList);
        },
      );

      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeStreamingPlaceholder('non-existent', 'stopped');
      });

      // setMessageList 被调用但 updater 返回原列表（幂等 noop）
      expect(opts.setMessageList).toHaveBeenCalled();
      expect(resultList).toBe(originalList); // 引用相同 = 无变更
    });

    it('rAF 重算活跃态：busy=false → active=false', () => {
      const opts = createMockOptions();
      opts.messageListRef.current = [
        {
          role: 'ASSISTANT',
          id: 'ph-3',
          status: MessageStatusEnum.Stopped,
        } as MessageInfo,
      ];
      opts.setMessageList = vi.fn(
        (updater: (prev: MessageInfo[]) => MessageInfo[]) => {
          updater([]);
        },
      );

      const { result } = renderHook(() =>
        useConversationTerminalFinalizer(opts),
      );

      act(() => {
        result.current.finalizeStreamingPlaceholder('ph-3', 'stopped');
      });
      flushRaf();

      expect(opts.setIsConversationActive).toHaveBeenCalledWith(
        false,
        'placeholder-recompute',
      );
    });
  });
});
