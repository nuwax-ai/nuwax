import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConversationStatus from '.';

// vitest 不为非 .module.less 生成类名导出(默认导出为 undefined),
// 组件内 styles.xxx 会崩;用恒等映射兜底,仅测逻辑不测样式
vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_target, key: string) => key }),
}));

vi.mock('@/components/ChatView/RunOver', () => ({
  default: ({
    messageInfo,
    showTerminalStatus,
  }: {
    messageInfo: MessageInfo;
    showTerminalStatus?: boolean;
  }) => (
    <div
      data-testid="run-over"
      data-status={messageInfo.status}
      data-show-terminal-status={String(showTerminalStatus)}
    />
  ),
}));

const createAssistantMessage = (
  message: Partial<MessageInfo> = {},
): MessageInfo =>
  ({
    id: 'assistant-message',
    role: 'ASSISTANT',
    text: '回复内容',
    ...message,
  } as MessageInfo);

describe('ConversationStatus', () => {
  it('只有未开始会话的开场白时不显示任务完成状态栏', () => {
    const { container } = render(
      <ConversationStatus
        messageList={[
          createAssistantMessage({
            id: null as unknown as string,
            index: null as unknown as number,
            text: '嗨 xiedaokun，有什么需要帮忙的吗？',
            finished: false,
            finishReason: undefined,
            componentExecutedList: null as unknown as [],
          }),
        ]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('run-over')).not.toBeInTheDocument();
  });

  it('会话结束后助手消息不再携带 status 时仍保留计时栏', () => {
    const { rerender } = render(
      <ConversationStatus
        messageList={[
          createAssistantMessage({ status: MessageStatusEnum.Complete }),
        ]}
      />,
    );

    expect(screen.getByText('00:00')).toBeInTheDocument();

    rerender(<ConversationStatus messageList={[createAssistantMessage()]} />);

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByTestId('run-over')).toHaveAttribute(
      'data-status',
      MessageStatusEnum.Complete,
    );
    expect(screen.getByTestId('run-over')).toHaveAttribute(
      'data-show-terminal-status',
      'true',
    );
  });
});
