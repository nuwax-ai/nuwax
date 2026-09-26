/**
 * 新线 runtime session 核心环合同测试（双线方案 R2）。
 * send → live 连接（transport mock）→ 事件投影 → 终态收尾，编排语义对齐旧线。
 */
import { processInterventionSsePatch } from '@/components/business-component/AgentIntervention/utils/processInterventionSsePatch';
import { reconcileAcpPermissionStatusesInMessageList } from '@/components/business-component/AgentIntervention/utils/reconcileAcpPermissionStatus';
import { createConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import type { ConversationEffectsAdapter } from '@/features/conversation/runtime/effectDispatcher';
import {
  ConversationEventTypeEnum,
  MessageModeEnum,
  TaskStatus,
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
  fetchConversationTaskStatus: (...args: unknown[]) =>
    mockSyncTerminal(...args),
  emitConversationListTaskStatus: vi.fn(),
}));

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: (...args: unknown[]) => mockCreateSSE(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
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
  id = 'server-output',
  requestId = 'req-1',
): ConversationChatResponse =>
  ({
    requestId,
    eventType: ConversationEventTypeEnum.MESSAGE,
    data: { id, type: MessageModeEnum.CHAT, text, finished },
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

  it('send：sandboxId 随 chat 请求体透传（不传时请求体不带该字段）', () => {
    const { session } = createSession();
    mockOpenLive.mockReturnValue(vi.fn());

    session.send({
      conversationId: 1001,
      message: '你好',
      sandboxId: '4321',
    });
    const withSandbox = mockOpenLive.mock.calls[0][0] as ConversationChatParams;
    expect(withSandbox.sandboxId).toBe('4321');

    session.send({ conversationId: 1001, message: '再来' });
    const withoutSandbox = mockOpenLive.mock
      .calls[1][0] as ConversationChatParams;
    expect(withoutSandbox.sandboxId).toBeUndefined();
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

  it('ASK_QUESTION 优先投影为干预交互，不落入普通 PROCESSING', () => {
    const { session } = createSession({
      interventionAdapter: {
        patchEvent: processInterventionSsePatch,
        reconcileMessages: reconcileAcpPermissionStatusesInMessageList,
      },
    });
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '演示 ask-question' });
    const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    callbacks.onMessage({
      eventType: ConversationEventTypeEnum.PROCESSING,
      requestId: 'req-ask',
      data: {
        name: 'AskQuestion',
        type: 'Event',
        status: 'EXECUTING',
        subEventType: 'ASK_QUESTION',
        result: {
          name: '请选择继续方式',
          type: 'Event',
          success: true,
          data: {
            schemaVersion: 'nuwax.mcp_ask.v1',
            requestId: 'ask-runtime-1',
            revision: 1,
            title: '请选择继续方式',
            ui: {
              presentation: 'inline',
              title: '请选择继续方式',
              fields: [
                {
                  name: 'choice',
                  title: '继续方式',
                  widget: 'radio',
                  required: true,
                  options: [
                    { value: '继续', label: '继续执行' },
                    { value: '暂停', label: '暂停等待' },
                  ],
                },
              ],
            },
          },
          executeId: 'tool-call-runtime-1',
          input: null,
        },
      },
    } as ConversationChatResponse);

    const assistant = session.store.getSnapshot()[1];
    expect(assistant.mcpAskInteractions).toHaveLength(1);
    expect(assistant.mcpAskInteractions?.[0]).toMatchObject({
      toolCallId: 'ask-runtime-1',
      executeId: 'tool-call-runtime-1',
      responseStatus: 'pending',
      input: { requestId: 'ask-runtime-1' },
    });
    expect(assistant.processingList).toBeUndefined();
    expect(assistant.text).toBe('');
    expect(session.getState().currentRequestId).toBe('req-ask');
  });

  it('REQUEST_PERMISSION 优先投影为 ACP 干预交互，不落入普通 PROCESSING', () => {
    const { session } = createSession({
      interventionAdapter: {
        patchEvent: processInterventionSsePatch,
        reconcileMessages: reconcileAcpPermissionStatusesInMessageList,
      },
    });
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '演示权限审批' });
    const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;

    callbacks.onMessage({
      eventType: ConversationEventTypeEnum.PROCESSING,
      requestId: 'req-perm',
      data: {
        targetId: -1,
        name: 'Backend.Sandbox.Event.RequestPermission',
        type: 'Event',
        status: 'FINISHED',
        executeId: 'perm-runtime-1',
        subEventType: 'REQUEST_PERMISSION',
        result: {
          id: -1,
          name: 'Backend.Sandbox.Event.RequestPermission',
          type: 'Event',
          startTime: Date.now(),
          endTime: Date.now(),
          input: {
            request_permission_request: {
              sessionId: 'sess-runtime-1',
              toolCall: {
                toolCallId: 'perm-runtime-1',
                kind: 'other',
                status: 'pending',
                title: '执行 bash 命令',
                rawInput: { command: 'ls -la' },
              },
              options: [
                {
                  optionId: 'allow_once',
                  name: '允许一次',
                  kind: 'allow_once',
                },
                { optionId: 'reject', name: '拒绝', kind: 'reject_once' },
              ],
            },
            toolCallId: 'perm-runtime-1',
          },
          executeId: 'perm-runtime-1',
        },
        _meta: {
          nuwaclaw_intervention_id: 'itv-perm-runtime-1',
          nuwaclaw_revision: 1,
        },
      },
    } as ConversationChatResponse);

    const assistant = session.store.getSnapshot()[1];
    expect(assistant.acpPermissionInteractions).toHaveLength(1);
    expect(assistant.acpPermissionInteractions?.[0]).toMatchObject({
      executeId: 'perm-runtime-1',
      responseStatus: 'pending',
    });
    expect(assistant.acpPermissionInteractions?.[0]?.intervention).toBeTruthy();
    // 干预事件不进通用 PROCESSING 投影（不产工具块、不污染正文）
    expect(assistant.processingList).toBeUndefined();
    expect(assistant.text).toBe('');
    expect(session.getState().currentRequestId).toBe('req-perm');
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
    expect(mockSyncTerminal).toHaveBeenCalledWith(1001);
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
    const stopRequest = vi.fn().mockResolvedValue(undefined);
    const { session } = createSession({ stopRequest });
    const abort = vi.fn();
    mockOpenLive.mockReturnValue(abort);
    session.send({ conversationId: 1001, message: '你好' });

    session.stop(1001);

    expect(abort).toHaveBeenCalledTimes(1);
    expect(session.store.getSnapshot()[1].status).toBe(
      MessageStatusEnum.Stopped,
    );
    expect(stopRequest).toHaveBeenCalledWith('1001');
  });

  it('stop：发送后立即停止（无时间间隔）活跃态必须强制复位（禅道bug2528）', () => {
    // 复现路径：发送后 3s 保活窗口内用户点停止——修复前 stop 走受窗口
    // 约束的复位被拒绝，isConversationActive 永久卡 true，叠加输入框
    // isStoppingConversation 只在会话不活跃时复位 → 停止/发送双双卡死
    const stopRequest = vi.fn().mockResolvedValue(undefined);
    const { session } = createSession({ stopRequest });
    mockOpenLive.mockReturnValue(vi.fn());

    session.send({ conversationId: 1001, message: '你好' });
    expect(session.getState().isConversationActive).toBe(true);

    // 同步立即停止（Date.now 与 send 同毫秒，保活窗口内）
    session.stop(1001);

    expect(session.getState().isConversationActive).toBe(false);
    // 活跃态复位后可立即发起新一轮发送（不被残留活跃态拦截）
    session.send({ conversationId: 1001, message: '再次提问' });
    expect(session.getState().isConversationActive).toBe(true);
    const secondRoundUser = session.store
      .getSnapshot()
      .find((message) => message.text === '再次提问');
    expect(secondRoundUser).toBeTruthy();
  });

  it('stop：sub 恢复中也要断开连接，成功后写 CANCEL 释放合成活跃态', async () => {
    const abortSub = vi.fn();
    mockCreateSSE.mockReturnValue(abortSub);
    const applyTaskStatus = vi.fn();
    const { session } = createSession({
      stopRequest: vi.fn().mockResolvedValue(undefined),
      applyTaskStatus,
    });
    session.resumeConversationStream(1001, []);

    session.stop(1001);
    await Promise.resolve();

    expect(abortSub).toHaveBeenCalledOnce();
    expect(applyTaskStatus).toHaveBeenCalledWith(1001, TaskStatus.CANCEL);
    expect(session.getState().isAwaitingChatTerminal).toBe(false);
    expect(session.getState().isConversationActive).toBe(false);
  });

  it('stop：旧停止请求成功迟到不能取消同会话新一轮', async () => {
    let resolveStop!: () => void;
    const applyTaskStatus = vi.fn();
    const { session } = createSession({
      stopRequest: () =>
        new Promise<void>((resolve) => (resolveStop = resolve)),
      applyTaskStatus,
    });
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '旧轮' });
    session.stop(1001);
    session.send({ conversationId: 1001, message: '新轮' });
    resolveStop();
    await Promise.resolve();

    expect(applyTaskStatus).not.toHaveBeenCalled();
    expect(session.getState().isConversationActive).toBe(true);
    expect(session.getState().isAwaitingChatTerminal).toBe(true);
  });

  it('stop：任务终态后 setConversationActive 保活窗口机制随窗口一并移除——onClose 复位不再受 3s 约束', () => {
    const { session } = createSession();
    let liveOnClose: () => void = () => {};
    mockOpenLive.mockImplementation(
      (_params: unknown, callbacks: LiveCallbacks) => {
        liveOnClose = callbacks.onClose;
        return vi.fn();
      },
    );

    session.send({ conversationId: 1001, message: '你好' });
    // 发送同毫秒连接即被服务端关闭（异常结束最快路径）
    liveOnClose();

    expect(session.getState().isConversationActive).toBe(false);
  });

  it('disableConversationActive：仅清前端活跃态，不发送空 ID stop 请求', () => {
    const stopRequest = vi.fn().mockResolvedValue(undefined);
    const { session } = createSession({ stopRequest });
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '你好' });

    session.disableConversationActive();

    expect(session.getState().isConversationActive).toBe(false);
    expect(stopRequest).not.toHaveBeenCalled();
  });

  it('轮询/sub 确认终态：完整收敛 Loading 占位、执行中工具与会话活跃态', () => {
    const applyTaskStatus = vi.fn();
    const { session } = createSession({ applyTaskStatus });
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '继续执行' });
    const assistant = session.store.getSnapshot()[1];
    session.store.patchMessage(assistant.id, {
      processingList: [
        {
          executeId: 'tool-running',
          status: 'EXECUTING',
        } as never,
      ],
    });

    session.finalizeConversationTerminal(1001, TaskStatus.COMPLETE);

    const finalized = session.store.getSnapshot()[1];
    expect(finalized.status).toBe(MessageStatusEnum.Complete);
    expect(finalized.thinkingFinished).toBe(true);
    expect(finalized.processingList?.[0].status).toBe('FINISHED');
    expect(session.getState()).toMatchObject({
      isConversationActive: false,
      isAwaitingChatTerminal: false,
    });
    expect(applyTaskStatus).toHaveBeenCalledWith(1001, TaskStatus.COMPLETE);
  });

  it('切换会话：中断 live/sub 并清空上一会话状态，避免空 Loading 跨会话残留', () => {
    const { session } = createSession();
    const abortLive = vi.fn();
    mockOpenLive.mockReturnValue(abortLive);
    session.send({ conversationId: 1001, message: '上一会话' });

    session.resetForConversationSwitch();

    expect(abortLive).toHaveBeenCalledTimes(1);
    expect(session.store.getSnapshot()).toEqual([]);
    expect(session.getState()).toEqual({
      isConversationActive: false,
      isAwaitingChatTerminal: false,
      currentRequestId: '',
      currentConversationId: null,
    });
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

  it('历史详情与轮询快照统一经过 hydrate 后再写入 store', async () => {
    const hydrateHistoryMessages = vi.fn((messages: any[]) =>
      messages.map((message) => ({ ...message, hydrated: true })),
    );
    const loadRequest = vi
      .fn()
      .mockResolvedValue({ data: { id: 1001, messageList: [persisted] } });
    const { session } = createSession({
      loadRequest,
      hydrateHistoryMessages,
    });

    const loaded = await session.load(1001);
    expect((loaded?.messageList?.[0] as any).hydrated).toBe(true);
    expect((session.store.getSnapshot()[0] as any).hydrated).toBe(true);

    session.applySnapshot(1001, [{ ...persisted, id: 'persisted-2' } as never]);
    expect(hydrateHistoryMessages).toHaveBeenCalledTimes(2);
    expect(
      (
        session.store
          .getSnapshot()
          .find((item) => item.id === 'persisted-2') as any
      ).hydrated,
    ).toBe(true);
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

  it('R3 resume：sub FINAL_RESULT 统一清算占位与执行中工具', () => {
    const applyTaskStatus = vi.fn();
    const { session } = createSession({ applyTaskStatus });
    mockCreateSSE.mockReturnValue(vi.fn());

    session.resumeConversationStream(1001, [], undefined, 'test-terminal');
    const resumeCallbacks = mockCreateSSE.mock.calls[0][0];
    const assistant = session.store.getSnapshot()[0];
    session.store.patchMessage(assistant.id, {
      processingList: [
        { executeId: 'resume-tool', status: 'EXECUTING' } as never,
      ],
    });

    resumeCallbacks.onMessage({
      eventType: ConversationEventTypeEnum.FINAL_RESULT,
      data: {
        success: true,
        outputText: '恢复完成',
        componentExecuteResults: [],
      },
    } as ConversationChatResponse);

    const finalized = session.store.getSnapshot()[0];
    expect(finalized.status).toBe(MessageStatusEnum.Complete);
    expect(finalized.processingList?.[0].status).toBe('FINISHED');
    expect(applyTaskStatus).toHaveBeenCalledWith(1001, TaskStatus.COMPLETE);
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

  it.each(['', '此前已输出的回答'])(
    'Java ERROR completed/data:null 合同：保留正文 %s，close 不覆盖 FAILED',
    async (body) => {
      const { session, appliedStatuses } = createSessionWith();
      mockOpenLive.mockReturnValue(vi.fn());
      mockSyncTerminal.mockResolvedValue(TaskStatus.COMPLETE);
      session.send({ conversationId: 1001, message: '错误合同验收' });
      const callbacks = mockOpenLive.mock.calls[0][1] as LiveCallbacks;
      if (body) callbacks.onMessage(messageEvent(body));
      const error =
        'Agent execution failed. Please retry or contact the administrator.';
      callbacks.onMessage({
        requestId: 'req-failed',
        eventType: 'ERROR',
        completed: true,
        error,
        data: null,
      } as never);
      callbacks.onClose();
      await Promise.resolve();
      expect(appliedStatuses).toEqual([[1001, TaskStatus.FAILED]]);
      expect(mockSyncTerminal).not.toHaveBeenCalled();
      expect(session.getState()).toMatchObject({
        isConversationActive: false,
        isAwaitingChatTerminal: false,
      });
      const message = session.store.getSnapshot().at(-1);
      expect(message?.status).toBe(MessageStatusEnum.Error);
      expect(message?.text).toBe(body ? `${body}\n\n${error}` : error);
      expect(message?.requestId).toBe('req-failed');
    },
  );

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

  // ── topic.update（bug2382：会话名自动更新）──
  // 旧实现挂在 FINAL 分支且要求 FINAL 为首事件，正常流式必为 false，
  // /api/agent/conversation/update 永不触发；现为对齐旧线的「首事件即更名」。
  const topicUpdateDispatches = (dispatched: unknown[]) =>
    dispatched.filter((e) => (e as { type: string }).type === 'topic.update');
  const currentInfo = { id: 1001, topicUpdated: 0 } as never;

  it('topic.update：连接首个事件即分发（MESSAGE 打头，非 FINAL）', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: '帮我起个名字',
      currentInfo,
    });
    const callbacks = mockOpenLive.mock.calls[0][1];

    callbacks.onMessage(messageEvent('正在思考'));
    callbacks.onMessage(messageEvent(' 答案'));
    callbacks.onClose();

    expect(topicUpdateDispatches(dispatched)).toEqual([
      {
        type: 'topic.update',
        conversationId: 1001,
        firstMessage: '帮我起个名字',
        currentInfo,
      },
    ]);
  });

  it('topic.update：单连接只分发一次（多事件不重复）', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: 'x',
      currentInfo,
    });
    const callbacks = mockOpenLive.mock.calls[0][1];

    callbacks.onMessage(messageEvent('a'));
    callbacks.onMessage(messageEvent('b'));
    callbacks.onMessage(messageEvent('c'));

    expect(topicUpdateDispatches(dispatched)).toHaveLength(1);
  });

  it('topic.update：已命名会话（topicUpdated===1 且有名字）不分发', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: 'x',
      currentInfo: { id: 1001, topicUpdated: 1, topic: '已有名字' } as never,
    });
    const callbacks = mockOpenLive.mock.calls[0][1];
    callbacks.onMessage(messageEvent('a'));
    expect(topicUpdateDispatches(dispatched)).toEqual([]);
  });

  it('topic.update：预置无名会话（topicUpdated===1 且空 topic）仍分发（bug2382 回归：/api/project/create 预建会话形态）', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: '第一句话',
      currentInfo: { id: 1001, topicUpdated: 1, topic: '' } as never,
    });
    const callbacks = mockOpenLive.mock.calls[0][1];
    callbacks.onMessage(messageEvent('a'));
    expect(topicUpdateDispatches(dispatched)).toHaveLength(1);
    expect(topicUpdateDispatches(dispatched)[0]).toMatchObject({
      type: 'topic.update',
      firstMessage: '第一句话',
    });
  });

  it('topic.update：隔离入口（isSync=false）不分发', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: 'x',
      currentInfo,
      topicGate: { isSync: false },
    });
    const callbacks = mockOpenLive.mock.calls[0][1];
    callbacks.onMessage(messageEvent('a'));
    expect(topicUpdateDispatches(dispatched)).toEqual([]);
  });

  it('topic.update：无快照（currentInfo 缺失）不分发，且不阻断后续事件投影', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: 'x' });
    const callbacks = mockOpenLive.mock.calls[0][1];
    callbacks.onMessage(messageEvent('a'));
    expect(topicUpdateDispatches(dispatched)).toEqual([]);
    // 事件投影不受影响（占位消息收到文本）
    expect(session.store.getSnapshot()[1].text).toBe('a');
  });
});

describe('conversationRuntimeSession 关键业务场景（T03/T04/T06）', () => {
  const createSessionWith = () => {
    const dispatched: unknown[] = [];
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
    });
    return { session, dispatched };
  };
  const getCallbacks = (n = -1) =>
    mockOpenLive.mock.calls.at(n)![1] as {
      onMessage: (res: ConversationChatResponse) => void;
      onClose: () => void;
      onError: () => void;
    };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncTerminal.mockResolvedValue(undefined);
  });

  it('T03 多 assistant 输出（真实形态：首段 unfinished，后续新 id + finished 插行）', () => {
    const { session } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '多段' });
    const placeholderId = session.store.getSnapshot()[1].id;

    // 首段：未结束，累积进占位（对齐旧线「工作流多段」输入形态）
    getCallbacks().onMessage(messageEvent('第一段', false, 'out-1'));
    // 第二段：新 id + finished → 插入新行（replaceCount=0，占位保留）
    getCallbacks().onMessage(messageEvent(' 第二段', true, 'out-2'));

    const messages = session.store.getSnapshot();
    // user + 占位 + 新插入行
    expect(messages).toHaveLength(3);
    // 占位仍在且持有首段文本
    expect(messages.some((m) => m.id === placeholderId)).toBe(true);
    // 新行使用后端 id
    expect(messages.some((m) => m.id === 'out-2')).toBe(true);
    const inserted = messages.find((m) => m.id === 'out-2');
    expect(inserted?.text).toBe('第一段 第二段');
  });

  it('T04 工具调用：PROCESSING 写入 processingList，同 executeId 更新不重复', () => {
    const { session } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '调工具' });

    const toolEvent = (status: string) =>
      ({
        requestId: 'req-t04',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          name: 'search',
          executeId: 'exec-t04',
          status,
          result: { executeId: 'exec-t04' },
        },
      } as ConversationChatResponse);

    getCallbacks().onMessage(toolEvent('EXECUTING'));
    getCallbacks().onMessage(toolEvent('FINISHED'));

    const assistant = session.store.getSnapshot()[1];
    expect(assistant.processingList).toHaveLength(1); // 同 id 更新非追加
    expect(assistant.processingList?.[0].status).toBe('FINISHED');
  });

  it('T06 网络 reject：onError 后迟到的 onClose 不重复收尾（exactly-once）', async () => {
    const { session } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: 'x' });
    const callbacks = getCallbacks();

    callbacks.onError();
    const statusAfterError = session.store.getSnapshot()[1].status;
    // 迟到的 close：不应把已 Error 的消息再改 Stopped
    callbacks.onClose();

    expect(session.store.getSnapshot()[1].status).toBe(statusAfterError);
    expect(session.getState().isAwaitingChatTerminal).toBe(false);
  });

  it('T04 页面组件：PROCESSING Page dispatch preview.page.open（资源路由）', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '页面' });

    getCallbacks().onMessage({
      requestId: 'req-page',
      eventType: ConversationEventTypeEnum.PROCESSING,
      data: {
        type: 'Page',
        status: 'EXECUTING',
        executeId: 'exec-page',
        result: {
          executeId: 'exec-page',
          input: { uri: '/chart', method: 'get', arguments: { a: 1 } },
        },
      },
    } as ConversationChatResponse);

    expect(dispatched).toContainEqual({
      type: 'preview.page.open',
      preview: expect.objectContaining({
        executeId: 'exec-page',
        uri: '/chart',
      }),
    });
  });
});

describe('conversationRuntimeSession 文件树刷新信号生产者（V2 目录不刷新回归）', () => {
  const createSessionWith = () => {
    const dispatched: unknown[] = [];
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
    });
    return { session, dispatched };
  };
  const getCallbacks = (n = -1) =>
    mockOpenLive.mock.calls.at(n)![1] as {
      onMessage: (res: ConversationChatResponse) => void;
      onClose: () => void;
      onError: () => void;
    };
  const fileRefreshDispatches = (dispatched: unknown[]) =>
    dispatched.filter(
      (e) => (e as { type: string }).type === 'preview.file.refresh',
    );
  const settleDispatches = (dispatched: unknown[]) =>
    dispatched.filter(
      (e) => (e as { type: string }).type === 'taskResult.settle',
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncTerminal.mockResolvedValue(undefined);
  });

  it.each([
    { name: 'search', status: 'EXECUTING', result: {}, refresh: false },
    { name: 'search', status: 'FINISHED', result: {}, refresh: false },
    {
      name: '读取文件',
      status: 'FINISHED',
      result: { kind: 'read' },
      refresh: false,
    },
    {
      name: '写入文件',
      status: 'EXECUTING',
      result: { kind: 'write' },
      refresh: false,
    },
    {
      name: '写入文件',
      status: 'FINISHED',
      result: { kind: 'write' },
      refresh: true,
    },
    {
      name: '编辑文件',
      status: 'FINISHED',
      result: { kind: 'edit' },
      refresh: true,
    },
    {
      name: '终端',
      status: 'FINISHED',
      result: { kind: 'execute', input: { command: 'echo done > output.txt' } },
      refresh: true,
    },
    {
      name: '终端',
      status: 'FINISHED',
      result: { kind: 'execute', input: { command: 'pwd' } },
      refresh: false,
    },
    { name: 'apply_patch', status: 'FINISHED', result: {}, refresh: true },
    {
      name: '删除文件',
      status: 'FINISHED',
      result: { kind: 'delete' },
      refresh: true,
    },
  ])(
    'PROCESSING ToolCall 按完成后的文件变更刷新：$name/$status/$refresh',
    ({ name, status, result, refresh }) => {
      const { session, dispatched } = createSessionWith();
      mockOpenLive.mockReturnValue(vi.fn());
      session.send({ conversationId: 1001, message: '调工具' });

      getCallbacks().onMessage({
        requestId: 'req-tool',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          name,
          executeId: 'exec-1',
          status,
          result,
        },
      } as ConversationChatResponse);

      expect(fileRefreshDispatches(dispatched)).toEqual(
        refresh
          ? [
              {
                type: 'preview.file.refresh',
                conversationId: 1001,
                mode: 'throttled',
              },
            ]
          : [],
      );
    },
  );

  it('PROCESSING 非改文件的 ToolCall 不发文件树刷新', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '搜索' });

    getCallbacks().onMessage({
      requestId: 'req-search',
      eventType: ConversationEventTypeEnum.PROCESSING,
      data: {
        type: 'ToolCall',
        name: 'search',
        executeId: 'exec-search',
        status: 'EXECUTING',
        result: {},
      },
    } as ConversationChatResponse);

    expect(fileRefreshDispatches(dispatched)).toEqual([]);
  });

  it('PROCESSING 非 ToolCall（Page）不发文件树刷新', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({ conversationId: 1001, message: '页面' });

    getCallbacks().onMessage({
      requestId: 'req-page',
      eventType: ConversationEventTypeEnum.PROCESSING,
      data: {
        type: 'Page',
        status: 'EXECUTING',
        executeId: 'exec-page',
        result: { executeId: 'exec-page', input: { uri: '/chart' } },
      },
    } as ConversationChatResponse);

    expect(fileRefreshDispatches(dispatched)).toEqual([]);
  });

  it('FINAL_RESULT + TaskAgent：dispatch taskResult.settle（task-result 文件原始终路径）', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: '生成文件',
      currentInfo: {
        id: 1001,
        agent: { type: 'TaskAgent', enableVersionControl: 1 },
      } as never,
    });

    getCallbacks().onMessage({
      requestId: 'req-final',
      eventType: ConversationEventTypeEnum.FINAL_RESULT,
      data: {
        success: true,
        outputText:
          '<task-result><description>报告</description><file>/home/user/1001/docs/report.md</file></task-result>',
        error: '',
        componentExecuteResults: [],
      },
    } as ConversationChatResponse);

    expect(settleDispatches(dispatched)).toEqual([
      {
        type: 'taskResult.settle',
        conversationId: 1001,
        taskResult: {
          hasTaskResult: true,
          file: '/home/user/1001/docs/report.md',
        },
        enableVersionControl: true,
      },
    ]);
  });

  it('FINAL_RESULT + 非 TaskAgent：不发 taskResult.settle（对齐旧线门控）', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: '普通对话',
      currentInfo: { id: 1001, agent: { type: 'Chat' } } as never,
    });

    getCallbacks().onMessage({
      requestId: 'req-final',
      eventType: ConversationEventTypeEnum.FINAL_RESULT,
      data: {
        success: true,
        outputText: '答',
        error: '',
        componentExecuteResults: [],
      },
    } as ConversationChatResponse);

    expect(settleDispatches(dispatched)).toEqual([]);
  });

  it('FINAL_RESULT 无 task-result：settle 携带 hasTaskResult=false（消费端走兜底 trigger）', () => {
    const { session, dispatched } = createSessionWith();
    mockOpenLive.mockReturnValue(vi.fn());
    session.send({
      conversationId: 1001,
      message: '无产物任务',
      currentInfo: {
        id: 1001,
        agent: { type: 'TaskAgent' },
      } as never,
    });

    getCallbacks().onMessage({
      requestId: 'req-final',
      eventType: ConversationEventTypeEnum.FINAL_RESULT,
      data: {
        success: true,
        outputText: '完成',
        error: '',
        componentExecuteResults: [],
      },
    } as ConversationChatResponse);

    expect(settleDispatches(dispatched)).toEqual([
      {
        type: 'taskResult.settle',
        conversationId: 1001,
        taskResult: { hasTaskResult: false },
        enableVersionControl: false,
      },
    ]);
  });
});
