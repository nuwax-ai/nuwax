import ConversationStatus from '@/components/business-component/ConversationStatus';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/components/ChatView/RunOver', () => ({ default: () => null }));
vi.mock(
  '@/components/business-component/ConversationStatus/index.less',
  () => ({
    default: {},
  }),
);

const message = (
  id: string,
  role: AssistantRoleEnum,
  overrides: Partial<MessageInfo> = {},
): MessageInfo =>
  ({
    id,
    role,
    time: new Date(Date.now()).toISOString(),
    ...overrides,
  } as MessageInfo);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('从历史快照的毫秒时间戳恢复本轮计时', () => {
  vi.useFakeTimers();
  const user = message('user-1', AssistantRoleEnum.USER, {
    time: (Date.now() - 90_000) as unknown as MessageInfo['time'],
  });
  const assistant = message('assistant-1', AssistantRoleEnum.ASSISTANT, {
    status: MessageStatusEnum.Loading,
  });

  render(<ConversationStatus messageList={[user, assistant]} />);
  expect(screen.getByText('01:30')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText('01:31')).toBeInTheDocument();
});

it('思考中追加无状态消息或收到旧耗时时，底部计时继续，停止时冻结', () => {
  vi.useFakeTimers();
  const user = message('user-1', AssistantRoleEnum.USER);
  const assistant = message('assistant-1', AssistantRoleEnum.ASSISTANT, {
    status: MessageStatusEnum.Loading,
  });
  const context = message('context-1', AssistantRoleEnum.SYSTEM);
  const view = render(<ConversationStatus messageList={[user, assistant]} />);

  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByText('00:02')).toBeInTheDocument();

  view.rerender(
    <ConversationStatus messageList={[user, assistant, context]} />,
  );
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByText('00:04')).toBeInTheDocument();

  const staleResult = { startTime: 0, endTime: 2000 } as NonNullable<
    MessageInfo['finalResult']
  >;
  view.rerender(
    <ConversationStatus
      messageList={[user, { ...assistant, finalResult: staleResult }, context]}
    />,
  );
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByText('00:06')).toBeInTheDocument();

  view.rerender(
    <ConversationStatus
      messageList={[
        user,
        { ...assistant, status: MessageStatusEnum.Stopped },
        context,
      ]}
    />,
  );
  act(() => vi.advanceTimersByTime(4000));
  expect(screen.getByText('00:06')).toBeInTheDocument();
});
