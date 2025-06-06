import type { RequestResponse } from '@/types/interfaces/request';
import type {
  AddSpaceUserParams,
  CreateSpaceTeamParams,
  SpaceInfo,
  UserSpaceInfo,
  UserSpaceInfoParams,
  UserSpaceListParams,
} from '@/types/interfaces/workspace';
import { request } from 'umi';

// 创建新工作空间
export async function apiCreateSpaceTeam(
  data: CreateSpaceTeamParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/add', {
    method: 'POST',
    data,
  });
}

// 查询指定空间信息
export async function apiUserSpaceInfo(
  data: UserSpaceInfoParams,
): Promise<RequestResponse<SpaceInfo>> {
  const spaceId = data.spaceId;
  return request(`/api/space/get/${spaceId}`, {
    method: 'GET',
  });
}

// 查询用户空间列表
export async function apiSpaceList(): Promise<RequestResponse<SpaceInfo[]>> {
  return request('/api/space/list', {
    method: 'GET',
  });
}

// 增加团队成员接口
export async function apiAddSpaceUser(
  data: AddSpaceUserParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/user/add', {
    method: 'POST',
    data,
  });
}

// 查询团队成员列表接口
export async function apiUserSpaceList(
  params: UserSpaceListParams,
): Promise<RequestResponse<UserSpaceInfo[]>> {
  return request('/api/space/user/list', {
    method: 'GET',
    params,
  });
}
