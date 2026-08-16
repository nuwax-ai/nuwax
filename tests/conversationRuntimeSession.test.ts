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

const { mockOpenLive, mockSyncTerminal } = vi.hoisted(() => ({
  mockOpenLive: vi.fn(),
  mockSyncTerminal: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/features/conversation/runtime/conversationTransport', () => ({
  openLiveConversationStream: (...args: unknown[]) => mockOpenLive(...args),
}));

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  // 全量 stub：真实模块经 services 引入 umi 传递依赖，会破坏非 umi 测试环境
  syncTerminalConversationTaskStatus: (...args: unknown[]) =>
    mockSyncTerminal(...args),
}));

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: vi.fn(),
}));

type LiveCallbacks = {
  onMessage: (res: ConversationChatResponse) => void;
  onClose: () => void;
  onError: () => void;
};

const createSession = () => {
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
  });
  return { session, dispatched };
};

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
});
