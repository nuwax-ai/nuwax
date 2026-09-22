import type { MenuItemDto } from '@/types/interfaces/menu';

/**
 * 产品明确不展示、但仍保留路由与权限能力的菜单路径。
 *
 * 这些菜单由后端权限树下发，不能只依赖 Umi route 的 hideInMenu；过滤仅用于
 * 前端菜单展示，权限集合仍由原始权限树计算。
 */
const PRESENTATION_HIDDEN_MENU_PATHS = new Set(['/system/config/theme']);

const normalizeMenuPath = (path?: string): string =>
  (path || '').split('?')[0].replace(/\/+$/, '');

export function filterPresentationHiddenMenus(
  menus: MenuItemDto[],
): MenuItemDto[] {
  return menus
    .filter(
      (menu) =>
        !PRESENTATION_HIDDEN_MENU_PATHS.has(normalizeMenuPath(menu.path)),
    )
    .map((menu) =>
      menu.children?.length
        ? {
            ...menu,
            children: filterPresentationHiddenMenus(menu.children),
          }
        : menu,
    );
}
