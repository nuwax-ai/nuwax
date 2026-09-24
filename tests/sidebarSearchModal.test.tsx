/** 侧栏搜索弹窗当前六分类、结果跳转与快捷键行为。 */
import SidebarSearchModal from '@/layouts/DynamicMenusLayout/SidebarSearchModal';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  historyPush,
  handleCreateConversation,
  toggleCollapse,
  fetchTask,
  fetchProject,
  fetchRepo,
} = vi.hoisted(() => ({
  historyPush: vi.fn(),
  handleCreateConversation: vi.fn(),
  toggleCollapse: vi.fn(),
  fetchTask: vi.fn(),
  fetchProject: vi.fn(),
  fetchRepo: vi.fn(),
}));

const layoutState: Record<string, unknown> = {
  openSearchModal: true,
  setOpenSearchModal: vi.fn(),
  setOpenSetting: vi.fn(),
  isMobile: false,
  isSecondMenuCollapsed: false,
  setIsSecondMenuCollapsed: vi.fn(),
  setFullMobileMenu: vi.fn(),
};

const menuModelState: { firstLevelMenus: MenuItemDto[] } = {
  firstLevelMenus: [],
};

vi.mock('umi', () => ({
  history: { push: historyPush },
  useModel: (name: string) => {
    if (name === 'layout') return layoutState;
    if (name === 'menuModel') return menuModelState;
    if (name === 'tenantConfigInfo') return { tenantConfigInfo: null };
    return {};
  },
  useSearchParams: () => [new URLSearchParams('')],
}));

vi.mock('@/hooks/useConversation', () => ({
  default: () => ({ handleCreateConversation }),
}));

vi.mock('@/layouts/DynamicMenusLayout/useSidebarCollapse', () => ({
  useSidebarCollapse: () => ({
    isSecondMenuCollapsed: false,
    toggleCollapse,
  }),
}));

vi.mock('@/utils/hostBridge', () => ({
  isMac: () => false,
  isImmersiveShell: () => false,
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationList: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@/layouts/DynamicMenusLayout/SidebarSearchModal/sources', () => ({
  SEARCH_FETCHERS: { task: fetchTask, project: fetchProject, repo: fetchRepo },
}));

vi.mock('@/components/base/SvgIcon', () => ({
  default: () => <span data-testid="svg-icon" />,
}));

vi.mock('@/layouts/DynamicMenusLayout/SidebarSearchModal/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

vi.mock('@/layouts/DynamicMenusLayout/NewHomeSection/utils', () => ({
  formatModifiedTime: (value?: string) => value ?? '',
}));

const label = (key: string) =>
  `PC.Layouts.DynamicMenusLayout.SidebarSearchModal.${key}`;

beforeEach(() => {
  vi.clearAllMocks();
  menuModelState.firstLevelMenus = [];
  fetchTask.mockResolvedValue({
    items: [
      {
        id: 'task-11',
        kind: 'task',
        name: '任务一',
        conversation: { id: 11, agentId: 9 },
      },
    ],
    hasMore: false,
    cursor: {},
  });
  fetchProject.mockResolvedValue({ items: [], hasMore: false, cursor: {} });
  fetchRepo.mockResolvedValue({ items: [], hasMore: false, cursor: {} });
});

describe('SidebarSearchModal 六分类搜索', () => {
  it('展示六个分类，并且打开时只加载一次最近任务', async () => {
    render(<SidebarSearchModal />);
    for (const key of [
      'tabTask',
      'tabProject',
      'tabExpert',
      'tabSkill',
      'tabConnector',
      'tabRepo',
    ]) {
      expect(
        screen.getByRole('button', { name: label(key) }),
      ).toBeInTheDocument();
    }
    await screen.findByText('任务一');
    expect(fetchTask).toHaveBeenCalledTimes(1);
  });

  it('任务结果点击跳转到对应会话', async () => {
    const user = userEvent.setup();
    render(<SidebarSearchModal />);
    await user.click(await screen.findByText('任务一'));
    expect(historyPush).toHaveBeenCalledWith('/home/chat/11/9');
    expect(layoutState.setOpenSearchModal).toHaveBeenCalledWith(false);
  });

  it('切换到项目分类后按第一页加载', async () => {
    const user = userEvent.setup();
    render(<SidebarSearchModal />);
    await user.click(screen.getByRole('button', { name: label('tabProject') }));
    await waitFor(() =>
      expect(fetchProject).toHaveBeenCalledWith({
        keyword: '',
        size: 20,
        cursor: {},
      }),
    );
  });
});

describe('SidebarSearchModal 快捷键', () => {
  it('⌘B 调用统一折叠入口并关闭搜索', () => {
    render(<SidebarSearchModal />);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', metaKey: true, bubbles: true }),
    );
    expect(toggleCollapse).toHaveBeenCalledTimes(1);
    expect(layoutState.setOpenSearchModal).toHaveBeenCalledWith(false);
    expect(layoutState.setIsSecondMenuCollapsed).not.toHaveBeenCalled();
  });
});
