/**
 * 原文对照功能 - 类型定义
 */

import type {
  KnowledgeDocumentInfo,
  KnowledgeRawSegmentInfo,
} from '@/types/interfaces/knowledge';

/**
 * 文档类型枚举
 */
export enum DocumentTypeEnum {
  PDF = 'pdf',
  DOCX = 'docx',
  MD = 'md',
  TXT = 'txt',
}

/**
 * 高亮区域范围
 */
export interface HighlightRange {
  start: number; // 起始位置
  end: number; // 结束位置
  segmentId: string | number; // 对应的分段ID
  text?: string; // 匹配的文本内容
}

/**
 * 文本匹配结果
 */
export interface MatchResult {
  startOffset: number; // 起始偏移量
  endOffset: number; // 结束偏移量
  confidence: number; // 匹配置信度 (0-1)
  matchedText: string; // 匹配的文本
}

/**
 * 文档内容信息
 */
export interface DocumentContent {
  text: string; // 纯文本内容
  html?: string; // HTML内容（用于Word/Markdown）
  metadata?: {
    pageCount?: number; // PDF页数
    wordCount?: number; // 字数
  };
}

/**
 * 文档预览组件Props
 */
export interface DocumentPreviewProps {
  documentInfo: KnowledgeDocumentInfo | null;
  documentContent: DocumentContent | null;
  highlights: HighlightRange[];
  onHighlightClick?: (range: HighlightRange) => void;
}

/**
 * 位置匹配选项
 */
export interface MatchOptions {
  fuzzyMatch?: boolean; // 是否启用模糊匹配
  ignoreCase?: boolean; // 是否忽略大小写
  trimWhitespace?: boolean; // 是否忽略空格差异
}

/**
 * 原文对照主组件Props
 */
export interface SourceDocumentComparisonProps {
  documentInfo: KnowledgeDocumentInfo | null;
  selectedSegment: KnowledgeRawSegmentInfo | null;
  visible?: boolean;
}

/**
 * 位置匹配器Props
 */
export interface PositionMatcherProps {
  documentContent: string;
  segmentText: string;
  options?: MatchOptions;
  onMatch?: (result: MatchResult) => void;
}
