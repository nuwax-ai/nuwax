import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiGetUserTokenRank,
  apiGetUserTokenTrend,
} from '@/services/systemManage';
import type { PageNum } from '@/types/interfaces/request';
import type {
  UserTokenRankDTO,
  UserTokenRankParams,
  UserTokenTrendDTO,
  UserTokenTrendParams,
} from '@/types/interfaces/systemManage';
import { useEffect, useState } from 'react';

const loadRank = async (query: UserTokenRankParams, signal: AbortSignal) => {
  const result = await apiGetUserTokenRank(query, {
    signal,
    skipErrorHandler: true,
  });
  if (result.code !== SUCCESS_CODE || !Array.isArray(result.data?.records))
    throw new Error('User token ranking failed');
  return result.data;
};
const loadTrend = async (query: UserTokenTrendParams, signal: AbortSignal) => {
  const result = await apiGetUserTokenTrend(query, {
    signal,
    skipErrorHandler: true,
  });
  if (result.code !== SUCCESS_CODE || !Array.isArray(result.data))
    throw new Error('User token trend failed');
  return [...result.data].sort((a, b) => a.dt.localeCompare(b.dt));
};

/** 查询快照包含重试版本；草稿、翻页和迟到响应不能串到另一位用户。 */
function useUserTokenRequest<Q extends object, T>(
  query: Q,
  load: (query: Q, signal: AbortSignal) => Promise<T>,
) {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{
    query: Q;
    revision: number;
    data?: T;
    loading: boolean;
    failed: boolean;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const current = { query, revision };
    setSnapshot({ ...current, loading: true, failed: false });
    void load(query, controller.signal)
      .then((data) => {
        if (!cancelled)
          setSnapshot({ ...current, data, loading: false, failed: false });
      })
      .catch(() => {
        if (!cancelled)
          setSnapshot({ ...current, loading: false, failed: true });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, revision, load]);
  const current = snapshot?.query === query && snapshot.revision === revision;
  return {
    data: current ? snapshot.data : undefined,
    loading: !current || snapshot.loading,
    failed: current && snapshot.failed,
    retry: () => setRevision((value) => value + 1),
  };
}

export const useUserTokenRank = (query: UserTokenRankParams) =>
  useUserTokenRequest<UserTokenRankParams, PageNum<UserTokenRankDTO>>(
    query,
    loadRank,
  );

export const useUserTokenTrend = (query: UserTokenTrendParams) =>
  useUserTokenRequest<UserTokenTrendParams, UserTokenTrendDTO[]>(
    query,
    loadTrend,
  );
