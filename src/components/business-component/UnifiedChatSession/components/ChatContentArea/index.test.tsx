import { AssistantRoleEnum } from '@/types/enums/agent';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChatContentArea, getChatMessageRenderKey } from './index';

vi.mock('@/components/ChatView', () => ({
  default: ({ conversationId }: { conversationId?: string | number }) => (
    <div data-testid="chat-view" data-conversation-id={conversationId ?? ''} />
  ),
}));

vi.mock('@/components/AgentChatEmpty', () => ({ default: () => null }));
vi.mock('@/components/NewConversationSet', () => ({ default: () => null }));
vi.mock('@/components/RecommendList', () => ({ default: () => null }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'class-name' }),
}));

const roleInfo: RoleInfo = {
  assistant: { name: 'Assistant', avatar: '' },
  system: { name: 'System', avatar: '' },
};

describe('ChatContentArea', () => {
  it('消息 ID 不变时不因终态快照补齐 index 而更换 React key', () => {
    const streamingMessage = {
      id: 'message-1',
      index: undefined,
      role: AssistantRoleEnum.ASSISTANT,
      text: 'streaming result',
    } as MessageInfo;
    const persistedMessage = {
      ...streamingMessage,
      index: 42,
    } as MessageInfo;

    expect(getChatMessageRenderKey(streamingMessage, 0)).toBe(
      getChatMessageRenderKey(persistedMessage, 0),
    );
  });

  it('终态快照补齐 index 时复用已有消息节点', () => {
    const createProps = (message: MessageInfo) => ({
      conversationId: '1557156',
      messageRenderer: 'v1' as const,
      messageViewRef: createRef<HTMLDivElement>(),
      handleMouseEnter: vi.fn(),
      handleMouseLeave: vi.fn(),
      isLoading: false,
      messageList: [message],
      loadMoreRef: createRef<HTMLDivElement>(),
      effectiveRoleInfo: roleInfo,
      shouldShowSessionSuggest: false,
      handleMessageSend: vi.fn(),
      showTaskExecutingWait: false,
    });
    const message = {
      id: 'message-1',
      role: AssistantRoleEnum.ASSISTANT,
      text: 'streaming result',
    } as MessageInfo;
    const { rerender } = render(<ChatContentArea {...createProps(message)} />);
    const originalNode = screen.getByTestId('chat-view');

    rerender(<ChatContentArea {...createProps({ ...message, index: 42 })} />);

    expect(screen.getByTestId('chat-view')).toBe(originalNode);
  });

  it('把会话 ID 传给历史消息 ChatView，以便读取 OpenUI artifact', () => {
    const message = {
      id: 'message-1',
      role: AssistantRoleEnum.ASSISTANT,
      text: 'openui result',
    } as MessageInfo;

    render(
      <ChatContentArea
        conversationId="1557156"
        messageRenderer="v1"
        messageViewRef={createRef<HTMLDivElement>()}
        handleMouseEnter={vi.fn()}
        handleMouseLeave={vi.fn()}
        isLoading={false}
        messageList={[message]}
        loadMoreRef={createRef<HTMLDivElement>()}
        effectiveRoleInfo={roleInfo}
        shouldShowSessionSuggest={false}
        handleMessageSend={vi.fn()}
        showTaskExecutingWait={false}
      />,
    );

    expect(screen.getByTestId('chat-view')).toHaveAttribute(
      'data-conversation-id',
      '1557156',
    );
  });

  it('isMoreMessage 为 true 时哨兵恒渲染，不因本地列表短于一页而隐藏', () => {
    // 回归背景：门槛曾对比本地列表长度与 MESSAGE_PAGE_SIZE，模型层水合会把
    // 整页 10 条缩成 9，导致哨兵永不渲染、向上滚动加载历史失效
    const loadMoreRef = createRef<HTMLDivElement>();
    const message = {
      id: 'message-1',
      role: AssistantRoleEnum.ASSISTANT,
      text: 'result',
    } as MessageInfo;

    render(
      <ChatContentArea
        conversationId="1557156"
        messageRenderer="v1"
        messageViewRef={createRef<HTMLDivElement>()}
        handleMouseEnter={vi.fn()}
        handleMouseLeave={vi.fn()}
        isLoading={false}
        messageList={[message]}
        isMoreMessage
        loadingMore
        loadMoreRef={loadMoreRef}
        effectiveRoleInfo={roleInfo}
        shouldShowSessionSuggest={false}
        handleMessageSend={vi.fn()}
        showTaskExecutingWait={false}
      />,
    );

    expect(loadMoreRef.current).not.toBeNull();
    // 加载中文案与图标随 loadingMore 出现（容器由 CSS 定高，不产生布局抖动）
    expect(
      screen.getByText('PC.Pages.Chat.loadingHistoryConversation'),
    ).toBeInTheDocument();
  });

  it('isMoreMessage 为 false 时不渲染哨兵', () => {
    const loadMoreRef = createRef<HTMLDivElement>();
    const message = {
      id: 'message-1',
      role: AssistantRoleEnum.ASSISTANT,
      text: 'result',
    } as MessageInfo;

    render(
      <ChatContentArea
        conversationId="1557156"
        messageRenderer="v1"
        messageViewRef={createRef<HTMLDivElement>()}
        handleMouseEnter={vi.fn()}
        handleMouseLeave={vi.fn()}
        isLoading={false}
        messageList={[message]}
        loadMoreRef={loadMoreRef}
        effectiveRoleInfo={roleInfo}
        shouldShowSessionSuggest={false}
        handleMessageSend={vi.fn()}
        showTaskExecutingWait={false}
      />,
    );

    expect(loadMoreRef.current).toBeNull();
  });
});
