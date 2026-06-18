/**
 * UnifiedChatSession 与消息队列/intervention 的 UI 协调测试（功能维度）
 *
 * 验证：权限审批 / ask/question 出现（pending）时，待发送队列消息面板被隐藏，
 * 让 intervention 独占展示；intervention 解除后队列面板恢复显示。
 */
import type { InterventionQueueItem } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';
import UnifiedChatSession from '@/components/business-component/UnifiedChatSession';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// UI 协调单测需启用功能开关（生产环境默认关闭）
vi.mock('@/constants/feature.constants', () => ({
  ENABLE_CHAT_MESSAGE_QUEUE: true,
}));

// 避免 umi / @umijs 链触发 esbuild 环境问题
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
// UnifiedChatSession 的 index.less 在 vitest 下不是 CSS modules，mock 成代理
vi.mock(
  '@/components/business-component/UnifiedChatSession/index.less',
  () => ({
    default: new Proxy({}, { get: () => 'cls' }),
  }),
);

vi.mock('@/components/ChatInputHome', () => ({ default: () => null }));
vi.mock('@/components/ChatView', () => ({ default: () => null }));
vi.mock('@/components/AgentChatEmpty', () => ({ default: () => null }));
vi.mock('@/components/NewConversationSet', () => ({ default: () => null }));
vi.mock('@/components/RecommendList', () => ({ default: () => null }));
vi.mock('@/pages/Chat/components/ConversationStatus', () => ({
  default: () => null,
}));

vi.mock('@/components/business-component/AgentIntervention', () => ({
  AgentInterventionChatLayer: () => null,
  useAgentInterventionLayer: () => ({
    agentMode: 'yolo',
    chatLayerProps: {},
    agentModeInputProps: {
      agentMode: 'yolo',
      onAgentModeChange: vi.fn(),
      showAgentModeSelector: false,
    },
  }),
}));

// 控制 hasPendingIntervention：返回 [] 或 [item]
vi.mock(
  '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue',
  () => ({
    useActiveInterventionQueue: vi.fn(),
  }),
);

// MessageQueuePanel 用 spy DOM 标识；useUnifiedChatQueue 返回固定非空队列
vi.mock('@/components/business-component/MessageQueue', () => ({
  default: () => <div data-testid="queue-panel" />,
  useUnifiedChatQueue: () => ({
    queue: [{ id: 'm1', text: 'm1', queuedAt: new Date() }],
    hasQueuedMessages: true,
    trySend: vi.fn(),
    sendNow: vi.fn(),
    deleteQueued: vi.fn(),
    editQueued: vi.fn(),
    handleEditQueued: vi.fn(),
    clearQueue: vi.fn(),
    rawSend: vi.fn(),
  }),
}));

vi.mock('@/hooks/useConversationScrollDetection', () => ({
  useConversationScrollDetection: vi.fn(),
}));
vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => ({ ref: vi.fn(), inView: false }),
}));

import { useActiveInterventionQueue } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';

// jsdom 未实现 Element.scrollTo，UnifiedChatSession 的滚动 effect 会调用它
Element.prototype.scrollTo = vi.fn() as any;

const askItem = (): InterventionQueueItem =>
  ({
    kind: 'mcp_ask',
    interaction: { input: { requestId: 'ask-1' }, responseStatus: 'pending' },
    sortKey: 1,
  } as any);

describe('UnifiedChatSession：权限审批 / ask/question 出现时隐藏队列消息', () => {
  it('有待处理 intervention 时，队列消息面板不渲染', () => {
    vi.mocked(useActiveInterventionQueue).mockReturnValue([askItem()]);
    render(<UnifiedChatSession messageList={[]} />);
    expect(screen.queryByTestId('queue-panel')).toBeNull();
  });

  it('无 intervention 时，队列消息面板正常渲染', () => {
    vi.mocked(useActiveInterventionQueue).mockReturnValue([]);
    render(<UnifiedChatSession messageList={[]} />);
    expect(screen.queryByTestId('queue-panel')).toBeInTheDocument();
  });
});
