/**
 * 动态菜单权限管理 Model
 * @description 管理用户的菜单树数据和功能权限，提供权限检查方法
 */
import { apiQueryMenus } from '@/services/menuService';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { useCallback, useMemo, useState } from 'react';

/**
 * 菜单权限模型
 */
export default function useMenuModel() {
  // 菜单树数据
  const [menuTree, setMenuTree] = useState<MenuItemDto[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 权限码集合（用于快速查找）
  const [permissionSet, setPermissionSet] = useState<Set<string>>(new Set());
  // 菜单码集合（用于检查菜单访问权限）
  const [menuCodeSet, setMenuCodeSet] = useState<Set<string>>(new Set());

  /**
   * 从菜单树中提取所有权限码
   */
  const extractAllPermissions = useCallback(
    (menus: MenuItemDto[]): string[] => {
      const codes: string[] = [];
      const traverse = (items: MenuItemDto[]) => {
        items.forEach((item) => {
          // 提取功能权限
          item.permissions?.forEach((p) => codes.push(p.code));
          // 递归处理子菜单
          if (item.children?.length) {
            traverse(item.children);
          }
        });
      };
      traverse(menus);
      return codes;
    },
    [],
  );

  /**
   * 从菜单树中提取所有菜单码
   */
  const extractAllMenuCodes = useCallback((menus: MenuItemDto[]): string[] => {
    const codes: string[] = [];
    const traverse = (items: MenuItemDto[]) => {
      items.forEach((item) => {
        codes.push(item.code);
        if (item.children?.length) {
          traverse(item.children);
        }
      });
    };
    traverse(menus);
    return codes;
  }, []);

  /**
   * 加载菜单数据
   */
  const loadMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiQueryMenus();
      if (res.code === 0 && res.data) {
        const menus = res.data.menus || [];
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
  }, [extractAllPermissions, extractAllMenuCodes]);

  /**
   * 一级菜单列表
   */
  const firstLevelMenus = useMemo(() => menuTree, [menuTree]);

  /**
   * 根据一级菜单 code 获取二级菜单列表
   */
  const getSecondLevelMenus = useCallback(
    (parentCode: string): MenuItemDto[] => {
      const parent = menuTree.find((m) => m.code === parentCode);
      return parent?.children || [];
    },
    [menuTree],
  );

  /**
   * 根据一级和二级菜单 code 获取三级菜单列表
   */
  const getThirdLevelMenus = useCallback(
    (parentCode: string, secondCode: string): MenuItemDto[] => {
      const parent = menuTree.find((m) => m.code === parentCode);
      const second = parent?.children?.find((m) => m.code === secondCode);
      return second?.children || [];
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
      return menu?.permissions?.map((p) => p.code) || [];
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
    getThirdLevelMenus,
    findMenuByPath,
    // 权限检查
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMenuAccess,
    getPagePermissions,
  };
}
