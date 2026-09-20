/**
 * runtime session 终态快照守卫（SESSION_RESUME 断言 4 回归锚）：
 * 终态后到达的轮询快照可能仍带滞后的 EXECUTING 消息（服务端 messageList
 * 落库晚于 taskStatus），reconcile 稳定 ID 覆盖语义不得把已收敛的 processing
 * 盖回执行中——归并后按已确认终态重新收敛；新一轮 send 后恢复常规归并。
 */
import { createConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import type { ConversationEffectsAdapter } from '@/features/conversation/runtime/effectDispatcher';
import { ConversationEventTypeEnum, TaskStatus } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateSSE, mockOpenLive } = vi.hoisted(() => ({
  mockCreateSSE: vi.fn(),
  mockOpenLive: vi.fn(),
}));

vi.mock('@/features/conversation/runtime/conversationTransport', () => ({
  openLiveConversationStream: (...args: unknown[]) => mockOpenLive(...args),
  openResumeConversationStream: vi.fn(),
}));

vi.mock('@/utils/conversationTaskStatusSync', () => ({
  syncTerminalConversationTaskStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: (...args: unknown[]) => mockCreateSSE(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/constants/common.constants', () => ({
  CONVERSATION_CONNECTION_URL: '/api/agent/conversation/chat',
  CONVERSATION_CHAT_SUB_URL: '/api/agent/conversation/chat/sub',
  MESSAGE_PAGE_SIZE: 20,
}));
vi.mock('@/constants/home.constants', () => ({
  ACCESS_TOKEN: 'ACCESS_TOKEN',
}));

const CONV_ID = 7001;

/** 服务端静态快照：user + 执行中 assistant（processingList 恒 EXECUTING） */
const executingSnapshot = (): MessageInfo[] => [
  {
    id: 'resume-user-1',
    role: 'USER',
    messageType: 'USER',
    type: 'CHAT',
    status: 'complete',
    text: '帮我优化首页的加载速度',
  } as never,
  {
    id: 'resume-assistant-1',
    role: 'ASSISTANT',
    messageType: 'ASSISTANT',
    type: 'CHAT',
    status: 'loading',
    text: '我先对首页做一次性能审计',
    processingList: [
      {
        executeId: 'resume-tool-1',
        toolCallId: 'resume-tool-1',
        name: '终端执行 lighthouse 审计',
        type: 'ToolCall',
        status: ProcessingEnum.EXECUTING,
        targetId: -1,
        result: { executeId: 'resume-tool-1' },
      },
    ],
  } as never,
];

const processingFinished = (): ConversationChatResponse =>
  ({
    requestId: 'req-1',
    eventType: ConversationEventTypeEnum.PROCESSING,
    data: {
      targetId: -1,
      name: '终端执行 lighthouse 审计',
      status: 'FINISHED',
      toolCallId: 'resume-tool-1',
      type: 'ToolCall',
      executeId: 'resume-tool-1',
    },
  } as ConversationChatResponse);

const chatChunk = (finished: boolean): ConversationChatResponse =>
  ({
    requestId: 'req-1',
    eventType: ConversationEventTypeEnum.MESSAGE,
    data: {
      id: 'server-output',
      type: 'CHAT',
      text: finished ? '审计完成。' : '审计完成',
      finished,
    },
  } as ConversationChatResponse);

const finalResultOk = (): ConversationChatResponse =>
  ({
    requestId: 'req-1',
    eventType: ConversationEventTypeEnum.FINAL_RESULT,
    data: { success: true, outputText: '审计完成。' },
  } as ConversationChatResponse);

const countExecuting = (list: MessageInfo[]): number =>
  list.reduce(
    (count, message) =>
      count +
      (message.processingList || []).filter(
        (item) => item.status === ProcessingEnum.EXECUTING,
      ).length,
    0,
  );

describe('runtime session 终态快照守卫', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sub 续接终态后，滞后的 EXECUTING 轮询快照不复活执行中工具（SESSION_RESUME 断言 4）', async () => {
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
      loadRequest: async () =>
        ({
          data: {
            agent: { type: 'TaskAgent' },
            taskStatus: TaskStatus.EXECUTING,
            messageList: executingSnapshot(),
          },
        } as never),
    });

    // 详情装载半途快照 → sub 续接（FINISHED → 分片 → FINAL_RESULT）→ close
    await session.load(CONV_ID);
    expect(countExecuting(session.store.getSnapshot())).toBe(1);

    let subCallbacks: {
      onMessage: (res: ConversationChatResponse) => void;
      onClose: () => void;
    };
    mockCreateSSE.mockImplementation((options) => {
      subCallbacks = options;
      return () => {};
    });
    session.resumeConversationStream(
      CONV_ID,
      session.store.getSnapshot(),
      undefined,
      'test',
    );
    subCallbacks!.onMessage(processingFinished());
    subCallbacks!.onMessage(chatChunk(false));
    subCallbacks!.onMessage(chatChunk(true));
    subCallbacks!.onMessage(finalResultOk());
    subCallbacks!.onClose();

    // 重放终态后：快照消息上的 EXECUTING 已被统一清算
    expect(countExecuting(session.store.getSnapshot())).toBe(0);

    // 终态后轮询快照（服务端 messageList 滞后仍带 EXECUTING）：归并后按终态重收敛
    session.applySnapshot(CONV_ID, executingSnapshot());
    expect(countExecuting(session.store.getSnapshot())).toBe(0);
  });

  it('新一轮 send 后终态记忆清空：EXECUTING 快照归并不被上一轮终态误收敛', async () => {
    const dispatched: unknown[] = [];
    const effectsAdapter: ConversationEffectsAdapter = {
      dispatch: (effect) => {
        dispatched.push(effect);
      },
    };
    let liveCallbacks: {
      onMessage: (res: ConversationChatResponse) => void;
      onClose: () => void;
    };
    mockOpenLive.mockImplementation((_params, callbacks) => {
      liveCallbacks = callbacks;
      return () => {};
    });
    const session = createConversationRuntimeSession({
      adapters: {
        renderProcessingBlock: vi.fn(() => 'block'),
        reconcileFinalMessage: vi.fn((message) => message),
      },
      effectsAdapter,
    });

    // 第一轮：发送 → 终态（记录终态记忆）
    session.send({ conversationId: CONV_ID, message: '第一轮' });
    liveCallbacks!.onMessage(finalResultOk());
    liveCallbacks!.onClose();
    expect(countExecuting(session.store.getSnapshot())).toBe(0);

    // 第二轮：send 清终态记忆 → 执行中快照归并保持 EXECUTING（新任务真实在跑）
    session.send({ conversationId: CONV_ID, message: '第二轮' });
    session.applySnapshot(CONV_ID, executingSnapshot());
    expect(countExecuting(session.store.getSnapshot())).toBe(1);
  });
});
