import ChatView from '@/components/ChatView';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  useModel: () => ({
    userInfo: {
      nickName: 'Tester',
      avatar: '',
    },
  }),
}));

vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({
    data: { antdTheme: 'light' },
  }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/components/ChatView/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

vi.mock('@/components/base/CopyButton', () => ({
  default: ({
    children,
    text,
  }: {
    children: React.ReactNode;
    text: string;
  }) => (
    <button type="button" data-testid="copy-button" data-copy-text={text}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/MarkdownRenderer', () => ({
  default: ({
    answer,
    thinking,
    status,
  }: {
    answer?: string;
    thinking?: string;
    status?: string;
  }) => (
    <div
      data-testid="markdown-renderer"
      data-answer={answer}
      data-thinking={thinking}
      data-status={status || ''}
    />
  ),
}));

vi.mock('@/components/ChatView/RunOver', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <div data-testid="run-over" data-status={messageInfo.status || ''} />
  ),
}));

vi.mock('@/components/ChatView/ChatBottomMore', () => ({
  default: () => <div data-testid="chat-bottom-more" />,
}));

vi.mock('@/components/ChatView/ChatBottomDebug', () => ({
  default: () => <div data-testid="chat-bottom-debug" />,
}));

vi.mock('@/components/ChatView/ChatSampleBottom', () => ({
  default: () => <div data-testid="chat-sample-bottom" />,
}));

const roleInfo: RoleInfo = {
  assistant: { name: 'Assistant', avatar: '' },
  system: { name: 'System', avatar: '' },
};

const createMessage = (message: Partial<MessageInfo>): MessageInfo =>
  ({
    id: 'message-1',
    role: AssistantRoleEnum.ASSISTANT,
    text: '',
    think: '',
    ...message,
  } as MessageInfo);

describe('ChatView', () => {
  it('用户消息直接渲染文本，不走 MarkdownRenderer', () => {
    render(
      <ChatView
        roleInfo={roleInfo}
        messageInfo={createMessage({
          role: AssistantRoleEnum.USER,
          text: 'hello from user',
        })}
      />,
    );

    expect(screen.getByText('hello from user')).toBeInTheDocument();
    expect(screen.queryByTestId('markdown-renderer')).toBeNull();
    expect(screen.getByTestId('copy-button')).toHaveAttribute(
      'data-copy-text',
      'hello from user',
    );
  });

  it('助手消息渲染 MarkdownRenderer，并透传 answer/thinking/status', () => {
    render(
      <ChatView
        roleInfo={roleInfo}
        messageInfo={createMessage({
          text: 'assistant answer',
          think: 'assistant thinking',
          status: MessageStatusEnum.Incomplete,
        })}
      />,
    );

    const markdown = screen.getByTestId('markdown-renderer');
    expect(markdown).toHaveAttribute('data-answer', 'assistant answer');
    expect(markdown).toHaveAttribute('data-thinking', 'assistant thinking');
    expect(markdown).toHaveAttribute(
      'data-status',
      MessageStatusEnum.Incomplete,
    );
    expect(screen.getByTestId('run-over')).toHaveAttribute(
      'data-status',
      MessageStatusEnum.Incomplete,
    );
  });

  it('助手消息完成后展示底部操作区', () => {
    render(
      <ChatView
        roleInfo={roleInfo}
        mode="chat"
        messageInfo={createMessage({
          text: 'done',
          status: MessageStatusEnum.Complete,
        })}
      />,
    );

    expect(screen.getByTestId('chat-bottom-more')).toBeInTheDocument();
    expect(screen.getByTestId('chat-bottom-debug')).toBeInTheDocument();
  });
});
