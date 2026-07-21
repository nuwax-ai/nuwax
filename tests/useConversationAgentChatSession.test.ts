/**
 * ConversationAgent 隔离会话 hook 测试
 */
import { useConversationAgentChatSession } from '@/pages/ConversationAgent/hooks/useConversationAgentChatSession';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUseModel,
  mockRunAsyncConversationCreate,
  mockHidePagePreview,
  mockShowPagePreview,
} = vi.hoisted(() => ({
  mockUseModel: vi.fn(),
  mockRunAsyncConversationCreate: vi.fn(),
  mockHidePagePreview: vi.fn(),
  mockShowPagePreview: vi.fn(),
}));

vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => mockUseModel(...args),
}));

vi.mock('@/hooks/useConversation', () => ({
  default: () => ({
    runAsyncConversationCreate: mockRunAsyncConversationCreate,
  }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

describe('useConversationAgentChatSession', () => {
  const createConversationAgentModel = () => ({
    conversationInfo: {
      id: 9001,
      taskStatus: TaskStatus.EXECUTING,
      agent: { hasPermission: true },
    },
    setConversationInfo: vi.fn(),
    messageList: [],
    setMessageList: vi.fn(),
    chatSuggestList: [],
    loadingConversation: false,
    loadingMore: false,
    isMoreMessage: false,
    loadingSuggest: false,
    onMessageSend: vi.fn(),
    manualComponents: [],
    handleLoadMoreMessage: vi.fn(),
    showScrollBtn: false,
    setIsMoreMessage: vi.fn(),
    setIsLoadingConversation: vi.fn(),
    setIsLoadingOtherInterface: vi.fn(),
    isLoadingOtherInterface: false,
    handleClearSideEffect: vi.fn(),
    runQueryConversation: vi.fn(),
    runAsync: vi.fn().mockResolvedValue({
      data: { messageList: [{ id: 'reloaded' }] },
    }),
    clearFilePanelInfo: vi.fn(),
    isConversationActive: false,
    runStopConversation: vi.fn(),
    loadingStopConversation: false,
    disabledConversationActive: vi.fn(),
    getCurrentConversationId: vi.fn(),
    getCurrentConversationRequestId: vi.fn(),
    resumeConversationStream: vi.fn(),
    abortResumeStream: vi.fn(),
    respondAcpPermission: vi.fn(),
    respondMcpAsk: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationAgent') {
        return createConversationAgentModel();
      }
      if (name === 'chat') {
        return {
          hidePagePreview: mockHidePagePreview,
          showPagePreview: mockShowPagePreview,
        };
      }
      return {};
    });
  });

  it('向 UnifiedChatSession 透传隔离会话的 sub 恢复 action', async () => {
    const model = createConversationAgentModel();
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationAgent') return model;
      if (name === 'chat') {
        return {
          hidePagePreview: mockHidePagePreview,
          showPagePreview: mockShowPagePreview,
        };
      }
      return {};
    });

    const { result } = renderHook(() =>
      useConversationAgentChatSession({
        agentId: 77,
        agentConfigInfo: {
          id: 77,
          devConversationId: 9001,
          name: 'Dev Agent',
        } as any,
      }),
    );

    expect(result.current.onResumeConversationStream).toBe(
      model.resumeConversationStream,
    );
    expect(result.current.onAbortResumeStream).toBe(model.abortResumeStream);

    await expect(
      result.current.onReloadConversationHistoryAsync?.(9001),
    ).resolves.toEqual([{ id: 'reloaded' }]);
    expect(model.runAsync).toHaveBeenCalledWith(9001);
  });

  it('onTerminalTaskStatus 只按 devConversationId 写回终态 taskStatus', async () => {
    const model = createConversationAgentModel();
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationAgent') return model;
      if (name === 'chat') {
        return {
          hidePagePreview: mockHidePagePreview,
          showPagePreview: mockShowPagePreview,
        };
      }
      return {};
    });

    const { result } = renderHook(() =>
      useConversationAgentChatSession({
        agentId: 77,
        agentConfigInfo: {
          id: 77,
          devConversationId: 9001,
          name: 'Dev Agent',
        } as any,
      }),
    );

    await act(async () => {
      await result.current.onTerminalTaskStatus?.(TaskStatus.COMPLETE);
    });

    expect(model.setConversationInfo).toHaveBeenCalledWith(
      expect.any(Function),
    );
    const updater = model.setConversationInfo.mock.calls[0][0] as (
      prev: ConversationInfo,
    ) => ConversationInfo;
    expect(
      updater({
        id: 9001,
        taskStatus: TaskStatus.EXECUTING,
      } as ConversationInfo).taskStatus,
    ).toBe(TaskStatus.COMPLETE);
    expect(
      updater({
        id: 9002,
        taskStatus: TaskStatus.EXECUTING,
      } as ConversationInfo).taskStatus,
    ).toBe(TaskStatus.EXECUTING);
  });

  it('没有 devConversationId 时不写回终态 taskStatus', () => {
    const model = createConversationAgentModel();
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationAgent') return model;
      if (name === 'chat') {
        return {
          hidePagePreview: mockHidePagePreview,
          showPagePreview: mockShowPagePreview,
        };
      }
      return {};
    });

    const { result } = renderHook(() =>
      useConversationAgentChatSession({
        agentId: 77,
        agentConfigInfo: {
          id: 77,
          name: 'Dev Agent',
        } as any,
      }),
    );

    act(() => {
      result.current.onTerminalTaskStatus?.(TaskStatus.COMPLETE);
    });

    expect(model.setConversationInfo).not.toHaveBeenCalled();
  });

  it('终态 reload 返回等价列表时不替换 messageList，避免结束闪动', async () => {
    const existingList = [
      {
        id: 1,
        role: AssistantRoleEnum.USER,
        text: 'hello',
      },
      {
        id: 2,
        role: AssistantRoleEnum.ASSISTANT,
        text: 'done',
        status: MessageStatusEnum.Complete,
      },
    ];
    const model = {
      ...createConversationAgentModel(),
      messageList: existingList,
      runAsync: vi.fn().mockResolvedValue({
        data: { messageList: [...existingList] },
      }),
      getCurrentConversationId: vi.fn().mockReturnValue(9001),
      setMessageList: vi.fn((updater) =>
        typeof updater === 'function' ? updater(existingList) : updater,
      ),
    };
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'conversationAgent') return model;
      if (name === 'chat') {
        return {
          hidePagePreview: mockHidePagePreview,
          showPagePreview: mockShowPagePreview,
        };
      }
      return {};
    });

    const { result } = renderHook(() =>
      useConversationAgentChatSession({
        agentId: 77,
        agentConfigInfo: {
          id: 77,
          devConversationId: 9001,
          name: 'Dev Agent',
        } as any,
      }),
    );

    await act(async () => {
      await result.current.onTerminalTaskStatus?.(TaskStatus.COMPLETE);
    });

    const updater = model.setMessageList.mock.calls[0][0] as (
      prev: typeof existingList,
    ) => typeof existingList;
    expect(updater(existingList)).toBe(existingList);
  });
});
