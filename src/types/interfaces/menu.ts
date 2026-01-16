/**
 * 动态菜单权限类型定义
 * @description 支持三级菜单和功能权限控制
 */

/**
 * 功能权限项
 * 用于控制页面内的按钮、操作等功能的显示/隐藏
 */
export interface PermissionDto {
  /** 权限标识码，如 "user:add", "user:edit", "user:delete" */
  code: string;
  /** 权限名称，如 "新增用户", "编辑用户" */
  name: string;
}

/**
 * 菜单项数据传输对象
 * 支持三级嵌套的树形结构
 */
export interface MenuItemDto {
  /** 菜单唯一标识 */
  id: number;
  /** 菜单名称 */
  name: string;
  /** 菜单标识码，如 "home", "system_manage", "user_manage" */
  code: string;
  /** 图标名称，对应 SvgIcon 的 name，如 "icons-nav-home" */
  icon?: string;
  /** 路由路径，如 "/system/user/manage" */
  path?: string;
  /** 类型：menu 菜单项，button 按钮（功能权限） */
  type: 'menu' | 'button';
  /** 排序序号，数字越小越靠前 */
  sortOrder: number;
  /** 子菜单列表（支持三级嵌套） */
  children?: MenuItemDto[];
  /** 页面功能权限列表 */
  permissions?: PermissionDto[];
}

/**
 * 菜单查询响应数据结构
 */
export interface MenuQueryResponse {
  /** 菜单树列表 */
  menus: MenuItemDto[];
}

/**
 * 菜单类型枚举
 */
export enum MenuTypeEnum {
  /** 菜单项 */
  Menu = 'menu',
  /** 按钮（功能权限） */
  Button = 'button',
}
