import type { RequestResponse } from '@/types/interfaces/request';
import type {
  AddSpaceUserParams,
  CreateSpaceTeamParams,
  DeleteSpaceParams,
  SpaceInfo,
  TransferSpaceParams,
  UpdateSpaceTeamParams,
  UserSpaceInfo,
  UserSpaceInfoParams,
  UserSpaceListParams,
} from '@/types/interfaces/workspace';
import { request } from 'umi';

// 创建新团队
export async function apiCreateSpaceTeam(
  body: CreateSpaceTeamParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/add', {
    method: 'POST',
    data: body,
  });
}

// 更新工作空间新团队
export async function apiUpdateSpaceTeam(
  body: UpdateSpaceTeamParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/update', {
    method: 'POST',
    data: body,
  });
}

// 删除工作空间
export async function apiDeleteSpace(
  body: DeleteSpaceParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/delete', {
    method: 'POST',
    data: body,
  });
}

// 查询指定空间信息
export async function apiUserSpaceInfo(
  params: UserSpaceInfoParams,
): Promise<RequestResponse<SpaceInfo>> {
  return request('/api/space/get', {
    method: 'GET',
    params,
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
  body: AddSpaceUserParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/user/add', {
    method: 'POST',
    data: body,
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

// 空间转让接口
export async function apiUserSpaceTransfer(
  body: TransferSpaceParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/transfer', {
    method: 'POST',
    data: body,
  });
}
