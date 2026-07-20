/**
 * 命中测试API服务
 */
import { request } from 'umi';

/**
 * 获取知识库文档列表
 */
export async function getAccuracyTestDocuments(knowledgeBaseId: number) {
  return request('/api/knowledge/accuracytest/documents', {
    method: 'GET',
    params: { knowledgeBaseId },
  });
}

/**
 * 获取测试历史记录
 */
export async function getAccuracyTestHistory(knowledgeBaseId: number) {
  return request('/api/knowledge/accuracytest/history', {
    method: 'GET',
    params: { knowledgeBaseId },
  });
}

/**
 * 执行命中搜索
 */
export async function performAccuracySearch(data: {
  knowledgeBaseId: number;
  query: string;
  searchStrategy: 'SEMANTIC' | 'FULL_TEXT' | 'MIXED';
  topK: number;
  matchingDegree: number;
}) {
  return request('/api/knowledge/accuracytest/search', {
    method: 'POST',
    data,
  });
}

/**
 * 保存测试记录
 */
export async function saveAccuracyTestRecord(data: {
  knowledgeBaseId: number;
  query: string;
  searchStrategy: string;
  results: any[];
}) {
  return request('/api/knowledge/accuracytest/record', {
    method: 'POST',
    data,
  });
}