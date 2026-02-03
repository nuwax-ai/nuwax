import { RoleInfo } from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import { MenuNodeInfo } from '../SystemManagement/MenuPermission/types/menu-manage';
import { UserGroupInfo } from '../SystemManagement/MenuPermission/types/user-group-manage';

interface UserBindRoleParams {
  userId: number;
  roleIds: number[];
}

interface UserBindGroupParams {
  userId: number;
  groupIds: number[];
}

// 用户绑定角色（全量覆盖）
export async function apiSystemUserBindRole(
  data: UserBindRoleParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user/bind-role', {
    method: 'POST',
    data,
  });
}

// 用户绑定组（全量覆盖）
export async function apiSystemUserBindGroup(
  data: UserBindGroupParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user/bind-group', {
    method: 'POST',
    data,
  });
}

// 查询用户绑定的角色列表
export async function apiSystemUserListRole(
  userId: number,
): Promise<RequestResponse<RoleInfo[]>> {
  return request(`/api/system/user/list-role/${userId}`, {
    method: 'GET',
  });
}

// 查询用户的菜单权限（树形结构）
export async function apiSystemUserListMenu(
  userId: number,
): Promise<RequestResponse<MenuNodeInfo[]>> {
  return request(`/api/system/user/list-menu/${userId}`, {
    method: 'GET',
  });
}

// 查询用户绑定的组列表
export async function apiSystemUserListGroup(
  userId: number,
): Promise<RequestResponse<UserGroupInfo[]>> {
  return request(`/api/system/user/list-group/${userId}`, {
    method: 'GET',
  });
}
