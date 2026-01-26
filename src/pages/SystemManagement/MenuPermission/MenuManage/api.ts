import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  AddMenuParams,
  GetMenuListParams,
  MenuInfo,
  MenuTreeOption,
  UpdateMenuParams,
} from './type';

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
 * 根据ID查询菜单
 */
export async function apiGetMenuById(
  menuId: number,
): Promise<RequestResponse<MenuInfo>> {
  return request(`/api/system/menu/${menuId}`, {
    method: 'GET',
  });
}

/**
 * 根据条件查询菜单列表（树形结构）
 */
export async function apiGetMenuList(
  data?: GetMenuListParams,
): Promise<RequestResponse<MenuTreeOption[]>> {
  return request('/api/system/menu/list', {
    method: 'GET',
    params: data,
  });
}

/**
 * 查询菜单树（用于下拉选择）
 */
export async function apiGetMenuTree(): Promise<
  RequestResponse<MenuTreeOption[]>
> {
  return request('/api/system/menu/tree', {
    method: 'GET',
  });
}
