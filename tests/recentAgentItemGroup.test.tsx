/**
 * 「最近使用」智能体分组合同测试:
 * 1. 存在执行中会话 → 分组默认展开(需求:有会话进行中就默认展开);
 * 2. 全部终态 → 默认收起;
 * 3. 用户手动收起优先于执行中自动展开;
 * 4. 当前智能体选中(isActive)→ 展开;
 * 5. 展开时最多展示 3 条会话,点击条目触发跳转回调;
 * 6. 会话条目状态徽标:执行中绿点 / 失败红叹号 + 悬停「⋯」菜单入口;
 * 7. 超过 3 条经「查看更多 (N)」展开全部,再点「收起」回 3 条;
 * 8. 已归档会话(本地标记)不在分组条目中展示。
 */
import RecentAgentItem from '@/layouts/DynamicMenusLayout/NewHomeSection/components/RecentAgentItem';
import { TaskStatus } from '@/types/enums/agent';
import type { AgentInfo } from '@/types/interfaces/agent';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));
vi.mock('@/assets/images/agent_image.png', () => ({ default: 'agent.png' }));
vi.mock(
  '@/layouts/DynamicMenusLayout/NewHomeSection/components/RecentAgentItem/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
// 右键菜单组件走真实接口,测试中以 render-prop 透传「⋯」按钮占位
vi.mock('@/components/business-component/ConversationContextMenu', () => ({
  default: ({
    children,
  }: {
    children:
      | React.ReactElement
      | ((moreButton: React.ReactNode) => React.ReactElement);
  }) =>
    typeof children === 'function'
      ? children(<span data-testid="session-more">more</span>)
      : children,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

const baseAgent: AgentInfo = {
  id: 1,
  userId: 1,
  modified: '2026-08-31T10:00:00.000+00:00',
  created: '2026-08-01T10:00:00.000+00:00',
  agentId: 3994,
  name: '女娲Nuwax',
  icon: '',
  description: 'desc',
  spaceId: 1,
  agentType: 'ChatBot',
};

const conv = (id: number, taskStatus: TaskStatus, topic = `topic-${id}`) => ({
  id,
  topic,
  taskStatus,
});

const renderGroup = (
  conversationList: AgentInfo['conversationList'],
  options?: {
    isActive?: boolean;
    onConversationClick?: (conversationId: number | string) => void;
    conversationFlags?: {
      pinned: number[];
      archived: number[];
      collected: number[];
    };
  },
) =>
  render(
    <RecentAgentItem
      item={{ ...baseAgent, conversationList }}
      isActive={options?.isActive ?? false}
      onClick={() => {}}
      onConversationClick={options?.onConversationClick ?? (() => {})}
      conversationFlags={options?.conversationFlags}
    />,
  );

describe('RecentAgentItem 分组展开', () => {
  it('存在执行中会话 → 默认展开并显示会话条目', () => {
    renderGroup([conv(1, TaskStatus.EXECUTING), conv(2, TaskStatus.COMPLETE)]);
    // 最新会话 topic 同时出现在组头副标题与展开条目中
    expect(screen.getAllByText('topic-1').length).toBe(2);
    expect(screen.getByText('topic-2')).toBeInTheDocument();
  });

  it('全部终态 → 默认收起,不渲染会话条目', () => {
    renderGroup([conv(1, TaskStatus.COMPLETE)]);
    // 收起时最新会话 topic 仅剩组头副标题一处
    expect(screen.getAllByText('topic-1').length).toBe(1);
  });

  it('用户手动收起后,执行中也不再自动展开', async () => {
    const user = userEvent.setup();
    renderGroup([conv(1, TaskStatus.EXECUTING)]);
    expect(screen.getAllByText('topic-1').length).toBe(2);
    await user.click(screen.getByText('女娲Nuwax'));
    expect(screen.getAllByText('topic-1').length).toBe(1);
  });

  it('当前智能体选中(isActive)→ 展开', () => {
    renderGroup([conv(1, TaskStatus.COMPLETE)], { isActive: true });
    expect(screen.getAllByText('topic-1').length).toBe(2);
  });

  it('展开最多显示 3 条,条目点击回调带会话 id', async () => {
    const user = userEvent.setup();
    const onConversationClick = vi.fn();
    renderGroup(
      [
        conv(1, TaskStatus.COMPLETE),
        conv(2, TaskStatus.COMPLETE),
        conv(3, TaskStatus.COMPLETE),
        conv(4, TaskStatus.COMPLETE),
      ],
      { isActive: true, onConversationClick },
    );
    expect(screen.getAllByText('topic-1').length).toBe(2);
    expect(screen.getByText('topic-3')).toBeInTheDocument();
    expect(screen.queryByText('topic-4')).not.toBeInTheDocument();
    await user.click(screen.getByText('topic-2'));
    expect(onConversationClick).toHaveBeenCalledWith(2);
  });

  it('条目状态徽标:执行中绿点 / 失败红叹号 + 悬停「⋯」菜单入口', () => {
    renderGroup([
      conv(1, TaskStatus.EXECUTING),
      conv(2, TaskStatus.FAILED),
      conv(3, TaskStatus.COMPLETE),
    ]);
    expect(
      screen.getByLabelText(
        'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        'PC.Layouts.DynamicMenusLayout.NewHomeSection.failedTask',
      ),
    ).toBeInTheDocument();
    // 每个可见条目均渲染「⋯」菜单按钮
    expect(screen.getAllByTestId('session-more').length).toBe(3);
  });

  it('超过 3 条时经「查看更多 (N)」展开全部,再点「收起」回到 3 条', async () => {
    const user = userEvent.setup();
    renderGroup(
      [
        conv(1, TaskStatus.COMPLETE),
        conv(2, TaskStatus.COMPLETE),
        conv(3, TaskStatus.COMPLETE),
        conv(4, TaskStatus.COMPLETE),
        conv(5, TaskStatus.COMPLETE),
      ],
      { isActive: true },
    );
    const viewMoreText = 'PC.Components.AgentConversation.viewMore (5)';
    expect(screen.getByText(viewMoreText)).toBeInTheDocument();
    expect(screen.queryByText('topic-5')).not.toBeInTheDocument();

    await user.click(screen.getByText(viewMoreText));
    expect(screen.getByText('topic-5')).toBeInTheDocument();

    await user.click(
      screen.getByText(
        'PC.Layouts.DynamicMenusLayout.NewHomeSection.collapseSessions',
      ),
    );
    expect(screen.queryByText('topic-5')).not.toBeInTheDocument();
    expect(screen.getByText(viewMoreText)).toBeInTheDocument();
  });

  it('已归档会话(本地标记)不在分组条目中展示', () => {
    renderGroup([conv(1, TaskStatus.EXECUTING), conv(2, TaskStatus.COMPLETE)], {
      conversationFlags: { pinned: [], archived: [1], collected: [] },
    });
    // topic-1 已归档被过滤,仅剩组头副标题一处;条目只展示 topic-2
    expect(screen.getAllByText('topic-1').length).toBe(1);
    expect(screen.getByText('topic-2')).toBeInTheDocument();
  });
});
