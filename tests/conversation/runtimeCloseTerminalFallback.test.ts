import { EVENT_TYPE } from '@/constants/event.constants';
import { createConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import { apiAgentConversation } from '@/services/agentConfig';
import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { applyTerminalTaskStatus } from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockOpenLive } = vi.hoisted(() => ({ mockOpenLive: vi.fn() }));
vi.mock('@/features/conversation/runtime/conversationTransport', () => ({
  openLiveConversationStream: (...args: unknown[]) => mockOpenLive(...args),
}));
// 保留真实终态 utility，只隔离 HTTP 和外部副作用，覆盖 React setter 函数式合同。
vi.mock('@/services/agentConfig', () => ({ apiAgentConversation: vi.fn() }));
vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/constants/common.constants', () => ({
  CONVERSATION_CHAT_SUB_URL: '/api/agent/conversation/chat/sub',
}));
vi.mock('@/constants/home.constants', () => ({ ACCESS_TOKEN: 'ACCESS_TOKEN' }));
vi.mock('@/constants/codes.constants', () => ({ SUCCESS_CODE: '0000' }));
vi.mock('@/utils/eventBus', () => ({ default: { emit: vi.fn() } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function createSession() {
  let info = { id: 1001, taskStatus: TaskStatus.EXECUTING } as ConversationInfo;
  const applyTaskStatus = vi.fn((id: number | string, status: TaskStatus) => {
    applyTerminalTaskStatus(
      (updater) => {
        info = (typeof updater === 'function' ? updater(info) : updater)!;
      },
      id,
      status,
    );
  });
  const session = createConversationRuntimeSession({
    adapters: {
      renderProcessingBlock: vi.fn(() => 'block'),
      reconcileFinalMessage: vi.fn((message) => message),
    },
    effectsAdapter: { dispatch: vi.fn() },
    applyTaskStatus,
  });
  session.send({
    conversationId: 1001,
    message: '执行任务',
    currentInfo: info,
  });
  const onClose = mockOpenLive.mock.calls[0][1].onClose as () => void;
  return { session, onClose, applyTaskStatus, getInfo: () => info };
}

const result = (taskStatus: TaskStatus) =>
  ({ code: '0000', data: { id: 1001, taskStatus } } as Awaited<
    ReturnType<typeof apiAgentConversation>
  >);

describe('runtime onClose 真实终态查询写回（bug2528）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenLive.mockReturnValue(vi.fn());
  });

  it.each([TaskStatus.FAILED, TaskStatus.COMPLETE, TaskStatus.CANCEL])(
    '没有 FINAL 的连接关闭后，查询到 %s 必须恢复发送状态',
    async (status) => {
      vi.mocked(apiAgentConversation).mockResolvedValue(result(status));
      const { session, onClose, getInfo, applyTaskStatus } = createSession();

      onClose();
      await vi.waitFor(() =>
        expect(session.getState().isAwaitingChatTerminal).toBe(false),
      );

      expect(applyTaskStatus).toHaveBeenCalledWith(1001, status);
      expect(getInfo().taskStatus).toBe(status);
      expect(
        session.getState().isConversationActive ||
          getInfo().taskStatus === TaskStatus.EXECUTING,
      ).toBe(false);
      expect(eventBus.emit).toHaveBeenCalledWith(
        EVENT_TYPE.UpdateConversationListTaskStatus,
        { conversationId: 1001, taskStatus: status },
      );
    },
  );

  it('查询仍 EXECUTING 时不伪造终态，解除等待使恢复 hook 可以接管', async () => {
    vi.mocked(apiAgentConversation).mockResolvedValue(
      result(TaskStatus.EXECUTING),
    );
    const { session, onClose, getInfo, applyTaskStatus } = createSession();

    onClose();
    await vi.waitFor(() =>
      expect(session.getState().isAwaitingChatTerminal).toBe(false),
    );

    expect(applyTaskStatus).not.toHaveBeenCalled();
    expect(getInfo().taskStatus).toBe(TaskStatus.EXECUTING);
  });

  it('同会话新一轮已发送时，旧 close 的迟到查询不得写终态或解除新轮等待', async () => {
    const pending =
      deferred<Awaited<ReturnType<typeof apiAgentConversation>>>();
    vi.mocked(apiAgentConversation).mockReturnValue(pending.promise);
    const { session, onClose, applyTaskStatus } = createSession();

    onClose();
    session.send({ conversationId: 1001, message: '新一轮' });
    pending.resolve(result(TaskStatus.FAILED));
    await pending.promise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(applyTaskStatus).not.toHaveBeenCalled();
    expect(session.getState().isConversationActive).toBe(true);
    expect(session.getState().isAwaitingChatTerminal).toBe(true);
    expect(eventBus.emit).not.toHaveBeenCalledWith(
      EVENT_TYPE.UpdateConversationListTaskStatus,
      expect.objectContaining({ taskStatus: TaskStatus.FAILED }),
    );
  });

  it('切换会话后旧查询不写回旧终态', async () => {
    const pending =
      deferred<Awaited<ReturnType<typeof apiAgentConversation>>>();
    vi.mocked(apiAgentConversation).mockReturnValue(pending.promise);
    const { session, onClose, applyTaskStatus } = createSession();

    onClose();
    session.resetForConversationSwitch();
    await session.load(202);
    pending.resolve(result(TaskStatus.FAILED));
    await pending.promise;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(applyTaskStatus).not.toHaveBeenCalled();
    expect(session.getState().currentConversationId).toBe(202);
    expect(eventBus.emit).not.toHaveBeenCalledWith(
      EVENT_TYPE.UpdateConversationListTaskStatus,
      expect.objectContaining({ taskStatus: TaskStatus.FAILED }),
    );
  });
});
