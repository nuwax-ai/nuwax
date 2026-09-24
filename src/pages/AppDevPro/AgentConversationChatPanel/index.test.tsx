import { PageModelScopeContext } from '@/modelScopes/usePageModel';
import AgentConversationChatPanel from '@/pages/AppDevPro/AgentConversationChatPanel';
import AgentWorkbenchChatPanel from '@/pages/ConversationAgent/AgentConversationChatPanel';
import { TaskStatus } from '@/types/enums/agent';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUnifiedChatSession, mockUseModel, mockUseLocation, mockHistory } =
  vi.hoisted(() => ({
    mockUnifiedChatSession: vi.fn(),
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

vi.mock('umi', () => ({
  history: mockHistory,
  useLocation: (...args: unknown[]) => mockUseLocation(...args),
  useModel: (...args: unknown[]) => mockUseModel(...args),
  useParams: () => ({}),
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
    isAwaitingChatTerminal: false,
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

describe('AppDevPro AgentConversationChatPanel 双线分派', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHistory.action = 'PUSH';
    mockUseLocation.mockReturnValue({
      key: 'route-1',
      state: {},
    });
  });

  it('V1 回落：runtime 线为空时发送走旧线 onMessageSend（原行为不回归）', () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);

    render(
      <AgentConversationChatPanel
        runtimeLine={null}
        selectedComputerId="computer-prop"
      />,
    );
    latestUnifiedProps().onSendMessage(
      'build it',
      [{ name: 'a.ts' }],
      [11],
      undefined,
      'ask',
    );

    expect(model.onMessageSend).toHaveBeenCalledWith({
      id: 7001,
      messageInfo: 'build it',
      files: [{ name: 'a.ts' }],
      infos: [{ id: 1, type: 'Plugin' }],
      sandboxId: 'computer-prop',
      debug: true,
      skillIds: [11],
      agentMode: 'ask',
    });
  });

  it('V2 线：runtimeLine prop 的 conversationProps 末尾展开覆盖（页面级外提注入，bug 2477）', () => {
    // session 由页面级外提（URL id 即建）经 runtimeLine prop 注入，面板不自建
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);
    const runtimeOnSendMessage = vi.fn();
    const runtimeMessageList = [{ id: 'r1' }];

    render(
      <AgentConversationChatPanel
        runtimeLine={
          {
            conversationProps: {
              onSendMessage: runtimeOnSendMessage,
              messageList: runtimeMessageList,
            },
          } as any
        }
      />,
    );

    // 末尾展开覆盖：UnifiedChatSession 收到的发送实现与消息列表是 runtime 线版本
    expect(latestUnifiedProps().onSendMessage).toBe(runtimeOnSendMessage);
    expect(latestUnifiedProps().messageList).toBe(runtimeMessageList);
  });

  it('V2 线：runtimeLine prop 为 null 时回落旧线原值（flag 关，页面透传 null）', () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);

    render(<AgentConversationChatPanel runtimeLine={null} />);

    expect(latestUnifiedProps().messageList).toBe(model.messageList);
    expect(latestUnifiedProps().onSendMessage).not.toBeUndefined();
  });

  it('V1 回落：model 活跃态下降沿触发会话结束回调（原触发点不回归）', () => {
    const model = createConversationInfoModel({
      isConversationActive: true,
    });
    mockUseModel.mockReturnValue(model);
    const onConversationEnd = vi.fn();
    const { rerender } = render(
      <AgentConversationChatPanel
        runtimeLine={null}
        onConversationEnd={onConversationEnd}
      />,
    );

    model.isConversationActive = false;
    rerender(
      <AgentConversationChatPanel
        runtimeLine={null}
        onConversationEnd={onConversationEnd}
      />,
    );

    expect(onConversationEnd).toHaveBeenCalledTimes(1);
  });

  it('V2 线：结束沿消费 runtimeLine 生效值，model 置位点不执行（恒 false 不干扰）', () => {
    const model = createConversationInfoModel({
      isConversationActive: false,
    });
    mockUseModel.mockReturnValue(model);
    const onConversationEnd = vi.fn();
    const runtimeLineActive = {
      conversationProps: { isConversationActive: true },
      effectiveIsActive: true,
    } as any;
    const runtimeLineInactive = {
      conversationProps: { isConversationActive: false },
      effectiveIsActive: false,
    } as any;
    const { rerender } = render(
      <AgentConversationChatPanel
        runtimeLine={runtimeLineActive}
        onConversationEnd={onConversationEnd}
      />,
    );
    expect(onConversationEnd).not.toHaveBeenCalled();

    rerender(
      <AgentConversationChatPanel
        runtimeLine={runtimeLineInactive}
        onConversationEnd={onConversationEnd}
      />,
    );

    expect(onConversationEnd).toHaveBeenCalledTimes(1);
  });

  it('常驻实例使用固定会话 ID 和入页状态，不跟随当前路由变化', () => {
    const model = createConversationInfoModel({ loadingConversation: true });
    mockUseModel.mockReturnValue(model);
    const onChangeSelectedComputerId = vi.fn();
    const routeSnapshot = {
      conversationId: 7001,
      key: 'app-route',
      state: { selectedComputerId: 'app-computer', modelId: 456 },
      action: 'PUSH' as const,
    };
    const { rerender } = render(
      <AgentConversationChatPanel
        routeSnapshot={routeSnapshot}
        onChangeSelectedComputerId={onChangeSelectedComputerId}
      />,
    );
    expect(latestUnifiedProps().isLoading).toBe(false);
    expect(latestUnifiedProps().selectedModelId).toBe(456);

    mockUseLocation.mockReturnValue({
      key: 'other-route',
      state: { selectedComputerId: 'other-computer', modelId: 999 },
    });
    rerender(
      <AgentConversationChatPanel
        routeSnapshot={routeSnapshot}
        onChangeSelectedComputerId={onChangeSelectedComputerId}
      />,
    );

    expect(onChangeSelectedComputerId).toHaveBeenCalledTimes(1);
    expect(onChangeSelectedComputerId).toHaveBeenCalledWith('app-computer');
    expect(latestUnifiedProps().selectedModelId).toBe(456);
    expect(latestUnifiedProps().isLoading).toBe(false);
  });

  it('Agent 与 IDE 两个并存面板只消费各自作用域的消息和发送动作', () => {
    const globalModel = createConversationInfoModel({
      conversationInfo: { id: 9999 },
      messageList: [{ id: 'global' }],
    });
    const agentModel = createConversationInfoModel({
      conversationInfo: { id: 7001, agent: { agentId: 88 } },
      messageList: [{ id: 'agent-message' }],
      manualComponents: [],
    });
    const ideModel = createConversationInfoModel({
      conversationInfo: { id: 7002, agent: { agentId: 89 } },
      messageList: [{ id: 'ide-message' }],
      manualComponents: [],
    });
    mockUseModel.mockReturnValue(globalModel);

    render(
      <>
        <PageModelScopeContext.Provider
          value={{ conversationInfo: agentModel }}
        >
          <AgentWorkbenchChatPanel
            routeSnapshot={{
              search: '?agentId=88&conversationId=7001',
              key: 'agent-a',
              state: {},
              action: 'POP',
            }}
          />
        </PageModelScopeContext.Provider>
        <PageModelScopeContext.Provider value={{ conversationInfo: ideModel }}>
          <AgentConversationChatPanel
            routeSnapshot={{
              conversationId: 7002,
              key: 'ide-b',
              state: {},
              action: 'POP',
            }}
          />
        </PageModelScopeContext.Provider>
      </>,
    );

    const [agentProps, ideProps] = mockUnifiedChatSession.mock.calls.map(
      (call) => call[0],
    );
    expect(agentProps.messageList).toEqual([{ id: 'agent-message' }]);
    expect(ideProps.messageList).toEqual([{ id: 'ide-message' }]);
    agentProps.onSendMessage('agent prompt');
    ideProps.onSendMessage('ide prompt');
    expect(agentModel.onMessageSend).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7001, messageInfo: 'agent prompt' }),
    );
    expect(ideModel.onMessageSend).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7002, messageInfo: 'ide prompt' }),
    );
    expect(globalModel.onMessageSend).not.toHaveBeenCalled();
  });
});
