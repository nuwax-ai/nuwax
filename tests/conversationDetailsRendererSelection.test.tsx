/**
 * ConversationDetails 渲染线选择合同测试（V2 双线重构·调试接入）：
 * - 本页基线恒 V1（不接全局偏好链——全局默认 v2 也不改变本页观感）；
 * - 会话覆盖（session override）显式切 V2；清除后回 V1；
 * - 头部 RendererLineToggle 交互：Segmented 写会话覆盖，「恢复默认」清除。
 */
import ConversationDetails from '@/components/business-component/ConversationDetails';
import type { AgentDetailDto } from '@/types/interfaces/agent';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { detailResult } = vi.hoisted(() => ({
  // onResultSuccess 读取的字段：openingChatMsg 走入 messageList、conversationId
  // 决定会话覆盖的 key、paymentRequired/subscribed 走付费分支
  detailResult: {
    name: 'Mock Agent',
    icon: '',
    openingChatMsg: '开场白消息',
    conversationId: 777,
    variables: [],
    guidQuestionDtos: [],
    manualComponents: [],
    paymentRequired: false,
    subscribed: true,
  } as unknown as AgentDetailDto,
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
  apiPublishedAgentInfo: vi.fn(() => Promise.resolve(detailResult)),
}));
vi.mock(
  '@/components/business-component/ConversationDetails/index.less',
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
vi.mock('@/components/ChatInputHome', () => ({
  default: () => <div data-testid="chat-input-home" />,
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
  }),
);
vi.mock('@/hooks/useAgentDetails', () => ({
  default: () => ({
    agentDetail: { name: 'Mock Agent', icon: '' },
    setAgentDetail: vi.fn(),
  }),
}));
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
vi.mock('@/utils/nuwaClawBridge', () => ({
  needsTopRightAvoid: vi.fn(() => false),
  shellAvoid: vi.fn(),
  isNuwaClaw: vi.fn(() => false),
  nuwaClawHost: { theme: { syncTheme: vi.fn() } },
}));
vi.mock('@/features/conversation/presentation-v2/react', () => ({
  ConversationRendererV2: () => <div data-testid="conversation-renderer-v2" />,
}));

import {
  setGlobalRendererVersion,
  setSessionRendererOverride,
} from '@/utils/conversationRendererPreference';

const setSearch = (search: string) => {
  window.history.replaceState(null, '', search || location.pathname);
};

describe('ConversationDetails 渲染线选择（默认恒 V1，按会话显式切 V2）', () => {
  beforeEach(() => {
    localStorage.clear();
    setSearch('');
  });

  afterEach(() => {
    localStorage.clear();
    setSearch('');
    vi.restoreAllMocks();
  });

  it('默认 V1：即使全局偏好为 v2 也不改变本页（不接全局链），逐消息 ChatView', async () => {
    setGlobalRendererVersion('v2');
    render(<ConversationDetails agentId={1} />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-view')).toHaveLength(1);
    });
    expect(screen.queryByTestId('conversation-renderer-v2')).toBeNull();
  });

  it('会话覆盖 v2：渲染 V2 渲染器，不再出现 V1 ChatView', async () => {
    setSessionRendererOverride(777, 'v2');
    render(<ConversationDetails agentId={1} />);
    await waitFor(() => {
      expect(
        screen.getByTestId('conversation-renderer-v2'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('chat-view')).toBeNull();
  });

  it('头部调试按钮：切到 V2 写会话覆盖；「恢复默认」清除后回 V1', async () => {
    const user = userEvent.setup();
    render(<ConversationDetails agentId={1} />);
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-view')).toHaveLength(1);
    });

    // 打开 Popover，点「V2 工作轨迹」
    await user.click(screen.getByTestId('conversation-details-renderer-entry'));
    await user.click(
      screen.getByText('PC.Components.ConversationDetails.rendererLineV2'),
    );
    await waitFor(() => {
      expect(
        screen.getByTestId('conversation-renderer-v2'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('chat-view')).toBeNull();

    // 「恢复默认（经典）」清除覆盖 → 回 V1
    await user.click(
      screen.getByText('PC.Components.ConversationDetails.rendererLineReset'),
    );
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-view')).toHaveLength(1);
    });
    expect(screen.queryByTestId('conversation-renderer-v2')).toBeNull();
  });
});
