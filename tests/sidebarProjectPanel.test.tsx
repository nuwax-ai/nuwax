import ProjectPanel, {
  ProjectPanelHandle,
} from '@/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel';
import {
  apiUserProjectArchive,
  apiUserProjectPageQuery,
  apiUserProjectPin,
} from '@/services/userProjectApp';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);
// ⋯ 图标已换 SvgIcon（icons-common-more）：其 less 导入在测试环境为 undefined，
// 按组件边界 mock 成同构 span（aria-label 与真实渲染对齐）
vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
}));

// useModel 供 useHomePinnedProjectHandoff(pageHandoffContext)消费
vi.mock('umi', () => ({
  useParams: () => ({}),
  useModel: () => ({
    setContext: vi.fn(),
    consumeContext: () => undefined,
  }),
}));
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
  // 服务端真值（读己之写）：置顶/归档接口提交后列表回包随之带上标记，
  // 供 ProjectPanel「成败都向服务端真值收敛重拉」消费（2e17f6669 起）。
  // 不回写的话，收敛重拉会把本地刚落上的标记洗掉——本文件曾因此常红。
  const serverFlags = {
    pinned: new Set<number>(),
    archived: new Set<number>(),
  };
  const buildRecords = () =>
    [
      {
        projectId: 1,
        name: '项目甲',
        projectType: 'UserApp',
        modified: fiveMinutesAgo,
        created: fiveMinutesAgo,
      },
      { projectId: 2, name: '项目乙', projectType: 'NormalProject' },
    ].map((record) => ({
      ...record,
      ...(serverFlags.pinned.has(record.projectId) ? { pinned: true } : {}),
      ...(serverFlags.archived.has(record.projectId) ? { archived: true } : {}),
    }));
  const { SUCCESS_CODE } = await import('@/constants/codes.constants');
  const pageQueryMock = vi.fn().mockImplementation(() =>
    Promise.resolve({
      code: SUCCESS_CODE,
      data: { records: buildRecords(), total: 2 },
    }),
  );
  return {
    apiUserProjectPageQuery: Object.assign(pageQueryMock, {
      /** 复位服务端真值（beforeEach 用，防跨用例泄漏） */
      resetServerFlags: () => {
        serverFlags.pinned.clear();
        serverFlags.archived.clear();
      },
    }),
    apiUserProjectConversations: vi.fn().mockImplementation((projectId) =>
      Promise.resolve({
        code: '0000',
        data:
          projectId === 1
            ? [
                {
                  id: 11,
                  topic: '子会话一',
                  modified: fiveMinutesAgo,
                  taskStatus: 'COMPLETE',
                  agentId: 4166,
                },
              ]
            : [],
      }),
    ),
    apiNormalProjectUpdate: vi.fn().mockResolvedValue({ code: '0000' }),
    apiNormalProjectDelete: vi.fn().mockResolvedValue({ code: '0000' }),
    apiUserAppUpdate: vi.fn().mockResolvedValue({ code: '0000' }),
    apiUserAppDelete: vi.fn().mockResolvedValue({ code: '0000' }),
    apiUserProjectPin: vi.fn().mockImplementation((id, pinned) => {
      if (pinned) serverFlags.pinned.add(id);
      else serverFlags.pinned.delete(id);
      return Promise.resolve({ code: '0000' });
    }),
    apiUserProjectArchive: vi.fn().mockImplementation((id, archived) => {
      if (archived) serverFlags.archived.add(id);
      else serverFlags.archived.delete(id);
      return Promise.resolve({ code: '0000' });
    }),
    apiUserProjectCollect: vi.fn().mockResolvedValue({ code: '0000' }),
    apiUserProjectUnCollect: vi.fn().mockResolvedValue({ code: '0000' }),
  };
});

describe('项目侧栏原型交互', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 复位 mock 的服务端真值，避免上一条用例的置顶/归档泄漏到下一条
    // （resetServerFlags 挂在 mock 实例上，import 类型来自真实模块，须断言）
    (
      apiUserProjectPageQuery as unknown as { resetServerFlags: () => void }
    ).resetServerFlags();
  });

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

  it('项目右键与更多互斥，切换项目后也只保留当前菜单（2536）', async () => {
    render(<ProjectPanel compact />);
    const first = await screen.findByRole('button', { name: /项目甲/ });
    const second = screen.getByRole('button', { name: /项目乙/ });
    fireEvent.contextMenu(first);
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
    fireEvent.click(
      within(first).getByRole('button', {
        name: 'PC.Components.ActionMenu.more',
      }),
    );
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
    fireEvent.contextMenu(first);
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
    fireEvent.contextMenu(second);
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
    expect(first).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(
      screen.getByRole('menuitem', {
        name: /PC.Components.ConversationContextMenu.rename/,
      }),
    );
    await waitFor(() => expect(screen.queryAllByRole('menu')).toHaveLength(0));
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

  it('常规/全栈项目置顶和归档：接口成功后才更新列表状态', async () => {
    render(<ProjectPanel compact />);
    const normalProject = await screen.findByRole('button', {
      name: /项目乙/,
    });
    fireEvent.click(
      within(normalProject).getByRole('button', {
        name: 'PC.Components.ActionMenu.more',
      }),
    );
    fireEvent.click(
      await screen.findByText('PC.Components.ConversationContextMenu.pin'),
    );
    await waitFor(() =>
      expect(apiUserProjectPin).toHaveBeenCalledWith(2, true, 'NormalProject'),
    );
    await waitFor(() =>
      // 置顶态图标自 5e5028a87 起改渲染「实心图钉 + 斜杠」的 unpin-icon 槽位
      expect(normalProject.querySelector('.unpin-icon')).toBeInTheDocument(),
    );

    const userAppProject = screen.getByRole('button', { name: /项目甲/ });
    fireEvent.click(
      within(userAppProject).getByRole('button', {
        name: 'PC.Components.ActionMenu.more',
      }),
    );
    await screen.findAllByText('PC.Components.ConversationContextMenu.archive');
    fireEvent.click(
      screen
        .getAllByText('PC.Components.ConversationContextMenu.archive')
        .at(-1)!,
    );
    // 归档自 9f3292a79 起下沉为行内二次确认：先点「归档」进入 armed 态，
    // 再点红色「确认」才真正请求（防误触）
    fireEvent.click(await screen.findByText('PC.Common.Global.confirm'));
    await waitFor(() =>
      expect(apiUserProjectArchive).toHaveBeenCalledWith(1, true, 'UserApp'),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /项目甲/ }),
      ).not.toBeInTheDocument(),
    );
    // 归档项目不再提供侧栏查看入口（归档查看收敛到历史会话页）
    expect(
      screen.queryByText(
        'PC.Layouts.DynamicMenusLayout.NewHomeSection.archivedProjects (1)',
      ),
    ).not.toBeInTheDocument();
  });

  it('置顶接口失败时不改变本地状态', async () => {
    vi.mocked(apiUserProjectPin).mockResolvedValueOnce({
      code: '1001',
    } as never);
    render(<ProjectPanel compact />);
    const normalProject = await screen.findByRole('button', {
      name: /项目乙/,
    });
    const more = within(normalProject).getByRole('button', {
      name: 'PC.Components.ActionMenu.more',
    });
    fireEvent.click(more);
    fireEvent.click(
      await screen.findByText('PC.Components.ConversationContextMenu.pin'),
    );
    await waitFor(() =>
      expect(apiUserProjectPin).toHaveBeenCalledWith(2, true, 'NormalProject'),
    );
    expect(normalProject.querySelector('.pin-icon')).not.toBeInTheDocument();
  });
});
