/**
 * 专家列表数据层（ExpertListView 内聚）
 * @description 四种视图的接口适配（与设计矩阵一致）：
 * - used    GET /user/agent/used/list/{size} { type: 'Agent' } 全量数组，
 *           keyword 客户端过滤，条目带最近使用时间；
 * - system  POST /published/agent/list { page, pageSize, category, kw?,
 *           targetType: 'Agent', targetSubType: 'ChatBot' }（专家口径，
 *           排除网页应用，与广场一致）；
 * - team    同接口 + justReturnSpaceData + category='Agent'，
 *           spaceId（具体空间）/ spaceIds（全部聚合，外部传入或自拉兜底）；
 * - search  同接口固定 spaceId=-1（组件内写死，不走外部 spaceId）。
 * 统一提供 { list, loading, error, hasMore, loadMore, updateItem }；
 * 服务端分页沿用 requestId 竞态丢弃 + 触底追加，首屏补拉由组件层驱动。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiUserUsedAgentList } from '@/services/agentDev';
import { apiPublishedAgentList } from '@/services/square';
import { apiSpaceList } from '@/services/workspace';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { Page } from '@/types/interfaces/request';
import type {
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExpertListItem, ExpertListSourceType } from '../types';

/** 关键字防抖时长 */
const KEYWORD_DEBOUNCE = 300;

/** 系统广场/团队/搜索视图条目归一化（已发布智能体） */
const mapPublishedItem = (
  item: SquarePublishedItemInfo,
  source: ExpertListSourceType,
): ExpertListItem => ({
  key: `expert:${source}:${item.id}`,
  rawId: item.id,
  targetId: item.targetId,
  name: item.name,
  description: item.description,
  icon: item.icon,
  paymentRequired: item.paymentRequired,
  subscribed: item.subscribed,
  userCount: item.statistics?.userCount,
});

/** 最近召唤条目归一化：targetId 取智能体本体 ID，modified 即最近使用时间 */
const mapUsedItem = (item: AgentInfo): ExpertListItem => ({
  key: `expert:used:${item.id}`,
  rawId: item.id,
  targetId: item.agentId ?? item.id,
  name: item.name,
  description: item.description,
  icon: item.icon,
  usedTime: item.modified,
});

/** 服务端分页响应提取 */
const extractPage = (
  data: Page<SquarePublishedItemInfo> | null,
  page: number,
  source: ExpertListSourceType,
): { items: ExpertListItem[]; hasMore: boolean } => ({
  items: (data?.records || []).map((item) => mapPublishedItem(item, source)),
  hasMore: (data?.current || page) < (data?.pages || 1),
});

/** 按视图组装请求参数（used 走独立接口，参数在 fetcher 内组装） */
const buildParams = (
  type: ExpertListSourceType,
  page: number,
  pageSize: number,
  keyword: string,
  category?: string,
  spaceId?: number,
  spaceIds?: number[],
): SquarePublishedListParams => {
  const kw = keyword.trim() || undefined;
  // 专家口径限定（targetType=Agent + ChatBot，排除网页应用）
  const expertScope = {
    targetType: AgentComponentTypeEnum.Agent,
    targetSubType: 'ChatBot' as const,
  };
  if (type === 'system') {
    return { page, pageSize, category: category || '', kw, ...expertScope };
  }
  if (type === 'team') {
    return {
      page,
      pageSize,
      kw,
      ...expertScope,
      category: SquareAgentTypeEnum.Agent,
      justReturnSpaceData: true,
      ...(spaceId ? { spaceId } : spaceIds?.length ? { spaceIds } : {}),
    };
  }
  // search：固定 spaceId=-1（组件内写死的独立查询口径）
  return { page, pageSize, category: '', kw, spaceId: -1, ...expertScope };
};

export interface UseExpertListParams {
  type: ExpertListSourceType;
  keyword?: string;
  category?: string;
  spaceId?: number;
  spaceIds?: number[];
  pageSize?: number;
}

const useExpertList = ({
  type,
  keyword,
  category,
  spaceId,
  spaceIds,
  pageSize = 20,
}: UseExpertListParams) => {
  const [list, setList] = useState<ExpertListItem[]>([]);
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

  // team「全部」聚合兜底：未传 spaceId/spaceIds 时组件自拉空间列表，
  // 就绪前挂起列表查询（undefined=拉取中；[] = 失败/无空间，回落仅
  // justReturnSpaceData 的契约口径）
  const needAutoSpaces =
    type === 'team' && !spaceId && !(spaceIds && spaceIds.length > 0);
  const [autoSpaceIds, setAutoSpaceIds] = useState<number[] | undefined>();
  useEffect(() => {
    if (!needAutoSpaces) {
      return;
    }
    let cancelled = false;
    setAutoSpaceIds(undefined);
    void apiSpaceList()
      .then((res) => {
        if (cancelled) {
          return;
        }
        const spaces = (res?.data as SpaceInfo[] | undefined) || [];
        setAutoSpaceIds(
          spaces
            .map((item) => Number(item.id))
            .filter((id) => Number.isFinite(id) && id > 0),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setAutoSpaceIds([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [needAutoSpaces]);
  const effectiveSpaceIds = needAutoSpaces ? autoSpaceIds : spaceIds;
  const waitingSpaces = needAutoSpaces && autoSpaceIds === undefined;

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
        let items: ExpertListItem[];
        let more: boolean;
        if (type === 'used') {
          // type=Agent 排除网页应用；全量数组 + 客户端关键字过滤，无分页
          const res = await apiUserUsedAgentList({
            size: pageSize,
            type: 'Agent',
          });
          if (requestIdRef.current !== requestId) {
            return;
          }
          if (res?.code !== SUCCESS_CODE) {
            throw new Error('agent used list failed');
          }
          const all = ((res.data as AgentInfo[]) || []).map(mapUsedItem);
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
          const res = await apiPublishedAgentList(
            buildParams(
              type,
              nextPage,
              pageSize,
              debouncedKeyword,
              category,
              spaceId,
              effectiveSpaceIds,
            ),
          );
          if (requestIdRef.current !== requestId) {
            return;
          }
          if (res?.code !== SUCCESS_CODE) {
            throw new Error('agent list failed');
          }
          ({ items, hasMore: more } = extractPage(
            res.data as Page<SquarePublishedItemInfo> | null,
            nextPage,
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
    [type, debouncedKeyword, category, spaceId, effectiveSpaceIds, pageSize],
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  // 查询条件变化时重置加载；team 自拉空间未就绪时挂起（就绪后再次触发）
  useEffect(() => {
    pageRef.current = 0;
    setList([]);
    setError(false);
    setHasMore(true);
    if (!waitingSpaces) {
      loadRef.current(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    type,
    debouncedKeyword,
    category,
    spaceId,
    effectiveSpaceIds,
    pageSize,
    waitingSpaces,
  ]);

  /** 滚动触底加载下一页 */
  const loadMore = useCallback(() => {
    if (!loadingRef.current) {
      loadRef.current(false);
    }
  }, []);

  /** 就地更新单条（订阅态回写，避免整页重拉丢滚动位置） */
  const updateItem = useCallback(
    (key: string, patch: Partial<ExpertListItem>) => {
      setList((prev) =>
        prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  return {
    list,
    loading,
    error,
    hasMore,
    loadMore,
    updateItem,
    // team 自拉空间未就绪（组件层并入首屏加载态，避免误现空态）
    waitingSpaces,
  };
};

export default useExpertList;
