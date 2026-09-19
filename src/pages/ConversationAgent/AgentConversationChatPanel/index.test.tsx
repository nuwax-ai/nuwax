import AgentConversationChatPanel from '@/pages/ConversationAgent/AgentConversationChatPanel';
import { TaskStatus } from '@/types/enums/agent';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUnifiedChatSession,
  mockUseModel,
  mockUseLocation,
  mockHistory,
  mockUseRuntimeSession,
} = vi.hoisted(() => ({
  mockUnifiedChatSession: vi.fn(),
  mockUseModel: vi.fn(),
  mockUseLocation: vi.fn(),
  mockHistory: { action: 'PUSH' },
  mockUseRuntimeSession: vi.fn(),
}));

vi.mock('@/components/business-component', () => ({
  UnifiedChatSession: (props: any) => {
    mockUnifiedChatSession(props);
    return <div data-testid="unified-chat-session" />;
  },
}));

vi.mock('@/features/conversation/react/useConversationRuntimeSession', () => ({
  useConversationRuntimeSession: (...args: unknown[]) =>
    mockUseRuntimeSession(...args),
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
    manualComponents: [{ id: 1, type: 'Plugin', defaultSelected: 1 }],
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
    mockHistory.action = 'PUSH';
    // 默认无 runtime 线（V1 形态），双线用例自行覆写
    mockUseRuntimeSession.mockReturnValue(null);
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

  it('发送消息时带上电脑、组件、模型和调试会话参数', () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);

    render(<AgentConversationChatPanel selectedComputerId="computer-prop" />);
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
      skillIds: [11],
      modelId: 456,
      agentMode: 'ask',
    });
  });

  it('当前 URL 会话已有乐观消息时不再被详情 loading 遮挡', () => {
    const model = createConversationInfoModel({ loadingConversation: true });
    mockUseModel.mockReturnValue(model);
    mockUseLocation.mockReturnValue({
      key: 'route-loading',
      state: {},
      search: '?agentId=88&conversationId=7001',
    });

    render(<AgentConversationChatPanel />);

    expect(latestUnifiedProps().isLoading).toBe(false);
  });

  it('新建智能体跳转后保留选中的工具，后续发送也使用当前选中态', async () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);
    mockUseLocation.mockReturnValue({
      key: 'route-from-project-create',
      state: { infos: [{ id: 2, type: 'Workflow' }] },
      search: '?agentId=88&conversationId=7001',
    });

    render(<AgentConversationChatPanel />);
    await waitFor(() => {
      expect(latestUnifiedProps().selectedComponentList).toEqual([
        { id: 2, type: 'Workflow' },
      ]);
    });

    act(() => {
      latestUnifiedProps().onSelectComponent({ id: 2, type: 'Workflow' });
    });
    latestUnifiedProps().onSendMessage('继续', [], []);
    expect(model.onMessageSend).toHaveBeenCalledWith(
      expect.objectContaining({ infos: [] }),
    );
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

  it('V2 线：conversationProps 的活跃态下降沿触发会话结束回调（model 置位点不再执行）', () => {
    // V2 下 onSendMessage 走 runtime 线，model 的 isConversationActive 恒 false——
    // 结束沿必须消费 conversationProps 的生效值
    const model = createConversationInfoModel({
      isConversationActive: false,
    });
    mockUseModel.mockReturnValue(model);
    mockUseRuntimeSession.mockReturnValue({
      conversationProps: { isConversationActive: true },
    });
    const onConversationEnd = vi.fn();
    const { rerender } = render(
      <AgentConversationChatPanel onConversationEnd={onConversationEnd} />,
    );
    expect(onConversationEnd).not.toHaveBeenCalled();

    mockUseRuntimeSession.mockReturnValue({
      conversationProps: { isConversationActive: false },
    });
    rerender(
      <AgentConversationChatPanel onConversationEnd={onConversationEnd} />,
    );

    expect(onConversationEnd).toHaveBeenCalledTimes(1);
  });

  it('V2 线：生效值优先于 model 值（model 恒 false 不干扰 runtime 值驱动的沿检测）', () => {
    const model = createConversationInfoModel({
      isConversationActive: false,
    });
    mockUseModel.mockReturnValue(model);
    // 生效值 false（合成值即 false），model 值同为 false：无上升沿噪声
    mockUseRuntimeSession.mockReturnValue({
      conversationProps: { isConversationActive: false },
    });
    const onConversationEnd = vi.fn();
    const { rerender } = render(
      <AgentConversationChatPanel onConversationEnd={onConversationEnd} />,
    );
    expect(onConversationEnd).not.toHaveBeenCalled();

    // 生效值上升 → 再下降：一次沿
    mockUseRuntimeSession.mockReturnValue({
      conversationProps: { isConversationActive: true },
    });
    rerender(
      <AgentConversationChatPanel onConversationEnd={onConversationEnd} />,
    );
    expect(onConversationEnd).not.toHaveBeenCalled();

    mockUseRuntimeSession.mockReturnValue({
      conversationProps: { isConversationActive: false },
    });
    rerender(
      <AgentConversationChatPanel onConversationEnd={onConversationEnd} />,
    );
    expect(onConversationEnd).toHaveBeenCalledTimes(1);
  });

  it('URL 带 conversationId 时 @ 提及数据源首帧即下发（不等会话详情回填）', () => {
    // 进入开发页：URL 已有 conversationId，但 conversationInfo 尚为 null（详情请求未返回）
    mockUseModel.mockReturnValue(
      createConversationInfoModel({ conversationInfo: null }),
    );
    mockUseLocation.mockReturnValue({
      key: 'route-1',
      search: '?agentId=88&conversationId=7001',
      state: {},
    });

    render(<AgentConversationChatPanel selectedComputerId="computer-prop" />);

    // 首帧即拿到 @ 文件数据源：输入 @ 不再退化为纯文本
    expect(typeof latestUnifiedProps().onFetchMentionFiles).toBe('function');
  });
});
