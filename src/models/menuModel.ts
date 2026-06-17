/**
 * 动态菜单权限管理 Model
 * @description 管理用户的菜单树数据和功能权限，提供权限检查方法
 */
import { apiQueryMenus } from '@/services/menuService';
import { UserService } from '@/services/userService';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModel } from 'umi';

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { OTHER_MENU_CODES } from '@/constants/menus.constants';
import { MenuEnabledEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import {
  extractAllMenuCodes,
  extractAllPermissions,
  isRoutePathHidden,
} from '@/utils/permission';

/**
 * 菜单权限模型
 */
export default function useMenuModel() {
  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  // 缓存最原始的菜单数据，用作响应式过滤的数据源
  const rawMenusRef = useRef<MenuItemDto[]>([]);

  // 菜单树数据
  const [menuTree, setMenuTree] = useState<MenuItemDto[]>([]);
  // 权限码集合（用于快速查找）
  const [permissionSet, setPermissionSet] = useState<Set<string>>(new Set([]));
  // 权限码集合（用于快速查找）
  const [permissionsMap, setPermissionsMap] = useState<Map<string, string[]>>(
    new Map(),
  );
  // 菜单码集合（用于检查菜单访问权限）
  const [menuCodeSet, setMenuCodeSet] = useState<Set<string>>(new Set([]));

  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);

  // 标记是否已从 initialState 初始化
  const initializedRef = useRef<boolean>(false);

  // 获取全局初始状态（包含预加载的菜单数据）
  const { initialState } = useModel('@@initialState');

  /**
   * 处理菜单数据：设置菜单树、权限码、菜单码
   */
  const processMenuData = useCallback(
    (menus: MenuItemDto[]) => {
      rawMenusRef.current = menus;

      const isHiddenMenu = (menu: MenuItemDto): boolean => {
        if (!menu.path) return false;
        const normalizedPath = menu.path.split('?')[0];
        return isRoutePathHidden(normalizedPath, tenantConfigInfo);
      };

      const filterItems = (items: MenuItemDto[]): MenuItemDto[] => {
        return items
          .filter((item) => !isHiddenMenu(item))
          .map((item) => {
            if (item.children?.length) {
              return {
                ...item,
                children: filterItems(item.children),
              };
            }
            return item;
          })
          .filter((item) => {
            // 没有 path 的菜单不需要隐藏 【比如 通知】
            if (!item.path) return true;

            // 如果一个菜单项本应有子菜单（即 children 被声明且过滤前长度大于 0），
            // 但经过过滤后其 children 列表变成了空数组，说明其所有子菜单均被隐藏，
            // 此时如果它自身没有独立的有效可访问路由路径（或者属于结构性导航组，如以 '#' 或空串等为 path 的节点），
            // 则该空壳父菜单节点也应当一并予以隐藏，避免展示空白下拉。
            if (item.children && item.children.length === 0) {
              const hasValidPath =
                item.path && item.path !== '#' && item.path !== '';
              return hasValidPath;
            }
            return true;
          });
      };

      const filteredMenus = filterItems(menus);

      setMenuTree(filteredMenus);

      // 提取所有权限码（从 Map 中提取所有值并打平）
      const permissionsMapData: Map<string, string[]> =
        extractAllPermissions(filteredMenus);
      const permissions: string[] = [];
      permissionsMapData.forEach((codes) => {
        permissions.push(...codes);
      });
      setPermissionSet(new Set(permissions));
      setPermissionsMap(permissionsMapData);

      // 提取所有菜单码
      const menuCodes = extractAllMenuCodes(filteredMenus);
      setMenuCodeSet(new Set(menuCodes));
    },
    [tenantConfigInfo?.enableSubscription],
  );

  // 当租户订阅开关状态变化时，重新基于最原始的菜单树数据源进行响应式过滤与权限重算
  useEffect(() => {
    if (rawMenusRef.current.length > 0) {
      processMenuData(rawMenusRef.current);
    }
  }, [tenantConfigInfo?.enableSubscription, processMenuData]);

  /**
   * 从 initialState 初始化菜单数据
   * 在 model 首次使用时自动执行
   */
  useEffect(() => {
    if (initializedRef.current) return;
    if (initialState?.menuData && initialState.menuData.length > 0) {
      initializedRef.current = true;
      processMenuData(initialState.menuData);
    }
  }, [initialState?.menuData, processMenuData]);

  /**
   * 加载菜单数据
   * @param force 是否强制重新加载（用于登录成功后刷新菜单）
   */
  const loadMenus = useCallback(
    async (force: boolean = false) => {
      // 如果不是强制刷新，且已经从 initialState 加载过，且有数据，则跳过
      if (!force && initializedRef.current && menuTree.length > 0) {
        return;
      }

      setLoading(true);
      try {
        const userInfo = UserService.getUserInfoFromStorage();
        if (!userInfo?.id) {
          setLoading(false);
          return;
        }
        const res = await apiQueryMenus();
        if (res.code === SUCCESS_CODE && res.data) {
          const menus = res.data || [];
          processMenuData(menus);
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to load menu data:', error);
      } finally {
        setLoading(false);
      }
    },
    [menuTree.length, processMenuData],
  );

  /**
   * 需要单独分离的菜单 code 列表
   * documents：文档
   * notification：通知
   * my_computer：我的电脑
   */

  /**
   * 一级菜单列表（排除 documents、notification、my_computer、more_page）
   */
  const firstLevelMenus = useMemo(
    () =>
      menuTree?.filter(
        (menu: MenuItemDto) =>
          menu.status === MenuEnabledEnum.Enabled &&
          !OTHER_MENU_CODES.includes(menu.code || ''),
      ),
    [menuTree],
  );

  /**
   * 其他菜单列表（只包含 documents、notification、my_computer、more_page）
   */
  const otherMenus = useMemo(() => {
    const menu = menuTree?.filter(
      (menu: MenuItemDto) =>
        menu.status === MenuEnabledEnum.Enabled &&
        OTHER_MENU_CODES.includes(menu.code || ''),
    );
    return [...menu];
  }, [menuTree]);

  /**
   * 根据父级菜单 code 获取其子菜单列表（递归查找）
   * @description 不再只在一级菜单中查找，而是递归整个菜单树
   */
  const getSecondLevelMenus = useCallback(
    (parentCode: string): MenuItemDto[] => {
      if (!menuTree?.length) return [];

      const findParent = (items: MenuItemDto[]): MenuItemDto | undefined => {
        for (const item of items) {
          if (item.code === parentCode) {
            return item;
          }
          if (item.children?.length) {
            const found = findParent(item.children);
            if (found) {
              return found;
            }
          }
        }
        return undefined;
      };

      const parent = findParent(menuTree);
      return (
        parent?.children?.filter(
          (menu: MenuItemDto) => menu.status === MenuEnabledEnum.Enabled,
        ) || []
      );
    },
    [menuTree],
  );

  /**
   * 判断菜单路径是否与目标路径匹配
   * @description 按路径段逐一比对，动态参数（如 :spaceId）匹配任意值，段数必须一致
   */
  const isMenuPathMatch = (menuPath: string, targetPath: string): boolean => {
    if (!menuPath || !targetPath) return false;

    const [menuPathname, menuQuery = ''] = menuPath.split('?');
    const [targetPathname, targetQuery = ''] = targetPath.split('?');

    const menuSegments = menuPathname.split('/').filter(Boolean);
    const targetSegments = targetPathname.split('/').filter(Boolean);

    // 判断路径段数是否一致
    if (menuSegments.length !== targetSegments.length) {
      return false;
    }

    // 判断路径段是否匹配
    const isPathSegmentsMatch = menuSegments.every((segment, index) => {
      const targetSegment = targetSegments[index];
      if (segment.startsWith(':')) {
        return Boolean(targetSegment);
      }
      return segment === targetSegment;
    });

    if (!isPathSegmentsMatch) {
      return false;
    }

    // 菜单配置了查询参数时，要求目标路径的查询参数也一致
    if (menuQuery) {
      return menuQuery === targetQuery;
    }

    return true;
  };

  /**
   * 判断指定一级菜单及其所有子菜单中，是否存在与传入路径匹配的菜单
   * @param firstLevelMenuCode 一级菜单 code
   * @param targetPath 待匹配的跳转路径
   * @returns 存在匹配路径返回 true，否则返回 false
   */
  const hasPathUnderFirstLevelMenu = useCallback(
    (firstLevelMenuCode: string, targetPath: string): boolean => {
      if (!firstLevelMenuCode || !targetPath || !menuTree?.length) {
        return false;
      }

      const firstLevelMenu = menuTree.find(
        (menu) => menu.code === firstLevelMenuCode,
      );
      if (!firstLevelMenu) {
        return false;
      }

      // 递归检查子菜单
      const checkMenuSubtree = (menu: MenuItemDto): boolean => {
        if (menu.path && isMenuPathMatch(menu.path, targetPath)) {
          return true;
        }
        return menu.children?.some((child) => checkMenuSubtree(child)) ?? false;
      };

      return checkMenuSubtree(firstLevelMenu);
    },
    [menuTree],
  );

  /**
   * 根据路径查找对应的菜单项
   */
  const findMenuByPath = useCallback(
    (path: string): MenuItemDto | undefined => {
      const traverse = (items: MenuItemDto[]): MenuItemDto | undefined => {
        for (const item of items) {
          if (item.path === path) {
            return item;
          }
          if (item.children?.length) {
            const found = traverse(item.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      return traverse(menuTree);
    },
    [menuTree],
  );

  /**
   * 检查是否有某个功能权限
   */
  const hasPermission = useCallback(
    (code: string): boolean => {
      return permissionSet.has(code);
    },
    [permissionSet],
  );

  /**
   * 检查是否有某个功能权限
   */
  const hasPermissionByMenuCode = useCallback(
    (menuCode: string, permissionCode: string): boolean => {
      return permissionsMap.get(menuCode)?.includes(permissionCode) || false;
    },
    [permissionsMap],
  );

  /**
   * 检查是否有多个权限中的任意一个
   */
  const hasAnyPermission = useCallback(
    (codes: string[]): boolean => {
      return codes.some((code) => permissionSet.has(code));
    },
    [permissionSet],
  );

  /**
   * 检查是否有所有指定权限
   */
  const hasAllPermissions = useCallback(
    (codes: string[]): boolean => {
      return codes.every((code) => permissionSet.has(code));
    },
    [permissionSet],
  );

  /**
   * 检查是否有某个菜单的访问权限
   */
  const hasMenuAccess = useCallback(
    (menuCode: string): boolean => {
      return menuCodeSet.has(menuCode);
    },
    [menuCodeSet],
  );

  /**
   * 获取页面对应的功能权限列表
   */
  const getPagePermissions = useCallback(
    (path: string): string[] => {
      const menu = findMenuByPath(path);
      return menu?.resourceTree?.map((r) => r.code || '') || [];
    },
    [findMenuByPath],
  );

  /**
   * 清除菜单信息
   * 用于退出登录时清除菜单数据，确保下次登录会重新加载
   */
  const clearMenuInfo = useCallback(() => {
    setMenuTree([]);
    setPermissionSet(new Set([]));
    setPermissionsMap(new Map());
    setMenuCodeSet(new Set([]));
    // 重置初始化标记，确保下次登录会重新加载菜单
    initializedRef.current = false;
  }, []);

  return {
    // 状态
    menuTree,
    loading,
    // 菜单数据获取
    loadMenus,
    firstLevelMenus,
    otherMenus,
    getSecondLevelMenus,
    hasPathUnderFirstLevelMenu,
    findMenuByPath,
    clearMenuInfo,
    // 权限检查
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMenuAccess,
    getPagePermissions,
    permissionSet,
    permissionsMap,
    hasPermissionByMenuCode,
  };
}
