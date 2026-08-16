/**
 * conversationInfo model 单元测试（不改业务代码）
 *
 * 覆盖已有逻辑：
 * - checkConversationActive / disabledConversationActive
 * - resetInit / handleClearSideEffect
 * - onMessageSend 乐观追加消息并建立 SSE
 * - handleChangeMessageList：PROCESSING / MESSAGE / FINAL_RESULT / ERROR
 * - SSE onError / onClose 收尾状态
 */
import {
  ConversationEventTypeEnum,
  MessageModeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConversationTraceRecorder } from './helpers/conversationTraceHarness';

const {
  mockUseModel,
  mockCreateSSEConnection,
  mockUseRequest,
  mockMessageError,
  mockUuidV4,
  mockProcessInterventionSsePatch,
  mockRespondAcpPermission,
  mockRespondMcpAsk,
  mockResumeConversationStream,
  mockAbortResumeStream,
  mockHandleChatProcessingList,
  mockShowPagePreview,
  mockEventBusEmit,
  mockSyncTerminalConversationTaskStatus,
} = vi.hoisted(() => ({
  mockUseModel: vi.fn(),
  mockCreateSSEConnection: vi.fn(),
  mockUseRequest: vi.fn(),
  mockMessageError: vi.fn(),
  mockUuidV4: vi.fn(),
  mockProcessInterventionSsePatch: vi.fn(() => null),
  mockRespondAcpPermission: vi.fn(),
  mockRespondMcpAsk: vi.fn(),
  mockResumeConversationStream: vi.fn(),
  mockAbortResumeStream: vi.fn(),
  mockHandleChatProcessingList: vi.fn(),
  mockShowPagePreview: vi.fn(),
  mockEventBusEmit: vi.fn(),
  mockSyncTerminalConversationTaskStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => mockUseModel(...args),
}));

vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

vi.mock('uuid', () => ({
  v4: (...args: unknown[]) => mockUuidV4(...args),
}));

vi.mock('antd', () => ({
  message: {
    error: (...args: unknown[]) => mockMessageError(...args),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: (...args: unknown[]) => mockCreateSSEConnection(...args),
}));

vi.mock('@/utils/eventBus', () => ({
  default: {
    on: vi.fn(),
    off: vi.fn(),
    emit: (...args: unknown[]) => mockEventBusEmit(...args),
  },
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: vi.fn(),
  apiAgentConversationChatStop: vi.fn(),
  apiAgentConversationChatSuggest: vi.fn(),
  apiAgentConversationMessageList: vi.fn(),
  apiAgentConversationUpdate: vi.fn(),
}));

vi.mock('@/services/vncDesktop', () => ({
  apiEnsurePod: vi.fn(),
  apiGetStaticFileList: vi.fn(),
  apiKeepalivePod: vi.fn(),
  apiRestartAgent: vi.fn(),
  apiRestartPod: vi.fn(),
  isEnsurePodThrottledError: vi.fn(() => false),
}));

vi.mock('@/hooks/useResumeStreamHandlers', () => ({
  useResumeStreamHandlers: () => ({
    resumeConversationStream: mockResumeConversationStream,
    abortResumeStream: mockAbortResumeStream,
  }),
}));

vi.mock('@/components/business-component/AgentIntervention', () => ({
  hydrateMcpAskInteractionsInMessageList: (list: MessageInfo[]) => list,
  prependAndHydrateMcpAskMessageList: (
    prepend: MessageInfo[],
    list: MessageInfo[],
  ) => [...prepend, ...list],
  processInterventionSsePatch: (...args: unknown[]) =>
    mockProcessInterventionSsePatch(...args),
  useAgentInterventionHandlers: () => ({
    respondAcpPermission: mockRespondAcpPermission,
    respondMcpAsk: mockRespondMcpAsk,
  }),
}));

vi.mock(
  '@/components/business-component/AgentIntervention/utils/reconcileAcpPermissionStatus',
  () => ({
    reconcileAcpPermissionStatusesInMessageList: (list: MessageInfo[]) => list,
  }),
);

vi.mock(
  '@/components/business-component/AgentIntervention/utils/reconcileFinalMessageState',
  () => ({
    reconcileFinalMessageState: (current: MessageInfo) => current,
  }),
);

vi.mock('@/utils/conversationTaskStatusSync', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/utils/conversationTaskStatusSync')
  >();
  return {
    ...actual,
    syncTerminalConversationTaskStatus: (...args: unknown[]) =>
      mockSyncTerminalConversationTaskStatus(...args),
  };
});

vi.mock('@/utils/ant-custom', () => ({
  modalConfirm: vi.fn(),
}));

vi.mock('@/utils/nuwaClawBridge/perfTracker', () => ({
  perfTracker: {
    createLifecycle: () => ({
      onSendClick: vi.fn(),
      onHttpStart: vi.fn(),
      onSseConnect: vi.fn(),
      onFirstChunk: vi.fn(),
      onStreamEnd: vi.fn(),
      onCloseRenderComplete: vi.fn(),
    }),
  },
}));

vi.mock('@/constants/agent.constants', () => ({
  isAgentVersionControlEnabled: () => false,
}));

import useConversationAgent from '@/models/conversationAgent';
import useConversationInfo from '@/models/conversationInfo';

/** 捕获最近一次 createSSEConnection 入参，便于喂 SSE 事件 */
type SseHandlers = {
  onMessage?: (res: ConversationChatResponse) => void;
  onError?: () => void;
  onClose?: () => void | Promise<void>;
  onOpen?: () => void;
};

describe('conversationInfo model', () => {
  let sseHandlers: SseHandlers;
  let abortFn: ReturnType<typeof vi.fn>;
  let uuidSeq: number;

  beforeEach(() => {
    vi.clearAllMocks();
    uuidSeq = 0;
    mockUuidV4.mockImplementation(() => {
      uuidSeq += 1;
      return `msg-uuid-${uuidSeq}`;
    });

    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationHistory') {
        return { runHistory: vi.fn(), runHistoryItem: vi.fn() };
      }
      if (name === 'chat') {
        return {
          showPagePreview: mockShowPagePreview,
          handleChatProcessingList: mockHandleChatProcessingList,
        };
      }
      if (name === 'useOpenApp') {
        return { isAppSidebarMode: false };
      }
      return {};
    });

    mockUseRequest.mockImplementation(() => ({
      run: vi.fn(),
      runAsync: vi.fn().mockResolvedValue({ code: '0000', data: [] }),
      loading: false,
      cancel: vi.fn(),
    }));

    abortFn = vi.fn();
    sseHandlers = {};
    mockCreateSSEConnection.mockImplementation((options: SseHandlers) => {
      sseHandlers = options;
      return abortFn;
    });

    // 让 requestAnimationFrame 同步执行，便于断言 syncMessageListRuntimeState
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /**
   * 发送一条消息并拿到助手占位 id（msg-uuid-2：user=1, assistant=2）
   */
  const sendAndGetAssistantId = async (
    result: ReturnType<typeof renderHook<typeof useConversationInfo>>['result'],
  ) => {
    await act(async () => {
      await result.current.onMessageSend({
        id: 1001,
        messageInfo: 'hello',
      });
    });
    return 'msg-uuid-2';
  };

  it('checkConversationActive：近几条含 Loading 时置为活跃', async () => {
    const { result } = renderHook(() => useConversationInfo());

    await act(async () => {
      result.current.checkConversationActive([
        {
          id: 'a1',
          status: MessageStatusEnum.Loading,
        } as MessageInfo,
      ]);
    });

    expect(result.current.isConversationActive).toBe(true);
  });

  it('T18：主会话与 ConversationAgent 对同一核心 SSE Trace 保持消息投影一致', async () => {
    const main = renderHook(() => useConversationInfo());
    await act(async () => {
      await main.result.current.onMessageSend({
        id: 1001,
        messageInfo: 'hello',
      });
    });
    const mainHandlers = mockCreateSSEConnection.mock.calls.at(-1)?.[0] as
      | SseHandlers
      | undefined;

    uuidSeq = 0;
    const isolated = renderHook(() => useConversationAgent());
    await act(async () => {
      await isolated.result.current.onMessageSend({
        id: 1001,
        messageInfo: 'hello',
      });
    });
    const isolatedHandlers = mockCreateSSEConnection.mock.calls.at(-1)?.[0] as
      | SseHandlers
      | undefined;

    const trace = [
      {
        requestId: 'request-parity',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          name: 'tool',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'execute-parity' },
        },
      },
      {
        requestId: 'request-parity',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          id: 'output-parity',
          type: MessageModeEnum.CHAT,
          text: 'answer',
          finished: true,
        },
      },
      {
        requestId: 'request-parity',
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        data: {
          success: true,
          outputText: 'answer',
          error: '',
          componentExecuteResults: [],
        },
      },
    ] as ConversationChatResponse[];

    for (const streamEvent of trace) {
      await act(async () => {
        mainHandlers?.onMessage?.(streamEvent);
        isolatedHandlers?.onMessage?.(streamEvent);
      });
    }

    const digest = (messages: MessageInfo[]) =>
      messages.map((item) => ({
        id: item.id,
        role: item.role,
        text: item.text,
        think: item.think,
        status: item.status,
        thinkingFinished: item.thinkingFinished,
        requestId: item.requestId,
        finalSuccess: item.finalResult?.success,
        processing: item.processingList?.map((processing) => ({
          executeId: processing.executeId,
          status: processing.status,
        })),
      }));

    expect(digest(isolated.result.current.messageList)).toEqual(
      digest(main.result.current.messageList),
    );
  });

  it('checkConversationActive：无忙碌消息时置为非活跃', async () => {
    const { result } = renderHook(() => useConversationInfo());

    // 先置活跃，再 check 空闲消息验证落 false
    await act(async () => {
      result.current.checkConversationActive([
        { id: 'busy', status: MessageStatusEnum.Loading } as MessageInfo,
      ]);
    });
    expect(result.current.isConversationActive).toBe(true);

    await act(async () => {
      result.current.checkConversationActive([
        { id: 'done', status: MessageStatusEnum.Complete } as MessageInfo,
      ]);
    });
    expect(result.current.isConversationActive).toBe(false);
  });

  it('disabledConversationActive：将活跃态置为 false', async () => {
    const { result } = renderHook(() => useConversationInfo());

    await act(async () => {
      result.current.checkConversationActive([
        { id: 'busy', status: MessageStatusEnum.Loading } as MessageInfo,
      ]);
    });
    expect(result.current.isConversationActive).toBe(true);

    await act(async () => {
      result.current.disabledConversationActive();
    });
    expect(result.current.isConversationActive).toBe(false);
  });

  it('resetInit：清空消息列表并调用 abortResumeStream', async () => {
    const { result } = renderHook(() => useConversationInfo());

    await act(async () => {
      result.current.setMessageList([{ id: 'keep', text: 'x' } as MessageInfo]);
    });
    expect(result.current.messageList).toHaveLength(1);

    await act(async () => {
      result.current.resetInit();
    });

    expect(result.current.messageList).toEqual([]);
    expect(result.current.conversationInfo).toBeNull();
    expect(mockAbortResumeStream).toHaveBeenCalled();
  });

  it('onMessageSend：乐观追加 user + assistant Loading，并建立 SSE', async () => {
    const { result } = renderHook(() => useConversationInfo());

    await act(async () => {
      await result.current.onMessageSend({
        id: 1001,
        messageInfo: 'hello world',
      });
    });

    expect(result.current.messageList).toHaveLength(2);
    expect(result.current.messageList[0].text).toBe('hello world');
    expect(result.current.messageList[1].status).toBe(
      MessageStatusEnum.Loading,
    );
    expect(result.current.isConversationActive).toBe(true);
    expect(result.current.isAwaitingChatTerminal).toBe(true);
    expect(mockCreateSSEConnection).toHaveBeenCalledTimes(1);
    expect(mockCreateSSEConnection.mock.calls[0][0].body).toEqual(
      expect.objectContaining({
        conversationId: 1001,
        message: 'hello world',
      }),
    );
  });

  it('T01/T02：成功轮次 Trace 保持 MESSAGE finished 与协议终态分离', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const trace = createConversationTraceRecorder();

    await act(async () => {
      result.current.setConversationInfo({
        id: 1001,
        taskStatus: TaskStatus.EXECUTING,
      } as any);
      await result.current.onMessageSend({
        id: 1001,
        messageInfo: 'trace hello',
      });
    });
    trace.record('user', 'send.requested', result.current);

    await act(async () => {
      sseHandlers.onMessage?.({
        eventType: ConversationEventTypeEnum.MESSAGE,
        requestId: 'req-trace',
        completed: false,
        error: '',
        data: {
          id: 'assistant-server-id',
          type: MessageModeEnum.CHAT,
          text: 'trace answer',
          finished: true,
        },
      });
    });
    trace.record('live', 'message.finished', result.current);

    await act(async () => {
      sseHandlers.onMessage?.({
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        requestId: 'req-trace',
        completed: true,
        error: '',
        data: {
          success: true,
          outputText: 'trace answer',
        },
      });
    });
    trace.record('live', 'final-result', result.current);

    await act(async () => {
      await sseHandlers.onClose?.();
    });
    trace.record('live', 'connection.closed', result.current);

    expect(trace.snapshot()).toEqual([
      expect.objectContaining({
        seq: 1,
        event: 'send.requested',
        state: expect.objectContaining({
          isConversationActive: true,
          isAwaitingChatTerminal: true,
          taskStatus: TaskStatus.EXECUTING,
        }),
      }),
      expect.objectContaining({
        seq: 2,
        event: 'message.finished',
        state: expect.objectContaining({
          isAwaitingChatTerminal: true,
          taskStatus: TaskStatus.EXECUTING,
        }),
      }),
      expect.objectContaining({
        seq: 3,
        event: 'final-result',
        state: expect.objectContaining({
          isAwaitingChatTerminal: false,
          taskStatus: TaskStatus.COMPLETE,
        }),
      }),
      expect.objectContaining({
        seq: 4,
        event: 'connection.closed',
        state: expect.objectContaining({
          isConversationActive: false,
          isAwaitingChatTerminal: false,
          taskStatus: TaskStatus.COMPLETE,
        }),
      }),
    ]);

    const finalMessage = trace.snapshot()[2].state.messages.at(-1);
    expect(finalMessage).toEqual(
      expect.objectContaining({
        text: 'trace answer',
        status: MessageStatusEnum.Complete,
        hasFinalResult: true,
      }),
    );
  });

  it('SSE MESSAGE THINK：追加 think，状态 Incomplete', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-1',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 'thinking...',
          type: MessageModeEnum.THINK,
          id: 'think-1',
          finished: false,
        },
      } as ConversationChatResponse);
    });

    const assistant = result.current.messageList.find(
      (item) => item.id === assistantId,
    );
    expect(assistant?.think).toContain('thinking...');
    expect(assistant?.status).toBe(MessageStatusEnum.Incomplete);
  });

  it('SSE MESSAGE 普通文本：追加 text；finished 后 Complete', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-2',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 'partial ',
          type: MessageModeEnum.CHAT,
          id: 'stream-1',
          finished: false,
        },
      } as ConversationChatResponse);
    });

    expect(
      result.current.messageList.find((item) => item.id === assistantId)?.text,
    ).toContain('partial ');

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-2',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 'done',
          type: MessageModeEnum.CHAT,
          id: 'stream-1',
          finished: true,
        },
      } as ConversationChatResponse);
    });

    const assistant = result.current.messageList.find(
      (item) => item.id === assistantId,
    );
    expect(assistant?.text).toContain('done');
    expect(assistant?.status).toBe(MessageStatusEnum.Complete);
    expect(result.current.isAwaitingChatTerminal).toBe(true);
  });

  it('SSE MESSAGE QUESTION：finished=true 时 status 为 null', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-q',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 'ask me',
          type: MessageModeEnum.QUESTION,
          id: 'q-1',
          finished: true,
          ext: [{ content: 'suggest-a' }],
        },
      } as ConversationChatResponse);
    });

    const assistant = result.current.messageList.find(
      (item) => item.id === assistantId,
    );
    expect(assistant?.status).toBeNull();
    expect(result.current.chatSuggestList).toEqual(['suggest-a']);
  });

  it('SSE PROCESSING：写入 processingList 且状态 Loading', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-p',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          name: 'search',
          executeId: 'exec-1',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'exec-1' },
        },
      } as ConversationChatResponse);
    });

    const assistant = result.current.messageList.find(
      (item) => item.id === assistantId,
    );
    expect(assistant?.status).toBe(MessageStatusEnum.Loading);
    expect(assistant?.processingList?.[0]?.executeId).toBe('exec-1');
  });

  it('SSE PROCESSING：同一 executeId 更新而非重复追加', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-p2',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          name: 'search',
          executeId: 'exec-dup',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'exec-dup' },
        },
      } as ConversationChatResponse);
    });

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-p2',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          name: 'search',
          executeId: 'exec-dup',
          status: ProcessingEnum.FINISHED,
          result: { executeId: 'exec-dup' },
        },
      } as ConversationChatResponse);
    });

    const assistant = result.current.messageList.find(
      (item) => item.id === assistantId,
    );
    expect(assistant?.processingList).toHaveLength(1);
    expect(assistant?.processingList?.[0]?.status).toBe(
      ProcessingEnum.FINISHED,
    );
  });

  it('SSE FINAL_RESULT：消息 Complete 并写入 finalResult', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-final',
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        data: {
          success: true,
          outputText: 'final answer',
        },
      } as ConversationChatResponse);
    });

    const assistant = result.current.messageList.find(
      (item) => item.id === assistantId,
    );
    expect(assistant?.status).toBe(MessageStatusEnum.Complete);
    expect(assistant?.finalResult).toEqual(
      expect.objectContaining({ success: true, outputText: 'final answer' }),
    );
    expect(assistant?.requestId).toBe('req-final');
    expect(result.current.isAwaitingChatTerminal).toBe(false);
  });

  it('SSE FINAL_RESULT 已解析出终态时，onClose 不重复查询会话状态', async () => {
    const { result } = renderHook(() => useConversationInfo());
    await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-final-terminal',
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        data: {
          success: true,
          outputText: 'done',
        },
      } as ConversationChatResponse);
      await sseHandlers.onClose?.();
    });

    expect(mockSyncTerminalConversationTaskStatus).not.toHaveBeenCalled();
  });

  it('SSE FINAL_RESULT 未提供明确失败终态时，onClose 保留兜底查询', async () => {
    const { result } = renderHook(() => useConversationInfo());
    await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-final-unknown',
        eventType: ConversationEventTypeEnum.FINAL_RESULT,
        data: {
          success: false,
          outputText: 'unknown failure',
        },
      } as ConversationChatResponse);
      await sseHandlers.onClose?.();
    });

    expect(mockSyncTerminalConversationTaskStatus).toHaveBeenCalledTimes(1);
    expect(mockSyncTerminalConversationTaskStatus).toHaveBeenCalledWith(
      1001,
      expect.any(Function),
    );
  });

  it('SSE onClose：终态查询未返回时也立即释放本地活跃态', async () => {
    let resolveTerminalSync: (() => void) | undefined;
    mockSyncTerminalConversationTaskStatus.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveTerminalSync = resolve;
        }),
    );
    const { result } = renderHook(() => useConversationInfo());
    await sendAndGetAssistantId(result);
    expect(result.current.isConversationActive).toBe(true);

    await act(async () => {
      await sseHandlers.onClose?.();
    });

    expect(mockSyncTerminalConversationTaskStatus).toHaveBeenCalledTimes(1);
    expect(result.current.isConversationActive).toBe(false);
    resolveTerminalSync?.();
  });

  it('SSE ERROR：当前助手消息置为 Error', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-err',
        eventType: ConversationEventTypeEnum.ERROR,
        data: {},
      } as ConversationChatResponse);
    });

    expect(
      result.current.messageList.find((item) => item.id === assistantId)
        ?.status,
    ).toBe(MessageStatusEnum.Error);
    expect(result.current.isAwaitingChatTerminal).toBe(false);
  });

  it('SSE onError：Loading 消息改 Error，processing EXECUTING→FAILED', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-p3',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          executeId: 'exec-fail',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'exec-fail' },
        },
      } as ConversationChatResponse);
    });

    await act(async () => {
      sseHandlers.onError?.();
    });

    const assistant = result.current.messageList.find(
      (item) => item.id === assistantId,
    );
    expect(assistant?.status).toBe(MessageStatusEnum.Error);
    expect(assistant?.processingList?.[0]?.status).toBe(ProcessingEnum.FAILED);
    expect(mockMessageError).toHaveBeenCalled();
    expect(result.current.isConversationActive).toBe(false);
  });

  it('SSE onClose：末条 Loading/Incomplete → Stopped，EXECUTING → FAILED', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-p4',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          executeId: 'exec-close',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'exec-close' },
        },
      } as ConversationChatResponse);
    });

    await act(async () => {
      await sseHandlers.onClose?.();
    });

    await waitFor(() => {
      const assistant = result.current.messageList.find(
        (item) => item.id === assistantId,
      );
      expect(assistant?.status).toBe(MessageStatusEnum.Stopped);
      expect(assistant?.processingList?.[0]?.status).toBe(
        ProcessingEnum.FAILED,
      );
    });
    expect(mockSyncTerminalConversationTaskStatus).toHaveBeenCalledWith(
      1001,
      expect.any(Function),
    );
  });

  it('工作流多段 MESSAGE：新 id 且 finished 时插入新消息行', async () => {
    const { result } = renderHook(() => useConversationInfo());
    const assistantId = await sendAndGetAssistantId(result);

    // 先绑定 messageIdRef
    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-wf',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: 'part1',
          type: MessageModeEnum.CHAT,
          id: 'wf-1',
          finished: false,
        },
      } as ConversationChatResponse);
    });

    const lenBefore = result.current.messageList.length;

    // 新 id + finished → 插入（不替换原占位）
    await act(async () => {
      sseHandlers.onMessage?.({
        requestId: 'req-wf',
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          text: ' part2',
          type: MessageModeEnum.CHAT,
          id: 'wf-2',
          finished: true,
        },
      } as ConversationChatResponse);
    });

    expect(result.current.messageList.length).toBe(lenBefore + 1);
    // 原占位仍在
    expect(
      result.current.messageList.some((item) => item.id === assistantId),
    ).toBe(true);
    // 新插入行使用后端 id
    expect(result.current.messageList.some((item) => item.id === 'wf-2')).toBe(
      true,
    );
  });

  it('handleClearSideEffect：中止 SSE 并清空建议列表', async () => {
    const { result } = renderHook(() => useConversationInfo());
    await sendAndGetAssistantId(result);

    await act(async () => {
      result.current.setChatSuggestList(['a', 'b']);
      result.current.handleClearSideEffect();
    });

    expect(result.current.chatSuggestList).toEqual([]);
    expect(abortFn).toHaveBeenCalled();
    expect(mockAbortResumeStream).toHaveBeenCalled();
  });

  /**
   * 高频连续发送回归：发送 A 后紧接发送 B（B 会 abort A 的连接），
   * A 的延迟 onClose(500ms) 触发时只应清理 A 自己的消息，不得误停 B、误关活跃态。
   * 否则 streamActive 假性回落会让队列提前消费下一条，进而 abort 正在流式中的
   * /api/agent/conversation/chat（接口被意外取消）。
   */
  it('高频连续发送：上一轮连接的延迟 onClose 只清理自己的消息，不影响新一轮', async () => {
    // 每次 createSSEConnection 返回独立 abort 句柄，并分别捕获 handlers，
    // 模拟「发送 A（连接1）→ 发送 B（连接2，abort 连接1）→ A 的延迟 onClose 触发」时序
    const connectionHandlers: SseHandlers[] = [];
    const connectionAborts: Array<ReturnType<typeof vi.fn>> = [];
    mockCreateSSEConnection.mockImplementation((options: SseHandlers) => {
      const abort = vi.fn();
      connectionHandlers.push(options);
      connectionAborts.push(abort);
      return abort;
    });

    const { result } = renderHook(() => useConversationInfo());

    // 发送 A：连接1；user=msg-uuid-1，assistant=msg-uuid-2
    await act(async () => {
      await result.current.onMessageSend({ id: 1001, messageInfo: 'first' });
    });
    const firstAssistantId = 'msg-uuid-2';

    // A 流式中产生一个 EXECUTING 处理块
    await act(async () => {
      connectionHandlers[0].onMessage?.({
        requestId: 'req-a',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          type: 'ToolCall',
          executeId: 'exec-a',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'exec-a' },
        },
      } as ConversationChatResponse);
    });

    // 高频第二发 B：先 abort 连接1，再建立连接2；user=msg-uuid-3，assistant=msg-uuid-4
    await act(async () => {
      await result.current.onMessageSend({ id: 1001, messageInfo: 'second' });
    });
    expect(connectionAborts[0]).toHaveBeenCalled();
    const secondAssistantId = 'msg-uuid-4';

    // 模拟 A 的延迟 onClose（abort 500ms 后）打到 B 已追加的时刻
    await act(async () => {
      await connectionHandlers[0].onClose?.();
    });

    // B 的助手消息不受 A 过期 onClose 影响：仍是 Loading，未被置 Stopped
    const secondAssistant = result.current.messageList.find(
      (item) => item.id === secondAssistantId,
    );
    expect(secondAssistant?.status).toBe(MessageStatusEnum.Loading);
    // 活跃态不被误关（保活/活跃态未被 A 的过期 onClose 破坏）
    expect(result.current.isConversationActive).toBe(true);
    // A 自己的消息被清理：Stopped + EXECUTING→FAILED（不残留 busy 信号卡队列）
    const firstAssistant = result.current.messageList.find(
      (item) => item.id === firstAssistantId,
    );
    expect(firstAssistant?.status).toBe(MessageStatusEnum.Stopped);
    expect(firstAssistant?.processingList?.[0]?.status).toBe(
      ProcessingEnum.FAILED,
    );
    // 过期 onClose 不触发终态兜底查询
    expect(mockSyncTerminalConversationTaskStatus).not.toHaveBeenCalled();

    // B 的连接仍是当前连接：其 onClose 正常走全局收尾
    await act(async () => {
      await connectionHandlers[1].onClose?.();
    });
    expect(
      result.current.messageList.find((item) => item.id === secondAssistantId)
        ?.status,
    ).toBe(MessageStatusEnum.Stopped);
    expect(result.current.isConversationActive).toBe(false);
  });

  it('高频连续发送：上一轮连接的延迟 onError 不弹错、不误关活跃态', async () => {
    const connectionHandlers: SseHandlers[] = [];
    const connectionAborts: Array<ReturnType<typeof vi.fn>> = [];
    mockCreateSSEConnection.mockImplementation((options: SseHandlers) => {
      const abort = vi.fn();
      connectionHandlers.push(options);
      connectionAborts.push(abort);
      return abort;
    });

    const { result } = renderHook(() => useConversationInfo());

    // 发送 A：连接1；assistant=msg-uuid-2
    await act(async () => {
      await result.current.onMessageSend({ id: 1001, messageInfo: 'first' });
    });
    const firstAssistantId = 'msg-uuid-2';

    // 高频第二发 B：abort 连接1，建立连接2；assistant=msg-uuid-4
    await act(async () => {
      await result.current.onMessageSend({ id: 1001, messageInfo: 'second' });
    });
    const secondAssistantId = 'msg-uuid-4';

    // A 的延迟 onError：只清理 A 自己的消息，不弹全局错误、不清活跃态
    await act(async () => {
      connectionHandlers[0].onError?.();
    });

    const firstAssistant = result.current.messageList.find(
      (item) => item.id === firstAssistantId,
    );
    expect(firstAssistant?.status).toBe(MessageStatusEnum.Error);
    const secondAssistant = result.current.messageList.find(
      (item) => item.id === secondAssistantId,
    );
    expect(secondAssistant?.status).toBe(MessageStatusEnum.Loading);
    expect(result.current.isConversationActive).toBe(true);
    expect(mockMessageError).not.toHaveBeenCalled();
  });
});
