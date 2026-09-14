import ProjectList from '@/components/business-component/HistoryConversationList/ProjectList';
import {
  apiUserProjectArchive,
  apiUserProjectCollect,
  apiUserProjectConversations,
  apiUserProjectPageQuery,
  apiUserProjectUnCollect,
} from '@/services/userProjectApp';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { history } from 'umi';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/components/business-component/HistoryConversationList/ProjectList/index.less',
  () => ({ default: {} }),
);
vi.mock(
  '@/components/business-component/ConversationContextMenu/index.less',
  () => ({ default: {} }),
);
vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));
// ProjectList 取 history 跳转；其子组件依赖链里的 services/agentConfig 取 umi request
vi.mock('umi', () => ({
  history: { push: vi.fn() },
  request: vi.fn(),
}));
vi.mock('@/services/userProjectApp', () => ({
  apiUserProjectPageQuery: vi.fn(),
  apiUserProjectConversations: vi.fn(),
  apiUserProjectPin: vi.fn().mockResolvedValue({ code: '0000' }),
  apiUserProjectArchive: vi.fn().mockResolvedValue({ code: '0000' }),
  apiUserProjectCollect: vi.fn().mockResolvedValue({ code: '0000' }),
  apiUserProjectUnCollect: vi.fn().mockResolvedValue({ code: '0000' }),
}));

const buildProject = (
  overrides: Partial<UserProjectTabItem>,
): UserProjectTabItem =>
  ({
    projectId: 1,
    spaceId: 10,
    projectType: 'NormalProject',
    name: '项目A',
    modified: '2026-09-14 10:00:00',
    created: '2026-09-14 10:00:00',
    ...overrides,
  } as UserProjectTabItem);

const pageOf = (records: UserProjectTabItem[], pages = 1) => ({
  code: '0000',
  success: true,
  data: { records, total: records.length, current: 1, size: 20, pages },
});

/** 打开项目行「⋯」菜单（SvgIcon mock 的 aria-label 即图标名） */
const openProjectMenu = (index = 0) => {
  const buttons = screen
    .getAllByRole('img', { name: 'icons-common-more' })
    .map((icon) => icon.parentElement!);
  fireEvent.click(buttons[index]);
};

describe('历史会话页「项目」tab（ProjectList）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('全部视图首拉不传 collectedFilter，渲染项目行', async () => {
    vi.mocked(apiUserProjectPageQuery).mockResolvedValue(
      pageOf([
        buildProject({ projectId: 1, name: '项目A' }),
        buildProject({ projectId: 2, name: '项目B' }),
      ]) as never,
    );
    render(<ProjectList />);

    expect(await screen.findByText('项目A')).toBeInTheDocument();
    expect(screen.getByText('项目B')).toBeInTheDocument();
    const arg = vi.mocked(apiUserProjectPageQuery).mock.calls[0][0];
    expect(arg.queryFilter.collectedFilter).toBeUndefined();
    expect(arg.current).toBe(1);
  });

  it('切「已收藏」视图重拉并携带 collectedFilter=only', async () => {
    vi.mocked(apiUserProjectPageQuery).mockResolvedValue(
      pageOf([buildProject({ projectId: 1, collected: true })]) as never,
    );
    render(<ProjectList />);
    await screen.findByText('项目A');

    vi.mocked(apiUserProjectPageQuery).mockClear();
    fireEvent.click(
      screen.getByText('PC.Components.HistoryConversationList.collectedTab'),
    );
    await waitFor(() => expect(apiUserProjectPageQuery).toHaveBeenCalled());
    const arg = vi.mocked(apiUserProjectPageQuery).mock.calls[0][0];
    expect(arg.queryFilter.collectedFilter).toBe('only');
  });

  it('展开项目懒加载子会话（统一接口不随列表回包），全部视图隐藏归档子会话', async () => {
    vi.mocked(apiUserProjectPageQuery).mockResolvedValue(
      pageOf([buildProject({ projectId: 1 })]) as never,
    );
    vi.mocked(apiUserProjectConversations).mockResolvedValue({
      code: '0000',
      data: [
        { id: 11, topic: '子会话1', archived: false, agentId: 2 } as never,
        { id: 12, topic: '子会话2', archived: true, agentId: 2 } as never,
      ],
    } as never);
    render(<ProjectList />);
    fireEvent.click(await screen.findByText('项目A'));

    expect(await screen.findByText('子会话1')).toBeInTheDocument();
    expect(screen.queryByText('子会话2')).not.toBeInTheDocument(); // 全部视图隐藏归档子会话
    expect(apiUserProjectConversations).toHaveBeenCalledWith(
      1,
      'NormalProject',
    );
    fireEvent.click(screen.getByText('子会话1'));
    expect(history.push).toHaveBeenCalledWith('/home/chat/11/2');
  });

  it('收起再展开子会话走缓存，不重复调 conversations 接口', async () => {
    vi.mocked(apiUserProjectPageQuery).mockResolvedValue(
      pageOf([buildProject({ projectId: 1 })]) as never,
    );
    vi.mocked(apiUserProjectConversations).mockResolvedValue({
      code: '0000',
      data: [
        { id: 11, topic: '子会话1', archived: false, agentId: 2 } as never,
      ],
    } as never);
    render(<ProjectList />);
    fireEvent.click(await screen.findByText('项目A')); // 展开 → 懒加载
    await screen.findByText('子会话1');

    fireEvent.click(screen.getByText('项目A')); // 收起
    fireEvent.click(screen.getByText('项目A')); // 再展开
    await screen.findByText('子会话1');
    expect(apiUserProjectConversations).toHaveBeenCalledTimes(1);
  });

  it('已归档视图展示统一接口回包中的归档项目（全部视图隐藏）', async () => {
    vi.mocked(apiUserProjectPageQuery).mockResolvedValue(
      pageOf([
        buildProject({ projectId: 1 }),
        buildProject({ projectId: 2, name: '归档项目', archived: true }),
      ]) as never,
    );
    render(<ProjectList />);
    await screen.findByText('项目A');
    expect(screen.queryByText('归档项目')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByText('PC.Components.HistoryConversationList.archivedTab'),
    );
    expect(await screen.findByText('归档项目')).toBeInTheDocument();
    expect(screen.queryByText('项目A')).not.toBeInTheDocument();
  });

  it('项目菜单归档调 archive 接口（projectType 必传），成功后行从全部视图消失', async () => {
    vi.mocked(apiUserProjectPageQuery).mockResolvedValue(
      pageOf([buildProject({ projectId: 1 })]) as never,
    );
    render(<ProjectList />);
    await screen.findByText('项目A');

    openProjectMenu();
    fireEvent.click(
      await screen.findByText('PC.Components.ConversationContextMenu.archive'),
    );

    await waitFor(() =>
      expect(apiUserProjectArchive).toHaveBeenCalledWith(
        1,
        true,
        'NormalProject',
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText('项目A')).not.toBeInTheDocument(),
    );
  });

  it('已收藏视图取消收藏调 unCollect，成功后行消失', async () => {
    vi.mocked(apiUserProjectPageQuery).mockResolvedValue(
      pageOf([buildProject({ projectId: 1, collected: true })]) as never,
    );
    render(<ProjectList />);
    await screen.findByText('项目A');

    // 切到已收藏视图（collectedFilter=only 回包即该收藏项目）
    fireEvent.click(
      screen.getByText('PC.Components.HistoryConversationList.collectedTab'),
    );
    await screen.findByText('项目A');

    openProjectMenu();
    fireEvent.click(
      await screen.findByText(
        'PC.Components.ConversationContextMenu.unfavorite',
      ),
    );

    await waitFor(() =>
      expect(apiUserProjectUnCollect).toHaveBeenCalledWith(1, 'NormalProject'),
    );
    expect(apiUserProjectCollect).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText('项目A')).not.toBeInTheDocument(),
    );
  });
});
