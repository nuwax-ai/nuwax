/**
 * ChatContentArea 渲染线选择器合同测试（V2 双线重构）：
 * 默认（不传 messageRenderer）走 V1 逐消息 ChatView（现有测试零行为变化）；
 * messageRenderer='v2' 按需加载 V2 渲染器；renderMessageItem 自定义入口恒优先。
 */
import ChatContentArea from '@/components/business-component/UnifiedChatSession/components/ChatContentArea';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ChatContentArea/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
vi.mock('@/components/AgentChatEmpty', () => ({ default: () => null }));
vi.mock('@/components/NewConversationSet', () => ({ default: () => null }));
vi.mock('@/components/RecommendList', () => ({ default: () => null }));
vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <div data-testid="chat-view" data-message-id={String(messageInfo.id)} />
  ),
}));
vi.mock('@/features/conversation/presentation-v2/react', () => ({
  ConversationRendererV2: () => <div data-testid="conversation-renderer-v2" />,
}));

const msg = (id: string, role: AssistantRoleEnum): MessageInfo =>
  ({
    id,
    role,
    text: '文本',
    time: '',
    componentExecutedList: [],
    messageType: 'ASSISTANT',
    index: 0,
    tenantId: 1,
    senderType: 'User',
    senderId: 'u',
    userId: 1,
    agentId: 1,
    status: MessageStatusEnum.Complete,
  } as MessageInfo);

const baseProps = {
  messageViewRef: { current: null } as React.RefObject<HTMLDivElement>,
  handleMouseEnter: () => {},
  handleMouseLeave: () => {},
  isLoading: false,
  effectiveRoleInfo: {
    assistant: { name: 'A', avatar: '' },
    system: { name: 'S', avatar: '' },
  },
  shouldShowSessionSuggest: false,
  handleMessageSend: () => {},
  showTaskExecutingWait: false,
  loadMoreRef: { current: null },
};

const list = [
  msg('u1', AssistantRoleEnum.USER),
  msg('a1', AssistantRoleEnum.ASSISTANT),
];

describe('ChatContentArea 渲染线选择', () => {
  it('默认 v1：逐消息 ChatView，不加载 V2 渲染器', () => {
    render(<ChatContentArea {...baseProps} messageList={list} />);
    expect(screen.getAllByTestId('chat-view')).toHaveLength(2);
    expect(screen.queryByTestId('conversation-renderer-v2')).toBeNull();
  });

  it("messageRenderer='v2'：按需加载并渲染 V2 渲染器", async () => {
    render(
      <ChatContentArea
        {...baseProps}
        messageList={list}
        messageRenderer="v2"
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByTestId('conversation-renderer-v2'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId('chat-view')).toBeNull();
  });

  it('renderMessageItem 自定义入口恒优先（即使 v2）', () => {
    render(
      <ChatContentArea
        {...baseProps}
        messageList={list}
        messageRenderer="v2"
        renderMessageItem={(message) => (
          <div key={String(message.id)} data-testid="custom-item">
            {String(message.id)}
          </div>
        )}
      />,
    );
    expect(screen.getAllByTestId('custom-item')).toHaveLength(2);
    expect(screen.queryByTestId('conversation-renderer-v2')).toBeNull();
    expect(screen.queryByTestId('chat-view')).toBeNull();
  });
});
