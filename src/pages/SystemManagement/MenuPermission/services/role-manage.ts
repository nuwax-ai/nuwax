import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type { MenuNodeInfo } from '../types/menu-manage';
import type {
  AddRoleParams,
  GetRoleListParams,
  RoleBindMenuParams,
  RoleBindUserParams,
  RoleInfo,
  UpdateRoleParams,
  UserInfo,
} from '../types/role-manage';

/**
 * 更新角色
 */
export async function apiUpdateRole(
  data: UpdateRoleParams,
): Promise<RequestResponse<null>> {
  return request(`/api/system/role/updateRole`, {
    method: 'POST',
    data,
  });
}

/**
 * 删除角色
 */
export async function apiDeleteRole(
  roleId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/role/delete/${roleId}`, {
    method: 'POST',
  });
}

/**
 * 角色绑定用户（全量覆盖）
 */
export async function apiRoleBindUser(
  data: RoleBindUserParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/role/bind-user', {
    method: 'POST',
    data,
  });
}

/**
 * 角色绑定菜单（全量覆盖）
 */
export async function apiRoleBindMenu(
  data: RoleBindMenuParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/role/bind-menu', {
    method: 'POST',
    data,
  });
}

/**
 * 添加角色
 * @param data
 * @returns Promise<RequestResponse<null>>
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
 * 根据ID查询角色
 * @param roleId 角色ID
 * @returns Promise<RequestResponse<RoleInfo>>
 */
export async function apiGetRoleById(
  roleId: number,
): Promise<RequestResponse<RoleInfo>> {
  return request(`/api/system/role/${roleId}`, {
    method: 'GET',
  });
}

/**
 * 根据条件查询角色
 * @param data 查询条件
 * @returns Promise<RequestResponse<RoleInfo>>
 */
export async function apiGetRoleList(
  data?: GetRoleListParams,
): Promise<RequestResponse<RoleInfo[]>> {
  return request(`/api/system/role/list`, {
    method: 'GET',
    params: data,
  });
}

/**
 * 查询角色已绑定的用户
 * @param roleId 角色ID
 * @returns Promise<RequestResponse<UserInfo>>
 */
export async function apiGetRoleBoundUserList(
  roleId: number,
): Promise<RequestResponse<UserInfo[]>> {
  return request(`/api/system/role/list-user/${roleId}`, {
    method: 'GET',
  });
}

/**
 * 查询角色已绑定的菜单（树形结构）
 * @param roleId 角色ID
 * @returns Promise<RequestResponse<MenuNodeInfo[]>>
 */
export async function apiGetRoleBoundMenuList(
  roleId: number,
): Promise<RequestResponse<MenuNodeInfo[]>> {
  return request(`/api/system/role/list-menu/${roleId}`, {
    method: 'GET',
  });
}

/**
 * 根据编码查询角色
 * @param roleCode 角色编码
 * @returns Promise<RequestResponse<RoleInfo>>
 */
export async function apiGetRoleCode(
  roleCode: string,
): Promise<RequestResponse<RoleInfo>> {
  return request(`/api/system/role/code/${roleCode}`, {
    method: 'GET',
  });
}
