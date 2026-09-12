/**
 * 技能列表数据层（SkillListView 内聚）
 * @description 四种视图的接口适配（与设计矩阵一致）：
 * - system  POST /published/skill/list { page, pageSize, category, kw? }
 * - team    同接口 + justReturnSpaceData + category='Skill'，
 *           spaceId（具体空间）/ spaceIds（全部聚合，外部传入）
 * - enabled POST /published/skill/enable/list {} 全量数组，keyword 客户端过滤，
 *           条目一律 enabled=true（专门接口语义，不看条目级字段）
 * - search  POST /published/skill/list { page, pageSize, kw?, spaceId: -1 }
 * 统一提供 { list, loading, error, hasMore, loadMore, reload, updateItem }；
 * 服务端分页沿用 requestId 竞态丢弃 + 触底追加，首屏补拉由组件层驱动。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiPublishedSkillEnableList,
  apiPublishedSkillList,
} from '@/services/square';
import { apiSpaceList } from '@/services/workspace';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { Page } from '@/types/interfaces/request';
import type {
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SkillListItem, SkillListSourceType } from '../types';

/** 关键字防抖时长 */
const KEYWORD_DEBOUNCE = 300;

/** 接口条目归一化（targetId 供选中/启用/付费复核寻址） */
const mapItem = (
  item: SquarePublishedItemInfo,
  source: SkillListSourceType,
): SkillListItem => ({
  key: `skill:${source}:${item.id}`,
  rawId: item.id,
  targetId: item.targetId,
  name: item.name,
  description: item.description,
  icon: item.icon,
  paymentRequired: item.paymentRequired,
  subscribed: item.subscribed,
  // enable/list 口径下能拉到的即已启用；其余视图按条目级字段
  enabled: source === 'enabled' ? true : item.enabled,
});

/** 服务端分页响应提取 */
const extractPage = (
  data: Page<SquarePublishedItemInfo> | null,
  page: number,
  source: SkillListSourceType,
): { items: SkillListItem[]; hasMore: boolean } => ({
  items: (data?.records || []).map((item) => mapItem(item, source)),
  hasMore: (data?.current || page) < (data?.pages || 1),
});

/** 按视图组装请求参数 */
const buildParams = (
  type: SkillListSourceType,
  page: number,
  pageSize: number,
  keyword: string,
  category?: string,
  spaceId?: number,
  spaceIds?: number[],
): SquarePublishedListParams => {
  const kw = keyword.trim() || undefined;
  if (type === 'system') {
    return { page, pageSize, category: category || '', kw };
  }
  if (type === 'team') {
    return {
      page,
      pageSize,
      kw,
      category: SquareAgentTypeEnum.Skill,
      justReturnSpaceData: true,
      ...(spaceId ? { spaceId } : spaceIds?.length ? { spaceIds } : {}),
    };
  }
  if (type === 'search') {
    // 搜索场景：固定 spaceId=-1（组件内写死的独立查询口径，不走外部 spaceId）
    return { page, pageSize, category: '', kw, spaceId: -1 };
  }
  // enabled 走独立接口，参数在 fetcher 内组装（此处不会走到）
  return { page, pageSize, category: '', kw };
};

export interface UseSkillListParams {
  type: SkillListSourceType;
  keyword?: string;
  category?: string;
  spaceId?: number;
  spaceIds?: number[];
  pageSize?: number;
}

const useSkillList = ({
  type,
  keyword,
  category,
  spaceId,
  spaceIds,
  pageSize = 20,
}: UseSkillListParams) => {
  const [list, setList] = useState<SkillListItem[]>([]);
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
  // 就绪前挂起列表查询（undefined=拉取中；[] = 拉取失败/无空间，回落
  // 仅 justReturnSpaceData 的契约口径）
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
        let items: SkillListItem[];
        let more: boolean;
        if (type === 'enabled') {
          const res = await apiPublishedSkillEnableList();
          if (requestIdRef.current !== requestId) {
            return;
          }
          if (res?.code !== SUCCESS_CODE) {
            throw new Error('skill enabled list failed');
          }
          // 全量数组 + 客户端关键字过滤（名称/描述），无分页
          const all = ((res.data as SquarePublishedItemInfo[]) || []).map(
            (item) => mapItem(item, 'enabled'),
          );
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
          const res = await apiPublishedSkillList(
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
            throw new Error('skill list failed');
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

  // 查询条件变化时重置加载；team 自拉空间未就绪时挂起（空间就绪后
  // effectiveSpaceIds 变化再次触发）
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

  /** 整体重拉（启用开关成功后同步「我启用的」等视图） */
  const reload = useCallback(() => {
    loadRef.current(true);
  }, []);

  /** 就地更新单条（开关/订阅态回写，避免整页重拉丢滚动位置） */
  const updateItem = useCallback(
    (key: string, patch: Partial<SkillListItem>) => {
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
    reload,
    updateItem,
    // team 自拉空间未就绪（组件层并入首屏加载态，避免误现空态）
    waitingSpaces,
  };
};

export default useSkillList;
