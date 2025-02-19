import type {
  EmbeddingStatusInfo,
  KnowledgeConfigAddParams,
  KnowledgeConfigListParams,
  KnowledgeConfigUpdateParams,
  KnowledgeDocumentAddParams,
  KnowledgeDocumentInfo,
  KnowledgeDocumentListParams,
  KnowledgeDocumentUpdateParams,
  KnowledgeInfo,
  KnowledgeQAAddParams,
  KnowledgeQAInfo,
  KnowledgeQAListParams,
  KnowledgeQASearchParams,
  KnowledgeQAUpdateParams,
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

// 数据新增接口
export async function apiKnowledgeDocumentAdd(
  data: KnowledgeDocumentAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/document/add', {
    method: 'POST',
    data,
  });
}

// 数据详情查询
export async function apiKnowledgeDocumentDetail(
  dataId: string,
): Promise<RequestResponse<KnowledgeDocumentInfo>> {
  return request('/api/knowledge/document/detailById', {
    method: 'GET',
    params: {
      dataId,
    },
  });
}

// 数据删除接口
export async function apiKnowledgeDocumentDelete(
  id: string,
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

// 数据更新接口
export async function apiKnowledgeRawSegmentUpdate(
  data: KnowledgeRawSegmentUpdateParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/rawSegment/update', {
    method: 'POST',
    data,
  });
}

// 数据列表查询
export async function apiKnowledgeRawSegmentList(
  data: KnowledgeRawSegmentListParams,
): Promise<RequestResponse<Page<KnowledgeRawSegmentInfo>>> {
  return request('/api/knowledge/rawSegment/list', {
    method: 'POST',
    data,
  });
}

// 数据新增接口
export async function apiKnowledgeRawSegmentAdd(
  data: KnowledgeRawSegmentAddParams,
): Promise<RequestResponse<null>> {
  return request('/api/knowledge/rawSegment/add', {
    method: 'POST',
    data,
  });
}

// 数据详情查询
export async function apiKnowledgeRawSegmentDetail(
  dataId: string,
): Promise<RequestResponse<KnowledgeRawSegmentInfo>> {
  return request('/api/knowledge/rawSegment/detailById', {
    method: 'GET',
    params: {
      dataId,
    },
  });
}

// 数据删除接口
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
  dataId: string,
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
