/**
 * 权限包裹组件
 * @description 根据用户权限控制子元素的显示/隐藏
 *
 * @example
 * // 单个权限检查
 * <PermissionWrapper permissions="user:add">
 *   <Button type="primary">新增用户</Button>
 * </PermissionWrapper>
 *
 * @example
 * // 多个权限，满足任意一个即可
 * <PermissionWrapper permissions={['user:edit', 'user:delete']}>
 *   <Button>编辑或删除</Button>
 * </PermissionWrapper>
 *
 * @example
 * // 多个权限，需要全部满足
 * <PermissionWrapper permissions={['user:edit', 'user:delete']} requireAll>
 *   <Button danger>批量操作</Button>
 * </PermissionWrapper>
 *
 * @example
 * // 无权限时显示替代内容
 * <PermissionWrapper permissions="user:add" fallback={<Button disabled>无权限</Button>}>
 *   <Button type="primary">新增用户</Button>
 * </PermissionWrapper>
 */
import React from 'react';
import { useModel } from 'umi';

export interface PermissionWrapperProps {
  /**
   * 需要检查的权限码
   * 可以是单个字符串或字符串数组
   */
  permissions: string | string[];
  /**
   * 是否需要满足所有权限
   * - true: 需要满足所有权限才显示
   * - false: 满足任意一个权限即可显示（默认）
   */
  requireAll?: boolean;
  /**
   * 无权限时显示的替代内容
   * 默认为 null（不显示任何内容）
   */
  fallback?: React.ReactNode;
  /**
   * 子元素
   */
  children: React.ReactNode;
}

const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasAnyPermission, hasAllPermissions } = useModel('menuModel');

  // 标准化权限码为数组
  const codes = Array.isArray(permissions) ? permissions : [permissions];

  // 根据模式检查权限
  const hasAccess = requireAll
    ? hasAllPermissions(codes)
    : hasAnyPermission(codes);

  // 有权限则显示子元素，否则显示 fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionWrapper;
