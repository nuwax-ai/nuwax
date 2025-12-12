import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type {
  AgentAkDeleteParams,
  AgentAkUpdateParams,
  AgentDetailDto,
  AgentInfo,
  AgentLogDetailParams,
  apiAgentLogListParams,
  apiSpaceLogListParams,
  logInfo,
  SpaceLogInfo,
  UserApiKeyInfo,
} from '@/types/interfaces/agent';
import type { HomeAgentCategoryInfo } from '@/types/interfaces/agentConfig';
import type { ListParams, PageParams } from '@/types/interfaces/common';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 取消点赞智能体
export async function apiUnlikeAgent(
  agentId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user/agent/unLike/${agentId}`, {
    method: 'POST',
  });
}

// 智能体取消收藏
export async function apiUnCollectAgent(
  agentId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user/agent/unCollect/${agentId}`, {
    method: 'POST',
  });
}

// 点赞智能体
export async function apiLikeAgent(
  agentId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user/agent/like/${agentId}`, {
    method: 'POST',
  });
}

// 取消开发智能体收藏
export async function apiDevUnCollectAgent(
  agentId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user/agent/dev/unCollect/${agentId}`, {
    method: 'POST',
  });
}

// 开发智能体收藏
export async function apiDevCollectAgent(
  agentId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/user/agent/dev/collect/${agentId}`, {
    method: 'POST',
  });
}

// 智能体收藏
export async function apiCollectAgent(
  agentId: number,
): Promise<RequestResponse<null>> {
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

// 主页智能体列表接口 - 数据列表查询
export async function apiHomeCategoryList(): Promise<
  RequestResponse<HomeAgentCategoryInfo>
> {
  return request('/api/home/list', {
    method: 'GET',
  });
}

// 已发布的智能体详情接口
export function apiPublishedAgentInfo(
  agentId: number,
  withConversationId: boolean = false,
): Promise<RequestResponse<AgentDetailDto>> {
  return request(`/api/published/agent/${agentId}`, {
    method: 'GET',
    params: {
      withConversationId,
    },
  });
}

// 分类以及智能体排序更新
export async function apiUpdateAgentSort(
  types?: string[] | undefined, //分类列表，按顺序排，可选，传递时需要传完整的列表
  typeAgentIds?: { [key: string]: number[] } | undefined, //分类下的智能体ID列表，按顺序排，可选，可传某个分类下的所有id列表
): Promise<RequestResponse<null>> {
  return request(`/api/home/sort/update`, {
    method: 'POST',
    data: {
      types,
      typeAgentIds,
    },
  });
}

// 日志查询
export async function apiAgentLogList(
  data: apiAgentLogListParams,
): Promise<RequestResponse<Page<logInfo>>> {
  return request('/api/logPlatform/agent/list', {
    method: 'POST',
    data,
  });
}

// 工作空间日志查询
export async function apiSpaceLogList(
  data: apiSpaceLogListParams,
): Promise<RequestResponse<Page<SpaceLogInfo>>> {
  return request('/api/requestLogs/list', {
    method: 'POST',
    data,
  });
}
// 日志详情
export async function apiAgentLogDetail(
  data: AgentLogDetailParams,
): Promise<RequestResponse<logInfo>> {
  return request('/api/logPlatform/agent/detail', {
    method: 'POST',
    data,
  });
}

// 更新智能体APIKEY是否为开发模式
export async function apiAgentAkUpdate(
  data: AgentAkUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/ak/update', {
    method: 'POST',
    data,
  });
}

// 删除智能体APIKEY
export async function apiAgentAkDelete(
  data: AgentAkDeleteParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/ak/delete', {
    method: 'POST',
    data,
  });
}

// 新增智能体APIKEY
export async function apiAgentAkCreate(
  agentId: number,
): Promise<RequestResponse<UserApiKeyInfo>> {
  return request(`/api/agent/ak/create/${agentId}`, {
    method: 'POST',
  });
}

// 查询智能体APIKEY列表
export async function apiAgentAkList(
  agentId: number,
): Promise<RequestResponse<UserApiKeyInfo>> {
  return request(`/api/agent/ak/list/${agentId}`, {
    method: 'GET',
  });
}

// 导出配置接口，支持Agent、Workflow、Plugin、Table
export async function apiTemplateExport(
  targetId: number,
  targetType: AgentComponentTypeEnum,
): Promise<{
  data: Blob;
  headers: {
    'content-disposition': string;
    'content-length': string;
    'content-type': string;
  };
}> {
  return request(`/api/template/export/${targetType}/${targetId}`, {
    method: 'GET',
    responseType: 'blob', // 指定响应类型为blob
    getResponse: true, // 获取完整响应对象
  });
}
