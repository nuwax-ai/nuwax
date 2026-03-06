import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  AddMenuParams,
  BindMenuResourceParams,
  GetMenuListParams,
  MenuNodeInfo,
  UpdateMenuParams,
  UpdateMenuSortParams,
} from '../types/menu-manage';
import { ResourceTreeNode } from '../types/permission-resources';

/**
 * 更新菜单
 */
export async function apiUpdateMenu(
  data: UpdateMenuParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/menu/update', {
    method: 'POST',
    data,
  });
}

/**
 * 批量调整菜单顺序
 */
export async function apiUpdateMenuSort(
  data: UpdateMenuSortParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/menu/update-sort', {
    method: 'POST',
    data,
  });
}

/**
 * 添加菜单
 */
export async function apiAddMenu(
  data: AddMenuParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/menu/add', {
    method: 'POST',
    data,
  });
}

/**
 * 删除菜单
 */
export async function apiDeleteMenu(
  menuId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/menu/delete/${menuId}`, {
    method: 'POST',
  });
}

/**
 * 菜单绑定资源
 */
export async function apiMenuBindResource(
  data: BindMenuResourceParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/menu/bind-resource', {
    method: 'POST',
    data,
  });
}

/**
 * 根据ID查询菜单
 */
export async function apiGetMenuById(
  menuId: number,
): Promise<RequestResponse<MenuNodeInfo>> {
  return request(`/api/system/menu/${menuId}`, {
    method: 'GET',
  });
}

/**
 * 根据条件查询菜单列表（树形结构）
 */
export async function apiGetMenuList(
  data?: GetMenuListParams,
): Promise<RequestResponse<MenuNodeInfo[]>> {
  return request('/api/system/menu/list', {
    method: 'GET',
    params: data,
  });
}

/**
 * 查询菜单绑定的资源（树形结构）
 */
export async function apiGetMenuResourceList(
  menuId: number,
): Promise<RequestResponse<ResourceTreeNode>> {
  return request(`/api/system/menu/list-resource/${menuId}`, {
    method: 'GET',
  });
}

/**
 * 根据编码查询菜单
 */
export async function apiGetMenuByCode(
  menuCode: string,
): Promise<RequestResponse<MenuNodeInfo>> {
  return request(`/api/system/menu/code/${menuCode}`, {
    method: 'GET',
  });
}
