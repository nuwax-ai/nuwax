import { AssistantRoleEnum } from '@/types/enums/agent';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChatContentArea } from './index';

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
