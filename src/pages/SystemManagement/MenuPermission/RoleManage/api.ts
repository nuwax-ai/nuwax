import type { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  AddRoleParams,
  RoleInfo,
  RoleListParams,
  UpdateRoleParams,
} from './type';

/**
 * 查询角色列表
 */
export async function apiRoleList(
  data?: RoleListParams,
): Promise<RequestResponse<Page<RoleInfo>>> {
  return request('/api/system/role/list', {
    method: 'POST',
    data: data || {},
  });
}

/**
 * 新增角色
 */
export async function apiAddRole(
  data: AddRoleParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/role/add', {
    method: 'POST',
    data,
  });
}

/**
 * 更新角色
 */
export async function apiUpdateRole(
  data: UpdateRoleParams,
): Promise<RequestResponse<null>> {
  return request(`/api/system/role/update/${data.id}`, {
    method: 'POST',
    data,
  });
}

/**
 * 删除角色
 */
export async function apiDeleteRole(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/role/delete/${data.id}`, {
    method: 'POST',
  });
}

/**
 * 启用角色
 */
export async function apiEnableRole(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/role/enable/${data.id}`, {
    method: 'POST',
  });
}

/**
 * 禁用角色
 */
export async function apiDisableRole(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/role/disable/${data.id}`, {
    method: 'POST',
  });
}
