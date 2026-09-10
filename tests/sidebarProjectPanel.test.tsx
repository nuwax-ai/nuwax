import ProjectPanel, {
  ProjectPanelHandle,
} from '@/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);

vi.mock('umi', () => ({ useParams: () => ({}) }));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));
// 子项会话改名/删除走会话真实接口,测试里 mock 掉
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationUpdate: vi.fn().mockResolvedValue({ success: true }),
  apiAgentConversationDelete: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('@/services/userProjectApp', async () => {
  // 子会话时间取「5 分钟前」,断言走 relativeMinutes 分支
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  return {
    apiUserProjectTabPageQuery: vi.fn().mockResolvedValue({
      code: (await import('@/constants/codes.constants')).SUCCESS_CODE,
      data: {
        records: [
          {
            projectId: 1,
            name: '项目甲',
            projectType: 'UserApp',
            modified: fiveMinutesAgo,
            created: fiveMinutesAgo,
            conversations: [
              {
                id: 11,
                topic: '子会话一',
                modified: fiveMinutesAgo,
                taskStatus: 'COMPLETE',
                agentId: 4166,
              },
            ],
          },
          { projectId: 2, name: '项目乙', projectType: 'NormalProject' },
        ],
      },
    }),
  };
});

describe('项目侧栏原型交互', () => {
  it('混合展开状态批量展开，再批量收起；键盘独立切换项目', async () => {
    const ref = createRef<ProjectPanelHandle>();
    render(<ProjectPanel ref={ref} compact />);
    const first = await screen.findByRole('button', { name: /项目甲/ });
    const second = screen.getByRole('button', { name: /项目乙/ });
    expect(first).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    act(() => ref.current?.toggleAll());
    expect(first).toHaveAttribute('aria-expanded', 'true');
    act(() => ref.current?.toggleAll());
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(second).toHaveAttribute('aria-expanded', 'false');
    fireEvent.keyDown(second, { key: ' ' });
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });

  it('点击更多菜单不切换项目展开状态', async () => {
    render(<ProjectPanel compact />);
    const row = await screen.findByRole('button', { name: /项目甲/ });
    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'PC.Components.ActionMenu.more',
      })[0],
    );
    expect(row).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.ConversationContextMenu.rename'),
      ).toBeVisible(),
    );
  });

  it('tab 接口子会话渲染:相对时间 + 点击回调携带原始会话', async () => {
    const onConversationClick = vi.fn();
    render(<ProjectPanel compact onConversationClick={onConversationClick} />);
    const child = await screen.findByText('子会话一');
    // dict mock 为返回 key 本身,渲染出 relativeMinutes 即证明时间走相对格式化
    expect(
      screen.getByText('PC.Utils.Common.relativeMinutes'),
    ).toBeInTheDocument();
    fireEvent.click(child);
    expect(onConversationClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11, topic: '子会话一' }),
    );
  });
});
