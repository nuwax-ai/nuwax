/**
 * 命中测试类型定义
 */

// 搜索策略类型
export type SearchStrategy = 'SEMANTIC' | 'FULL_TEXT' | 'MIXED';

// 文档项
export interface DocumentItem {
  id: number;
  name: string;
  fileType: string;
  knowledgeBaseId: number;
}

// 测试历史项
export interface TestHistoryItem {
  id: number;
  knowledgeBaseId: number;
  query: string;
  searchStrategy: string;
  results: string;
  createTime: string;
}

// 召回结果项
export interface RecallResultItem {
  docId: number;
  docName: string;
  score: number;
  content: string;
  rank: number;
  metadata?: any;
  isExpanded?: boolean;
}

// 命中测试请求参数
export interface AccuracySearchParams {
  knowledgeBaseId: number;
  query: string;
  searchStrategy: SearchStrategy;
  topK: number;
  matchingDegree: number;
}