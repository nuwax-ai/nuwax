/**
 * 知识库基础配置接口
 */
import type {
  KnowledgeConfigAddParams,
  KnowledgeConfigListParams,
  KnowledgeConfigUpdateParams,
  KnowledgeDocumentInfo,
  KnowledgeDocumentListParams,
  KnowledgeDocumentUpdateParams,
  KnowledgeInfo,
} from '@/types/interfaces/knowledge';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 数据更新接口
export async function apiKnowledgeConfigUpdate(
  data: KnowledgeConfigUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/config/update', {
    method: 'POST',
    data,
  });
}

// 数据列表查询
export async function apiKnowledgeConfigList(
  data: KnowledgeConfigListParams,
): Promise<RequestResponse<Page<KnowledgeInfo>>> {
  return request('/api/knowledge/config/list', {
    method: 'POST',
    data,
  });
}

// 数据新增接口
export async function apiKnowledgeConfigAdd(
  data: KnowledgeConfigAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/config/add', {
    method: 'POST',
    data,
  });
}

// 数据详情查询
export async function apiKnowledgeConfigDetail(
  id: string,
): Promise<RequestResponse<KnowledgeInfo>> {
  return request('/api/knowledge/config/detailById', {
    method: 'GET',
    params: {
      id,
    },
  });
}

// 数据删除接口
export async function apiKnowledgeConfigDelete(
  id: string,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/config/deleteById', {
    method: 'GET',
    params: {
      id,
    },
  });
}

/**
 * 知识库-文档配置接口
 */
// 数据更新接口
export async function apiKnowledgeDocumentUpdate(
  data: KnowledgeDocumentUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/document/update', {
    method: 'POST',
    data,
  });
}

// 数据列表查询
export async function apiKnowledgeDocumentList(
  data: KnowledgeDocumentListParams,
): Promise<RequestResponse<Page<KnowledgeDocumentInfo>>> {
  return request('/api/knowledge/document/list', {
    method: 'POST',
    data,
  });
}

// 生成文档Q&A
export async function apiKnowledgeDocumentGenerateQA(
  docId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/knowledge/document/generateQA/${docId}`, {
    method: 'POST',
  });
}

// 生成嵌入
export async function apiKnowledgeDocumentGenerateEmbeddings(
  docId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/knowledge/document/doc/generateEmbeddings/${docId}`, {
    method: 'POST',
  });
}
