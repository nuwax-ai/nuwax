/**
 * UnifiedChatSession 行为单测（不改业务代码）
 *
 * 覆盖：
 * - inputDisabled / wholeDisabled（必填变量）
 * - 发送走 trySend + resumeAutoConsume
 * - intervention resume 走 rawSend
 * - shouldShowSessionSuggest（活跃 / 有队列时隐藏）
 * - showTaskExecutingWait（流式中不展示）
 * - effectiveRoleInfo 兜底与优先外部 roleInfo
 * - allowChooseMode 控制模式选择器
 */
import UnifiedChatSession from '@/components/business-component/UnifiedChatSession';
import { DefaultSelectedEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockTrySend,
  mockRawSend,
  mockResumeAutoConsume,
  mockPauseAutoConsume,
  queueState,
  interventionCapture,
  chatInputPropsRef,
  contentAreaPropsRef,
  mockUseActiveInterventionQueue,
} = vi.hoisted(() => ({
  mockTrySend: vi.fn(),
  mockRawSend: vi.fn(),
  mockResumeAutoConsume: vi.fn(),
  mockPauseAutoConsume: vi.fn(),
  queueState: { hasQueuedMessages: false },
  interventionCapture: {
    onSendMessage: null as null | ((msg: string, files?: unknown[]) => void),
  },
  chatInputPropsRef: { current: null as any },
  contentAreaPropsRef: { current: null as any },
  mockUseActiveInterventionQueue: vi.fn(() => []),
}));

vi.mock('@/constants/feature.constants', () => ({
  ENABLE_CHAT_MESSAGE_QUEUE: true,
}));

vi.mock('umi', () => ({
  useModel: () => ({}),
  request: vi.fn(),
  history: { push: vi.fn(), replace: vi.fn() },
  useLocation: () => ({ pathname: '/', search: '' }),
  useParams: () => ({}),
  Link: ({ children }: any) => children,
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (k: string) => k,
  t: (k: string) => k,
}));

vi.mock(
  '@/components/business-component/UnifiedChatSession/index.less',
  () => ({
    default: new Proxy({}, { get: () => 'cls' }),
  }),
);

vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ChatContentArea/index.less',
  () => ({
    default: new Proxy({}, { get: () => 'cls' }),
  }),
);

vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ChatContentArea',
  () => ({
    default: (props: any) => {
      contentAreaPropsRef.current = props;
      return (
        <div data-testid="chat-content-area">
          <span data-testid="role-assistant-name">
            {props.effectiveRoleInfo?.assistant?.name}
          </span>
          <span data-testid="show-suggest">
            {String(!!props.shouldShowSessionSuggest)}
          </span>
          <span data-testid="show-task-wait">
            {String(!!props.showTaskExecutingWait)}
          </span>
          {props.showTaskExecutingWait && (
            <span>PC.Pages.Chat.agentExecutingWait</span>
          )}
          {props.shouldShowSessionSuggest && (
            <div data-testid="session-suggest">
              {(props.chatSuggestList || []).join(',')}
            </div>
          )}
        </div>
      );
    },
  }),
);

vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ChatInputHomeIndependent',
  () => ({
    default: (props: any) => {
      chatInputPropsRef.current = props;
      return (
        <div data-testid="chat-input">
          <button
            type="button"
            data-testid="send-btn"
            onClick={() => props.onEnter?.('hello from input')}
          >
            send
          </button>
          <span data-testid="whole-disabled">
            {String(!!props.wholeDisabled)}
          </span>
          <span data-testid="show-agent-mode">
            {String(!!props.showAgentModeSelector)}
          </span>
        </div>
      );
    },
  }),
);

vi.mock('@/pages/Chat/components/ConversationStatus', () => ({
  default: () => <div data-testid="conversation-status" />,
}));

vi.mock('@/components/business-component/AgentIntervention', () => ({
  AgentInterventionChatLayer: () => <div data-testid="intervention-layer" />,
  useAgentInterventionLayer: (opts: any) => {
    interventionCapture.onSendMessage = opts.onSendMessage;
    return {
      agentMode: 'yolo',
      chatLayerProps: {},
      agentModeInputProps: {
        agentMode: 'yolo',
        onAgentModeChange: vi.fn(),
        showAgentModeSelector: false,
      },
    };
  },
}));

vi.mock(
  '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue',
  () => ({
    useActiveInterventionQueue: (...args: unknown[]) =>
      mockUseActiveInterventionQueue(...args),
  }),
);

vi.mock('@/components/business-component/MessageQueue', () => ({
  default: () => <div data-testid="queue-panel" />,
  useUnifiedChatQueue: () => ({
    queue: queueState.hasQueuedMessages
      ? [{ id: 'q1', text: 'queued', queuedAt: new Date() }]
      : [],
    hasQueuedMessages: queueState.hasQueuedMessages,
    trySend: mockTrySend,
    sendNow: vi.fn(),
    deleteQueued: vi.fn(),
    editQueued: vi.fn(),
    handleEditQueued: vi.fn(),
    clearQueue: vi.fn(),
    reorder: vi.fn(),
    rawSend: mockRawSend,
    resumeAutoConsume: mockResumeAutoConsume,
    pauseAutoConsume: mockPauseAutoConsume,
  }),
}));

vi.mock(
  '@/components/business-component/UnifiedChatSession/hooks/useUnifiedChatScroll',
  () => ({
    useUnifiedChatScroll: () => ({
      messageViewRef: { current: null },
      scrollBtnVisible: false,
      isHoveringChat: false,
      handleSendScrollReset: vi.fn(),
      onScrollBottom: vi.fn(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
    }),
  }),
);

vi.mock(
  '@/components/business-component/UnifiedChatSession/hooks/useLoadMoreHistory',
  () => ({
    useLoadMoreHistory: () => ({ loadMoreRef: { current: null } }),
  }),
);

vi.mock(
  '@/components/business-component/UnifiedChatSession/hooks/useConversationStreamResume',
  () => ({
    useConversationStreamResume: vi.fn(),
  }),
);

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('UnifiedChatSession 行为', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queueState.hasQueuedMessages = false;
    interventionCapture.onSendMessage = null;
    chatInputPropsRef.current = null;
    contentAreaPropsRef.current = null;
    mockUseActiveInterventionQueue.mockReturnValue([]);
    // @ts-expect-error jsdom polyfill
    global.ResizeObserver = ResizeObserverStub;
    Element.prototype.scrollTo = vi.fn() as typeof Element.prototype.scrollTo;
  });

  it('必填变量未填齐时 wholeDisabled=true', () => {
    render(
      <UnifiedChatSession
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
        requiredNameList={['city']}
        variableParams={null}
      />,
    );
    expect(screen.getByTestId('whole-disabled')).toHaveTextContent('true');
  });

  it('必填变量已填齐时 wholeDisabled=false', () => {
    render(
      <UnifiedChatSession
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
        requiredNameList={['city']}
        variableParams={{ city: 'Shanghai' }}
      />,
    );
    expect(screen.getByTestId('whole-disabled')).toHaveTextContent('false');
  });

  it('有 pending intervention 时 wholeDisabled=true', () => {
    mockUseActiveInterventionQueue.mockReturnValue([
      { kind: 'mcp_ask', sortKey: 1 } as any,
    ]);
    render(
      <UnifiedChatSession
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
      />,
    );
    expect(screen.getByTestId('whole-disabled')).toHaveTextContent('true');
    expect(screen.queryByTestId('queue-panel')).toBeNull();
  });

  it('点击发送：resumeAutoConsume + trySend', async () => {
    render(
      <UnifiedChatSession
        conversationId={11}
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
      />,
    );

    await userEvent.click(screen.getByTestId('send-btn'));
    expect(mockResumeAutoConsume).toHaveBeenCalled();
    expect(mockTrySend).toHaveBeenCalledWith(
      'hello from input',
      [],
      [],
      undefined,
      undefined,
    );
  });

  it('intervention onSendMessage 走 rawSend 绕过队列', () => {
    render(
      <UnifiedChatSession
        conversationId={11}
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
      />,
    );

    expect(interventionCapture.onSendMessage).toBeTypeOf('function');
    act(() => {
      interventionCapture.onSendMessage?.('resume answer', []);
    });
    expect(mockRawSend).toHaveBeenCalledWith('resume answer', []);
    expect(mockTrySend).not.toHaveBeenCalled();
  });

  it('会话活跃时不展示 session suggest', () => {
    render(
      <UnifiedChatSession
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
        chatSuggestList={['s1']}
        isConversationActive
      />,
    );
    expect(screen.getByTestId('show-suggest')).toHaveTextContent('false');
    expect(screen.queryByTestId('session-suggest')).toBeNull();
  });

  it('有排队消息时不展示 session suggest', () => {
    queueState.hasQueuedMessages = true;
    render(
      <UnifiedChatSession
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
        chatSuggestList={['s1']}
        isConversationActive={false}
      />,
    );
    expect(screen.getByTestId('show-suggest')).toHaveTextContent('false');
  });

  it('空闲且无队列时展示 session suggest', () => {
    render(
      <UnifiedChatSession
        messageList={[{ id: 'm1', text: 'hi' } as MessageInfo]}
        chatSuggestList={['suggest-a']}
        isConversationActive={false}
      />,
    );
    expect(screen.getByTestId('show-suggest')).toHaveTextContent('true');
    expect(screen.getByTestId('session-suggest')).toHaveTextContent(
      'suggest-a',
    );
  });

  it('taskStatus=EXECUTING 但末条仍在流式时不展示等待提示', () => {
    render(
      <UnifiedChatSession
        messageList={
          [
            {
              id: 'a1',
              text: 'streaming',
              status: MessageStatusEnum.Loading,
            },
          ] as MessageInfo[]
        }
        agentInfo={{ type: AgentTypeEnum.TaskAgent }}
        conversationInfo={{ taskStatus: TaskStatus.EXECUTING } as any}
      />,
    );
    expect(screen.getByTestId('show-task-wait')).toHaveTextContent('false');
    expect(screen.queryByText('PC.Pages.Chat.agentExecutingWait')).toBeNull();
  });

  it('taskStatus=EXECUTING 且末条 Complete 时展示等待提示', () => {
    render(
      <UnifiedChatSession
        messageList={
          [
            {
              id: 'a1',
              text: 'done',
              status: MessageStatusEnum.Complete,
            },
          ] as MessageInfo[]
        }
        conversationInfo={{ taskStatus: TaskStatus.EXECUTING } as any}
      />,
    );
    expect(screen.getByTestId('show-task-wait')).toHaveTextContent('true');
    expect(
      screen.getByText('PC.Pages.Chat.agentExecutingWait'),
    ).toBeInTheDocument();
  });

  it('注入 sessionView（Facade Props）时覆盖内部派生：原始字段不满足也按注入视图展示', () => {
    render(
      <UnifiedChatSession
        messageList={
          [
            {
              id: 'a1',
              text: 'streaming',
              status: MessageStatusEnum.Loading,
            },
          ] as MessageInfo[]
        }
        conversationInfo={{ taskStatus: TaskStatus.EXECUTING } as any}
        sessionView={{
          phase: 'streaming',
          canSendNow: false,
          shouldEnqueue: true,
          canPollSnapshot: false,
          shouldShowStop: true,
          shouldShowTaskWait: true,
          shouldShowSuggest: false,
          queueGate: {
            streamActive: true,
            taskExecuting: true,
            enqueueBlocked: true,
            consumeBlocked: true,
          },
        }}
      />,
    );
    // 内部派生（末条 Loading）应为 false；注入视图置 true 后以注入值为准
    expect(screen.getByTestId('show-task-wait')).toHaveTextContent('true');
    expect(
      screen.getByText('PC.Pages.Chat.agentExecutingWait'),
    ).toBeInTheDocument();
  });

  it('优先使用外部 roleInfo', () => {
    const roleInfo: RoleInfo = {
      assistant: { name: 'ExternalBot', avatar: 'a.png' },
      system: { name: 'ExternalSys', avatar: 's.png' },
    };
    render(
      <UnifiedChatSession
        roleInfo={roleInfo}
        agentInfo={{ name: 'AgentName', icon: 'i.png' }}
        messageList={[]}
      />,
    );
    expect(screen.getByTestId('role-assistant-name')).toHaveTextContent(
      'ExternalBot',
    );
  });

  it('未传 roleInfo 时用 agentInfo 组装', () => {
    render(
      <UnifiedChatSession
        agentInfo={{ name: 'FromAgent', icon: 'icon.png' }}
        messageList={[]}
      />,
    );
    expect(screen.getByTestId('role-assistant-name')).toHaveTextContent(
      'FromAgent',
    );
  });

  it('allowChooseMode=Yes 时展示 Agent 模式选择器', () => {
    render(
      <UnifiedChatSession
        agentInfo={{ allowChooseMode: DefaultSelectedEnum.Yes }}
        messageList={[]}
      />,
    );
    expect(screen.getByTestId('show-agent-mode')).toHaveTextContent('true');
  });

  it('TaskAgent 且有消息时渲染 ConversationStatus', () => {
    render(
      <UnifiedChatSession
        agentInfo={{ type: AgentTypeEnum.TaskAgent }}
        messageList={[{ id: 'm1', text: 'x' } as MessageInfo]}
      />,
    );
    expect(screen.getByTestId('conversation-status')).toBeInTheDocument();
  });
});
