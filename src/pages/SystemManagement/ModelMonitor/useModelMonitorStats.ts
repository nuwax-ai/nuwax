import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiGetResourceStatDetail,
  apiGetResourceStatSummary,
} from '@/services/systemManage';
import type {
  ResourceStatDTO,
  ResourceStatSummaryDTO,
} from '@/types/interfaces/systemManage';
import { useEffect, useState } from 'react';

export interface ModelMonitorQuery {
  scope: 'platform' | 'user';
  userId: string;
  dtStart: string;
  dtEnd: string;
}

interface StatData {
  summary: ResourceStatSummaryDTO;
  records: ResourceStatDTO[];
  total: number;
}

interface Snapshot {
  query: ModelMonitorQuery | null;
  pageNum: number;
  pageSize: number;
  data?: StatData;
  loading: boolean;
  failed: boolean;
}

export default function useModelMonitorStats(
  query: ModelMonitorQuery | null,
  pageNum: number,
  pageSize: number,
) {
  const [snapshot, setSnapshot] = useState<Snapshot>();

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const current = { query, pageNum, pageSize };
    setSnapshot({ ...current, loading: !!query, failed: false });
    if (!query) {
      return () => controller.abort();
    }
    const { scope, ...params } = query;
    const options = { signal: controller.signal, skipErrorHandler: true };
    void Promise.all([
      apiGetResourceStatSummary(params, options),
      apiGetResourceStatDetail(
        {
          ...params,
          type: scope === 'user' ? 'CONSUMPTION' : 'SALES',
          ...(scope === 'user' ? { targetType: 'Model' } : {}),
          pageNum,
          pageSize,
        },
        options,
      ),
    ])
      .then(([summary, detail]) => {
        if (cancelled) return;
        if (
          summary.code !== SUCCESS_CODE ||
          detail.code !== SUCCESS_CODE ||
          !summary.data ||
          !detail.data ||
          !Array.isArray(detail.data.records)
        ) {
          throw new Error('Resource statistics query failed');
        }
        setSnapshot({
          ...current,
          loading: false,
          failed: false,
          data: {
            summary: summary.data,
            records: detail.data.records,
            total: detail.data.total ?? 0,
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          controller.abort();
          setSnapshot({ ...current, loading: false, failed: true });
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, pageNum, pageSize]);

  // 条件改变的首次渲染也不能展示上一用户的数据或错误，不能等 effect 才清空。
  if (
    !snapshot ||
    snapshot.query !== query ||
    snapshot.pageNum !== pageNum ||
    snapshot.pageSize !== pageSize
  ) {
    return { data: undefined, loading: !!query, failed: false };
  }
  return snapshot;
}
