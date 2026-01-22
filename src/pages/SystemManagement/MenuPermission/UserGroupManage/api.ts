import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  AddUserGroupParams,
  GetUserGroupListParams,
  UpdateUserGroupParams,
  UserGroupInfo,
} from './type';

/**
 * 添加用户组
 */
export async function apiAddUserGroup(
  data: AddUserGroupParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user-group/add', {
    method: 'POST',
    data,
  });
}

/**
 * 更新用户组
 */
export async function apiUpdateUserGroup(
  data: UpdateUserGroupParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user-group/update', {
    method: 'POST',
    data,
  });
}

/**
 * 删除用户组
 */
export async function apiDeleteUserGroup(
  userGroupId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/user-group/delete/${userGroupId}`, {
    method: 'POST',
  });
}

/**
 * 根据ID查询用户组
 */
export async function apiGetUserGroupById(
  userGroupId: number,
): Promise<RequestResponse<UserGroupInfo>> {
  return request(`/api/system/user-group/${userGroupId}`, {
    method: 'GET',
  });
}

/**
 * 根据条件查询用户组列表
 */
export async function apiGetUserGroupList(
  data?: GetUserGroupListParams,
): Promise<RequestResponse<UserGroupInfo[]>> {
  return request('/api/system/user-group/list', {
    method: 'GET',
    params: data,
  });
}
