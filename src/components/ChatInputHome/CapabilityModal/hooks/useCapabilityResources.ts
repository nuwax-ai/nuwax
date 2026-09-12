/**
 * 添加能力弹窗归一化数据层
 * @description 参考 pages/ExpertSkillConnector/useResourceList 的双适配器模式独立实现：
 * - 专家：系统广场/团队空间均走已发布智能体接口（团队维度经 spaceIds 聚合，
 *   "全部"页签=全部空间），服务端分页；
 * - 连接器：系统广场全量数组、团队空间服务端分页；
 * - 资料库：repo 页面树全量拉取后先序平铺（客户端切片）；
 * - 技能维度已接入 SkillListView（自带数据层），此处不注册适配器；
 * 对外统一提供 { list, loading, error, hasMore, loadMore } 语义。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiRepoSpaceTree } from '@/services/repo';
import { apiPublishedAgentList } from '@/services/square';
import {
  apiConnectorProviderPageList,
  apiSystemConnectorProviderList,
} from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { RepoPageTreeNode } from '@/types/interfaces/repo';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CapabilityItem,
  CapabilityItemSourceEnum,
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
  /** 团队空间专家维度：空间聚合查询（"全部"页签=全部空间，具体空间=单元素） */
  spaceIds?: number[];
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
export const mapPublishedItem = (
  item: SquarePublishedItemInfo & { tags?: string[]; fileType?: string },
  resourceType: CapabilityTypeEnum,
  source: CapabilityItemSourceEnum = 'system',
): CapabilityItem => ({
  key: `${resourceType}:${source}:${item.id}`,
  resourceType,
  source,
  rawId: item.id,
  targetId: item.targetId,
  name: item.name,
  description: item.description,
  icon: item.icon,
  category: item.category || undefined,
  userCount: item.statistics?.userCount,
  convCount: item.statistics?.convCount,
  collectCount: item.statistics?.collectCount,
  collect: item.collect,
  official: item.official,
  // 发布者信息（与广场卡同口径：昵称优先，回退用户名）
  publisherName: item.publishUser?.nickName || item.publishUser?.userName,
  publisherAvatar: item.publishUser?.avatar,
  tags: item.tags,
  fileType: item.fileType,
  paymentRequired: item.paymentRequired,
  subscribed: item.subscribed,
  enabled: item.enabled,
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
  // 认证方式（连接/断开分流：oauth2 授权 / 凭据表单 / no_auth 免连接），与广场页同口径
  authType: item.authType,
});

/**
 * 资料卡文档类型归一化：优先源文件扩展名 sourceExt（清洗前导点），
 * 无 sourceExt 回落接口 pageType；统一大写供 Tag 展示（PDF/DOC/MD）
 */
export const normalizeDocType = (
  sourceExt?: string,
  pageType?: string,
): string | undefined =>
  (sourceExt?.replace(/^\./, '') || pageType)?.toUpperCase();

/**
 * 资料库页面树先序平铺：目录与页面同构（每个节点都是可选文档），
 * 按树的先序顺序展开为列表，保留资料库的目录分组视觉顺序。
 * 时间胶囊仅「最近访问」条目展示（useRecentRepoPages），空间树不带时间。
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
          // 创建人（repo 树平铺字段），复用发布者通道与其他卡同款展示
          publisherName: page.creatorName,
          publisherAvatar: page.creatorAvatar,
          // 文档类型：源文件扩展名优先，无则回落接口 pageType
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

/** 已发布接口（Page 分页结构）响应提取 */
const extractPublishedPage = (
  res: RequestResponse<unknown>,
  page: number,
  idPrefix: CapabilityTypeEnum,
  source: CapabilitySourceEnum = 'system',
): { items: CapabilityItem[]; hasMore: boolean } => {
  const data = res.data as Page<SquarePublishedItemInfo> | null;
  const records = data?.records || [];
  const current = data?.current || page;
  const pages = data?.pages || 1;
  return {
    items: records.map((item) => mapPublishedItem(item, idPrefix, source)),
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
    spaceIds?: number[];
  }) => Promise<RequestResponse<unknown>>,
  resourceType: CapabilityTypeEnum,
  source: CapabilitySourceEnum = 'system',
): ServerAdapter => ({
  mode: 'server',
  fetchPage: ({ page, pageSize, category, keyword, spaceIds }) =>
    fetch({ page, pageSize, category, kw: keyword || undefined, spaceIds }),
  extract: (res, page) => extractPublishedPage(res, page, resourceType, source),
});

/**
 * 能力类型 × 数据源 的接口适配器矩阵。
 * 技能维度已接入 SkillListView（自带四场景数据层），此处不再注册 skill
 * 适配器——hook 对未注册的类型保持空态（不加载）。
 */
const ADAPTERS: Partial<
  Record<CapabilityTypeEnum, Record<CapabilitySourceEnum, ResourceAdapter>>
> = {
  expert: {
    // 系统广场：已发布智能体（POST /api/published/agent/list），
    // 与广场页 /square?cate_type=Agent 默认口径一致：targetType=Agent +
    // targetSubType=ChatBot（含对话型/通用型，排除网页应用），不带 official
    system: publishedServerAdapter(
      (data) =>
        apiPublishedAgentList({
          ...data,
          targetType: AgentComponentTypeEnum.Agent,
          targetSubType: 'ChatBot',
        }),
      'expert',
    ),
    // 团队空间：同为已发布智能体接口，与空间广场
    // /space/:id/space-square?activeKey=Agent 同口径——category=Agent +
    // justReturnSpaceData 只查空间已发布内容；具体空间页签传单 spaceId，
    // "全部"页签经 spaceIds 聚合全部空间
    team: publishedServerAdapter(
      (data) => {
        const single =
          data.spaceIds?.length === 1 ? data.spaceIds[0] : undefined;
        return apiPublishedAgentList({
          page: data.page,
          pageSize: data.pageSize,
          kw: data.kw,
          category: SquareAgentTypeEnum.Agent,
          justReturnSpaceData: true,
          ...(single
            ? { spaceId: single }
            : data.spaceIds?.length
            ? { spaceIds: data.spaceIds }
            : {}),
        });
      },
      'expert',
      'team',
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
  /** 二级分类 key：system 维度为内容分类（空串=全部）；team 维度为空间 ID 串（空串="全部"页签，专家维度聚合全部空间） */
  category: string;
  /** 搜索关键字（已防抖） */
  keyword: string;
  /** 团队空间维度的空间 ID（system 源不依赖；专家团队维度由 spaceIds 承载） */
  spaceId?: number;
  /** 团队空间专家维度：空间聚合查询（"全部"=全部空间 ID；具体空间=单元素） */
  spaceIds?: number[];
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
  spaceIds,
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
      // 团队空间维度依赖空间 ID（空间字典加载中 / 未选择空间）；
      // 专家团队维度的"全部"页签只有 spaceIds（无单空间 ID），凭其放行
      if (source === 'team' && !spaceId && !spaceIds?.length) {
        return;
      }
      // 未注册适配器的类型（技能已接入 SkillListView）保持空态,不发起加载
      const adapter = ADAPTERS[resourceType]?.[source];
      if (!adapter) {
        return;
      }
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
            spaceIds,
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
    [resourceType, source, category, keyword, spaceId, spaceIds, pageSize],
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
  }, [resourceType, source, category, keyword, spaceId, spaceIds]);

  // 滚动触底加载下一页
  const loadMore = useCallback(() => {
    if (loadingRef.current) {
      return;
    }
    loadRef.current(false);
  }, []);

  /**
   * 就地更新单条能力（连接器连接/断开成功后使用，与广场页 useResourceList
   * 同款能力）：同步更新已加载列表与全量缓存，避免整页重拉丢滚动位置、
   * 或滚动翻页时缓存旧状态复活
   */
  const updateItem = useCallback(
    (key: string, patch: Partial<CapabilityItem>) => {
      const apply = (item: CapabilityItem) =>
        item.key === key ? { ...item, ...patch } : item;
      setList((prev) => prev.map(apply));
      if (rawListRef.current) {
        rawListRef.current = rawListRef.current.map(apply);
      }
    },
    [],
  );

  return { list, loading, error, hasMore, loadMore, updateItem };
};

export default useCapabilityResources;
