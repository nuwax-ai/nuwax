/**
 * 双轨对照（docs/conversation-dual-track-plan.md §4）：同一 Trace 驱动新线 session，
 * 断言消息 digest 与旧线合同一致。旧线基准断言见 tests/conversationInfoModel.test.ts
 * 的「T01/T02：成功轮次 Trace」「SSE MESSAGE 普通文本」「SSE onClose 收尾」用例——
 * 两轨断言值同源（本文件的期望即旧线期望），任何一轨变更须同步本文件。
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
  MessageInfo,
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
  syncTerminalConversationTaskStatus: (...args: unknown[]) =>
    mockSyncTerminal(...args),
}));

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: vi.fn(),
}));

vi.mock('@/constants/common.constants', () => ({
  CONVERSATION_CONNECTION_URL: '/api/agent/conversation/chat',
  CONVERSATION_CHAT_SUB_URL: '/api/agent/conversation/chat/sub',
  MESSAGE_PAGE_SIZE: 20,
}));
vi.mock('@/constants/home.constants', () => ({
  ACCESS_TOKEN: 'ACCESS_TOKEN',
}));

/** 与旧线 T01 同形状的核心成功 Trace */
const T01_TRACE: ConversationChatResponse[] = [
  {
    requestId: 'req-t01',
    eventType: ConversationEventTypeEnum.MESSAGE,
    data: {
      id: 'output-t01',
      type: MessageModeEnum.CHAT,
      text: '你好',
      finished: false,
    },
  } as ConversationChatResponse,
  {
    requestId: 'req-t01',
    eventType: ConversationEventTypeEnum.MESSAGE,
    data: {
      id: 'output-t01',
      type: MessageModeEnum.CHAT,
      text: '！',
      finished: true,
    },
  } as ConversationChatResponse,
  {
    requestId: 'req-t01',
    eventType: ConversationEventTypeEnum.FINAL_RESULT,
    data: {
      success: true,
      outputText: '你好！',
      error: '',
      componentExecuteResults: [],
    },
  } as ConversationChatResponse,
];

/** 消息 digest（与旧线 T18 parity 测试同形状） */
const digest = (messages: MessageInfo[]) =>
  messages.map((item) => ({
    role: item.role,
    text: item.text,
    status: item.status,
    finalSuccess: item.finalResult?.success,
  }));

describe('conversation dual track parity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('T01：新线 session 对核心成功 Trace 的 digest 与旧线合同一致', async () => {
    const session = createConversationRuntimeSession({
      adapters: {
        renderProcessingBlock: vi.fn(() => 'block'),
        reconcileFinalMessage: vi.fn((message) => message),
      },
      effectsAdapter: { dispatch: () => {} } as ConversationEffectsAdapter,
    });

    session.send({ conversationId: 1001, message: '你好' });
    const callbacks = mockOpenLive.mock.calls[0][1] as {
      onMessage: (res: ConversationChatResponse) => void;
      onClose: () => void;
      onError: () => void;
    };

    for (const event of T01_TRACE) {
      callbacks.onMessage(event);
    }
    callbacks.onClose();
    await vi.waitFor(() => {
      expect(session.getState().isAwaitingChatTerminal).toBe(false);
    });

    // 期望值与旧线合同（conversationInfoModel.test T01/T02）一致：
    // user 乐观 → assistant 投影 Complete → FINAL 写入 finalResult.success=true；
    // onClose 的 finalize 只作用于 Loading/Incomplete，Complete 保持不变
    expect(digest(session.store.getSnapshot())).toEqual([
      {
        role: 'USER',
        text: '你好',
        status: undefined,
        finalSuccess: undefined,
      },
      {
        role: 'ASSISTANT',
        text: '你好！',
        status: MessageStatusEnum.Complete,
        finalSuccess: true,
      },
    ]);
    // FINAL 已带明确终态 → 不做兜底查询（旧线同合同）
    expect(mockSyncTerminal).not.toHaveBeenCalled();
  });

  it('发送体：conversationId/message 携带（与旧线 chat 参数面一致）', () => {
    const session = createConversationRuntimeSession({
      adapters: {
        renderProcessingBlock: vi.fn(),
        reconcileFinalMessage: vi.fn((message) => message),
      },
      effectsAdapter: { dispatch: () => {} } as ConversationEffectsAdapter,
    });
    session.send({ conversationId: 2002, message: '参数面' });
    const params = mockOpenLive.mock.calls.at(-1)![0] as ConversationChatParams;
    expect(params.conversationId).toBe(2002);
    expect(params.message).toBe('参数面');
  });
});
