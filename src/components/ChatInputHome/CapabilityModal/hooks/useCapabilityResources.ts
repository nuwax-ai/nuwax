/**
 * 添加能力弹窗归一化数据层
 * @description 参考 pages/ExpertSkillConnector/useResourceList 的双适配器模式独立实现：
 * - 服务端分页维度（系统广场已发布技能/专家/资料库、团队空间连接器）透传分页参数；
 * - 全量数组维度（系统广场连接器、团队空间技能/专家/资料库）首次全量拉取后
 *   内存筛选切片，模拟滚动加载；
 * 对外统一提供 { list, loading, error, hasMore, loadMore } 语义。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConfigList } from '@/services/agentConfig';
import { apiSkillList } from '@/services/library';
import { apiRepoSpaceTree } from '@/services/repo';
import {
  apiPublishedAgentList,
  apiPublishedSkillList,
} from '@/services/square';
import {
  apiConnectorProviderPageList,
  apiSystemConnectorProviderList,
} from '@/services/systemManage';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { SkillInfo } from '@/types/interfaces/library';
import type { RepoPageTreeNode } from '@/types/interfaces/repo';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CapabilityItem,
  CapabilitySourceEnum,
  CapabilityTypeEnum,
} from '../types';

/** 服务端分页请求参数（category 仅系统广场内容分类维度使用） */
interface ServerFetchParams {
  page: number;
  pageSize: number;
  category: string;
  keyword: string;
  spaceId?: number;
}

/** 服务端分页适配器 */
interface ServerAdapter {
  mode: 'server';
  fetchPage: (params: ServerFetchParams) => Promise<RequestResponse<unknown>>;
  /** 从响应提取归一化列表与是否还有下一页 */
  extract: (
    res: RequestResponse<unknown>,
    page: number,
    pageSize: number,
  ) => { items: CapabilityItem[]; hasMore: boolean };
}

/** 全量数组适配器 */
interface ClientAdapter {
  mode: 'client';
  fetchAll: (params: { spaceId?: number }) => Promise<RequestResponse<unknown>>;
  /** 从响应提取归一化全量列表 */
  extractAll: (res: RequestResponse<unknown>) => CapabilityItem[];
}

type ResourceAdapter = ServerAdapter | ClientAdapter;

/** 系统广场已发布条目（专家/技能/资料库）归一化（保留 targetId 供挂载能力使用） */
const mapPublishedItem = (
  item: SquarePublishedItemInfo & { tags?: string[]; fileType?: string },
  resourceType: CapabilityTypeEnum,
): CapabilityItem => ({
  key: `${resourceType}:system:${item.id}`,
  resourceType,
  source: 'system',
  rawId: item.id,
  targetId: item.targetId,
  name: item.name,
  description: item.description,
  icon: item.icon,
  category: item.category || undefined,
  userCount: item.statistics?.userCount,
  tags: item.tags,
  fileType: item.fileType,
  paymentRequired: item.paymentRequired,
  subscribed: item.subscribed,
});

/** 连接器提供方归一化（系统广场/团队空间结构一致） */
const mapConnectorItem = (
  item: ConnectorProviderInfo,
  source: CapabilitySourceEnum,
): CapabilityItem => ({
  key: `connector:${source}:${item.service || item.id}`,
  resourceType: 'connector',
  source,
  rawId: item.service || item.id,
  name: item.displayName || item.service,
  description: item.description,
  icon: item.icon,
  category: item.category || undefined,
  tags: item.tags,
  connected: item.connected,
});

/** 团队空间条目（空间内专家/技能组件）归一化 */
const mapSpaceItem = (
  base: { id: number; name: string; description: string; icon: string },
  resourceType: CapabilityTypeEnum,
): CapabilityItem => ({
  key: `${resourceType}:team:${base.id}`,
  resourceType,
  source: 'team',
  rawId: base.id,
  name: base.name,
  description: base.description || undefined,
  icon: base.icon,
});

/**
 * 资料库页面树先序平铺：目录与页面同构（每个节点都是可选文档），
 * 按树的先序顺序展开为列表，保留资料库的目录分组视觉顺序。
 */
const flattenRepoTree = (nodes: RepoPageTreeNode[]): CapabilityItem[] => {
  const items: CapabilityItem[] = [];
  const walk = (list: RepoPageTreeNode[]) => {
    list.forEach((node) => {
      const page = node.page;
      if (typeof page?.id === 'number' && page.title) {
        items.push({
          key: `knowledge:team:${page.id}`,
          resourceType: 'knowledge',
          source: 'team',
          rawId: page.id,
          slugId: page.slugId,
          name: page.title,
          pageType: page.pageType,
          // 源文件扩展名清洗为资料格式（如 ".md" / "md" → MD）
          fileType: page.sourceExt?.replace(/^\./, '')?.toUpperCase(),
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

/** 已发布接口（Page 分页结构）响应提取 */
const extractPublishedPage = (
  res: RequestResponse<unknown>,
  page: number,
  idPrefix: CapabilityTypeEnum,
): { items: CapabilityItem[]; hasMore: boolean } => {
  const data = res.data as Page<SquarePublishedItemInfo> | null;
  const records = data?.records || [];
  const current = data?.current || page;
  const pages = data?.pages || 1;
  return {
    items: records.map((item) => mapPublishedItem(item, idPrefix)),
    hasMore: current < pages,
  };
};

/** 系统广场已发布维度（服务端分页：page/pageSize/category/kw）通用适配器 */
const publishedServerAdapter = (
  fetch: (data: {
    page: number;
    pageSize: number;
    category: string;
    kw?: string;
  }) => Promise<RequestResponse<unknown>>,
  resourceType: CapabilityTypeEnum,
): ServerAdapter => ({
  mode: 'server',
  fetchPage: ({ page, pageSize, category, keyword }) =>
    fetch({ page, pageSize, category, kw: keyword || undefined }),
  extract: (res, page) => extractPublishedPage(res, page, resourceType),
});

/** 团队空间通用全量适配器（技能/专家/资料库） */
const teamClientAdapter = (
  fetchAll: (spaceId: number) => Promise<RequestResponse<unknown>>,
  extractRecords: (res: RequestResponse<unknown>) => CapabilityItem[],
): ClientAdapter => ({
  mode: 'client',
  fetchAll: ({ spaceId }) => fetchAll(spaceId as number),
  extractAll: extractRecords,
});

/**
 * 能力类型 × 数据源 的接口适配器矩阵
 */
const ADAPTERS: Record<
  CapabilityTypeEnum,
  Record<CapabilitySourceEnum, ResourceAdapter>
> = {
  expert: {
    // 系统广场：已发布智能体（POST /api/published/agent/list）
    system: publishedServerAdapter(
      (data) => apiPublishedAgentList(data),
      'expert',
    ),
    // 团队空间：空间内智能体配置（全量数组）
    team: teamClientAdapter(
      (spaceId) => apiAgentConfigList(spaceId),
      (res) => {
        const records = (res.data as AgentConfigInfo[] | null) || [];
        return records.map((item) => mapSpaceItem(item, 'expert'));
      },
    ),
  },
  skill: {
    // 系统广场：已发布技能（POST /api/published/skill/list）
    system: publishedServerAdapter(
      (data) => apiPublishedSkillList(data),
      'skill',
    ),
    // 团队空间：空间内技能（全量数组）
    team: teamClientAdapter(
      (spaceId) => apiSkillList({ spaceId }),
      (res) => {
        const records = (res.data as SkillInfo[] | null) || [];
        return records.map((item) => ({
          ...mapSpaceItem(item, 'skill'),
          category: item.category || undefined,
        }));
      },
    ),
  },
  connector: {
    // 系统广场：系统连接器（全量数组）
    system: {
      mode: 'client',
      fetchAll: () => apiSystemConnectorProviderList(),
      extractAll: (res) => {
        const records = (res.data as ConnectorProviderInfo[] | null) || [];
        return records.map((item) => mapConnectorItem(item, 'system'));
      },
    },
    // 团队空间：空间连接器（GET /api/connector/providers 服务端分页）
    team: {
      mode: 'server',
      fetchPage: ({ page, pageSize, keyword, spaceId }) =>
        apiConnectorProviderPageList({
          spaceId,
          pageNum: page,
          pageSize,
          // 与空间连接器页保持一致的空间维度查询参数
          scope: 'space',
          status: 'all',
          connected: 'all',
          keyword: keyword || undefined,
        }),
      extract: (res, page, pageSize) => {
        const data = res.data as {
          records?: ConnectorProviderInfo[] | null;
          pageNum?: number;
        } | null;
        const records = data?.records || [];
        const current = data?.pageNum || page;
        return {
          items: records.map((item) => mapConnectorItem(item, 'team')),
          // 该接口无总页数字段，按"本页取满"判断是否还有下一页
          hasMore: current === page && records.length >= pageSize,
        };
      },
    },
  },
  knowledge: {
    // 资料库=空间文档仓库（repo 页面树），接口 spaceId 必传，仅团队空间维度；
    // 系统广场无 repo 概念（上层已固定资料库维度为 team 源），此处占位返回空
    system: {
      mode: 'client',
      fetchAll: async () =>
        ({ code: SUCCESS_CODE, data: [] } as RequestResponse<unknown>),
      extractAll: () => [],
    },
    // 团队空间：空间完整页面树（全量拉取后先序平铺，客户端分页）
    team: {
      mode: 'client',
      fetchAll: ({ spaceId }) => apiRepoSpaceTree(spaceId as number),
      extractAll: (res) => flattenRepoTree(res.data as RepoPageTreeNode[]),
    },
  },
};

export interface UseCapabilityResourcesParams {
  /** 能力类型 */
  resourceType: CapabilityTypeEnum;
  /** 数据源（系统广场/团队空间） */
  source: CapabilitySourceEnum;
  /** 二级分类 key：system 维度为内容分类（空串=全部）；team 维度为空间 ID 串（空串="全部"占位，回落上层默认空间） */
  category: string;
  /** 搜索关键字（已防抖） */
  keyword: string;
  /** 团队空间维度的空间 ID（system 源不依赖） */
  spaceId?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 归一化能力列表 hook
 */
const useCapabilityResources = ({
  resourceType,
  source,
  category,
  keyword,
  spaceId,
  pageSize = 20,
}: UseCapabilityResourcesParams) => {
  const [list, setList] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 当前页码（0 表示尚未加载）
  const pageRef = useRef<number>(0);
  // 全量数组接口的原始数据缓存
  const rawListRef = useRef<CapabilityItem[] | null>(null);
  // 进行中的请求标识（过期响应丢弃）
  const requestIdRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  const load = useCallback(
    async (reset: boolean) => {
      // 防重入仅限追加加载（滚动触底连点）；筛选条件变化的重置加载必须放行，
      // 由 requestId 让旧请求过期丢弃——否则切换数据源时首个请求携带旧分类
      // 参数落地错误结果，而新参数的重置加载被挡，列表停留在错误空态
      if (!reset && loadingRef.current) {
        return;
      }
      // 团队空间维度依赖空间 ID（空间字典加载中 / 未选择空间）
      if (source === 'team' && !spaceId) {
        return;
      }
      const adapter = ADAPTERS[resourceType][source];
      const requestId = ++requestIdRef.current;
      const nextPage = reset ? 1 : pageRef.current + 1;
      loadingRef.current = true;
      setLoading(true);
      setError(false);
      try {
        if (adapter.mode === 'server') {
          const res = await adapter.fetchPage({
            page: nextPage,
            pageSize,
            // system 维度才存在内容分类过滤；team 维度分类承载的是空间选择
            category: source === 'system' ? category : '',
            keyword,
            spaceId,
          });
          // 过期响应丢弃（筛选条件已变化）
          if (requestIdRef.current !== requestId) {
            return;
          }
          if (res?.code === SUCCESS_CODE) {
            const { items, hasMore: more } = adapter.extract(
              res,
              nextPage,
              pageSize,
            );
            setList((prev) => (reset ? items : [...prev, ...items]));
            pageRef.current = nextPage;
            setHasMore(more);
          } else {
            throw new Error('capability list failed');
          }
        } else {
          if (reset || rawListRef.current === null) {
            const res = await adapter.fetchAll({ spaceId });
            if (requestIdRef.current !== requestId) {
              return;
            }
            if (res?.code !== SUCCESS_CODE) {
              throw new Error('capability list failed');
            }
            rawListRef.current = adapter.extractAll(res);
          }
          // 全量数据按分类/关键字做客户端筛选后内存切片
          const kw = keyword.trim().toLowerCase();
          const filtered = (rawListRef.current || []).filter((item) => {
            const categoryMatched =
              source !== 'system' ||
              !category ||
              (!!item.category && item.category === category);
            const keywordMatched =
              !kw ||
              item.name?.toLowerCase().includes(kw) ||
              item.description?.toLowerCase().includes(kw);
            return categoryMatched && keywordMatched;
          });
          const start = (nextPage - 1) * pageSize;
          const slice = filtered.slice(start, start + pageSize);
          setList((prev) => (reset ? slice : [...prev, ...slice]));
          pageRef.current = nextPage;
          setHasMore(start + pageSize < filtered.length);
        }
      } catch {
        if (requestIdRef.current === requestId) {
          setError(true);
          if (reset) {
            setList([]);
          }
          setHasMore(false);
        }
      } finally {
        // 仅最新请求允许复位加载标记（过期请求属于已被替代的查询）
        if (requestIdRef.current === requestId) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [resourceType, source, category, keyword, spaceId, pageSize],
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  // 筛选条件变化时重置加载
  useEffect(() => {
    pageRef.current = 0;
    rawListRef.current = null;
    setList([]);
    setError(false);
    setHasMore(true);
    loadRef.current(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, source, category, keyword, spaceId]);

  // 滚动触底加载下一页
  const loadMore = useCallback(() => {
    if (loadingRef.current) {
      return;
    }
    loadRef.current(false);
  }, []);

  return { list, loading, error, hasMore, loadMore };
};

export default useCapabilityResources;
