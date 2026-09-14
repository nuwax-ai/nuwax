/**
 * 资料库列表数据层（KnowledgeListView 内聚）
 * @description 两种视图的接口适配（与设计矩阵一致）：
 * - recent  GET /repo/pages/recently-accessed { from: 0, size } 全量数组，
 *           keyword 客户端过滤，条目带最近访问时间（相对时间胶囊）；
 * - space   GET /repo/space-tree { spaceId }（必传，未传挂起）全量树
 *           先序平铺 → keyword 客户端过滤 → 内存切片模拟滚动加载。
 * 统一提供 { list, loading, error, hasMore, loadMore }；
 * 竞态沿用 requestId 过期丢弃，首屏补拉由组件层驱动。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiRepoRecentlyAccessedPages,
  apiRepoSpaceTree,
} from '@/services/repo';
import type {
  RepoPageTreeNode,
  RepoPortalPageInfo,
} from '@/types/interfaces/repo';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KnowledgeListItem, KnowledgeListSourceType } from '../types';

/** 关键字防抖时长 */
const KEYWORD_DEBOUNCE = 300;

/**
 * 资料卡文档类型归一化：优先源文件扩展名 sourceExt（清洗前导点），
 * 无 sourceExt 回落接口 pageType；统一大写供 Tag 展示（PDF/DOC/MD）
 */
const normalizeDocType = (
  sourceExt?: string,
  pageType?: string,
): string | undefined =>
  (sourceExt?.replace(/^\./, '') || pageType)?.toUpperCase();

/** 最近访问条目归一化：time 即最近访问时间（仅此视图时间胶囊展示） */
const mapRecentItem = (item: RepoPortalPageInfo): KnowledgeListItem => ({
  key: `knowledge:recent:${item.id}`,
  rawId: item.id,
  slugId: item.slugId,
  name: item.title ?? '',
  pageType: item.pageType,
  fileType: normalizeDocType(item.sourceExt, item.pageType),
  usedTime: item.time,
});

/**
 * repo 页面树先序平铺：目录与页面同构（每个节点都是可选文档），
 * 按树的先序顺序展开为列表，保留资料库的目录分组视觉顺序。
 */
const flattenRepoTree = (nodes: RepoPageTreeNode[]): KnowledgeListItem[] => {
  const items: KnowledgeListItem[] = [];
  const walk = (list: RepoPageTreeNode[]) => {
    list.forEach((node) => {
      const page = node.page;
      if (typeof page?.id === 'number' && page.title) {
        items.push({
          key: `knowledge:space:${page.id}`,
          rawId: page.id,
          slugId: page.slugId,
          name: page.title,
          pageType: page.pageType,
          fileType: normalizeDocType(page.sourceExt, page.pageType),
        });
      }
      if (node.children?.length) {
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return items;
};

/** 全量数组按关键字客户端过滤（名称/描述） */
const filterByKeyword = <T extends { name?: string; description?: string }>(
  all: T[],
  keyword: string,
): T[] => {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return all;
  return all.filter(
    (item) =>
      item.name?.toLowerCase().includes(kw) ||
      item.description?.toLowerCase().includes(kw),
  );
};

export interface UseKnowledgeListParams {
  type: KnowledgeListSourceType;
  keyword?: string;
  spaceId?: number;
  pageSize?: number;
}

const useKnowledgeList = ({
  type,
  keyword,
  spaceId,
  pageSize = 20,
}: UseKnowledgeListParams) => {
  const [list, setList] = useState<KnowledgeListItem[]>([]);
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

  // 当前页码（0=未加载）、全量过滤后缓存与请求竞态标识
  const pageRef = useRef<number>(0);
  const rawListRef = useRef<KnowledgeListItem[] | null>(null);
  const requestIdRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  const load = useCallback(
    async (reset: boolean) => {
      // 防重入仅限追加加载；条件变化的重置加载由 requestId 过期丢弃
      if (!reset && loadingRef.current) {
        return;
      }
      // space 场景 repo 树接口 spaceId 必传（空间字典加载中/未选择空间），
      // 未就绪时挂起（不发起请求）
      if (type === 'space' && spaceId === undefined) {
        return;
      }
      const requestId = ++requestIdRef.current;
      const nextPage = reset ? 1 : pageRef.current + 1;
      loadingRef.current = true;
      setLoading(true);
      setError(false);
      try {
        if (reset || rawListRef.current === null) {
          const res =
            type === 'recent'
              ? await apiRepoRecentlyAccessedPages({
                  from: 0,
                  size: pageSize,
                })
              : await apiRepoSpaceTree(spaceId as number);
          if (requestIdRef.current !== requestId) {
            return;
          }
          if (res?.code !== SUCCESS_CODE) {
            throw new Error('knowledge list failed');
          }
          rawListRef.current =
            type === 'recent'
              ? ((res.data as RepoPortalPageInfo[]) || []).map(mapRecentItem)
              : flattenRepoTree(res.data as RepoPageTreeNode[]);
        }
        // 全量数据按关键字客户端筛选后内存切片
        const filtered = filterByKeyword(
          rawListRef.current || [],
          debouncedKeyword,
        );
        const start = (nextPage - 1) * pageSize;
        const slice = filtered.slice(start, start + pageSize);
        setList((prev) => (reset ? slice : [...prev, ...slice]));
        pageRef.current = nextPage;
        setHasMore(start + pageSize < filtered.length);
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
    [type, spaceId, debouncedKeyword, pageSize],
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  // 查询条件变化时重置加载（含 space 未就绪 → 就绪后的首次拉取）
  useEffect(() => {
    pageRef.current = 0;
    rawListRef.current = null;
    setList([]);
    setError(false);
    setHasMore(true);
    loadRef.current(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, spaceId, debouncedKeyword, pageSize]);

  /** 滚动触底加载下一页（内存切片，尾部追加） */
  const loadMore = useCallback(() => {
    if (!loadingRef.current) {
      loadRef.current(false);
    }
  }, []);

  return { list, loading, error, hasMore, loadMore };
};

export default useKnowledgeList;
