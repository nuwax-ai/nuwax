import { useConversationRuntimeSession } from '@/features/conversation/react/useConversationRuntimeSession';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum, OpenCloseEnum } from '@/types/enums/space';
import type {
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockLoad, mockSuggest, mockOpenLive, mockOpenResume, mockChatModel } =
  vi.hoisted(() => ({
    mockLoad: vi.fn(),
    mockSuggest: vi.fn(),
    mockOpenLive: vi.fn(),
    mockOpenResume: vi.fn(),
    mockChatModel: { handleChatProcessingList: vi.fn() },
  }));

// 保留真实 hook → session → effects 链，只隔离页面资源与 HTTP/流式传输。
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversation: mockLoad,
  apiAgentConversationChatSuggest: mockSuggest,
  apiAgentConversationChatStop: vi.fn(),
  apiAgentConversationMessageList: vi.fn(),
  apiAgentConversationUpdate: vi.fn(),
}));
vi.mock('@/features/conversation/runtime/conversationTransport', () => ({
  openLiveConversationStream: mockOpenLive,
}));
vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: mockOpenResume,
}));
vi.mock('@/utils/conversationTaskStatusSync', () => ({
  applyTerminalTaskStatus: vi.fn(),
  emitConversationListTaskStatus: vi.fn(),
  fetchConversationTaskStatus: vi.fn(),
}));
vi.mock('@/components/business-component/AgentIntervention', () => ({
  hydrateMcpAskInteractionsInMessageList: (messages: unknown[]) => messages,
  prependAndHydrateMcpAskMessageList: vi.fn(),
  processInterventionSsePatch: vi.fn(),
  useAgentInterventionHandlers: () => ({}),
}));
vi.mock('@/plugins/ds-markdown-process', () => ({
  getCustomBlock: vi.fn(),
}));
vi.mock('@/hooks/useDirectorySync', () => ({
  useConversationChanged: vi.fn(),
}));
vi.mock('@/modelScopes/usePageModel', () => ({
  usePageModel: () => mockChatModel,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/ant-custom', () => ({ modalConfirm: vi.fn() }));
vi.mock('@/utils/conversationRuntimeFlag', () => ({
  isConversationRuntimeEnabled: () => true,
}));
vi.mock('@/constants/common.constants', () => ({
  CONVERSATION_CONNECTION_URL: '/api/agent/conversation/chat',
  CONVERSATION_CHAT_SUB_URL: '/api/agent/conversation/chat/sub',
  MESSAGE_PAGE_SIZE: 20,
}));

const conversation = (id: number, openSuggest?: OpenCloseEnum) =>
  ({
    id,
    topic: '已有会话',
    topicUpdated: 1,
    taskStatus: TaskStatus.COMPLETE,
    messageList: [],
    agent: { type: AgentTypeEnum.ChatBot, openSuggest },
  } as ConversationInfo);

async function finishRound(send: unknown) {
  act(() => {
    (send as (message: string) => void)('你好');
  });
  const callbacks = mockOpenLive.mock.lastCall?.[1] as {
    onMessage: (event: ConversationChatResponse) => void;
    onClose: () => void;
  };
  act(() => {
    callbacks.onMessage({
      requestId: 'suggest-test',
      eventType: ConversationEventTypeEnum.FINAL_RESULT,
      data: { success: true, outputText: '你好' },
    } as ConversationChatResponse);
    callbacks.onClose();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

describe('runtime 会话问题建议', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    mockOpenLive.mockReturnValue(vi.fn());
    mockOpenResume.mockReturnValue(vi.fn());
    mockSuggest.mockResolvedValue({ data: ['下一个问题'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each([
    [OpenCloseEnum.Open, true],
    [OpenCloseEnum.Close, false],
    [undefined, false],
  ])('openSuggest=%s：整轮结束后是否调用建议接口=%s', async (flag, enabled) => {
    mockLoad.mockResolvedValue({ data: conversation(1001, flag) });
    const { result } = renderHook(() =>
      useConversationRuntimeSession({ conversationId: 1001 }),
    );
    await act(async () => {});
    expect(result.current?.conversationProps.conversationInfo).toEqual(
      conversation(1001, flag),
    );
    expect(mockSuggest).not.toHaveBeenCalled();

    await finishRound(result.current?.conversationProps.onSendMessage);

    expect(mockSuggest).toHaveBeenCalledTimes(enabled ? 1 : 0);
    if (enabled) {
      expect(mockSuggest).toHaveBeenCalledWith({ conversationId: 1001 });
      expect(result.current?.conversationProps.chatSuggestList).toEqual([
        '下一个问题',
      ]);
    }
  });

  it('切换到关闭建议的会话后，不沿用上一会话的开启状态', async () => {
    mockLoad.mockImplementation(async (id: number) => ({
      data: conversation(
        id,
        id === 1001 ? OpenCloseEnum.Open : OpenCloseEnum.Close,
      ),
    }));
    const { result, rerender } = renderHook(
      ({ id }) => useConversationRuntimeSession({ conversationId: id }),
      { initialProps: { id: 1001 } },
    );
    await act(async () => {});
    await finishRound(result.current?.conversationProps.onSendMessage);
    expect(mockSuggest).toHaveBeenCalledTimes(1);

    rerender({ id: 1002 });
    await act(async () => {});
    await finishRound(result.current?.conversationProps.onSendMessage);
    expect(mockSuggest).toHaveBeenCalledTimes(1);
    expect(result.current?.conversationProps.chatSuggestList).toEqual([]);
  });

  it.each([
    [OpenCloseEnum.Open, true],
    [OpenCloseEnum.Close, false],
    [undefined, false],
  ])(
    '恢复会话 openSuggest=%s：订阅结束后是否调用建议接口=%s',
    async (flag, enabled) => {
      mockLoad.mockResolvedValue({ data: conversation(1001, flag) });
      const { result } = renderHook(() =>
        useConversationRuntimeSession({ conversationId: 1001 }),
      );
      await act(async () => {});
      act(() => {
        result.current?.session.resumeConversationStream(1001, [
          { id: 'resume-user', role: AssistantRoleEnum.USER },
          {
            id: 'resume-assistant',
            role: AssistantRoleEnum.ASSISTANT,
            status: MessageStatusEnum.Loading,
          },
        ] as MessageInfo[]);
        mockOpenResume.mock.lastCall?.[0].onMessage({
          eventType: ConversationEventTypeEnum.FINAL_RESULT,
          data: { success: true, outputText: '恢复完成' },
        });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(mockSuggest).toHaveBeenCalledTimes(enabled ? 1 : 0);
      if (enabled) {
        expect(mockSuggest).toHaveBeenCalledWith({ conversationId: 1001 });
      }
    },
  );
});
