/**
 * 菜单匹配纯函数（ClassicLayout / SidebarNavLayout 双布局单源，2026-09-12 抽取）。
 * 两布局此前各自持有一份逐字节相同的实现，收敛于此避免继续分叉。
 */
import { MenuItemDto } from '@/types/interfaces/menu';

import { normalizeMenuPathname } from './utils';

/**
 * 递归检查菜单是否匹配当前路径（一级菜单用）
 */
export const isMenuMatch = (menu: MenuItemDto, pathname: string): boolean => {
  const normalizedPathname = normalizeMenuPathname(pathname);

  // 检查当前菜单路径
  if (menu.path) {
    // 移除查询参数（? 及后面的部分），因为 pathname 不包含查询参数
    const menuPathWithoutQuery = menu.path.split('?')[0];

    // 首页特殊处理 homepage 是动态菜单的编码，/home 是前端路由
    if (menuPathWithoutQuery === '/homepage' || menuPathWithoutQuery === '') {
      if (normalizedPathname === '/home' || normalizedPathname === '')
        return true;
    }
    // 工作空间特殊处理，menu.path为/space 是工作空间的编码，pathname为/space/:spaceId/develop 是前端路由
    else if (menuPathWithoutQuery === '/space') {
      return normalizedPathname.startsWith(menuPathWithoutQuery);
    } else {
      // 通用处理：取第一个斜杠后的路径段进行匹配
      // 例如 pathname 为 /system/demo，menuPathWithoutQuery 为 /system/menu/xxx
      // 则都取第一个非空段 system 进行比较
      const getFirstSegment = (p: string) =>
        p.split('?')[0].split('/').filter(Boolean)[0] || '';

      const pathFirstSegment = getFirstSegment(normalizedPathname);
      const menuFirstSegment = getFirstSegment(menuPathWithoutQuery);

      if (menuFirstSegment && menuFirstSegment === pathFirstSegment) {
        return true;
      }
    }
  }

  return false;
};

/**
 * 检查路径是否匹配（用于子菜单的精确匹配）
 * @param menuPath 菜单路径
 * @param pathname 当前路径
 * @returns 是否匹配
 */
export const isPathMatch = (
  menuPath: string,
  pathname: string,
): boolean => {
  if (!menuPath) return false;

  const normalizedPathname = normalizeMenuPathname(pathname);

  // 移除查询参数
  const menuPathWithoutQuery = menuPath.split('?')[0];

  // 精确匹配
  if (normalizedPathname === menuPathWithoutQuery) {
    return true;
  }

  // 前缀匹配（例如 /system/menu 匹配 /system/menu/xxx）
  if (normalizedPathname.startsWith(menuPathWithoutQuery + '/')) {
    return true;
  }

  // 处理动态路径（例如 /space/:spaceId/develop）
  if (menuPathWithoutQuery.includes(':')) {
    // 将动态路径转换为正则表达式
    const pattern = menuPathWithoutQuery.replace(/:(\w+)/g, '[^/]+');
    const regex = new RegExp(`^${pattern}(/.*)?$`);
    return regex.test(normalizedPathname);
  }

  return false;
};

/**
 * 递归根据 code 查找菜单，并返回其第一级菜单的 code
 * @param firstLevelMenus 一级菜单列表
 * @param menuCode 需要匹配的菜单 code（可能是任意层级）
 * @returns 匹配菜单所属的第一级菜单 code，未找到返回 null
 */
export const findFirstLevelCodeByMenuCode = (
  firstLevelMenus: MenuItemDto[],
  menuCode: string,
): string | null => {
  if (!menuCode || !firstLevelMenus?.length) return null;

  /**
   * 深度优先遍历查找匹配的菜单
   * @param menus 当前遍历的菜单列表
   * @param firstLevelCode 当前遍历所在的一级菜单 code
   */
  const dfs = (
    menus: MenuItemDto[],
    firstLevelCode: string,
  ): string | null => {
    for (const menu of menus) {
      // 命中任意层级的菜单，返回对应的一级菜单 code
      if (menu.code === menuCode) {
        return firstLevelCode;
      }

      if (menu.children?.length) {
        const found = dfs(menu.children, firstLevelCode);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // 遍历所有一级菜单，从每个一级菜单开始向下递归查找
  for (const topMenu of firstLevelMenus) {
    // code 可选：缺失时回退空串（与原实现的 falsy 行为一致，命中也不会被外层采信）
    const result = dfs(topMenu.children || [], topMenu.code ?? '');
    // 也要判断一级菜单本身是否就是要找的 code
    if (topMenu.code === menuCode) {
      return topMenu.code;
    }
    if (result) {
      return result;
    }
  }

  return null;
};

/**
 * 递归查找匹配路径的菜单，并返回其第一级父菜单的 code
 * @param menus 菜单列表
 * @param pathname 当前路径
 * @param firstLevelCode 第一级菜单的 code（用于递归时传递）
 * @returns 匹配菜单的第一级父菜单的 code，如果未找到则返回 null
 */
export const findFirstLevelCodeByPath = (
  menus: MenuItemDto[],
  pathname: string,
  firstLevelCode?: string,
): string | null => {
  for (const menu of menus) {
    // 如果是第一级菜单，记录其 code
    const currentFirstLevelCode = firstLevelCode || menu.code;

    // 检查当前菜单是否匹配（一级菜单使用 isMenuMatch，子菜单使用 isPathMatch）
    const isMatch = firstLevelCode
      ? isPathMatch(menu.path || '', pathname)
      : isMenuMatch(menu, pathname);

    if (isMatch) {
      return currentFirstLevelCode || null;
    }

    // 如果有子菜单，递归查找
    if (menu.children && menu.children.length > 0) {
      const foundCode = findFirstLevelCodeByPath(
        menu.children,
        pathname,
        currentFirstLevelCode,
      );
      if (foundCode) {
        return foundCode;
      }
    }
  }
  return null;
};
