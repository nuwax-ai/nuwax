import AgentConversationChatPanel from '@/pages/AppDevPro/AgentConversationChatPanel';
import { TaskStatus } from '@/types/enums/agent';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUnifiedChatSession,
  mockUseConversationRuntimeSession,
  mockUseModel,
  mockUseLocation,
  mockHistory,
} = vi.hoisted(() => ({
  mockUnifiedChatSession: vi.fn(),
  mockUseConversationRuntimeSession: vi.fn(() => null),
  mockUseModel: vi.fn(),
  mockUseLocation: vi.fn(),
  mockHistory: { action: 'PUSH' },
}));

vi.mock('@/components/business-component', () => ({
  UnifiedChatSession: (props: any) => {
    mockUnifiedChatSession(props);
    return <div data-testid="unified-chat-session" />;
  },
}));

vi.mock('@/features/conversation/react/useConversationRuntimeSession', () => ({
  useConversationRuntimeSession: (...args: unknown[]) =>
    mockUseConversationRuntimeSession(...args),
}));

vi.mock('umi', () => ({
  history: mockHistory,
  useLocation: (...args: unknown[]) => mockUseLocation(...args),
  useModel: (...args: unknown[]) => mockUseModel(...args),
}));

// useConversationMentionFiles → services 链（vncDesktop → userService → 常量表）
// 在 vitest 环境不可用，统一桩掉 i18n 与文件列表接口
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

function createConversationInfoModel(overrides: Record<string, any> = {}) {
  return {
    conversationInfo: {
      id: 7001,
      taskStatus: TaskStatus.EXECUTING,
      agent: {
        agentId: 88,
        name: 'Agent',
        allowOtherModel: true,
      },
    },
    messageList: [{ id: 'm1', text: 'hello' }],
    chatSuggestList: ['next'],
    loadingConversation: false,
    onMessageSend: vi.fn(),
    manualComponents: [
      {
        id: 1,
        name: 'Plugin',
        icon: '',
        description: '',
        type: 'Plugin',
        defaultSelected: 1,
      },
    ],
    isMoreMessage: true,
    loadingMore: false,
    handleLoadMoreMessage: vi.fn(),
    runStopConversation: vi.fn(),
    loadingStopConversation: false,
    getCurrentConversationId: vi.fn(),
    getCurrentConversationRequestId: vi.fn(),
    disabledConversationActive: vi.fn(),
    isConversationActive: false,
    isLoadingOtherInterface: false,
    resumeConversationStream: vi.fn(),
    abortResumeStream: vi.fn(),
    runAsync: vi.fn().mockResolvedValue({
      data: { messageList: [{ id: 'reloaded' }] },
    }),
    ...overrides,
  };
}

const latestUnifiedProps = () =>
  mockUnifiedChatSession.mock.calls.at(-1)?.[0] as any;

describe('AgentConversationChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConversationRuntimeSession.mockReturnValue(null);
    mockHistory.action = 'PUSH';
    mockUseLocation.mockReturnValue({
      key: 'route-1',
      state: {
        selectedComputerId: 'computer-from-route',
        modelId: 456,
        agentMode: 'ask',
      },
    });
  });

  it('把后端执行态与本地流式态拆开传给 UnifiedChatSession', async () => {
    const model = createConversationInfoModel({
      isConversationActive: false,
    });
    mockUseModel.mockReturnValue(model);
    const onChangeSelectedComputerId = vi.fn();

    render(
      <AgentConversationChatPanel
        selectedComputerId="computer-prop"
        onChangeSelectedComputerId={onChangeSelectedComputerId}
      />,
    );

    await waitFor(() => {
      expect(latestUnifiedProps().isSelectionLocked).toBe(true);
    });

    const props = latestUnifiedProps();
    expect(onChangeSelectedComputerId).toHaveBeenCalledWith(
      'computer-from-route',
    );
    expect(props.isConversationActive).toBe(true);
    expect(props.isLocallyStreaming).toBe(false);
    expect(props.initialAgentMode).toBe('ask');
    expect(props.selectedModelId).toBe(456);
    expect(props.agentInfo).toMatchObject({
      id: 88,
      sandboxId: 'computer-prop',
      allowOtherModel: true,
    });
  });

  it('保留 App Pro 页面模型的消息和推荐，不被未对齐的 runtime 数据覆盖', () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);
    mockUseConversationRuntimeSession.mockReturnValue({
      conversationProps: {
        messageList: [],
        chatSuggestList: [],
      },
    } as any);

    render(<AgentConversationChatPanel />);

    expect(latestUnifiedProps().messageList).toBe(model.messageList);
    expect(latestUnifiedProps().chatSuggestList).toBe(model.chatSuggestList);
  });

  it('发送消息时带上电脑、已选组件、模型和调试会话参数', async () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);

    render(<AgentConversationChatPanel selectedComputerId="computer-prop" />);
    await waitFor(() => {
      expect(latestUnifiedProps().selectedComponentList).toEqual([
        { id: 1, type: 'Plugin' },
      ]);
    });

    latestUnifiedProps().onSendMessage(
      'fix it',
      [{ name: 'a.ts' }],
      [11],
      undefined,
      'ask',
    );

    expect(model.onMessageSend).toHaveBeenCalledWith({
      id: 7001,
      messageInfo: 'fix it',
      files: [{ name: 'a.ts' }],
      infos: [{ id: 1, type: 'Plugin' }],
      sandboxId: 'computer-prop',
      debug: true,
      isSync: false,
      skillIds: [11],
      modelId: 456,
      agentMode: 'ask',
    });
  });

  it('从首页透传已选组件，并允许用户在面板内取消选中', async () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);
    mockUseLocation.mockReturnValue({
      key: 'route-from-home',
      state: {
        messageSourceType: 'home',
        infos: [{ id: 2, type: 'Workflow' }],
      },
      search: '?conversationId=7001',
    });

    render(<AgentConversationChatPanel selectedComputerId="computer-prop" />);

    await waitFor(() => {
      expect(latestUnifiedProps().selectedComponentList).toEqual([
        { id: 2, type: 'Workflow' },
      ]);
    });

    act(() => {
      latestUnifiedProps().onSelectComponent({ id: 2, type: 'Workflow' });
    });
    await waitFor(() => {
      expect(latestUnifiedProps().selectedComponentList).toEqual([]);
    });
  });

  it('重新加载历史时把字符串 id 转数字并返回 messageList', async () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);

    render(<AgentConversationChatPanel selectedComputerId="computer-prop" />);

    await expect(
      latestUnifiedProps().onReloadConversationHistoryAsync('7001'),
    ).resolves.toEqual([{ id: 'reloaded' }]);
    expect(model.runAsync).toHaveBeenCalledWith(7001);
  });

  it('本地流式从 active 变为 inactive 时触发会话结束回调', () => {
    const model = createConversationInfoModel({
      isConversationActive: true,
      conversationInfo: {
        id: 7001,
        taskStatus: TaskStatus.EXECUTING,
        agent: { agentId: 88 },
      },
    });
    mockUseModel.mockReturnValue(model);
    const onConversationEnd = vi.fn();
    const { rerender } = render(
      <AgentConversationChatPanel onConversationEnd={onConversationEnd} />,
    );

    model.isConversationActive = false;
    rerender(
      <AgentConversationChatPanel onConversationEnd={onConversationEnd} />,
    );

    expect(onConversationEnd).toHaveBeenCalledTimes(1);
  });
});
