/**
 * conversationTaskStatusSync 工具测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEventBusOn, mockEventBusOff } = vi.hoisted(() => ({
  mockEventBusOn: vi.fn(),
  mockEventBusOff: vi.fn(),
}));

vi.mock('@/utils/eventBus', () => ({
  default: {
    on: mockEventBusOn,
    off: mockEventBusOff,
  },
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: vi.fn(),
}));

vi.mock('@/constants/codes.constants', () => ({
  SUCCESS_CODE: '0000',
}));

vi.mock('@/constants/event.constants', () => ({
  EVENT_TYPE: { ChatFinished: 'chat_finished' },
}));

import { apiAgentConversation } from '@/services/agentConfig';
import { TaskStatus } from '@/types/enums/agent';
import {
  applyTerminalTaskStatus,
  createSyncConversationTaskStatus,
  fetchConversationTaskStatus,
  hasExecutingTaskInList,
  resolveTerminalTaskStatus,
  subscribeChatFinished,
  subscribeChatFinishedTaskSync,
  syncTerminalConversationTaskStatus,
} from '@/utils/conversationTaskStatusSync';

describe('conversationTaskStatusSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchConversationTaskStatus', () => {
    it('成功时返回 taskStatus', async () => {
      (apiAgentConversation as any).mockResolvedValue({
        code: '0000',
        data: { id: 1553050, taskStatus: TaskStatus.COMPLETE },
      });

      const status = await fetchConversationTaskStatus(1553050);
      expect(status).toBe(TaskStatus.COMPLETE);
    });

    it('接口失败时返回 undefined', async () => {
      (apiAgentConversation as any).mockRejectedValue(new Error('network'));
      const status = await fetchConversationTaskStatus(1553050);
      expect(status).toBeUndefined();
    });
  });

  describe('syncTerminalConversationTaskStatus', () => {
    it('API 返回 EXECUTING 时不写回', async () => {
      (apiAgentConversation as any).mockResolvedValue({
        code: '0000',
        data: { taskStatus: TaskStatus.EXECUTING },
      });

      const setConversationInfo = vi.fn();
      await syncTerminalConversationTaskStatus(100, setConversationInfo);

      expect(setConversationInfo).not.toHaveBeenCalled();
    });

    it('API 返回 COMPLETE 时写回', async () => {
      (apiAgentConversation as any).mockResolvedValue({
        code: '0000',
        data: { taskStatus: TaskStatus.COMPLETE },
      });

      const setConversationInfo = vi.fn();
      await syncTerminalConversationTaskStatus(100, setConversationInfo);

      expect(setConversationInfo).toHaveBeenCalled();
      const updater = setConversationInfo.mock.calls[0][0];
      const next = updater({ id: 100, taskStatus: TaskStatus.EXECUTING });
      expect(next.taskStatus).toBe(TaskStatus.COMPLETE);
    });
  });

  describe('resolveTerminalTaskStatus', () => {
    it('success=true → COMPLETE', () => {
      expect(resolveTerminalTaskStatus(true)).toBe(TaskStatus.COMPLETE);
    });

    it('success=false / undefined → undefined（不落，交后端轮询兜底）', () => {
      expect(resolveTerminalTaskStatus(false)).toBeUndefined();
      expect(resolveTerminalTaskStatus(undefined)).toBeUndefined();
    });
  });

  describe('createSyncConversationTaskStatus', () => {
    it('仅 merge 匹配会话的 taskStatus', async () => {
      (apiAgentConversation as any).mockResolvedValue({
        code: '0000',
        data: { taskStatus: TaskStatus.COMPLETE },
      });

      const setConversationInfo = vi.fn();
      const sync = createSyncConversationTaskStatus(setConversationInfo);
      await sync(100);

      expect(setConversationInfo).toHaveBeenCalled();
      const updater = setConversationInfo.mock.calls[0][0];
      const next = updater({ id: 100, taskStatus: TaskStatus.EXECUTING });
      expect(next.taskStatus).toBe(TaskStatus.COMPLETE);
    });

    // 复用 syncTerminal：同样跳过 EXECUTING（避免 ChatFinished 兜底固化 EXECUTING）
    it('API 返回 EXECUTING 时不写回', async () => {
      (apiAgentConversation as any).mockResolvedValue({
        code: '0000',
        data: { taskStatus: TaskStatus.EXECUTING },
      });

      const setConversationInfo = vi.fn();
      const sync = createSyncConversationTaskStatus(setConversationInfo);
      await sync(100);

      expect(setConversationInfo).not.toHaveBeenCalled();
    });
  });

  describe('applyTerminalTaskStatus', () => {
    it('跳过 undefined / EXECUTING', () => {
      const setConversationInfo = vi.fn();
      applyTerminalTaskStatus(setConversationInfo, 100, undefined);
      applyTerminalTaskStatus(setConversationInfo, 100, TaskStatus.EXECUTING);
      expect(setConversationInfo).not.toHaveBeenCalled();
    });

    it('taskStatus 未变化时返回原引用（让 React bail-out）', () => {
      const setConversationInfo = vi.fn();
      applyTerminalTaskStatus(setConversationInfo, 100, TaskStatus.COMPLETE);
      expect(setConversationInfo).toHaveBeenCalledTimes(1);
      const updater = setConversationInfo.mock.calls[0][0];
      const prev = { id: 100, taskStatus: TaskStatus.COMPLETE };
      expect(updater(prev)).toBe(prev);
    });

    it('会话 id 不匹配时返回原引用', () => {
      const setConversationInfo = vi.fn();
      applyTerminalTaskStatus(setConversationInfo, 100, TaskStatus.COMPLETE);
      const updater = setConversationInfo.mock.calls[0][0];
      const prev = { id: 999, taskStatus: TaskStatus.EXECUTING };
      expect(updater(prev)).toBe(prev);
    });

    it('终态变化时写回新对象', () => {
      const setConversationInfo = vi.fn();
      applyTerminalTaskStatus(setConversationInfo, 100, TaskStatus.COMPLETE);
      const updater = setConversationInfo.mock.calls[0][0];
      const next = updater({ id: 100, taskStatus: TaskStatus.EXECUTING });
      expect(next.taskStatus).toBe(TaskStatus.COMPLETE);
    });
  });

  describe('subscribeChatFinished', () => {
    it('订阅与取消订阅', () => {
      const handler = vi.fn();
      const unsubscribe = subscribeChatFinished(handler);

      expect(mockEventBusOn).toHaveBeenCalledWith('chat_finished', handler);

      unsubscribe();
      expect(mockEventBusOff).toHaveBeenCalledWith('chat_finished', handler);
    });
  });

  describe('hasExecutingTaskInList', () => {
    it('列表含 EXECUTING 时返回 true', () => {
      expect(
        hasExecutingTaskInList([
          { taskStatus: TaskStatus.COMPLETE },
          { taskStatus: TaskStatus.EXECUTING },
        ]),
      ).toBe(true);
    });

    it('列表无 EXECUTING 或为空时返回 false', () => {
      expect(hasExecutingTaskInList([])).toBe(false);
      expect(hasExecutingTaskInList(undefined)).toBe(false);
      expect(
        hasExecutingTaskInList([{ taskStatus: TaskStatus.COMPLETE }]),
      ).toBe(false);
    });
  });

  describe('subscribeChatFinishedTaskSync', () => {
    it('非 EXECUTING 时不订阅', () => {
      const onSync = vi.fn();
      const unsubscribe = subscribeChatFinishedTaskSync(
        100,
        TaskStatus.COMPLETE,
        onSync,
      );
      unsubscribe();
      expect(mockEventBusOn).not.toHaveBeenCalled();
    });

    it('EXECUTING 时订阅并在匹配事件后触发同步', () => {
      const onSync = vi.fn();
      subscribeChatFinishedTaskSync(100, TaskStatus.EXECUTING, onSync);

      expect(mockEventBusOn).toHaveBeenCalledWith(
        'chat_finished',
        expect.any(Function),
      );

      const handler = mockEventBusOn.mock.calls[0][1] as (data: {
        conversationId: string;
      }) => void;
      handler({ conversationId: '100' });
      handler({ conversationId: '999' });

      expect(onSync).toHaveBeenCalledTimes(1);
      expect(onSync).toHaveBeenCalledWith(100);
    });

    it('返回的函数可取消订阅', () => {
      const unsubscribe = subscribeChatFinishedTaskSync(
        100,
        TaskStatus.EXECUTING,
        vi.fn(),
      );
      unsubscribe();

      expect(mockEventBusOff).toHaveBeenCalledWith(
        'chat_finished',
        expect.any(Function),
      );
    });
  });
});
