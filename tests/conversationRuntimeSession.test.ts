/**
 * 新线 runtime session 核心环合同测试（双线方案 R2）。
 * send → live 连接（transport mock）→ 事件投影 → 终态收尾，编排语义对齐旧线。
 */
import { createConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import type { ConversationEffectsAdapter } from '@/features/conversation/runtime/effectDispatcher';
import {
  ConversationEventTypeEnum,
  MessageModeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatParams,
  ConversationChatResponse,
} from '@/types/interfaces/conversationInfo';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockOpenLive, mockOpenResume, mockSyncTerminal, mockCreateSSE } =
  vi.hoisted(() => ({
    mockOpenLive: vi.fn(),
    mockOpenResume: vi.fn(),
    mockSyncTerminal: vi.fn().mockResolvedValue(undefined),
    mockCreateSSE: vi.fn(),
  }));

vi.mock('@/features/conversation/runtime/conversationTransport', () => ({
  openLiveConversationStream: (...args: unknown[]) => mockOpenLive(...args),
  openResumeConversationStream: (...args: unknown[]) => mockOpenResume(...args),
}));

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  // 全量 stub：真实模块经 services 引入 umi 传递依赖，会破坏非 umi 测试环境
  syncTerminalConversationTaskStatus: (...args: unknown[]) =>
    mockSyncTerminal(...args),
}));

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: (...args: unknown[]) => mockCreateSSE(...args),
}));

// 基线版 common/home.constants 经 i18nRuntime→umi 传递依赖破坏非 umi 测试环境
//（与 resumeController.test 同法 mock）
vi.mock('@/constants/common.constants', () => ({
  CONVERSATION_CONNECTION_URL: '/api/agent/conversation/chat',
  CONVERSATION_CHAT_SUB_URL: '/api/agent/conversation/chat/sub',
  MESSAGE_PAGE_SIZE: 20,
}));
vi.mock('@/constants/home.constants', () => ({
  ACCESS_TOKEN: 'ACCESS_TOKEN',
}));

type LiveCallbacks = {
  onMessage: (res: ConversationChatResponse) => void;
  onClose: () => void;
  onError: () => void;
};

const createSession = (
  extraConfig: Partial<
    Parameters<typeof createConversationRuntimeSession>[0]
  > = {},
) => {
  const dispatched: unknown[] = [];
  const effectsAdapter: ConversationEffectsAdapter = {
    dispatch: (effect) => {
      dispatched.push(effect);
    },
  };
  const session = createConversationRuntimeSession({
    adapters: {
      renderProcessingBlock: vi.fn(() => 'block'),
      reconcileFinalMessage: vi.fn((message) => message),
    },
    effectsAdapter,
    ...extraConfig,
  });
  return { session, dispatched };
};

/** 已落库的历史消息 */
const persisted = {
  id: 'persisted-1',
  text: '历史',
  status: MessageStatusEnum.Complete,
} as never;

const messageEvent = (
  text: string,
  finished = false,
): ConversationChatResponse =>
  ({
    requestId: 'req-1',
    eventType: ConversationEventTypeEnum.MESSAGE,
    data: { id: 'server-output', type: MessageModeEnum.CHAT, text, finished },
  } as ConversationChatResponse);

describe('conversationRuntimeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncTerminal.mockResolvedValue(undefined);
  });

  it('send：乐观追加 user/assistant 占位并携带请求体', () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());

    session.send({ conversationId: 1001, message: '你好' });

    const messages = session.store.getSnapshot();
    expect(messages).toHaveLength(2);
    expect(messages[0].text).toBe('你好');
    expect(messages[1].status).toBe(MessageStatusEnum.Loading);

    const params = mockOpenLive.mock.calls[0][0] as ConversationChatParams;
    expect(params.conversationId).toBe(1001);
    expect(params.message).toBe('你好');

    expect(session.getState().isConversationActive).toBe(true);
    expect(session.getState().isAwaitingChatTerminal).toBe(true);
  });

  it('事件投影：MESSAGE chunk 归并进 assistant 占位，requestId 更新', () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '你好' });
    const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    callbacks.onMessage(messageEvent('答'));
    callbacks.onMessage(messageEvent('案', true));

    const messages = session.store.getSnapshot();
    expect(messages[1].text).toBe('答案');
    expect(messages[1].status).toBe(MessageStatusEnum.Complete);
    expect(session.getState().currentRequestId).toBe('req-1');
  });

  it('onClose 正常收尾：finalize + 释放活跃/等终态 + 终态兜底查询（FINAL 未解析时）', async () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '你好' });
    const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    callbacks.onClose();
    await vi.waitFor(() => {
      expect(session.getState().isAwaitingChatTerminal).toBe(false);
    });

    expect(session.store.getSnapshot()[1].status).toBe(
      MessageStatusEnum.Stopped,
    );
    expect(session.getState().isConversationActive).toBe(false);
    // FINAL 未带明确终态 → 兜底查询发生
    expect(mockSyncTerminal).toHaveBeenCalledWith(1001, expect.anything());
  });

  it('FINAL 已解析终态时 onClose 不做兜底查询', () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '你好' });
    const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    callbacks.onMessage({
      requestId: 'req-1',
      eventType: ConversationEventTypeEnum.FINAL_RESULT,
      data: {
        success: true,
        outputText: '答',
        error: '',
        componentExecuteResults: [],
      },
    } as ConversationChatResponse);
    callbacks.onClose();

    expect(mockSyncTerminal).not.toHaveBeenCalled();
    expect(session.getState().isAwaitingChatTerminal).toBe(false);
  });

  it('ERROR 事件：FAILED 补丁经 effects 分发', () => {
    const { session, dispatched } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '你好' });
    const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    callbacks.onMessage({
      requestId: 'req-1',
      eventType: ConversationEventTypeEnum.ERROR,
    } as ConversationChatResponse);

    expect(dispatched).toContainEqual({
      type: 'recent.status.patch',
      conversationId: 1001,
      status: 'FAILED',
    });
  });

  it('onError：owner 消息置 Error 并释放活跃态', () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '你好' });
    const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    callbacks.onError();

    expect(session.store.getSnapshot()[1].status).toBe(MessageStatusEnum.Error);
    expect(session.getState().isConversationActive).toBe(false);
    expect(session.getState().isAwaitingChatTerminal).toBe(false);
  });

  it('高频连续发送：上一轮连接的迟到 onClose 只清理自己的消息', () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '一' });
    const firstCallbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    session.send({ conversationId: 1001, message: '二' });
    const secondCallbacks = mockOpenLive.mock.calls[1][1] as LiveCallbacks;

    // 第一轮的迟到 close 在第二轮进行中到达
    firstCallbacks.onClose();

    const messages = session.store.getSnapshot();
    // 第二轮不受影响：仍有 4 条（两轮乐观），第二轮 assistant 仍 Loading
    expect(messages).toHaveLength(4);
    expect(messages[3].status).toBe(MessageStatusEnum.Loading);
    expect(session.getState().isConversationActive).toBe(true);

    // 第二轮正常关闭后全部收尾
    secondCallbacks.onClose();
    expect(messages[3].status).toBe(MessageStatusEnum.Loading); // 引用旧快照
    expect(session.store.getSnapshot()[3].status).toBe(
      MessageStatusEnum.Stopped,
    );
  });

  it('stop：中断连接、消息终态 Stopped', () => {
    const { session } = createSession();
    const abort = vi.fn();
    mockOpenLive.mockReturnValue(abort);
    session.send({ conversationId: 1001, message: '你好' });

    session.stop(1001);

    expect(abort).toHaveBeenCalledTimes(1);
    expect(session.store.getSnapshot()[1].status).toBe(
      MessageStatusEnum.Stopped,
    );
  });

  it('R3 load：详情加载整体替换并保留乐观尾，过期返回丢弃', async () => {
    const loadRequest = vi
      .fn()
      .mockResolvedValue({ data: { id: 1001, messageList: [persisted] } });
    const { session } = createSession({ loadRequest });
    // 先有本地乐观轮次
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '本地' });

    const data = await session.load(1001);

    expect(loadRequest).toHaveBeenCalledWith(1001);
    expect(data?.id).toBe(1001);
    // 乐观 user/assistant 保留在尾部，persisted 在前
    const messages = session.store.getSnapshot();
    expect(messages[0].id).toBe('persisted-1');
    expect(messages.some((message) => message.text === '本地')).toBe(true);

    // 过期丢弃：慢请求挂起期间发起了新会话的 load（currentConversationId 已切换）
    let resolveLate: (value: unknown) => void;
    loadRequest.mockReturnValue(
      new Promise((resolve) => {
        resolveLate = resolve;
      }),
    );
    const late = session.load(1001);
    loadRequest.mockResolvedValue({ data: { id: 2002, messageList: [] } });
    void session.load(2002); // 同步置 currentConversationId = 2002
    resolveLate!({ data: { id: 1001, messageList: [] } });
    expect(await late).toBeUndefined();
  });

  it('R3 applySnapshot：会话门禁——不匹配的快照丢弃', () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '你好' });
    const before = session.store.getSnapshot();

    session.applySnapshot(9999, [{ id: 'other', text: '别家会话' } as never]);

    expect(session.store.getSnapshot()).toBe(before);

    session.applySnapshot(1001, [{ id: 's1', text: '本会话快照' } as never]);
    expect(session.store.getSnapshot().length).toBeGreaterThan(before.length);
  });

  it('R3 resume：sub 订阅追加 assistant 占位并共用事件投影', () => {
    const { session } = createSession();
    const abort = vi.fn();
    mockCreateSSE.mockReturnValue(abort);

    session.resumeConversationStream(1001, [], undefined, 'test');

    // resumeController 直用 createSSEConnection 建立 sub 流
    expect(mockCreateSSE).toHaveBeenCalledTimes(1);
    expect(mockCreateSSE.mock.calls[0][0].url).toContain('/sub/1001');
    // 占位已追加
    const messages = session.store.getSnapshot();
    expect(messages).toHaveLength(1);
    expect(messages[0].status).toBe(MessageStatusEnum.Loading);

    // sub chunk 投影进占位（与 live 共用 applyStreamEvent）
    const resumeCallbacks = mockCreateSSE.mock.calls[0][0];
    resumeCallbacks.onMessage(messageEvent('恢复'));

    expect(session.store.getSnapshot()[0].text).toBe('恢复');
    expect(session.getState().currentRequestId).toBe('req-1');

    resumeCallbacks.onClose();
    expect(mockCreateSSE).toHaveBeenCalledTimes(1);
  });
});

describe('conversationRuntimeSession R6 收口', () => {
  const createSessionWith = (
    extraConfig: Partial<
      Parameters<typeof createConversationRuntimeSession>[0]
    > = {},
  ) => {
    const dispatched: unknown[] = [];
    const appliedStatuses: Array<[unknown, unknown]> = [];
    const session = createConversationRuntimeSession({
      adapters: {
        renderProcessingBlock: vi.fn(() => 'block'),
        reconcileFinalMessage: vi.fn((message) => message),
      },
      effectsAdapter: {
        dispatch: (effect: unknown) => {
          dispatched.push(effect);
        },
      } as never,
      ...extraConfig,
      applyTaskStatus: (id, status) => {
        appliedStatuses.push([id, status]);
        extraConfig.applyTaskStatus?.(id, status);
      },
    });
    return { session, dispatched, appliedStatuses };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncTerminal.mockResolvedValue(undefined);
  });

  it('isSync=false：不发乐观「执行中」标记', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: 'x',
      topicGate: { isSync: false },
    });
    expect(
      dispatched.filter(
        (e) =>
          (e as { type: string; status?: string }).type ===
          'recent.status.patch',
      ),
    ).toEqual([]);
  });

  it('ERROR 事件：taskStatus 经 applyTaskStatus 写回', () => {
    const { session, appliedStatuses } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: 'x' });
    const callbacks = mockOpenLive.mock.calls[0][1];
    callbacks.onMessage({ eventType: 'ERROR' } as never);
    expect(appliedStatuses).toContainEqual([1001, 'FAILED']);
  });

  it('FINAL 冲突文案：dispatch conflict.confirmStop；成功终态：写回 taskStatus', () => {
    const { session, dispatched, appliedStatuses } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: 'x' });
    const callbacks = mockOpenLive.mock.calls[0][1];

    callbacks.onMessage({
      eventType: 'FINAL_RESULT',
      error: 'Agent正在执行任务，请等待当前任务完成后再发送新请求',
    } as never);
    expect(dispatched).toContainEqual({
      type: 'conflict.confirmStop',
      conversationId: 1001,
    });

    callbacks.onMessage({
      eventType: 'FINAL_RESULT',
      data: {
        success: true,
        outputText: 'ok',
        error: '',
        componentExecuteResults: [],
      },
    } as never);
    expect(appliedStatuses.length).toBeGreaterThan(0);
  });

  it('onError：taskStatus 写回 FAILED', () => {
    const { session, appliedStatuses } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: 'x' });
    const callbacks = mockOpenLive.mock.calls[0][1];
    callbacks.onError();
    expect(appliedStatuses).toContainEqual([1001, 'FAILED']);
  });

  it('参数面：modelId/agentMode/skillIds 透传请求体', () => {
    const { session } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: 'x',
      modelId: 7,
      agentMode: 'yolo',
      skillIds: [3, 5],
    });
    const params = mockOpenLive.mock.calls.at(-1)![0];
    expect(params.modelId).toBe(7);
    expect(params.agentMode).toBe('yolo');
    expect(params.skillIds).toEqual([3, 5]);
  });
});
