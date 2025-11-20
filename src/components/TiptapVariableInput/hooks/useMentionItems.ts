/*
 * useMentionItems Hook
 * Mentions 数据管理 Hook
 */

import { useMemo } from 'react';
import type { MentionItem } from '../types';

/**
 * Mentions 数据管理 Hook
 * @param mentions Mentions 数据列表
 * @param query 搜索查询文本
 * @returns 过滤后的 Mentions 列表
 */
export const useMentionItems = (
  mentions: MentionItem[] = [],
  query: string = '',
): MentionItem[] => {
  return useMemo(() => {
    if (!query.trim()) {
      return mentions;
    }

    const queryLower = query.toLowerCase();
    return mentions.filter((item) => {
      const labelLower = item.label.toLowerCase();
      const idLower = item.id.toLowerCase();
      return labelLower.includes(queryLower) || idLower.includes(queryLower);
    });
  }, [mentions, query]);
};
