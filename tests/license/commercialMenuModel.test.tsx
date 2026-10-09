import useMenuModel from '@/models/menuModel';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  config: { aiOSCommercialEdition: false, enableSubscription: 1 },
  initialState: {
    menuData: [
      {
        id: 1,
        code: 'xiangmu_yingyong',
        path: '/space/:spaceId/project-manage',
        resourceTree: [{ code: 'project_read' }],
      },
      { id: 2, code: 'message', path: '/instant-message' },
    ],
  },
}));
vi.mock('umi', () => ({
  useModel: (name: string) =>
    name === 'tenantConfigInfo'
      ? { tenantConfigInfo: state.config }
      : { initialState: state.initialState },
}));
vi.mock('@/services/menuService', () => ({ apiQueryMenus: vi.fn() }));
vi.mock('@/services/userService', () => ({ UserService: {} }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/constants/menus.constants', () => ({ OTHER_MENU_CODES: [] }));
vi.mock('@/utils/permission', () => ({
  isRoutePathHidden: () => false,
  extractAllPermissions: (menus: any[]) =>
    new Map(
      menus.map((m) => [
        m.code,
        (m.resourceTree || []).map((r: any) => r.code),
      ]),
    ),
  extractAllMenuCodes: (menus: any[]) => menus.map((m) => m.code),
}));
afterEach(cleanup);
it('只隐藏菜单入口，保留 RBAC；授权刷新从原始菜单恢复', () => {
  state.config.aiOSCommercialEdition = false;
  const hook = renderHook(() => useMenuModel());
  expect(hook.result.current.menuTree.map((m) => m.code)).toEqual(['message']);
  expect(hook.result.current.hasPermission('project_read')).toBe(true);
  act(() => {
    state.config = { ...state.config, aiOSCommercialEdition: true };
    hook.rerender();
  });
  expect(hook.result.current.menuTree.map((m) => m.code)).toEqual([
    'xiangmu_yingyong',
    'message',
  ]);
  act(() => {
    state.config = { ...state.config, aiOSCommercialEdition: false };
    hook.rerender();
  });
  expect(hook.result.current.menuTree.map((m) => m.code)).toEqual(['message']);
});
