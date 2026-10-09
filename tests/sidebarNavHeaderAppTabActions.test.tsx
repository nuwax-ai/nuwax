/**
 * SidebarNavHeader 菜单顺序与应用标签行操作区单测：
 * - 系统/自定义菜单保留 list-menu 顺序，应用标签区在菜单列表之后；
 * - 点刷新/链接 icon → eventBus 发出 APP_TAB_PREVIEW_COMMAND（routePath 精确
 *   寻址 + action 区分），且不触发行点击跳转（stopPropagation）；
 * - 回归：标签行本体点击仍走 openApp + history.push；关闭钮仍走 closeApp。
 */
import SidebarNavHeader from '@/layouts/DynamicMenusLayout/SidebarNavHeader';
import type { OpenedAppTabInfo } from '@/models/openedAppTabs';
import type { MenuItemDto } from '@/types/interfaces/menu';
import {
  MenuBindTypeEnum,
  MenuEnabledEnum,
  MenuSourceEnum,
} from '@/types/menuPermission/menu-manage';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  openApp: vi.fn(),
  closeApp: vi.fn(),
  push: vi.fn(),
  commandSpy: vi.fn(),
  onMenuClick: vi.fn(),
  tabs: [] as OpenedAppTabInfo[],
}));

vi.mock('umi', () => ({
  useModel: (ns: string) => {
    if (ns === 'layout') return { setOpenSearchModal: vi.fn() };
    if (ns === 'tenantConfigInfo') return { tenantConfigInfo: null };
    if (ns === 'openedAppTabs')
      return {
        openedAppTabs: h.tabs,
        openApp: h.openApp,
        closeApp: h.closeApp,
      };
    return {};
  },
  useLocation: () => ({ pathname: '/user-app/5', search: '' }),
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

const header = (menus: MenuItemDto[] = []) => (
  <SidebarNavHeader
    menus={menus}
    activeTab="system_a"
    onMenuClick={h.onMenuClick}
    onNewTask={vi.fn()}
  />
);

const renderHeader = () => render(header());

// 模拟 list-menu 交错下发来源，sortIndex 也不能覆盖接口数组的顺序。
const orderedMenus: MenuItemDto[] = [
  { code: 'custom_a', name: '自定义甲', source: MenuSourceEnum.UserDefined },
  { code: 'system_a', name: '系统甲', source: MenuSourceEnum.SystemBuiltIn },
  { code: 'without_source', name: '未标来源' },
  { code: 'custom_b', name: '自定义乙', source: MenuSourceEnum.UserDefined },
  { code: 'system_b', name: '系统乙', source: MenuSourceEnum.SystemBuiltIn },
].map((menu, index) => ({
  ...menu,
  id: index + 1,
  path: `/menu/${menu.code}`,
  sortIndex: 10 - index,
  status: MenuEnabledEnum.Enabled,
  menuBindType: MenuBindTypeEnum.Unbound,
}));

describe('SidebarNavHeader 应用标签行操作区', () => {
  beforeEach(() => {
    h.openApp.mockReset();
    h.closeApp.mockReset();
    h.push.mockReset();
    h.commandSpy.mockReset();
    h.onMenuClick.mockReset();
    eventBus.clear();
    eventBus.on(EVENT_NAMES.APP_TAB_PREVIEW_COMMAND, h.commandSpy);
    h.tabs = [
      { routePath: '/user-app/5', name: '应用A', icon: '' },
    ] as OpenedAppTabInfo[];
  });

  it.each([false, true])(
    '系统与自定义菜单严格保留 list-menu 顺序（已打开应用：%s）',
    (hasOpenedApp) => {
      if (!hasOpenedApp) h.tabs = [];
      const { container } = render(header(orderedMenus));

      expect(
        Array.from(container.querySelectorAll('.nav-item-label')).map(
          (node) => node.textContent,
        ),
      ).toEqual(orderedMenus.map((menu) => menu.name));
      if (hasOpenedApp) {
        expect(
          Array.from(
            container.querySelectorAll('.nav-item-label, .app-tab-label'),
          ).map((node) => node.textContent),
        ).toEqual([...orderedMenus.map((menu) => menu.name), '应用A']);
      }
    },
  );

  it('菜单刷新后跟随新的接口顺序，选中态和点击仍对应原菜单', () => {
    const { container, rerender } = render(header(orderedMenus));
    const refreshedMenus = [...orderedMenus].reverse();

    rerender(header(refreshedMenus));

    expect(
      Array.from(container.querySelectorAll('.nav-item-label')).map(
        (node) => node.textContent,
      ),
    ).toEqual(refreshedMenus.map((menu) => menu.name));
    expect(container.querySelector('.nav-item-active')).toHaveTextContent(
      '系统甲',
    );
    fireEvent.click(screen.getByText('自定义甲'));
    expect(h.onMenuClick).toHaveBeenCalledWith(orderedMenus[0]);
  });

  it('点刷新 icon：发 reload 命令且不触发行点击跳转', () => {
    renderHeader();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.PagePreviewIframe.tooltipRefresh',
      }),
    );
    expect(h.commandSpy).toHaveBeenCalledWith({
      routePath: '/user-app/5',
      action: 'reload',
    });
    // stopPropagation 生效：行级点击（跳转）不被触发
    expect(h.openApp).not.toHaveBeenCalled();
    expect(h.push).not.toHaveBeenCalled();
  });

  it('点链接 icon：发 copyLink 命令且不触发行点击跳转', () => {
    renderHeader();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Components.PagePreviewIframe.tooltipCopyLink',
      }),
    );
    expect(h.commandSpy).toHaveBeenCalledWith({
      routePath: '/user-app/5',
      action: 'copyLink',
    });
    expect(h.openApp).not.toHaveBeenCalled();
    expect(h.push).not.toHaveBeenCalled();
  });

  it('回归：标签行本体点击仍跳转（openApp + history.push）', () => {
    renderHeader();
    fireEvent.click(screen.getByText('应用A'));
    expect(h.openApp).toHaveBeenCalledTimes(1);
    expect(h.push).toHaveBeenCalledTimes(1);
  });

  it('回归：关闭当前激活标签仍走 closeApp 并跳回女娲应用页', () => {
    renderHeader();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.closeAppTab',
      }),
    );
    expect(h.closeApp).toHaveBeenCalledWith('/user-app/5');
    // 无剩余标签 → 跳回女娲应用页（既有行为）
    expect(h.push).toHaveBeenCalledWith('/nuwa-apps');
  });
});
