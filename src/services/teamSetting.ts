import type { RequestResponse } from '@/types/interfaces/request';
import type {
  SearchUserInfo,
  SpaceUserInfo,
  TeamDetailInfo,
  UpdateSpaceTeamParams,
} from '@/types/interfaces/teamSetting';
import { request } from 'umi';

// 查询指定空间信息
export async function apiGetSpaceDetail(
  spaceId: number,
): Promise<RequestResponse<TeamDetailInfo>> {
  return request(`/api/space/get/${spaceId}`, {
    method: 'GET',
  });
}

// 查询成员列表信息
export async function apiGetSpaceUserList(data: {
  spaceId: number;
  kw: string;
  role: string | undefined;
}): Promise<RequestResponse<SpaceUserInfo[]>> {
  return request('/api/space/user/list', {
    method: 'POST',
    data,
  });
}

// 删除用户
export async function apiDeleteSpaceUser(data: {
  spaceId: number;
  userId: number;
}): Promise<RequestResponse<null>> {
  return request('/api/space/user/delete', {
    method: 'POST',
    data,
  });
}

// 增加团队成员
export async function apiAddSpaceMember(
  data: {
    spaceId: number;
    userId: number;
    role: string;
  }[],
): Promise<RequestResponse<null>> {
  return request('/api/space/user/add', {
    method: 'POST',
    data,
  });
}

// 更新工作空间新团队
export async function apiUpdateSpaceTeam(
  data: UpdateSpaceTeamParams,
): Promise<RequestResponse<null>> {
  return request('/api/space/update', {
    method: 'POST',
    data,
  });
}

// 删除空间
export async function apiRemoveSpace(data: {
  spaceId: number;
}): Promise<RequestResponse<null>> {
  return request(`/api/space/delete/${data.spaceId}`, {
    method: 'POST',
    data,
  });
}

// 转让空间
export async function apiTransferSpace(data: {
  spaceId: number;
  targetUserId: number;
}): Promise<RequestResponse<null>> {
  return request('/api/space/transfer', {
    method: 'POST',
    data,
  });
}

// 根据关键字搜索用户信息
export async function apiSearchUser(data: {
  kw: string | undefined;
}): Promise<RequestResponse<SearchUserInfo[]>> {
  return request('/api/user/search', {
    method: 'POST',
    data,
  });
}
