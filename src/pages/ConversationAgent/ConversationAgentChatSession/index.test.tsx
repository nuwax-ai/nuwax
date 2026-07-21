import ConversationAgentChatSession from '@/pages/ConversationAgent/ConversationAgentChatSession';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUnifiedChatSession, mockUseConversationAgentChatSession } =
  vi.hoisted(() => ({
    mockUnifiedChatSession: vi.fn(),
    mockUseConversationAgentChatSession: vi.fn(),
  }));

vi.mock('@/components/business-component', () => ({
  UnifiedChatSession: (props: any) => {
    mockUnifiedChatSession(props);
    return <div data-testid="unified-chat-session" />;
  },
}));

vi.mock('../hooks/useConversationAgentChatSession', () => ({
  useConversationAgentChatSession: (...args: unknown[]) =>
    mockUseConversationAgentChatSession(...args),
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

describe('ConversationAgentChatSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConversationAgentChatSession.mockReturnValue({
      conversationId: 9001,
      messageList: [{ id: 'm1' }],
      isConversationActive: true,
      onSendMessage: vi.fn(),
    });
  });

  it('用隔离会话 hook 生成 UnifiedChatSession props，并固定 mentionPlacement=up', () => {
    const onSelectComponent = vi.fn();

    render(
      <ConversationAgentChatSession
        className="panel"
        agentId={77}
        agentConfigInfo={{ id: 77, devConversationId: 9001 } as any}
        selectedComponentList={[{ id: 'component-1' } as any]}
        onSelectComponent={onSelectComponent}
        onTaskResultClick={vi.fn()}
      />,
    );

    expect(mockUseConversationAgentChatSession).toHaveBeenCalledWith({
      agentId: 77,
      agentConfigInfo: { id: 77, devConversationId: 9001 },
      selectedComponentList: [{ id: 'component-1' }],
      onSelectComponent,
    });
    expect(mockUnifiedChatSession).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 9001,
        messageList: [{ id: 'm1' }],
        isConversationActive: true,
        mentionPlacement: 'up',
      }),
    );
  });
});
