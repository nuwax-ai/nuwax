/**
 * useMenuNavigation hook 单测（Classic/SidebarNav 双布局共用导航状态机的单源实现）。
 * 覆盖 activeTab 路径同步大 effect 的分支树与 handleTabClick 关键路径。
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MenuItemDto } from '@/types/interfaces/menu';

// vi.mock 工厂被提升执行，可变状态须经 vi.hoisted 供工厂引用
const nav = vi.hoisted(() => ({
  location: {
    pathname: '/home',
    search: '',
    state: undefined as unknown,
  },
  params: {} as Record<string, string | undefined>,
  menus: [] as MenuItemDto[],
  historyPush: vi.fn(),
  handleCloseMobileMenu: vi.fn(),
  runEdit: vi.fn(),
  handleCreateConversation: vi.fn(),
  hasPathUnderFirstLevelMenu: vi.fn(),
}));

vi.mock('umi', () => ({
  history: { push: nav.historyPush, replace: vi.fn(), location: {} },
  useLocation: () => nav.location,
  useParams: () => nav.params,
  useModel: (name: string) => {
    switch (name) {
      case 'layout':
        return { handleCloseMobileMenu: nav.handleCloseMobileMenu };
      case 'menuModel':
        return {
          firstLevelMenus: nav.menus,
          otherMenus: [],
          hasPathUnderFirstLevelMenu: nav.hasPathUnderFirstLevelMenu,
        };
      case 'devCollectAgent':
        return { runEdit: nav.runEdit };
      case 'tenantConfigInfo':
        return { tenantConfigInfo: { defaultAgentId: 42 } };
      default:
        return {};
    }
  },
}));

vi.mock('@/hooks/useConversation', () => ({
  default: () => ({ handleCreateConversation: nav.handleCreateConversation }),
}));

import { useMenuNavigation } from '@/layouts/DynamicMenusLayout/useMenuNavigation';

const buildMenus = (overrides: Partial<MenuItemDto> = {}): MenuItemDto =>
  ({
    code: 'some_menu',
    name: '菜单',
    path: '/some',
    ...overrides,
  }) as unknown as MenuItemDto;

describe('useMenuNavigation：activeTab 路径同步 effect', () => {
  beforeEach(() => {
    nav.location = { pathname: '/home', search: '', state: undefined };
    nav.params = {};
    nav.menus = [
      buildMenus({ code: 'workspace', path: '/space' }),
      buildMenus({
        code: 'system_manage',
        path: '/system',
        children: [buildMenus({ code: 'system_menu', path: '/system/menu' })],
      }),
    ];
    vi.clearAllMocks();
  });

  it('/home → homepage', () => {
    const { result } = renderHook(() => useMenuNavigation());
    expect(result.current.activeTab).toBe('homepage');
  });

  it('/square?cate_type=… → system_square', () => {
    nav.location = { pathname: '/square', search: '?cate_type=Agent', state: undefined };
    const { result } = renderHook(() => useMenuNavigation());
    expect(result.current.activeTab).toBe('system_square');
  });

  it('/more-page → more_page', () => {
    nav.location = { pathname: '/more-page', search: '', state: undefined };
    const { result } = renderHook(() => useMenuNavigation());
    expect(result.current.activeTab).toBe('more_page');
  });

  it('/agent/:id（带 agentId 参数）→ homepage 兜底', () => {
    nav.location = { pathname: '/agent/123', search: '', state: undefined };
    nav.params = { agentId: '123' };
    const { result } = renderHook(() => useMenuNavigation());
    expect(result.current.activeTab).toBe('homepage');
  });

  it('menuCode 参数命中子菜单 → 所属一级 code', () => {
    nav.location = { pathname: '/system/menu/list', search: '', state: undefined };
    nav.params = { menuCode: 'system_menu' };
    const { result } = renderHook(() => useMenuNavigation());
    expect(result.current.activeTab).toBe('system_manage');
  });

  it('根路径 → 第一个菜单 code（非新对话）', () => {
    nav.location = { pathname: '/', search: '', state: undefined };
    const { result } = renderHook(() => useMenuNavigation());
    expect(result.current.activeTab).toBe('workspace');
  });

  it('未匹配路径 → 回退到除新对话外的第一个菜单', () => {
    nav.menus = [
      buildMenus({ code: 'new_conversation', path: undefined }),
      buildMenus({ code: 'fallback_tab', path: '/fallback' }),
    ];
    nav.location = { pathname: '/nowhere', search: '', state: undefined };
    const { result } = renderHook(() => useMenuNavigation());
    expect(result.current.activeTab).toBe('fallback_tab');
  });
});

describe('useMenuNavigation：handleTabClick', () => {
  beforeEach(() => {
    nav.location = { pathname: '/home', search: '', state: undefined };
    nav.params = {};
    nav.menus = [
      buildMenus({ code: 'workspace', path: '/space' }),
      buildMenus({ code: 'system_manage', path: '/system' }),
    ];
    vi.clearAllMocks();
  });

  it('workspace 菜单：刷新最近编辑并跳转 /space', () => {
    const { result } = renderHook(() => useMenuNavigation());
    act(() => {
      result.current.handleTabClick(buildMenus({ code: 'workspace', path: '/space' }));
    });
    expect(nav.runEdit).toHaveBeenCalledWith({ size: 5 });
    expect(nav.historyPush).toHaveBeenCalledWith(
      '/space',
      expect.objectContaining({ menuCode: 'workspace' }),
    );
    expect(result.current.activeTab).toBe('workspace');
  });

  it('新对话菜单（无 path）：租户默认智能体建会话 + activeTab 跳下一个菜单', () => {
    nav.menus = [
      buildMenus({ code: 'new_conversation', path: undefined }),
      buildMenus({ code: 'next_tab', path: '/next' }),
    ];
    const { result } = renderHook(() => useMenuNavigation());
    act(() => {
      result.current.handleTabClick(
        buildMenus({ code: 'new_conversation', path: undefined }),
      );
    });
    expect(nav.handleCreateConversation).toHaveBeenCalledWith(42);
    expect(result.current.isClickNewConversation).toBe(true);
    expect(result.current.activeTab).toBe('next_tab');
  });

  it('普通菜单：置激活并跳转', () => {
    const { result } = renderHook(() => useMenuNavigation());
    act(() => {
      result.current.handleTabClick(buildMenus({ code: 'system_manage', path: '/system' }));
    });
    expect(result.current.activeTab).toBe('system_manage');
    expect(nav.historyPush).toHaveBeenCalledWith(
      '/system',
      expect.objectContaining({ menuCode: 'system_manage' }),
    );
  });
});
