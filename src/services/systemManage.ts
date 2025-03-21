import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  AddSystemUserParams,
  SystemUserConfig,
  SystemUserListInfo,
  SystemUserListParams,
  UpdateSystemUserParams,
} from '@/types/interfaces/systemManage';
import { request } from 'umi';

// 查询用户列表
export async function apiSystemUserList(
  data: SystemUserListParams,
): Promise<RequestResponse<Page<SystemUserListInfo>>> {
  return request('/api/system/user/list', {
    method: 'POST',
    data,
  });
}

// 新增用户
export async function apiAddSystemUser(
  data: AddSystemUserParams,
): Promise<RequestResponse<null>> {
  return request('/api/system/user/add', {
    method: 'POST',
    data,
  });
}

// 更新用户
export async function apiUpdateSystemUser(
  data: UpdateSystemUserParams,
): Promise<RequestResponse<null>> {
  return request(`/api/system/user/updateById/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 启用用户
export async function apiEnableSystemUser(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/user/enable/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 启用用户
export async function apiDisableSystemUser(data: {
  id: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/system/user/disable/${data.id}`, {
    method: 'POST',
    data,
  });
}

// 查询用户列表
export async function apiSystemConfigList(): Promise<
  RequestResponse<SystemUserConfig[]>
> {
  return request('/api/system/config/list', {
    method: 'POST',
  });
}
