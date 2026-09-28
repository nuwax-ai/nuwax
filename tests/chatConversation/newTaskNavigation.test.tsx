import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({
  historyPush: vi.fn(),
  handleCreateConversation: vi.fn(),
  handleCloseMobileMenu: vi.fn(),
  refreshUserInfo: vi.fn(),
  hostCommandHandler: null as ((payload: HostCommand) => void) | null,
  syncNewTaskAvailable: vi.fn(),
  tenantConfigInfo: { defaultAgentId: 42 } as { defaultAgentId: number } | null,
  menus: [
    { code: 'new_conversation', name: '新对话', path: '' },
    { code: 'homepage', name: '主页', path: '/home' },
  ],
  otherMenus: [],
  openedAppTabs: [],
}));

vi.mock('umi', () => ({
  history: { push: nav.historyPush },
  useLocation: () => ({ pathname: '/user-app/5', search: '' }),
  useParams: () => ({}),
  useModel: (name: string) => {
    switch (name) {
      case 'layout':
        return {
          isSecondMenuCollapsed: false,
          handleCloseMobileMenu: nav.handleCloseMobileMenu,
          setIsSecondMenuCollapsed: vi.fn(),
          setOpenMessage: vi.fn(),
          setOpenAdmin: vi.fn(),
          setOpenSearchModal: vi.fn(),
        };
      case 'menuModel':
        return {
          firstLevelMenus: nav.menus,
          otherMenus: nav.otherMenus,
          hasPathUnderFirstLevelMenu: vi.fn(),
        };
      case 'tenantConfigInfo':
        return { tenantConfigInfo: nav.tenantConfigInfo };
      case 'userInfo':
        return { refreshUserInfo: nav.refreshUserInfo };
      case 'openedAppTabs':
        return { openedAppTabs: nav.openedAppTabs };
      default:
        return {};
    }
  },
}));

vi.mock('@/hooks/useConversation', () => ({
  default: () => ({ handleCreateConversation: nav.handleCreateConversation }),
}));
vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({
    effectiveNavigationStyle: 'style3',
    layoutStyle: 'default',
  }),
}));
vi.mock('@/services/i18n', () => ({
  saveUserLang: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    events: {
      onHostCommand: (handler: ((payload: HostCommand) => void) | null) => {
        nav.hostCommandHandler = handler;
        return true;
      },
    },
    layout: { setNewTaskAvailable: nav.syncNewTaskAvailable },
  },
  isDesktopHost: () => false,
  isImmersiveShell: () => false,
  isWinLinuxShell: () => false,
  isMac: () => false,
  shellAvoid: { TOP: 0, CONTENT_TOP: 0 },
}));
vi.mock('@/features/client-shell', () => ({ ClientVersionBadge: () => null }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/base/HoverScrollbar', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/components/ResizableSplit/ResizeDivider', () => ({
  default: () => null,
}));
vi.mock('@/components/business-component/CreditsBalance', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/useSidebarCollapse', () => ({
  useSidebarCollapse: () => ({
    isSecondMenuCollapsed: false,
    toggleCollapse: vi.fn(),
  }),
}));
vi.mock('@/layouts/DynamicMenusLayout/useSecondMenuShellSync', () => ({
  useSecondMenuShellSync: () => undefined,
}));
vi.mock('@/layouts/DynamicMenusLayout/DynamicSecondMenu', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/NewHomeSection', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/SpaceSection', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/SquareSection', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/SidebarSearchModal', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/User', () => ({ default: () => null }));
vi.mock('@/layouts/DynamicMenusLayout/User/UserAvatar', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/Header', () => ({ default: () => null }));
vi.mock('@/layouts/DynamicMenusLayout/DynamicTabs', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/UserOperateArea', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/ClassicLayout/CollapseButton', () => ({
  default: () => null,
}));
vi.mock('@/layouts/DynamicMenusLayout/SidebarNavLayout/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@/layouts/DynamicMenusLayout/ClassicLayout/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@/layouts/DynamicMenusLayout/SidebarNavHeader/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

import ClassicLayout from '@/layouts/DynamicMenusLayout/ClassicLayout';
import SidebarNavLayout from '@/layouts/DynamicMenusLayout/SidebarNavLayout';

const expectHomeWithoutConversation = () => {
  expect(nav.handleCreateConversation).not.toHaveBeenCalled();
  expect(nav.historyPush).toHaveBeenCalledTimes(1);
  expect(nav.historyPush).toHaveBeenCalledWith('/home');
  expect(nav.handleCloseMobileMenu).toHaveBeenCalledTimes(1);
};

describe('全局新建任务入口', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.tenantConfigInfo = { defaultAgentId: 42 };
    nav.hostCommandHandler = null;
    nav.menus = [
      { code: 'new_conversation', name: '新对话', path: '' },
      { code: 'homepage', name: '主页', path: '/home' },
    ];
  });
  afterEach(cleanup);

  it('侧栏点击直接进入主页，租户配置就绪也不提前创建会话', () => {
    render(<SidebarNavLayout />);
    fireEvent.click(
      screen.getByText(
        'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.newTask',
      ),
    );
    expectHomeWithoutConversation();
  });

  it.each(['ctrlKey', 'metaKey'])('%s + N 与侧栏点击行为一致', (modifier) => {
    render(<SidebarNavLayout />);
    fireEvent.keyDown(window, { key: 'n', [modifier]: true });
    expectHomeWithoutConversation();
  });

  it.each([
    { name: '单栏布局', Layout: SidebarNavLayout },
    { name: '经典布局', Layout: ClassicLayout },
  ])('$name 宿主 new-task 命令直接进入主页', ({ Layout }) => {
    render(<Layout />);
    act(() => nav.hostCommandHandler?.({ type: 'new-task' }));
    expectHomeWithoutConversation();
  });

  it.each([
    { name: '单栏布局', Layout: SidebarNavLayout },
    { name: '经典布局', Layout: ClassicLayout },
  ])('$name 菜单隐藏后宿主 new-task 命令不再导航', ({ Layout }) => {
    nav.menus = [{ code: 'homepage', name: '主页', path: '/home' }];
    render(<Layout />);
    act(() => nav.hostCommandHandler?.({ type: 'new-task' }));
    expect(nav.historyPush).not.toHaveBeenCalled();
    expect(nav.handleCreateConversation).not.toHaveBeenCalled();
    expect(nav.syncNewTaskAvailable).toHaveBeenLastCalledWith(false);
  });

  it.each([
    { name: '单栏布局', Layout: SidebarNavLayout },
    { name: '经典布局', Layout: ClassicLayout },
  ])('$name 菜单刷新与布局卸载同步撤销宿主可用态', ({ Layout }) => {
    const { rerender, unmount } = render(<Layout />);
    expect(nav.syncNewTaskAvailable).toHaveBeenLastCalledWith(true);

    nav.menus = [{ code: 'homepage', name: '主页', path: '/home' }];
    rerender(<Layout />);
    expect(nav.syncNewTaskAvailable).toHaveBeenLastCalledWith(false);
    act(() => nav.hostCommandHandler?.({ type: 'new-task' }));
    expect(nav.historyPush).not.toHaveBeenCalled();

    nav.menus = [
      { code: 'new_conversation', name: '新对话', path: '' },
      ...nav.menus,
    ];
    rerender(<Layout />);
    expect(nav.syncNewTaskAvailable).toHaveBeenLastCalledWith(true);
    act(() => nav.hostCommandHandler?.({ type: 'new-task' }));
    expectHomeWithoutConversation();

    unmount();
    expect(nav.syncNewTaskAvailable).toHaveBeenLastCalledWith(false);
    expect(nav.hostCommandHandler).toBeNull();
  });

  it('租户配置未就绪时也能直接进入主页', () => {
    nav.tenantConfigInfo = null;
    render(<SidebarNavLayout />);
    fireEvent.click(
      screen.getByText(
        'PC.Layouts.DynamicMenusLayout.SidebarNavHeader.newTask',
      ),
    );
    expectHomeWithoutConversation();
  });
});
