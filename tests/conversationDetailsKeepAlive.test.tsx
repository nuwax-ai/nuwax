/**
 * ConversationDetails 多实例保活改造单测（instanceScoped / active 契约）：
 * - 默认形态（不传新 props）行为与现状一致：详情成功后写全局预览槽/全局
 *   appAgentDetail、拉历史——/app 树与既有合同零回归；
 * - instanceScoped：预览与付费弹窗改实例自持，不写全局单槽；
 * - active：失活实例不写全局归属、失活关闭本地传送门弹窗，重新激活时重同步
 *   全局归属并重拉历史；首挂激活不双跑。
 * mock 脚手架复用 tests/conversationDetailsRendererSelection.test.tsx。
 */
import ConversationDetails from '@/components/business-component/ConversationDetails';
import type { AgentDetailDto } from '@/types/interfaces/agent';
import { render, screen, waitFor } from '@testing-library/react';
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

/** 共享 mock 与可变详情回包（用例内切换形态） */
const h = vi.hoisted(() => ({
  detail: { paymentRequired: false, subscribed: true } as Record<
    string,
    unknown
  >,
  showPagePreview: vi.fn(),
  hidePagePreview: vi.fn(),
  handleSetAppAgentDetail: vi.fn(),
  setOpenPaymentModal: vi.fn(),
  runHistoryItem: vi.fn(),
}));

const baseDetail = {
  name: 'Mock Agent',
  icon: '',
  openingChatMsg: '开场白消息',
  conversationId: 777,
  variables: [],
  guidQuestionDtos: [],
  manualComponents: [],
};

vi.mock('umi', () => ({
  useModel: (ns: string) => {
    const models: Record<string, unknown> = {
      layout: { isMobile: false },
      conversationHistory: { runHistoryItem: h.runHistoryItem },
      useOpenApp: {
        handleSetAppAgentDetail: h.handleSetAppAgentDetail,
        isAppSidebarMode: false,
        isAppSidebarVisible: false,
        toggleAppSidebarVisible: vi.fn(),
        setAppAgentDetailLoading: vi.fn(),
        openPaymentModal: false,
        setOpenPaymentModal: h.setOpenPaymentModal,
        incrementCalledTrialCount: vi.fn(),
        localCalledTrialCount: 0,
      },
      chat: {
        pagePreviewData: null,
        hidePagePreview: h.hidePagePreview,
        showPagePreview: h.showPagePreview,
      },
      tenantConfigInfo: { tenantConfigInfo: { enableSubscription: 1 } },
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
  apiPublishedAgentInfo: vi.fn(() => Promise.resolve(h.detail)),
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
// 桶导入过重：按名替身（PagePreviewIframe 捕获 pagePreviewData 供断言）
vi.mock('@/components/business-component', () => ({
  CopyToSpaceComponent: () => null,
  PagePreviewIframe: ({
    pagePreviewData,
  }: {
    pagePreviewData: { uri?: string } | null;
  }) => (
    <div data-testid="page-preview" data-uri={pagePreviewData?.uri ?? 'none'} />
  ),
}));
vi.mock('@/components/AgentSidebar', async () => {
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
vi.mock('@/components/business-component/ChatInputUnified', () => ({
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
  // 捕获 open 供「失活关弹窗」断言
  default: ({ open }: { open: boolean }) => (
    <div data-testid="payment-modal" data-open={String(open)} />
  ),
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
vi.mock('@/hooks/useAgentDetails', () => ({
  // agentDetail 恒真值供「激活沿重同步」断言（真实 hook 为组件局部 state）
  default: () => ({
    agentDetail: { name: 'Mock Agent', icon: '', agentId: 1 },
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
vi.mock('@/utils/hostBridge', () => ({
  needsTopRightAvoid: vi.fn(() => false),
  shellAvoid: vi.fn(),
  hasHostBridge: vi.fn(() => false),
  hostBridge: { theme: { syncTheme: vi.fn() } },
}));
vi.mock('@/features/conversation/presentation-v2/react', () => ({
  ConversationRendererV2: () => <div data-testid="conversation-renderer-v2" />,
}));

describe('ConversationDetails 多实例保活契约', () => {
  beforeEach(() => {
    h.detail = { ...baseDetail, paymentRequired: false, subscribed: true };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('默认形态合同不回归：详情成功写全局预览槽/全局归属并拉历史', async () => {
    h.detail = {
      ...baseDetail,
      expandPageArea: true,
      pageHomeIndex: '/apps/page1/index.html',
    } as unknown as AgentDetailDto;
    render(<ConversationDetails agentId={1} />);
    // 详情回包处理完成（全局 mock 的 pagePreviewData 恒 null,右侧面板不渲染,
    // 以全局槽被写为断言面——与现状行为一致）
    await waitFor(() => {
      expect(h.handleSetAppAgentDetail).toHaveBeenCalledTimes(1);
    });
    expect(h.showPagePreview).toHaveBeenCalledTimes(1);
    expect(h.runHistoryItem).toHaveBeenCalledTimes(1);
  });

  it('instanceScoped：预览与付费弹窗实例自持，不写全局单槽', async () => {
    h.detail = {
      ...baseDetail,
      expandPageArea: true,
      pageHomeIndex: '/apps/page2/index.html',
      paymentRequired: true,
      subscribed: false,
    } as unknown as AgentDetailDto;
    render(<ConversationDetails agentId={1} instanceScoped />);
    // 本地预览生效（PagePreviewIframe 收到本地数据）
    await waitFor(() => {
      expect(screen.getByTestId('page-preview').dataset.uri).toContain(
        '/apps/page2/index.html',
      );
    });
    // 全局槽不被写（防并存实例互踩）
    expect(h.showPagePreview).not.toHaveBeenCalled();
    // 付费弹窗实例自持：本地打开,不写全局
    await waitFor(() => {
      expect(screen.getByTestId('payment-modal').dataset.open).toBe('true');
    });
    expect(h.setOpenPaymentModal).not.toHaveBeenCalled();
  });

  it('active 激活沿：失活不写全局归属，重新激活重同步归属并重拉历史', async () => {
    const view = render(<ConversationDetails agentId={1} active={false} />);
    await waitFor(() => {
      expect(
        screen.getByTestId('conversation-renderer-v2'),
      ).toBeInTheDocument();
    });
    // 失活挂载：详情回包到达但不写全局归属,也不拉历史
    expect(h.handleSetAppAgentDetail).not.toHaveBeenCalled();
    expect(h.runHistoryItem).not.toHaveBeenCalled();
    // 重新激活：重同步本地详情到全局归属 + 重拉历史
    view.rerender(<ConversationDetails agentId={1} active instanceScoped />);
    await waitFor(() => {
      expect(h.handleSetAppAgentDetail).toHaveBeenCalledTimes(1);
    });
    expect(h.runHistoryItem).toHaveBeenCalledTimes(1);
  });

  it('active 首挂激活不双跑：归属仍只写一次', async () => {
    const view = render(<ConversationDetails agentId={1} />);
    await waitFor(() => {
      expect(h.handleSetAppAgentDetail).toHaveBeenCalledTimes(1);
    });
    // active 未经历失活,false 值都不出现——重复 rerender 不追加
    view.rerender(<ConversationDetails agentId={1} />);
    expect(h.handleSetAppAgentDetail).toHaveBeenCalledTimes(1);
  });

  it('失活关闭本地付费弹窗（防传送门悬空）', async () => {
    h.detail = {
      ...baseDetail,
      paymentRequired: true,
      subscribed: false,
    } as unknown as AgentDetailDto;
    const view = render(<ConversationDetails agentId={1} instanceScoped />);
    await waitFor(() => {
      expect(screen.getByTestId('payment-modal').dataset.open).toBe('true');
    });
    view.rerender(
      <ConversationDetails agentId={1} instanceScoped active={false} />,
    );
    // 失活即关（antd Modal 传送门到 body,display:none 拦不住悬空）
    await waitFor(() => {
      expect(screen.getByTestId('payment-modal').dataset.open).toBe('false');
    });
  });
});
