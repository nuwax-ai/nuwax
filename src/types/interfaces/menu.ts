/**
 * 动态菜单权限类型定义
 * @description 支持三级菜单和功能权限控制
 */

import { MenuNodeInfo } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';

/**
 * 菜单项数据传输对象
 * 支持三级嵌套的树形结构
 */
export type MenuItemDto = MenuNodeInfo;

/**
 * 菜单查询响应数据结构
 */
export interface MenuQueryResponse {
  /** 菜单树列表 */
  menus: MenuItemDto[];
}
