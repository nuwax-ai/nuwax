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

// 查询用户收藏的智能体列表
export async function apiUserCollectAgentList(
  params: PageParams,
): Promise<RequestResponse<AgentInfo[]>> {
  return request('/api/user/agent/collect/list', {
    method: 'GET',
    params,
  });
}

// 取消点赞智能体
export async function apiUnlikeAgent(
  body: UnlikeParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/agent/unLike', {
    method: 'POST',
    data: body,
  });
}

// 智能体取消收藏
export async function apiUnCollectAgent(
  body: UnCollectParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/agent/unCollect', {
    method: 'POST',
    data: body,
  });
}

// 点赞智能体
export async function apiLikeAgent(
  body: LikeAgentParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/agent/like', {
    method: 'POST',
    data: body,
  });
}

// 取消开发智能体收藏
export async function apiDevUnCollectAgent(
  body: DevUnCollectAgentParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/agent/dev/unCollect', {
    method: 'POST',
    data: body,
  });
}

// 开发智能体收藏
export async function apiDevCollectAgent(
  body: DevCollectAgentParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/agent/dev/collect', {
    method: 'POST',
    data: body,
  });
}

// 智能体收藏
export async function apiCollectAgent(
  body: CollectAgentParams,
): Promise<RequestResponse<null>> {
  return request('/api/user/agent/collect', {
    method: 'POST',
    data: body,
  });
}

// 查询用户最近使用过的智能体列表
export async function apiUserUsedAgentList(
  params: ListParams,
): Promise<RequestResponse<AgentInfo[]>> {
  return request('/api/user/agent/used/list', {
    method: 'GET',
    params,
  });
}

// 查询用户最近编辑的智能体列表
export async function apiUserEditAgentList(
  params: ListParams,
): Promise<RequestResponse<AgentInfo[]>> {
  return request('/api/user/agent/edit/list', {
    method: 'GET',
    params,
  });
}

// 查询用户开发智能体收藏列表
export async function apiUserDevCollectAgentList(
  params: PageParams,
): Promise<RequestResponse<AgentInfo[]>> {
  return request('/api/user/agent/dev/collect/list', {
    method: 'GET',
    params,
  });
}
