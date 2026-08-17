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
});
