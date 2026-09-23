/**
 * SidebarNavHeader 应用标签行操作区单测（刷新/复制链接 icon）：
 * - 点刷新/链接 icon → eventBus 发出 APP_TAB_PREVIEW_COMMAND（routePath 精确
 *   寻址 + action 区分），且不触发行点击跳转（stopPropagation）；
 * - 回归：标签行本体点击仍走 openApp + history.push；关闭钮仍走 closeApp。
 */
import SidebarNavHeader from '@/layouts/DynamicMenusLayout/SidebarNavHeader';
import type { OpenedAppTabInfo } from '@/models/openedAppTabs';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  openApp: vi.fn(),
  closeApp: vi.fn(),
  push: vi.fn(),
  commandSpy: vi.fn(),
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

const renderHeader = () =>
  render(
    <SidebarNavHeader
      menus={[]}
      activeTab=""
      onMenuClick={vi.fn()}
      onNewTask={vi.fn()}
    />,
  );

describe('SidebarNavHeader 应用标签行操作区', () => {
  beforeEach(() => {
    h.openApp.mockReset();
    h.closeApp.mockReset();
    h.push.mockReset();
    h.commandSpy.mockReset();
    eventBus.clear();
    eventBus.on(EVENT_NAMES.APP_TAB_PREVIEW_COMMAND, h.commandSpy);
    h.tabs = [
      { routePath: '/user-app/5', name: '应用A', icon: '' },
    ] as OpenedAppTabInfo[];
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
