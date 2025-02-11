// 更新工作流
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  AddSpaceUserParams,
  CreateSpaceTeamParams,
  DeleteSpaceParams,
  SpaceInfo,
  UpdateSpaceTeamParams,
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

// 删除工作空间 todo: 确定是Get请求还是Post
export async function apiDeleteSpace(
  body: DeleteSpaceParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/delete/{spaceId}', {
    method: 'POST',
    data: body,
  });
}

// 查询指定空间信息
export async function apiUserSpaceInfo(): Promise<RequestResponse<SpaceInfo>> {
  return request('/api/space/get/{spaceId}', {
    method: 'GET',
  });
}

// 查询用户空间列表
export async function apiUserSpaceList(): Promise<
  RequestResponse<SpaceInfo[]>
> {
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
