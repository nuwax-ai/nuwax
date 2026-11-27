import ConversationStatus from '@/components/business-component/ConversationStatus';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/components/ChatView/RunOver', () => ({ default: () => null }));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, value: string) => `${value}（按工具记录估算）`,
}));
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

const historyTool = (id: string, startTime: number, endTime: number) => ({
  result: {
    executeId: id,
    type: 'ToolCall',
    startTime,
    endTime,
    success: true,
  },
});
const historyTag = (id: string) =>
  `<div><markdown-custom-process executeId="${id}" type="ToolCall" status="FINISHED"></markdown-custom-process></div>`;

it('历史多轮只取本轮的有效工具时间，标记估算来源', () => {
  const old = message('old', AssistantRoleEnum.ASSISTANT, {
    text: historyTag('old-tool'),
    componentExecutedList: [historyTool('old-tool', 1000, 999000)],
  });
  const assistant = message('new', AssistantRoleEnum.ASSISTANT, {
    text: historyTag('one') + historyTag('two') + historyTag('broken'),
    componentExecutedList: [
      historyTool('one', 10000, 15000),
      historyTool('two', 20000, 53969),
      historyTool('broken', 1, -1),
    ],
  });
  render(
    <ConversationStatus
      messageList={[
        message('old-user', AssistantRoleEnum.USER),
        old,
        message('new-user', AssistantRoleEnum.USER),
        assistant,
      ]}
    />,
  );
  expect(screen.getByText('00:43（按工具记录估算）')).toBeInTheDocument();
});

it('历史缺少有效耗时显示短横线，有最终结果时优先使用最终耗时', () => {
  const user = message('user', AssistantRoleEnum.USER);
  const assistant = message('assistant', AssistantRoleEnum.ASSISTANT, {
    text: historyTag('broken'),
    componentExecutedList: [historyTool('broken', 10000, 5000)],
  });
  const view = render(<ConversationStatus messageList={[user, assistant]} />);
  expect(screen.getByText('—')).toBeInTheDocument();
  view.rerender(
    <ConversationStatus
      messageList={[
        user,
        {
          ...assistant,
          finalResult: {
            startTime: 1000,
            endTime: 11000,
          } as MessageInfo['finalResult'],
        },
      ]}
    />,
  );
  expect(screen.getByText('00:10')).toBeInTheDocument();
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
