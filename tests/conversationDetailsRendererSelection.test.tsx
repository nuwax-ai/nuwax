/**
 * ConversationDetails 渲染线选择合同测试（V2 双线重构·调试接入）：
 * - 详情页已纳入 UnifiedChatSession，默认使用 V2；
 * - URL `?conversationRenderer=v1` 可显式回退 V1。
 */
import ConversationDetails from '@/components/business-component/ConversationDetails';
import type { AgentDetailDto } from '@/types/interfaces/agent';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

Element.prototype.scrollTo = vi.fn() as any;
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error jsdom polyfill
global.ResizeObserver = ResizeObserverStub;

const h = vi.hoisted(() => ({
  // onResultSuccess 读取的字段：openingChatMsg 进入 messageList，付费字段
  // 走订阅分支。用例内可改 sandboxId 等字段。
  detailResult: {
    name: 'Mock Agent',
    icon: '',
    type: 'TaskAgent',
    openingChatMsg: '开场白消息',
    conversationId: 777,
    variables: [],
    guidQuestionDtos: [],
    manualComponents: [],
    paymentRequired: false,
    subscribed: true,
  } as unknown as AgentDetailDto,
  // 捕获透传给 ChatInputUnified 的电脑选择相关 props（BUG #2673）
  lastChatInputProps: null as {
    fixedSelection?: boolean;
    agentSandboxId?: string | number;
    selectedComputerId?: string;
    onComputerSelect?: (id: string) => void;
  } | null,
}));

vi.mock('umi', () => ({
  useModel: (ns: string) => {
    const models: Record<string, unknown> = {
      layout: { isMobile: false },
      conversationHistory: { runHistoryItem: vi.fn() },
      useOpenApp: {
        handleSetAppAgentDetail: vi.fn(),
        isAppSidebarMode: false,
        isAppSidebarVisible: false,
        toggleAppSidebarVisible: vi.fn(),
        setAppAgentDetailLoading: vi.fn(),
        openPaymentModal: false,
        setOpenPaymentModal: vi.fn(),
        incrementCalledTrialCount: vi.fn(),
        localCalledTrialCount: 0,
      },
      chat: {
        pagePreviewData: null,
        hidePagePreview: vi.fn(),
        showPagePreview: vi.fn(),
      },
      tenantConfigInfo: { tenantConfigInfo: { enableSubscription: 0 } },
    };
    return models[ns] ?? {};
  },
  useLocation: () => ({ pathname: '/agent', search: '', query: {} }),
  history: { push: vi.fn(), replace: vi.fn() },
  // useRequest 最小 shim：run 即调 service 并路由 onSuccess/onError
  useRequest: (
    service: (...args: unknown[]) => Promise<unknown>,
    options: {
      onSuccess?: (result: unknown) => void;
      onError?: (error: unknown) => void;
    } = {},
  ) => ({
    run: (...args: unknown[]) =>
      service(...args).then(
        (result) => options.onSuccess?.(result),
        (error) => options.onError?.(error),
      ),
    loading: false,
  }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock('@/services/agentDev', () => ({
  apiPublishedAgentInfo: vi.fn(() => Promise.resolve(h.detailResult)),
}));
vi.mock(
  '@/components/business-component/ConversationDetails/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
vi.mock(
  '@/components/business-component/UnifiedChatSession/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ChatContentArea/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
// 桶导入过重：按名替身（本组件只用这两个）
vi.mock('@/components/business-component', () => ({
  CopyToSpaceComponent: () => null,
  PagePreviewIframe: () => null,
}));
vi.mock('@/components/AgentSidebar', async () => {
  // forwardRef 需要真实 React；vi.mock 工厂不能引用顶层 import，走 importActual
  const actualReact = await vi.importActual<typeof import('react')>('react');
  return {
    default: actualReact.forwardRef(() => <div data-testid="agent-sidebar" />),
  };
});
vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: { messageInfo: { id: unknown } }) => (
    <div data-testid="chat-view" data-message-id={String(messageInfo.id)} />
  ),
}));
// ConversationDetails 已迁移到统一输入组件（保持原 testid 便于断言稳定）
vi.mock('@/components/business-component/ChatInputUnified', () => ({
  default: (props: {
    fixedSelection?: boolean;
    agentSandboxId?: string | number;
    selectedComputerId?: string;
    onComputerSelect?: (id: string) => void;
  }) => {
    h.lastChatInputProps = {
      fixedSelection: props.fixedSelection,
      agentSandboxId: props.agentSandboxId,
      selectedComputerId: props.selectedComputerId,
      onComputerSelect: props.onComputerSelect,
    };
    return (
      <div
        data-testid="chat-input-home"
        data-fixed-selection={String(props.fixedSelection)}
        data-selected-computer={String(props.selectedComputerId ?? '')}
      />
    );
  },
}));
vi.mock('@/components/custom/TooltipIcon', () => ({
  default: ({ title, onClick }: { title: string; onClick?: () => void }) => (
    <button type="button" data-testid="tooltip-icon" onClick={onClick}>
      {title}
    </button>
  ),
}));
vi.mock('@/components/NewConversationSet', () => ({ default: () => null }));
vi.mock('@/components/RecommendList', () => ({ default: () => null }));
vi.mock('@/components/AgentChatEmpty', () => ({ default: () => null }));
vi.mock('@/components/ResizableSplit', () => ({
  // ResizableSplit 以 left/right props 渲染两栏，而非 children
  default: ({
    left,
    right,
  }: {
    left: React.ReactNode;
    right: React.ReactNode;
  }) => (
    <>
      {left}
      {right}
    </>
  ),
}));
vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));
vi.mock(
  '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer',
  () => ({
    readAgentModeCache: vi.fn(() => undefined),
    writeAgentModeCache: vi.fn(),
    useAgentInterventionLayer: () => ({
      agentMode: 'yolo',
      chatLayerProps: {},
      agentModeInputProps: {
        agentMode: 'yolo',
        onAgentModeChange: vi.fn(),
      },
    }),
  }),
);
vi.mock('@/components/business-component/AgentIntervention', () => ({
  AgentInterventionChatLayer: () => null,
  useAgentInterventionLayer: () => ({
    agentMode: 'yolo',
    chatLayerProps: {},
    agentModeInputProps: {
      agentMode: 'yolo',
      onAgentModeChange: vi.fn(),
    },
  }),
}));
// 真实局部 state：详情回包 setAgentDetail 后 sandboxId 才能透传给 UnifiedChatSession
vi.mock('@/hooks/useAgentDetails', async () => {
  const actualReact = await vi.importActual<typeof import('react')>('react');
  return {
    default: () => {
      const [agentDetail, setAgentDetail] =
        actualReact.useState<AgentDetailDto | null>(null);
      return { agentDetail, setAgentDetail };
    },
  };
});
vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    agentSubscriptionPlans: [],
    loadingAgentSubscriptionPlans: false,
    mySubscriptionInfo: undefined,
    loadingMySubscription: false,
    createSubscriptionOrder: vi.fn(),
    queryAgentSubscriptionPlans: vi.fn(),
  }),
}));
vi.mock('@/utils/router', () => ({ jumpToPageDevelop: vi.fn() }));
vi.mock('@/utils/hostBridge', () => ({
  needsTopRightAvoid: vi.fn(() => false),
  shellAvoid: vi.fn(),
  hasHostBridge: vi.fn(() => false),
  hostBridge: { theme: { syncTheme: vi.fn() } },
}));
vi.mock('@/features/conversation/presentation-v2/react', () => ({
  ConversationRendererV2: () => <div data-testid="conversation-renderer-v2" />,
}));

const setSearch = (search: string) => {
  window.history.replaceState(null, '', search || location.pathname);
};

describe('ConversationDetails 统一渲染线选择', () => {
  beforeEach(() => {
    localStorage.clear();
    setSearch('');
    h.lastChatInputProps = null;
    h.detailResult = {
      name: 'Mock Agent',
      icon: '',
      type: 'TaskAgent',
      openingChatMsg: '开场白消息',
      conversationId: 777,
      variables: [],
      guidQuestionDtos: [],
      manualComponents: [],
      paymentRequired: false,
      subscribed: true,
    } as unknown as AgentDetailDto;
  });

  afterEach(() => {
    localStorage.clear();
    setSearch('');
    vi.restoreAllMocks();
  });

  it('默认使用 V2', async () => {
    render(<ConversationDetails agentId={1} />);
    await waitFor(() => {
      expect(
        screen.getByTestId('conversation-renderer-v2'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('chat-view')).toBeNull();
  });

  it('URL 指定 v1 时可紧急回退逐消息 ChatView', async () => {
    setSearch('?conversationRenderer=v1');
    render(<ConversationDetails agentId={1} />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-view')).toHaveLength(1);
    });
    expect(screen.queryByTestId('conversation-renderer-v2')).toBeNull();
  });
});

/**
 * BUG #2673：独立会话入口 /agent/:id 有开场白时，不得因本地开场白伪造
 * 持久化 id 误锁电脑选择。影响面仅 ConversationDetails（Agent 详情/主页），
 * 不改 UnifiedChatSession / resolveComputerSelection 共享逻辑。
 */
describe('ConversationDetails 电脑选择（开场白不误锁）', () => {
  beforeEach(() => {
    localStorage.clear();
    setSearch('');
    h.lastChatInputProps = null;
    h.detailResult = {
      name: 'Mock Agent',
      icon: '',
      type: 'TaskAgent',
      openingChatMsg: '开场白消息',
      conversationId: 777,
      variables: [],
      guidQuestionDtos: [],
      manualComponents: [],
      paymentRequired: false,
      subscribed: true,
    } as unknown as AgentDetailDto;
  });

  afterEach(() => {
    localStorage.clear();
    setSearch('');
    vi.restoreAllMocks();
  });

  it('有开场白且未绑定个人电脑时 fixedSelection 为 false（可切换电脑）', async () => {
    render(<ConversationDetails agentId={1602} />);
    await waitFor(() => {
      expect(screen.getByTestId('chat-input-home')).toBeInTheDocument();
      expect(h.lastChatInputProps?.fixedSelection).toBe(false);
    });
    // atHomePanel 必须透传真实 agent.sandboxId（未绑定则为空），不能把已选电脑 id 当绑定
    expect(h.lastChatInputProps?.agentSandboxId).toBeFalsy();
  });

  it('切换一次个人电脑后仍可再切（不误判为智能体绑定锁死）', async () => {
    render(<ConversationDetails agentId={3091} />);
    await waitFor(() => {
      expect(h.lastChatInputProps?.onComputerSelect).toBeTypeOf('function');
      expect(h.lastChatInputProps?.fixedSelection).toBe(false);
    });
    // 模拟用户首次切换到个人电脑（原 bug：此后 isHomeAgentSandboxBound 误为 true）
    await act(async () => {
      h.lastChatInputProps!.onComputerSelect!('339');
    });
    await waitFor(() => {
      expect(h.lastChatInputProps?.selectedComputerId).toBe('339');
      expect(h.lastChatInputProps?.fixedSelection).toBe(false);
      expect(h.lastChatInputProps?.agentSandboxId).toBeFalsy();
    });
  });

  it('智能体绑定真实个人电脑时 fixedSelection 为 true（恢复原锁定逻辑）', async () => {
    h.detailResult = {
      ...h.detailResult,
      sandboxId: '339',
    } as unknown as AgentDetailDto;
    render(<ConversationDetails agentId={1602} />);
    await waitFor(() => {
      expect(screen.getByTestId('chat-input-home')).toBeInTheDocument();
      expect(h.lastChatInputProps?.fixedSelection).toBe(true);
      expect(String(h.lastChatInputProps?.agentSandboxId)).toBe('339');
    });
  });
});
