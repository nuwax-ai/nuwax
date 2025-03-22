import type { RequestResponse } from '@/types/interfaces/request';
import type {
  SpaceUserInfo,
  TeamDetailInfo,
  UpdateSpaceParams,
} from '@/types/interfaces/teamSetting';
import { request } from 'umi';

// 查询指定空间信息
export async function apiGetSpaceDetail(data: {
  spaceId: number;
}): Promise<RequestResponse<TeamDetailInfo>> {
  return request(`/api/space/get/${data.spaceId}`, {
    method: 'GET',
    data,
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

// 更新空间
export async function apiUpdateSpace(
  data: UpdateSpaceParams,
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
