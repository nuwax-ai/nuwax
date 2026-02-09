/**
 * 动态菜单权限类型定义
 * @description 支持三级菜单和功能权限控制
 */

import { MenuNodeInfo } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';

/**
 * 功能权限项
 * 用于控制页面内的按钮、操作等功能的显示/隐藏
 */
// export interface PermissionDto {
//   /** 权限标识码，如 "user:add", "user:edit", "user:delete" */
//   code: string;
//   /** 权限名称，如 "新增用户", "编辑用户" */
//   name: string;
// }

/**
 * 菜单项数据传输对象
 * 支持三级嵌套的树形结构
 */
export type MenuItemDto = MenuNodeInfo;
// {
//   /** 菜单唯一标识 */
//   id: number;
//   /** 菜单名称 */
//   name: string;
//   /** 菜单标识码，如 "home", "system_manage", "user_manage" */
//   code: string;
//   /** 图标名称，对应 SvgIcon 的 name，如 "icons-nav-home" */
//   icon?: string;
//   /** 路由路径，如 "/system/user/manage" */
//   path?: string;
//   // /** 类型：menu 菜单项，button 按钮（功能权限） */
//   // type: 'menu' | 'button';
//   /** 排序序号，数字越小越靠前 */
//   sortIndex: number;
//   /** 子菜单列表（支持三级嵌套） */
//   children?: MenuItemDto[];
//   /** 页面功能权限列表 */
//   permissions?: PermissionDto[];
//   /** 描述 */
//   description?: string;
//   /** 来源 1:系统内置 2:用户自定义 */
//   source?: number;
//   /** 父级ID */
//   parentId?: number;
//   /** 是否显示 1:显示 0:隐藏 */
//   visible?: number;
//   /** 创建人 */
//   creator?: string;
//   /** 创建时间 */
//   created?: string;
//   /** 修改人ID */
//   modifierId?: number;
//   /** 修改人 */
//   modifier?: string;
//   /** 修改时间 */
//   modified?: string;
// }

/**
 * 后端返回的菜单数据结构
 */
// export interface SysMenuDto {
//   id: number;
//   code: string;
//   name: string;
//   description: string;
//   source: number;
//   parentId: number;
//   path: string;
//   icon: string;
//   sortIndex: number;
//   status: number;
//   visible: number;
//   creator: string;
//   created: string;
//   modifierId: number;
//   modifier: string;
//   modified: string;
//   children: SysMenuDto[];
// }

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
// export enum MenuTypeEnum {
//   /** 菜单项 */
//   Menu = 'menu',
//   /** 按钮（功能权限） */
//   Button = 'button',
// }
