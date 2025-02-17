import type {
  AgentInfo,
  CollectAgentParams,
  DevCollectAgentParams,
  DevUnCollectAgentParams,
  LikeAgentParams,
  UnCollectParams,
  UnlikeParams,
} from '@/types/interfaces/agent';
import type { ListParams, PageParams } from '@/types/interfaces/common';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 取消点赞智能体
export async function apiUnlikeAgent(
  data: UnlikeParams,
): Promise<RequestResponse<null>> {
  const agentId = data.agentId;
  return request(`/api/user/agent/unLike/${agentId}`, {
    method: 'POST',
  });
}

// 智能体取消收藏
export async function apiUnCollectAgent(
  data: UnCollectParams,
): Promise<RequestResponse<null>> {
  const agentId = data.agentId;
  return request(`/api/user/agent/unCollect/${agentId}`, {
    method: 'POST',
  });
}

// 点赞智能体
export async function apiLikeAgent(
  data: LikeAgentParams,
): Promise<RequestResponse<null>> {
  const agentId = data.agentId;
  return request(`/api/user/agent/like/${agentId}`, {
    method: 'POST',
  });
}

// 取消开发智能体收藏
export async function apiDevUnCollectAgent(
  data: DevUnCollectAgentParams,
): Promise<RequestResponse<null>> {
  const agentId = data.agentId;
  return request(`/api/user/agent/dev/unCollect/${agentId}`, {
    method: 'POST',
  });
}

// 开发智能体收藏
export async function apiDevCollectAgent(
  data: DevCollectAgentParams,
): Promise<RequestResponse<null>> {
  const agentId = data.agentId;
  return request(`/api/user/agent/dev/collect/${agentId}`, {
    method: 'POST',
  });
}

// 智能体收藏
export async function apiCollectAgent(
  data: CollectAgentParams,
): Promise<RequestResponse<null>> {
  const agentId = data.agentId;
  return request(`/api/user/agent/collect/${agentId}`, {
    method: 'POST',
  });
}

// 查询用户最近使用过的智能体列表
export async function apiUserUsedAgentList(
  params: ListParams,
): Promise<RequestResponse<AgentInfo[]>> {
  const size = params.size;
  return request(`/api/user/agent/used/list/${size}`, {
    method: 'GET',
  });
}

// 查询用户最近编辑的智能体列表
export async function apiUserEditAgentList(
  params: ListParams,
): Promise<RequestResponse<AgentInfo[]>> {
  const size = params.size;
  return request(`/api/user/agent/edit/list/${size}`, {
    method: 'GET',
  });
}

// 查询用户开发智能体收藏列表
export async function apiUserDevCollectAgentList(
  params: PageParams,
): Promise<RequestResponse<AgentInfo[]>> {
  const { page, size } = params;
  return request(`/api/user/agent/dev/collect/list/${page}/${size}`, {
    method: 'GET',
  });
}

// 查询用户收藏的智能体列表
export async function apiUserCollectAgentList(
  params: PageParams,
): Promise<RequestResponse<AgentInfo[]>> {
  const { page, size } = params;
  return request(`/api/user/agent/collect/list/${page}/${size}`, {
    method: 'GET',
  });
}
