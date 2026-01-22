import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import { MenuNodeInfo, UserInfo } from '../RoleManage/type';
import type {
  AddUserGroupParams,
  GetUserGroupListParams,
  GroupBindMenuParams,
  GroupBindUserParams,
  UpdateUserGroupParams,
  UserGroupInfo,
} from './type';

/**
 * 更新用户组
 */
export async function apiUpdateUserGroup(
  data: UpdateUserGroupParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/group/update', {
    method: 'POST',
    data,
  });
}

/**
 * 删除用户组
 */
export async function apiDeleteUserGroup(
  groupId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/group/delete/${groupId}`, {
    method: 'POST',
  });
}

/**
 * 组绑定用户（全量覆盖）
 */
export async function apiGroupBindUser(
  data: GroupBindUserParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/group/bind-user', {
    method: 'POST',
    data,
  });
}

/**
 * 组绑定菜单权限（全量覆盖）
 */
export async function apiGroupBindMenu(
  data: GroupBindMenuParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/group/bind-menu', {
    method: 'POST',
    data,
  });
}

/**
 * 添加用户组
 */
export async function apiAddUserGroup(
  data: AddUserGroupParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/group/add', {
    method: 'POST',
    data,
  });
}

/**
 * 根据ID查询用户组
 */
export async function apiGetUserGroupById(
  groupId: number,
): Promise<RequestResponse<UserGroupInfo>> {
  return request(`/api/system/group/${groupId}`, {
    method: 'GET',
  });
}

/**
 * 根据条件查询组列表
 */
export async function apiGetUserGroupList(
  data?: GetUserGroupListParams,
): Promise<RequestResponse<UserGroupInfo[]>> {
  return request('/api/system/group/list', {
    method: 'GET',
    params: data,
  });
}

/**
 * 查询组已绑定的用户列表
 */
export async function apiGetGroupUserList(
  groupId?: number,
): Promise<RequestResponse<UserInfo[]>> {
  return request(`/api/system/group/list-user/${groupId}`, {
    method: 'GET',
  });
}

/**
 * 查询组已绑定的菜单权限（树形结构）
 */
export async function apiGetGroupMenuList(
  groupId?: number,
): Promise<RequestResponse<MenuNodeInfo[]>> {
  return request(`/api/system/group/list-menu/${groupId}`, {
    method: 'GET',
  });
}

/**
 * 根据编码查询组
 */
export async function apiGetGroupByCode(
  groupCode?: string,
): Promise<RequestResponse<UserGroupInfo>> {
  return request(`/api/system/group/code/${groupCode}`, {
    method: 'GET',
  });
}
