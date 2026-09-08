/**
 * 命令面板（侧栏搜索弹窗）权限门禁与折叠入口测试（#16 review 修复）：
 * 1. 工作空间入口与侧栏同源门禁：后端菜单树未下发 workspace/space 菜单
 *    （或状态为停用）时不渲染「打开工作空间」，杜绝 /space URL 直达绕过菜单权限；
 * 2. 菜单树含启用的工作空间菜单时渲染入口，点击跳转 /space；
 * 3. ⌘B / 面板动作统一走 toggleCollapse（移动端切抽屉、桌面端折叠含持久化）。
 */
import SidebarSearchModal from '@/layouts/DynamicMenusLayout/SidebarSearchModal';
import { MenuEnabledEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { historyPush, handleCreateConversation, toggleCollapse } = vi.hoisted(
  () => ({
    historyPush: vi.fn(),
    handleCreateConversation: vi.fn(),
    toggleCollapse: vi.fn(),
  }),
);

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

vi.mock('@/utils/nuwaClawBridge', () => ({
  isMac: () => false,
  isImmersiveShell: () => false,
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationList: vi.fn().mockResolvedValue({ data: [] }),
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

const workspaceLabel =
  'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.actionOpenWorkspace';

const menu = (code: string, status: MenuEnabledEnum): MenuItemDto =>
  ({
    code,
    status,
    name: code,
    children: [],
  } as unknown as MenuItemDto);

beforeEach(() => {
  vi.clearAllMocks();
  menuModelState.firstLevelMenus = [];
});

describe('SidebarSearchModal 工作空间入口权限门禁', () => {
  it('菜单树未下发工作空间菜单时不渲染「打开工作空间」', async () => {
    menuModelState.firstLevelMenus = [
      menu('homepage', MenuEnabledEnum.Enabled),
    ];
    render(<SidebarSearchModal />);
    await screen.findByText(
      'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.actionNewTask',
    );
    expect(screen.queryByText(workspaceLabel)).toBeNull();
  });

  it('工作空间菜单为停用状态时同样不渲染入口', async () => {
    menuModelState.firstLevelMenus = [
      menu('workspace', MenuEnabledEnum.Disabled),
    ];
    render(<SidebarSearchModal />);
    await screen.findByText(
      'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.actionNewTask',
    );
    expect(screen.queryByText(workspaceLabel)).toBeNull();
  });

  it('动态菜单 code=workspace 启用时渲染入口，点击跳转 /space', async () => {
    const user = userEvent.setup();
    menuModelState.firstLevelMenus = [
      menu('homepage', MenuEnabledEnum.Enabled),
      menu('workspace', MenuEnabledEnum.Enabled),
    ];
    render(<SidebarSearchModal />);
    const entry = await screen.findByText(workspaceLabel);
    await user.click(entry);
    await waitFor(() => expect(historyPush).toHaveBeenCalledWith('/space'));
  });

  it('静态菜单 code=space 启用时同样渲染入口', async () => {
    menuModelState.firstLevelMenus = [menu('space', MenuEnabledEnum.Enabled)];
    render(<SidebarSearchModal />);
    expect(await screen.findByText(workspaceLabel)).toBeTruthy();
  });
});

describe('SidebarSearchModal 折叠入口统一走 toggleCollapse', () => {
  it('面板「切换侧边栏」动作调用 toggleCollapse 而非直改折叠状态', async () => {
    const user = userEvent.setup();
    render(<SidebarSearchModal />);
    const action = await screen.findByText(
      'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.panelToggleSidebar',
    );
    await user.click(action);
    expect(toggleCollapse).toHaveBeenCalledTimes(1);
    expect(layoutState.setIsSecondMenuCollapsed).not.toHaveBeenCalled();
  });
});
