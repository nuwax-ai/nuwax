/**
 * 连接器列表数据层（ConnectorListView 内聚）
 * @description 四种视图的接口适配（与设计矩阵一致）：
 * - system    GET /connector/providers { pageNum, pageSize, scope: 'official',
 *             category?, keyword? } 服务端分页（官方连接器目录）；
 * - team      同接口 { pageNum, pageSize, keyword?, spaceId } / 未传 spaceId
 *             → { scope: 'space' } 服务端聚合全部空间（无需空间列表）；
 * - connected 同接口 { connected: 'true' } 全量数组（兼容裸数组/records
 *             双壳），keyword 客户端过滤，无分页；
 * - search    同接口 { pageNum, pageSize, keyword? } 纯关键字搜索
 *             （不带 scope/spaceId）。
 * 统一提供 { list, loading, error, hasMore, loadMore, updateItem }；
 * 服务端分页沿用 requestId 竞态丢弃 + 触底追加（该接口无总页数字段，
 * 按「本页取满」判定还有下一页），首屏补拉由组件层驱动。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiConnectorProviderPageList } from '@/services/systemManage';
import type {
  ConnectorProviderInfo,
  ConnectorProviderPageParams,
} from '@/types/interfaces/systemManage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectorListItem, ConnectorListSourceType } from '../types';

/** 关键字防抖时长 */
const KEYWORD_DEBOUNCE = 300;

/** 接口条目归一化（service 即连接/断开寻址标识） */
const mapItem = (
  item: ConnectorProviderInfo,
  source: ConnectorListSourceType,
): ConnectorListItem => ({
  key: `connector:${source}:${item.service || item.id}`,
  rawId: item.service || item.id,
  name: item.displayName || item.service,
  description: item.description,
  icon: item.icon,
  connected: item.connected,
  authType: item.authType,
});

/** 按视图组装请求参数（connected 走全量口径，参数在 fetcher 内组装） */
const buildParams = (
  type: ConnectorListSourceType,
  page: number,
  pageSize: number,
  keyword: string,
  category?: string,
  spaceId?: number,
): ConnectorProviderPageParams => {
  const kw = keyword.trim() || undefined;
  if (type === 'system') {
    return {
      pageNum: page,
      pageSize,
      scope: 'official',
      category: category || undefined,
      keyword: kw,
    };
  }
  if (type === 'team') {
    return {
      pageNum: page,
      pageSize,
      keyword: kw,
      // 具体空间 = 仅传 spaceId；「全部」= scope=space 服务端聚合全部空间
      ...(spaceId ? { spaceId } : { scope: 'space' }),
    };
  }
  if (type === 'search') {
    // 搜索场景：纯关键字 + 分页（不带 scope/spaceId）
    return { pageNum: page, pageSize, keyword: kw };
  }
  // connected 不经此处
  return { pageNum: page, pageSize };
};

/** 分页响应提取（该接口无总页数,按「本页取满」判定 hasMore） */
const extractPage = (
  res: unknown,
  page: number,
  pageSize: number,
  source: ConnectorListSourceType,
): { items: ConnectorListItem[]; hasMore: boolean } => {
  const data =
    (res as {
      records?: ConnectorProviderInfo[] | null;
      pageNum?: number;
    } | null) ?? null;
  const records = data?.records || [];
  const current = data?.pageNum || page;
  return {
    items: records.map((item) => mapItem(item, source)),
    hasMore: current === page && records.length >= pageSize,
  };
};

export interface UseConnectorListParams {
  type: ConnectorListSourceType;
  keyword?: string;
  category?: string;
  spaceId?: number;
  pageSize?: number;
}

const useConnectorList = ({
  type,
  keyword,
  category,
  spaceId,
  pageSize = 20,
}: UseConnectorListParams) => {
  const [list, setList] = useState<ConnectorListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 关键字防抖（受控传入，组件内收敛为稳定查询值）
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>(
    keyword ?? '',
  );
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedKeyword(keyword ?? ''),
      KEYWORD_DEBOUNCE,
    );
    return () => window.clearTimeout(timer);
  }, [keyword]);

  // 当前页码（0=未加载）与请求竞态标识
  const pageRef = useRef<number>(0);
  const requestIdRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  const load = useCallback(
    async (reset: boolean) => {
      // 防重入仅限追加加载；条件变化的重置加载由 requestId 过期丢弃
      if (!reset && loadingRef.current) {
        return;
      }
      const requestId = ++requestIdRef.current;
      const nextPage = reset ? 1 : pageRef.current + 1;
      loadingRef.current = true;
      setLoading(true);
      setError(false);
      try {
        let items: ConnectorListItem[];
        let more: boolean;
        if (type === 'connected') {
          // connected=true 全量（兼容裸数组/records 双壳），客户端过滤,无分页
          const res = await apiConnectorProviderPageList({ connected: 'true' });
          if (requestIdRef.current !== requestId) {
            return;
          }
          if (res?.code !== SUCCESS_CODE) {
            throw new Error('connected connectors failed');
          }
          const data = res.data as unknown;
          const records = Array.isArray(data)
            ? (data as ConnectorProviderInfo[])
            : (data as { records?: ConnectorProviderInfo[] | null } | null)
                ?.records ?? [];
          const all = records.map((item) => mapItem(item, 'connected'));
          const kw = debouncedKeyword.trim().toLowerCase();
          items = kw
            ? all.filter(
                (item) =>
                  item.name?.toLowerCase().includes(kw) ||
                  item.description?.toLowerCase().includes(kw),
              )
            : all;
          more = false;
        } else {
          const res = await apiConnectorProviderPageList(
            buildParams(
              type,
              nextPage,
              pageSize,
              debouncedKeyword,
              category,
              spaceId,
            ),
          );
          if (requestIdRef.current !== requestId) {
            return;
          }
          if (res?.code !== SUCCESS_CODE) {
            throw new Error('connector list failed');
          }
          ({ items, hasMore: more } = extractPage(
            res.data,
            nextPage,
            pageSize,
            type,
          ));
        }
        setList((prev) => (reset ? items : [...prev, ...items]));
        pageRef.current = nextPage;
        setHasMore(more);
      } catch {
        if (requestIdRef.current === requestId) {
          setError(true);
          if (reset) {
            setList([]);
          }
          setHasMore(false);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [type, debouncedKeyword, category, spaceId, pageSize],
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  // 查询条件变化时重置加载
  useEffect(() => {
    pageRef.current = 0;
    setList([]);
    setError(false);
    setHasMore(true);
    loadRef.current(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, debouncedKeyword, category, spaceId, pageSize]);

  /** 滚动触底加载下一页 */
  const loadMore = useCallback(() => {
    if (!loadingRef.current) {
      loadRef.current(false);
    }
  }, []);

  /** 整体重拉（连接态同步由宿主经 onConnectedChange 决定是否触发） */
  const reload = useCallback(() => {
    loadRef.current(true);
  }, []);

  /** 就地更新单条（连接/断开成功后就地回写，避免整页重拉丢滚动位置） */
  const updateItem = useCallback(
    (key: string, patch: Partial<ConnectorListItem>) => {
      setList((prev) =>
        prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  return { list, loading, error, hasMore, loadMore, reload, updateItem };
};

export default useConnectorList;
