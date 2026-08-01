/**
 * 原文对照页面 - 自定义 Hooks
 */

import { apiKnowledgeSegOriginalText } from '@/services/knowledge';
import type { KnowledgeRawSegmentInfo } from '@/types/interfaces/knowledge';
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { useEffect, useRef, useState } from 'react';

/**
 * 模拟数据 - 临时测试用（后端未就绪时使用）
 */
const getMockData = (segmentId: number): KnowledgeRawSegmentInfo[] => {
  const mockDataMap: Record<number, KnowledgeRawSegmentInfo[]> = {
    203921: Array.from({ length: 21 }, (_, i) => ({
      id: 203921 + i,
      docId: 3579,
      rawTxt: `[分段 ${i + 1}] 这是测试文档 3579 的第 ${i + 1} 段内容。`,
      kbId: 910,
      sortIndex: i,
      spaceId: 910,
      created: '2024-01-01 00:00:00',
      creatorId: 1,
      creatorName: '测试用户',
      modified: '2024-01-01 00:00:00',
      modifiedId: 1,
      modifiedName: '测试用户',
    })),
  };

  return mockDataMap[segmentId] || [];
};

/**
 * 根据分段 ID 拉取所属文档的全部分段
 *
 * - 自动分页拉满
 * - 按 sortIndex 升序排序
 * - 分段 ID 变化时自动重新拉取
 * - 权限错误显示 i18n 提示，不显示假数据
 * - 其他错误使用 mock 兜底（开发环境）
 */
export const useOriginalTextSegments = (
  segmentId: number | string | null | undefined,
  agentId?: number | string | null | undefined,
) => {
  const [segments, setSegments] = useState<KnowledgeRawSegmentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef<number>(0);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    const currentReqId = ++reqIdRef.current;

    if (!segmentId) {
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
          const res = await apiKnowledgeSegOriginalText(Number(segmentId), agentId ? Number(agentId) : undefined);

          if (cancelled || reqIdRef.current !== currentReqId) {
            return;
          }

          const page = res?.data;
          if (!page) {
            break;
          }

          // 权限拒绝：后端返回 permissionDenied=true（不抛异常），用 i18n 在页面持续提示，不兜 mock 假数据
          if (page.permissionDenied) {
            setError(dict('PC.Components.AppDevEmptyState.permissionDeniedDescription'));
            setSegments([]);
            setUsingMockData(false);
            return;
          }

          if (Array.isArray(page.records)) {
            all.push(...page.records);
          }
          totalPages = page.pages || 1;
          current += 1;

          // 如果只有一页，跳出循环
          if (totalPages === 1) {
            break;
          }
        }

        if (cancelled || reqIdRef.current !== currentReqId) {
          return;
        }

        // 按 sortIndex 升序排序
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

        // 仅开发环境（后端未就绪联调时）用模拟数据兜底，便于自测；
        // 生产环境绝不展示伪造数据，直接进入错误态。
        if (process.env.NODE_ENV === 'development') {
          console.warn('API 请求失败（开发环境使用模拟数据）:', err?.message);
          const mockSegments = getMockData(Number(segmentId));
          if (mockSegments.length > 0) {
            setSegments(mockSegments);
            setUsingMockData(true);
            return;
          }
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
  }, [segmentId, agentId]);

  const reset = () => {
    reqIdRef.current += 1;
    setSegments([]);
    setLoading(false);
    setError(null);
    setUsingMockData(false);
  };

  return {
    segments,
    loading,
    error,
    reset,
    usingMockData,
  };
};
