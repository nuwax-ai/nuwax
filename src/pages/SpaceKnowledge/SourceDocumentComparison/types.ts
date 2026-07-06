/**
 * 原文对照功能 - 类型定义
 *
 * 重构说明：移除 PDF/Word/Markdown 全文提取相关类型（DocumentContent / MatchResult /
 * MatchOptions / HighlightRange / DocumentTypeEnum 等），统一改为分段拼接模式。
 */

import type {
  KnowledgeDocumentInfo,
  KnowledgeRawSegmentInfo,
} from '@/types/interfaces/knowledge';

/**
 * 文档预览组件 Props（拼接模式）
 *
 * - segments: 按顺序的所有分段
 * - selectedSegmentId: 当前选中的分段 id（与 seg.id 比较，匹配则高亮）
 * - loading: 是否正在加载分段
 */
export interface DocumentPreviewProps {
  segments: KnowledgeRawSegmentInfo[];
  selectedSegmentId: string | number | null;
  loading?: boolean;
}

/**
 * 原文对照主组件 Props
 */
export interface SourceDocumentComparisonProps {
  documentInfo: KnowledgeDocumentInfo | null;
  selectedSegment: KnowledgeRawSegmentInfo | null;
  visible?: boolean;
}
