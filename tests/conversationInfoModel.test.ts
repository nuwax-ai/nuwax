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
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    expect(mockCreateSSEConnection).toHaveBeenCalledTimes(1);
    expect(mockCreateSSEConnection.mock.calls[0][0].body).toEqual(
      expect.objectContaining({
        conversationId: 1001,
        message: 'hello world',
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
});
