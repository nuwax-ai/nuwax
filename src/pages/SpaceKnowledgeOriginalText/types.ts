/**
 * 原文对照页面 - 类型定义
 */

import type { KnowledgeRawSegmentInfo } from '@/types/interfaces/knowledge';

/**
 * 页面 Props
 */
export interface SpaceKnowledgeOriginalTextProps {
  // 当前空间 ID（来自路由）
  spaceId?: number;
  // 当前分段 ID（来自路由）
  segmentId?: number;
}

/**
 * 页面状态
 */
export interface OriginalTextState {
  segments: KnowledgeRawSegmentInfo[];
  loading: boolean;
  error: string | null;
}
