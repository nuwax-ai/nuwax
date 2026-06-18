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
  createSyncConversationTaskStatus,
  fetchConversationTaskStatus,
  hasExecutingTaskInList,
  subscribeChatFinished,
  subscribeChatFinishedTaskSync,
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
