import type {
  EmbeddingStatusInfo,
  KnowledgeConfigAddParams,
  KnowledgeConfigListParams,
  KnowledgeConfigUpdateParams,
  KnowledgeDocumentAddParams,
  KnowledgeDocumentCustomAddParams,
  KnowledgeDocumentInfo,
  KnowledgeDocumentListParams,
  KnowledgeDocumentUpdateDocNameParams,
  KnowledgeDocumentUpdateParams,
  KnowledgeInfo,
  KnowledgeQAAddParams,
  KnowledgeQaAddParams,
  KnowledgeQaDeleteParams,
  KnowledgeQAInfo,
  KnowledgeQAListParams,
  KnowledgeQaListParams,
  KnowledgeQASearchParams,
  KnowledgeQAUpdateParams,
  KnowledgeQaUpdateParams,
  KnowledgeQueryDocStatusParams,
  KnowledgeRawSegmentAddParams,
  KnowledgeRawSegmentInfo,
  KnowledgeRawSegmentListParams,
  KnowledgeRawSegmentUpdateParams,
} from '@/types/interfaces/knowledge';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 知识库基础配置接口
 */

// 知识库基础配置接口 - 数据更新接口
export async function apiKnowledgeConfigUpdate(
  data: KnowledgeConfigUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/config/update', {
    method: 'POST',
    data,
  });
}

// 知识库基础配置接口 - 数据列表查询
export async function apiKnowledgeConfigList(
  data: KnowledgeConfigListParams,
): Promise<RequestResponse<Page<KnowledgeInfo>>> {
  return request('/api/knowledge/config/list', {
    method: 'POST',
    data,
  });
}

// 知识库基础配置接口 - 数据新增接口
export async function apiKnowledgeConfigAdd(
  data: KnowledgeConfigAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/config/add', {
    method: 'POST',
    data,
  });
}

// 知识库基础配置接口 - 数据详情查询
export async function apiKnowledgeConfigDetail(
  id: number,
): Promise<RequestResponse<KnowledgeInfo>> {
  return request('/api/knowledge/config/detailById', {
    method: 'GET',
    params: {
      id,
    },
  });
}

// 知识库基础配置接口 - 数据删除接口
export async function apiKnowledgeConfigDelete(
  id: number,
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
// 知识库文档配置 - 数据更新接口
export async function apiKnowledgeDocumentUpdate(
  data: KnowledgeDocumentUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/document/update', {
    method: 'POST',
    data,
  });
}

// 知识库文档配置 - 更改文件名称
export async function apiKnowledgeDocumentUpdateDocName(
  data: KnowledgeDocumentUpdateDocNameParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/document/updateDocName', {
    method: 'POST',
    data,
  });
}

// 知识库文档配置 - 数据列表查询
export async function apiKnowledgeDocumentList(
  data: KnowledgeDocumentListParams,
): Promise<RequestResponse<Page<KnowledgeDocumentInfo>>> {
  return request('/api/knowledge/document/list', {
    method: 'POST',
    data,
  });
}

// 知识库文档配置 - 生成文档Q&A
export async function apiKnowledgeDocumentGenerateQA(
  docId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/knowledge/document/generateQA/${docId}`, {
    method: 'POST',
  });
}

// 知识库文档配置 - 生成嵌入
export async function apiKnowledgeDocumentGenerateEmbeddings(
  docId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/knowledge/document/doc/generateEmbeddings/${docId}`, {
    method: 'POST',
  });
}

// 知识库文档配置 - 自定义新增接口
export async function apiKnowledgeDocumentCustomAdd(
  data: KnowledgeDocumentCustomAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/document/customAdd', {
    method: 'POST',
    data,
  });
}

// 知识库文档配置 - 数据新增接口
export async function apiKnowledgeDocumentAdd(
  data: KnowledgeDocumentAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/document/add', {
    method: 'POST',
    data,
  });
}

// 知识库文档配置 - 重试最近x天的失败任务,如果有分段,问答,向量化有失败的话
export async function apiDocRetryAllTaskByDays(
  days: number,
): Promise<RequestResponse<null>> {
  return request(`/api/knowledge/document/doc/retryAllTaskByDays/${days}`, {
    method: 'GET',
  });
}

// 知识库文档配置 - 根据文件id,自动重试,如果有分段,问答,向量化有失败的话
export async function apiDocAutoRetryTaskByDocId(
  docId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/knowledge/document/doc/autoRetryTaskByDocId/${docId}`, {
    method: 'GET',
  });
}

// 知识库文档配置 - 数据详情查询
export async function apiKnowledgeDocumentDetail(
  dataId: number,
): Promise<RequestResponse<KnowledgeDocumentInfo>> {
  return request('/api/knowledge/document/detailById', {
    method: 'GET',
    params: {
      dataId,
    },
  });
}

// 知识库文档配置 - 查询文档状态
export async function apiKnowledgeQueryDocStatus(
  data: KnowledgeQueryDocStatusParams,
): Promise<RequestResponse<KnowledgeDocumentInfo[]>> {
  return request('/api/knowledge/document/queryDocStatus', {
    method: 'POST',
    data,
  });
}

// 知识库文档配置 - 数据删除接口
export async function apiKnowledgeDocumentDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/document/deleteById', {
    method: 'GET',
    params: {
      id,
    },
  });
}

/**
 * 知识库 - 分段配置接口
 */

// 知识库分段配置 - 数据更新接口
export async function apiKnowledgeRawSegmentUpdate(
  data: KnowledgeRawSegmentUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/rawSegment/update', {
    method: 'POST',
    data,
  });
}

// 知识库分段配置 - 数据列表查询
export async function apiKnowledgeRawSegmentList(
  data: KnowledgeRawSegmentListParams,
): Promise<RequestResponse<Page<KnowledgeRawSegmentInfo>>> {
  return request('/api/knowledge/rawSegment/list', {
    method: 'POST',
    data,
  });
}

// 知识库分段配置 - 数据新增接口
export async function apiKnowledgeRawSegmentAdd(
  data: KnowledgeRawSegmentAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/rawSegment/add', {
    method: 'POST',
    data,
  });
}

// 知识库分段配置 - 数据详情查询
export async function apiKnowledgeRawSegmentDetail(
  dataId: number,
): Promise<RequestResponse<KnowledgeRawSegmentInfo>> {
  return request('/api/knowledge/rawSegment/detailById', {
    method: 'GET',
    params: {
      dataId,
    },
  });
}

// 知识库分段配置 - 数据删除接口
export async function apiKnowledgeRawSegmentDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/rawSegment/deleteById', {
    method: 'GET',
    params: {
      id,
    },
  });
}

/**
 * 知识库问答配置接口
 */

// 知识库问答 - 数据新增接口
export async function apiKnowledgeQAUpdate(
  data: KnowledgeQAUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/qa/update', {
    method: 'POST',
    data,
  });
}

// 知识库问答 - 搜索单个知识库（它不关心知识库本身的状态，用于后台调试）
export async function apiKnowledgeQASearch(
  data: KnowledgeQASearchParams,
): Promise<RequestResponse<KnowledgeQASearchParams[]>> {
  return request('/api/knowledge/qa/search', {
    method: 'POST',
    data,
  });
}

// 知识库问答 - 数据列表查询
export async function apiKnowledgeQAList(
  data: KnowledgeQAListParams,
): Promise<RequestResponse<Page<KnowledgeQAInfo>>> {
  return request('/api/knowledge/qa/list', {
    method: 'POST',
    data,
  });
}

// 知识库问答 - 数据新增接口
export async function apiKnowledgeQAAdd(
  data: KnowledgeQAAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/qa/add', {
    method: 'POST',
    data,
  });
}

// 知识库问答 - 查看Doc嵌入状态
export async function apiKnowledgeQAEmbeddingStatus(
  docId: number,
): Promise<RequestResponse<EmbeddingStatusInfo>> {
  return request(`/api/knowledge/qa/doc/embeddingStatus/${docId}`, {
    method: 'GET',
  });
}

// 知识库问答 - 数据详情查询
export async function apiKnowledgeQADetail(
  dataId: number,
): Promise<RequestResponse<KnowledgeQAInfo>> {
  return request('/api/knowledge/qa/detailById', {
    method: 'GET',
    params: {
      dataId,
    },
  });
}

// 知识库问答 - 数据删除接口
export async function apiKnowledgeQADelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/qa/deleteById', {
    method: 'GET',
    params: {
      id,
    },
  });
}

// 知识库问答 - 数据新增接口
export async function apiKnowledgeQaAdd(
  data: KnowledgeQaAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/qa/add', {
    method: 'POST',
    data,
  });
}

// 知识库问答 - 数据列表查询
export async function apiKnowledgeQaList(
  data: KnowledgeQaListParams,
): Promise<RequestResponse<Page<KnowledgeQAInfo>>> {
  return request('/api/knowledge/qa/list', {
    method: 'POST',
    data,
  });
}

// 知识库问答 - 数据删除接口
export async function apiKnowledgeQaDelete(
  data: KnowledgeQaDeleteParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/qa/deleteById', {
    method: 'POST',
    data,
  });
}

// 知识库问答 - 数据更新接口
export async function apiKnowledgeQaUpdate(
  data: KnowledgeQaUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/qa/update', {
    method: 'POST',
    data,
  });
}
