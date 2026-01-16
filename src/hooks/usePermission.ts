/**
 * 权限检查 Hook
 * @description 提供权限检查方法，用于在组件中进行权限判断
 *
 * @example
 * const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
 *
 * // 检查单个权限
 * if (hasPermission('user:add')) {
 *   // 有权限时的逻辑
 * }
 *
 * // 检查是否有任意权限
 * if (hasAnyPermission(['user:edit', 'user:delete'])) {
 *   // 有任意一个权限时的逻辑
 * }
 *
 * // 检查是否有所有权限
 * if (hasAllPermissions(['admin:view', 'admin:edit'])) {
 *   // 有所有权限时的逻辑
 * }
 */
import { useCallback } from 'react';
import { useModel } from 'umi';

export interface UsePermissionReturn {
  /**
   * 检查是否有某个功能权限
   * @param code 权限码
   * @returns 是否有权限
   */
  hasPermission: (code: string) => boolean;
  /**
   * 检查是否有多个权限中的任意一个
   * @param codes 权限码数组
   * @returns 是否有任意一个权限
   */
  hasAnyPermission: (codes: string[]) => boolean;
  /**
   * 检查是否有所有指定权限
   * @param codes 权限码数组
   * @returns 是否有所有权限
   */
  hasAllPermissions: (codes: string[]) => boolean;
  /**
   * 检查是否有某个菜单的访问权限
   * @param menuCode 菜单码
   * @returns 是否有访问权限
   */
  hasMenuAccess: (menuCode: string) => boolean;
}

export function usePermission(): UsePermissionReturn {
  const {
    hasPermission: _hasPermission,
    hasAnyPermission: _hasAnyPermission,
    hasAllPermissions: _hasAllPermissions,
    hasMenuAccess: _hasMenuAccess,
  } = useModel('menuModel');

  // 包装方法以确保稳定引用
  const hasPermission = useCallback(
    (code: string) => _hasPermission(code),
    [_hasPermission],
  );

  const hasAnyPermission = useCallback(
    (codes: string[]) => _hasAnyPermission(codes),
    [_hasAnyPermission],
  );

  const hasAllPermissions = useCallback(
    (codes: string[]) => _hasAllPermissions(codes),
    [_hasAllPermissions],
  );

  const hasMenuAccess = useCallback(
    (menuCode: string) => _hasMenuAccess(menuCode),
    [_hasMenuAccess],
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasMenuAccess,
  };
}

export default usePermission;
