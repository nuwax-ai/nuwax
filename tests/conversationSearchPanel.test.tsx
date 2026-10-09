/**
 * 会话内搜索面板测试(需求 5c 收尾):
 * 1. 无会话/无消息时不渲染入口;
 * 2. 打开面板拉全量消息,关键词本地过滤出命中;
 * 3. 点击命中按锚点定位:V2 聚合块 ids 词列表锚点可滚动定位并高亮;
 * 4. 锚点不存在时 toast 提示向上加载历史。
 */
import ConversationSearchPanel from '@/pages/Chat/components/ConversationSearchPanel';
import { apiAgentConversationMessageList } from '@/services/agentConfig';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationMessageList: vi.fn(),
}));
vi.mock('@/pages/Chat/components/ConversationSearchPanel/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));
// antd message 需在 mock 工厂(hoisted)外定义可变的 spy,用 vi.hoisted 提升
const { messageApiMock } = vi.hoisted(() => ({ messageApiMock: vi.fn() }));
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return { ...actual, message: { ...actual.message, info: messageApiMock } };
});

const messageListMock = vi.mocked(apiAgentConversationMessageList);

const msg = (id: number, role: AssistantRoleEnum, text: string) => ({
  id,
  role,
  text,
  think: '',
  index: id,
});

afterEach(() => {
  vi.restoreAllMocks();
  messageApiMock.mockClear();
  messageListMock.mockReset();
});

const openPanel = async (messages: MessageInfo[]) => {
  messageListMock.mockResolvedValue({ data: messages });
  const { container } = render(
    <ConversationSearchPanel conversationId={9} hasMessages />,
  );
  // Popover trigger 为面板根 span
  fireEvent.click(container.querySelector('span') as HTMLSpanElement);
  return screen.findByPlaceholderText('PC.Pages.Chat.searchMessages');
};

const clickHit = async (user: ReturnType<typeof userEvent.setup>) => {
  const hit = await screen.findByText(/部署|常显|远古/);
  await user.click(hit.closest('.search-hit') ?? hit);
  return hit;
};

describe('ConversationSearchPanel', () => {
  it('无会话或无消息时不渲染入口', () => {
    const { container } = render(
      <ConversationSearchPanel conversationId={1} hasMessages={false} />,
    );
    expect(container).toBeEmptyDOMElement();

    const { container: noId } = render(
      <ConversationSearchPanel conversationId={null} hasMessages />,
    );
    expect(noId).toBeEmptyDOMElement();
  });

  it('打开面板拉取消息,关键词过滤出命中条目', async () => {
    const user = userEvent.setup();
    const input = await openPanel([
      msg(2, AssistantRoleEnum.ASSISTANT, '部署失败了,请检查日志'),
      msg(1, AssistantRoleEnum.USER, '帮我部署服务'),
    ]);
    await waitFor(() =>
      expect(messageListMock).toHaveBeenCalledWith({
        conversationId: 9,
        index: 0,
        size: 50,
      }),
    );

    await user.type(input, '部署');
    await waitFor(() => expect(screen.getAllByText('部署').length).toBe(2));
  });

  it('点击命中:V2 聚合块 ids 词列表锚点可定位滚动并高亮', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const input = await openPanel([
      msg(7, AssistantRoleEnum.ASSISTANT, '聚合在 turn 常显区的回答'),
    ]);

    // 模拟 V2 锚点:turn 常显区根节点挂 ids 词列表
    const anchor = document.createElement('div');
    anchor.setAttribute('data-server-message-ids', 'other-id 7');
    document.body.appendChild(anchor);

    await user.type(input, '常显区');
    await clickHit(user);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(anchor.className).toContain('conversation-search-highlight');
    anchor.remove();
  });

  it('锚点不存在时提示向上加载历史', async () => {
    const user = userEvent.setup();
    const input = await openPanel([
      msg(5, AssistantRoleEnum.USER, '远古消息内容'),
    ]);

    await user.type(input, '远古');
    await clickHit(user);
    await waitFor(() =>
      expect(messageApiMock).toHaveBeenCalledWith(
        'PC.Pages.Chat.searchLocateHint',
      ),
    );
  });
});
