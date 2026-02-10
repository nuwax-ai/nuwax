/**
 * 动态菜单权限管理 Model
 * @description 管理用户的菜单树数据和功能权限，提供权限检查方法
 */
import { apiQueryMenus } from '@/services/menuService';
import { UserService } from '@/services/userService';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { MenuEnabledEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import { extractAllMenuCodes, extractAllPermissions } from '@/utils/permission';
import { useModel } from 'umi';

/**
 * 菜单权限模型
 */
export default function useMenuModel() {
  const { initialState } = useModel('@@initialState');
  // 菜单树数据
  const [menuTree, setMenuTree] = useState<MenuItemDto[]>(
    initialState?.menus || [],
  );
  // 权限码集合（用于快速查找）
  const [permissionSet, setPermissionSet] = useState<Set<string>>(
    new Set(initialState?.permissions || []),
  );
  // 菜单码集合（用于检查菜单访问权限）
  const [menuCodeSet, setMenuCodeSet] = useState<Set<string>>(
    new Set(initialState?.menus ? extractAllMenuCodes(initialState.menus) : []),
  );

  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);

  // 监听 initialState 变化
  useEffect(() => {
    if (initialState?.menus) {
      setMenuTree(initialState.menus);
      setPermissionSet(new Set(initialState.permissions || []));
      setMenuCodeSet(new Set(extractAllMenuCodes(initialState.menus)));
    }
  }, [initialState?.menus, initialState?.permissions]);

  /**
   * 加载菜单数据 (如果 data 已经存在于 initialState 则不需要重新 fetch)
   * 但为了兼容手动刷新，保留 fetch 逻辑
   */
  const loadMenus = useCallback(
    async (force = false) => {
      // 如果已有数据且不强制刷新，直接返回
      if (initialState?.menus?.length && !force) {
        console.log(
          '[Debug] Using cached menus from initialState:',
          initialState.menus,
        );
        setMenuTree(initialState.menus);
        setPermissionSet(new Set(initialState.permissions || []));
        setMenuCodeSet(new Set(extractAllMenuCodes(initialState.menus)));
        return;
      }

      setLoading(true);
      try {
        const userInfo = UserService.getUserInfoFromStorage();
        if (!userInfo?.id) {
          console.warn('无法获取用户信息，跳过菜单加载');
          setLoading(false);
          return;
        }
        const res = await apiQueryMenus();
        if (res.code === SUCCESS_CODE && res.data) {
          const menus = res.data || [];
          setMenuTree(menus);

          // 提取所有权限码
          const permissions = extractAllPermissions(menus);
          setPermissionSet(new Set(permissions));

          // 提取所有菜单码
          const menuCodes = extractAllMenuCodes(menus);
          setMenuCodeSet(new Set(menuCodes));
        }
      } catch (error) {
        console.error('加载菜单数据失败:', error);
      } finally {
        setLoading(false);
      }
    },
    [initialState],
  );

  /**
   * 一级菜单列表
   */
  const firstLevelMenus = useMemo(
    () =>
      menuTree?.filter(
        (menu: MenuItemDto) => menu.status === MenuEnabledEnum.Enabled,
      ),
    [menuTree],
  );

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

  return {
    // 状态
    menuTree,
    loading,
    // 菜单数据获取
    loadMenus,
    firstLevelMenus,
    getSecondLevelMenus,
    findMenuByPath,
    // 权限检查
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMenuAccess,
    getPagePermissions,
  };
}
