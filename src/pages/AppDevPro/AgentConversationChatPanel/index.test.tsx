import AgentConversationChatPanel from '@/pages/AppDevPro/AgentConversationChatPanel';
import { TaskStatus } from '@/types/enums/agent';
import { render } from '@testing-library/react';
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
    // 默认无 runtime 线（V1 形态），V2 用例自行覆写
    mockUseRuntimeSession.mockReturnValue(null);
    mockUseLocation.mockReturnValue({
      key: 'route-1',
      state: {},
    });
  });

  it('V1 回落：runtime 线为空时发送走旧线 onMessageSend（原行为不回归）', () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);

    render(<AgentConversationChatPanel selectedComputerId="computer-prop" />);
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

  it('V2 线：runtimeLine 以会话 id 与面板选中电脑挂载，conversationProps 末尾展开覆盖', () => {
    const model = createConversationInfoModel();
    mockUseModel.mockReturnValue(model);
    const runtimeOnSendMessage = vi.fn();
    mockUseRuntimeSession.mockReturnValue({
      conversationProps: { onSendMessage: runtimeOnSendMessage },
    });

    render(<AgentConversationChatPanel selectedComputerId="computer-prop" />);

    expect(mockUseRuntimeSession).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 7001,
        // 空串兜底 undefined 的取沙箱链：选中电脑透传给 runtime 线发送
        getSandboxId: expect.any(Function),
      }),
    );
    // 末尾展开覆盖：UnifiedChatSession 收到的发送实现是 runtime 线版本
    expect(latestUnifiedProps().onSendMessage).toBe(runtimeOnSendMessage);
  });

  it('V2 线：getSandboxId 返回面板当前选中电脑（空串兜底 undefined）', () => {
    mockUseModel.mockReturnValue(createConversationInfoModel());
    mockUseRuntimeSession.mockReturnValue({ conversationProps: {} });

    render(<AgentConversationChatPanel selectedComputerId="" />);

    const options = mockUseRuntimeSession.mock.calls.at(-1)?.[0] as any;
    expect(options.getSandboxId()).toBeUndefined();
  });

  it('V1 回落：model 活跃态下降沿触发会话结束回调（原触发点不回归）', () => {
    const model = createConversationInfoModel({
      isConversationActive: true,
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

  it('V2 线：结束沿消费 conversationProps 生效值，model 置位点不执行（恒 false 不干扰）', () => {
    const model = createConversationInfoModel({
      isConversationActive: false,
    });
    mockUseModel.mockReturnValue(model);
    const onConversationEnd = vi.fn();
    mockUseRuntimeSession.mockReturnValue({
      conversationProps: { isConversationActive: true },
    });
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
});
