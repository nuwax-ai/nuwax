/**
 * 自定义 Hooks - 原文对照（分段拼接模式）
 *
 * 新方案直接渲染 segments[]，不再做全文提取与文本匹配，
 * 避免历史方案中高亮边界准确性问题。
 */

import { apiKnowledgeRawSegmentList } from '@/services/knowledge';
import type { KnowledgeRawSegmentInfo } from '@/types/interfaces/knowledge';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';

/**
 * 分段列表 Hook - 按顺序拉取指定文档下的所有分段
 *
 * - 自动分页拉满（pageSize=100，循环直至 current >= pages）
 * - 按 sortIndex 升序排序，保证从上到下顺序
 * - 文档切换时自动重新拉取；docId 为空时清空
 */
export const useRawSegments = (
  docId: number | string | null | undefined,
  enabled: boolean = true,
) => {
  const [segments, setSegments] = useState<KnowledgeRawSegmentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef<number>(0);

  useEffect(() => {
    // 自增请求 id，丢弃过期响应（避免快速切换文档时旧响应覆盖新响应）
    const currentReqId = ++reqIdRef.current;

    if (!enabled || !docId) {
      setSegments([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      try {
        const all: KnowledgeRawSegmentInfo[] = [];
        let current = 1;
        const pageSize = 100;
        let totalPages = 1;

        // 循环拉取直到 current >= pages
        while (current <= totalPages) {
          const res = await apiKnowledgeRawSegmentList({
            queryFilter: { docId: Number(docId) },
            current,
            pageSize,
          });

          if (cancelled || reqIdRef.current !== currentReqId) {
            return;
          }

          const page = res?.data;
          if (!page) {
            break;
          }

          if (Array.isArray(page.records)) {
            all.push(...page.records);
          }
          totalPages = page.pages || 1;
          current += 1;
        }

        if (cancelled || reqIdRef.current !== currentReqId) {
          return;
        }

        // 按 sortIndex 升序排序，确保从上到下顺序与中间分段列表一致
        all.sort((a, b) => {
          const sa = typeof a.sortIndex === 'number' ? a.sortIndex : 0;
          const sb = typeof b.sortIndex === 'number' ? b.sortIndex : 0;
          return sa - sb;
        });

        setSegments(all);
        setError(null);
      } catch (err: any) {
        if (cancelled || reqIdRef.current !== currentReqId) {
          return;
        }
        const errorMsg = err?.message || '加载分段失败';
        setError(errorMsg);
        message.error(errorMsg);
        setSegments([]);
      } finally {
        if (!cancelled && reqIdRef.current === currentReqId) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [docId, enabled]);

  const reset = () => {
    reqIdRef.current += 1;
    setSegments([]);
    setLoading(false);
    setError(null);
  };

  return {
    segments,
    loading,
    error,
    reset,
  };
};
