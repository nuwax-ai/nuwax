/**
 * menus 使用 menuModel 已过滤禁用项的 firstLevelMenus 契约：
 * 新建任务入口与快捷键随 new_conversation 下发状态变化，搜索与普通菜单独立可用。
 */
import SidebarNavHeader from '@/layouts/DynamicMenusLayout/SidebarNavHeader';
import type { OpenedAppTabInfo } from '@/models/openedAppTabs';
import type { MenuItemDto } from '@/types/interfaces/menu';
import {
  MenuBindTypeEnum,
  MenuEnabledEnum,
  MenuSourceEnum,
} from '@/types/menuPermission/menu-manage';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  setOpenSearchModal: vi.fn(),
  onMenuClick: vi.fn(),
  onNewTask: vi.fn(),
  openApp: vi.fn(),
  closeApp: vi.fn(),
  push: vi.fn(),
  tabs: [] as OpenedAppTabInfo[],
}));

vi.mock('umi', () => ({
  useModel: (ns: string) => {
    if (ns === 'layout') return { setOpenSearchModal: h.setOpenSearchModal };
    if (ns === 'tenantConfigInfo') return { tenantConfigInfo: null };
    if (ns === 'openedAppTabs')
      return {
        openedAppTabs: h.tabs,
        openApp: h.openApp,
        closeApp: h.closeApp,
      };
    return {};
  },
  useLocation: () => ({ pathname: '/home', search: '' }),
  history: { push: h.push },
}));

vi.mock('@/layouts/DynamicMenusLayout/useSidebarCollapse', () => ({
  useSidebarCollapse: () => ({
    isSecondMenuCollapsed: false,
    toggleCollapse: vi.fn(),
  }),
}));

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

vi.mock('@/utils/hostBridge', () => ({
  isImmersiveShell: () => false,
  isMac: () => false,
}));

vi.mock('@/features/client-shell', () => ({
  ClientVersionBadge: () => null,
}));

vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
}));

vi.mock('@/assets/images/agent_image.png', () => ({ default: 'agent.png' }));

vi.mock('@/layouts/DynamicMenusLayout/SidebarNavHeader/index.less', () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

const NEW_TASK_LABEL = 'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.newTask';

const homeMenu: MenuItemDto = {
  id: 1,
  code: 'home',
  name: '主页',
  path: '/home',
  status: MenuEnabledEnum.Enabled,
  source: MenuSourceEnum.SystemBuiltIn,
  menuBindType: MenuBindTypeEnum.Unbound,
};

const newTaskMenu: MenuItemDto = {
  id: 2,
  code: 'new_conversation',
  name: '后台新建任务入口',
  status: MenuEnabledEnum.Enabled,
  source: MenuSourceEnum.SystemBuiltIn,
  menuBindType: MenuBindTypeEnum.Unbound,
};

const header = (menus: MenuItemDto[]) => (
  <SidebarNavHeader
    menus={menus}
    activeTab="home"
    onMenuClick={h.onMenuClick}
    onNewTask={h.onNewTask}
  />
);

const shortcuts = [
  { name: 'Ctrl+N', ctrlKey: true, metaKey: false },
  { name: 'Meta+N', ctrlKey: false, metaKey: true },
];

describe('SidebarNavHeader 新建任务菜单权限', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.tabs = [];
  });

  it.each([
    { name: '菜单尚未加载', menus: [] },
    { name: '后台未下发新建任务', menus: [homeMenu] },
  ])('$name 时不显示新建任务', ({ menus }) => {
    render(header(menus));

    expect(screen.queryByText(NEW_TASK_LABEL)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: 'icons-nav-new_chat' }),
    ).not.toBeInTheDocument();
  });

  it('下发启用的新建任务菜单时显示独立入口，点击与快捷键均执行 onNewTask', () => {
    render(header([newTaskMenu, homeMenu]));

    expect(screen.getAllByText(NEW_TASK_LABEL)).toHaveLength(1);
    expect(screen.queryByText(newTaskMenu.name)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(NEW_TASK_LABEL));

    expect(h.onNewTask).toHaveBeenCalledTimes(1);
    expect(h.onMenuClick).not.toHaveBeenCalled();
    for (const shortcut of shortcuts) {
      const event = new KeyboardEvent('keydown', {
        key: 'N',
        ctrlKey: shortcut.ctrlKey,
        metaKey: shortcut.metaKey,
        cancelable: true,
      });

      fireEvent(window, event);

      expect(event.defaultPrevented).toBe(true);
    }
    expect(h.onNewTask).toHaveBeenCalledTimes(3);
  });

  it('新建任务隐藏时不执行或拦截 Ctrl+N 和 Meta+N 浏览器快捷键', () => {
    render(header([homeMenu]));
    for (const shortcut of shortcuts) {
      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: shortcut.ctrlKey,
        metaKey: shortcut.metaKey,
        cancelable: true,
      });

      fireEvent(window, event);

      expect(event.defaultPrevented).toBe(false);
    }
    expect(h.onNewTask).not.toHaveBeenCalled();
  });

  it('菜单刷新移除新建任务后入口和快捷键立即失效，再次下发后恢复', () => {
    const { rerender } = render(header([newTaskMenu, homeMenu]));
    expect(screen.getByText(NEW_TASK_LABEL)).toBeInTheDocument();

    rerender(header([homeMenu]));

    expect(screen.queryByText(NEW_TASK_LABEL)).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'n', metaKey: true });
    expect(h.onNewTask).not.toHaveBeenCalled();

    rerender(header([newTaskMenu, homeMenu]));

    fireEvent.click(screen.getByText(NEW_TASK_LABEL));
    fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
    expect(h.onNewTask).toHaveBeenCalledTimes(2);
  });

  it('新建任务隐藏时普通菜单与搜索入口仍可用', () => {
    const { container } = render(header([homeMenu]));

    fireEvent.click(screen.getByText(homeMenu.name));
    expect(h.onMenuClick).toHaveBeenCalledWith(homeMenu);

    // 顶栏第一个操作入口为搜索，Tooltip 不改变其点击元素。
    const searchButton = container.querySelector('.header-action-btn');
    expect(searchButton).toBeInTheDocument();
    fireEvent.click(searchButton!);
    expect(h.setOpenSearchModal).toHaveBeenCalledWith(true);
    expect(h.onNewTask).not.toHaveBeenCalled();
  });
});
