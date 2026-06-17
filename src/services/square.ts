import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  SquareCategoryInfo,
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import { request } from 'umi';

// 已发布插件列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedPluginList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/plugin/list', {
    method: 'POST',
    data,
  });
}

// 已发布工作流列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedWorkflowList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/workflow/list', {
    method: 'POST',
    data,
  });
}

// 已发布知识库列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedKnowledgeList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/knowledge/list', {
    method: 'POST',
    data,
  });
}

// 广场-已发布智能体列表接口
export async function apiPublishedAgentList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/agent/list', {
    method: 'POST',
    data,
  });
}

// 广场-智能体与插件分类
export async function apiPublishedCategoryList(): Promise<
  RequestResponse<SquareCategoryInfo[]>
> {
  return request('/api/published/category/list', {
    method: 'GET',
  });
}

// 广场-收藏工作流接口
export async function apiPublishedWorkflowCollect(
  workflowId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/workflow/collect/${workflowId}`, {
    method: 'POST',
  });
}

// 广场-取消收藏工作流接口
export async function apiPublishedWorkflowUnCollect(
  workflowId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/workflow/unCollect/${workflowId}`, {
    method: 'POST',
  });
}

// 广场-收藏技能接口
export async function apiPublishedSkillCollect(
  skillId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/skill/collect/${skillId}`, {
    method: 'POST',
  });
}

// 广场-取消收藏技能接口
export async function apiPublishedSkillUnCollect(
  skillId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/published/skill/unCollect/${skillId}`, {
    method: 'POST',
  });
}

// 广场-已发布模板列表接口
export async function apiPublishedTemplateList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/template/list', {
    method: 'POST',
    data,
  });
}

// 广场-已发布技能列表接口
export async function apiPublishedSkillList(
  data: SquarePublishedListParams,
): Promise<RequestResponse<Page<SquarePublishedItemInfo>>> {
  return request('/api/published/skill/list', {
    method: 'POST',
    data,
  });
}
