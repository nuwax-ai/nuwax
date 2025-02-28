import type { Page, RequestResponse } from '@/types/interfaces/request';
import type {
  PublishedAgentInfo,
  PublishedAgentListParams,
  PublishedKnowledgeListParams,
  PublishedPluginListParams,
  SquareCategoryInfo,
} from '@/types/interfaces/square';
import { request } from 'umi';

// 已发布插件列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedPluginList(
  data: PublishedPluginListParams,
): Promise<RequestResponse<Page<PublishedAgentInfo>>> {
  return request('/api/published/plugin/list', {
    method: 'POST',
    data,
  });
}

// 已发布知识库列表接口（广场以及弹框选择中全部插件）
export async function apiPublishedKnowledgeList(
  data: PublishedKnowledgeListParams,
): Promise<RequestResponse<Page<PublishedAgentInfo>>> {
  return request('/api/published/knowledge/list', {
    method: 'POST',
    data,
  });
}

// 广场-已发布智能体列表接口
export async function apiPublishedAgentList(
  data: PublishedAgentListParams,
): Promise<RequestResponse<Page<PublishedAgentInfo>>> {
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
