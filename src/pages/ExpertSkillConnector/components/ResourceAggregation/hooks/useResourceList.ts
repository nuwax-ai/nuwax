/**
 * 归一化资源列表数据层
 * @description 屏蔽各资源类型/数据源接口的分页差异（服务端分页 vs 全量数组），
 * 对外统一提供 { list, loading, hasMore, loadMore } 语义：
 * - 服务端分页接口（已发布智能体/技能、官方/空间连接器）直接透传分页参数
 * - 全量数组接口（已连接的连接器、我启用的技能）首次全量拉取后内存切片，
 *   模拟滚动加载
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiPublishedAgentList,
  apiPublishedSkillEnableList,
  apiPublishedSkillList,
} from '@/services/square';
import { apiConnectorProviderPageList } from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ResourceItem,
  ResourceSourceEnum,
  ResourceTypeEnum,
} from '../../../types';
import { mapPublishedStats } from '../../../types';

/** 服务端分页请求参数 */
interface ServerFetchParams {
  page: number;
  pageSize: number;
  category: string;
  keyword: string;
  spaceId?: number;
}

/** 服务端分页适配器（响应原始结构由 extract 内部自行收窄） */
interface ServerAdapter {
  mode: 'server';
  fetchPage: (params: ServerFetchParams) => Promise<RequestResponse<unknown>>;
  /** 从响应中提取归一化列表与是否有更多数据 */
  extract: (
    res: RequestResponse<unknown>,
    page: number,
    pageSize: number,
  ) => { items: ResourceItem[]; hasMore: boolean };
}

/** 全量数组适配器 */
interface ClientAdapter {
  mode: 'client';
  /**
   * 接口侧已按 keyword 过滤时置 true：本地跳过关键字筛选，
   * 避免与接口口径不一致造成双重收窄（如接口按 service/标签命中）
   */
  serverKeyword?: boolean;
  /**
   * 接口侧已按 category 过滤时置 true：本地跳过分类筛选
   * （与 serverKeyword 同理，避免双重收窄）
   */
  serverCategory?: boolean;
  fetchAll: (
    params: Pick<ServerFetchParams, 'spaceId' | 'keyword' | 'category'>,
  ) => Promise<RequestResponse<unknown>>;
  /** 从响应中提取归一化全量列表 */
  extractAll: (res: RequestResponse<unknown>) => ResourceItem[];
}

type ResourceAdapter = ServerAdapter | ClientAdapter;

/** 广场已发布条目（智能体/技能）归一化 */
const mapPublishedItem = (
  item: SquarePublishedItemInfo,
  idPrefix: string,
): ResourceItem => ({
  id: `${idPrefix}-${item.id}`,
  // 仅专家（前缀 agent / space-agent）填：targetId 即智能体 ID，
  // 供「召唤」跳转与收藏寻址使用；技能（前缀 skill）的 targetId
  // 是技能 ID，不能当 agentId 用
  agentId:
    idPrefix === 'agent' || idPrefix === 'space-agent'
      ? item.targetId
      : undefined,
  // 仅技能（前缀 skill / space-skill / enabled-skill）填：targetId 即技能
  // ID，供「立即使用」透传 home 使用
  skillId:
    idPrefix === 'skill' ||
    idPrefix === 'space-skill' ||
    idPrefix === 'enabled-skill'
      ? item.targetId
      : undefined,
  name: item.name,
  description: item.description,
  icon: item.icon,
  category: item.category || undefined,
  publishUser: item.publishUser,
  // 当前用户是否已收藏（列表接口返回 collect；专家卡片收藏按钮选中态）
  collected: !!item.collect,
  // 技能启用状态（卡片右上角启用开关选中态；SquarePublishedItemInfo 暂未
  // 声明该字段，防御性读取列表接口返回的 enabled，缺省按未启用展示）
  skillEnabled: !!(item as { enabled?: boolean }).enabled,
  // 付费订阅（专家卡片：订阅功能开启时展示「付费/已订阅」角标，未订阅
  // 点「召唤」或角标跳转智能体详情页弹订阅套餐；技能卡片：左上角「付费」
  // Ribbon 角标，未订阅点「选择」弹订阅套餐弹窗；连接器卡片不消费）
  paymentRequired: !!item.paymentRequired,
  subscribed: !!item.subscribed,
  stats: mapPublishedStats(item.statistics),
});

/**
 * 连接器提供方归一化
 * 卡片不展示工具数统计（需求下线）；connected / authType 驱动
 * 标题下方的连接状态行与 hover 右上角的 连接/断开 按钮；
 * connectorId / connectionEnabled 驱动已连接卡片右上角的启用开关
 */
const mapConnectorItem = (
  item: ConnectorProviderInfo,
  idPrefix: string,
): ResourceItem => ({
  id: `${idPrefix}-${item.service || item.id}`,
  // 连接器 service 标识：断开连接时按 service 匹配用户连接 id 用
  service: item.service,
  // 连接器主键 id：切换连接启用状态接口（POST .../connections/{连接器id}/status）寻址用
  connectorId: item.id,
  // 所属空间 ID：团队空间维度列表响应每条自带（"全部"页签聚合时也逐条携带），
  // 免鉴权直连建连透传用；系统广场响应无该字段
  spaceId: item.spaceId,
  name: item.displayName || item.service,
  description: item.description,
  icon: item.icon,
  category: item.category || undefined,
  tags: item.tags,
  connected: item.connected,
  connectionEnabled: item.connectionEnabled,
  authType: item.authType,
});

/** 已发布接口响应提取（Page 分页结构） */
const extractPublishedPage = (
  res: RequestResponse<unknown>,
  page: number,
  idPrefix: string,
): { items: ResourceItem[]; hasMore: boolean } => {
  const data = res.data as Page<SquarePublishedItemInfo> | null;
  const records = data?.records || [];
  const current = data?.current || page;
  const pages = data?.pages || 1;
  return {
    items: records.map((item) => mapPublishedItem(item, idPrefix)),
    hasMore: current < pages,
  };
};

/**
 * 连接器接口响应提取（GET /api/connector/providers 分页结构，
 * 官方目录 / 空间维度共用，仅归一化 id 前缀不同）
 */
const extractConnectorPage = (
  res: RequestResponse<unknown>,
  page: number,
  pageSize: number,
  idPrefix: string,
): { items: ResourceItem[]; hasMore: boolean } => {
  const data = res.data as {
    records?: ConnectorProviderInfo[] | null;
    pageNum?: number;
  } | null;
  const records = data?.records || [];
  const current = data?.pageNum || page;
  return {
    items: records.map((item) => mapConnectorItem(item, idPrefix)),
    // 该接口无总页数字段，按"本页取满"判断是否还有下一页
    hasMore: current === page && records.length >= pageSize,
  };
};

/**
 * 各资源类型 × 数据源的接口适配器
 * （Partial：已连接的维度仅连接器配置，专家/技能无该 tab 不会路由到）
 */
const RESOURCE_ADAPTERS: Record<
  ResourceTypeEnum,
  Partial<Record<ResourceSourceEnum, ResourceAdapter>>
> = {
  expert: {
    // 系统广场-已发布智能体（服务端分页）
    system: {
      mode: 'server',
      fetchPage: ({ page, pageSize, category, keyword }) =>
        apiPublishedAgentList({
          page,
          pageSize,
          category,
          kw: keyword || undefined,
          // 查询智能体需设置目标子类型：ChatBot 含对话型与通用型，排除网页应用
          targetType: AgentComponentTypeEnum.Agent,
          targetSubType: 'ChatBot',
          // 仅展示官方智能体
          official: true,
        }),
      extract: (res, page) => extractPublishedPage(res, page, 'agent'),
    },
    // 团队空间-空间内已发布智能体（POST /api/published/agent/list 服务端分页）：
    // 与空间广场 /space/:id/space-square?activeKey=Agent 同口径——
    // category=Agent（tab 维度）+ justReturnSpaceData 只查空间已发布内容；
    // 二级 tab 即空间选择（必选中具体空间），category 内容分类不适用不传
    team: {
      mode: 'server',
      fetchPage: ({ page, pageSize, keyword, spaceId }) =>
        apiPublishedAgentList({
          page,
          pageSize,
          kw: keyword || undefined,
          category: SquareAgentTypeEnum.Agent,
          justReturnSpaceData: true,
          spaceId,
        }),
      extract: (res, page) => extractPublishedPage(res, page, 'space-agent'),
    },
  },
  skill: {
    // 系统广场-已发布技能（服务端分页）
    system: {
      mode: 'server',
      fetchPage: ({ page, pageSize, category, keyword }) =>
        apiPublishedSkillList({
          page,
          pageSize,
          category,
          kw: keyword || undefined,
        }),
      extract: (res, page) => extractPublishedPage(res, page, 'skill'),
    },
    // 团队空间-空间内已发布技能（POST /api/published/skill/list 服务端分页）：
    // 与专家-团队空间同口径——category=Skill（tab 维度）+ justReturnSpaceData
    // 只查空间已发布内容；二级 tab 即空间选择（必选中具体空间），
    // 内容分类不适用不传
    team: {
      mode: 'server',
      fetchPage: ({ page, pageSize, keyword, spaceId }) =>
        apiPublishedSkillList({
          page,
          pageSize,
          kw: keyword || undefined,
          category: SquareAgentTypeEnum.Skill,
          justReturnSpaceData: true,
          spaceId,
        }),
      extract: (res, page) => extractPublishedPage(res, page, 'space-skill'),
    },
    // 我启用的-当前用户启用的技能（POST /api/published/skill/enable/list
    // 不传参一次性全量返回）：本地按二级分类（与系统广场同源）与关键字
    // 筛选后内存切片模拟滚动加载；关闭开关后就地更新卡片状态不整页重拉
    // （刷新后自然移出该维度）
    enabled: {
      mode: 'client',
      fetchAll: async () => apiPublishedSkillEnableList(),
      extractAll: (res) => {
        const data = res.data;
        // 不带分页参数时后端可能直接回数组、也可能仍套 records 分页壳，两者兼容
        const records = Array.isArray(data)
          ? (data as SquarePublishedItemInfo[])
          : (data as Page<SquarePublishedItemInfo> | null)?.records ?? [];
        return records.map((item) => mapPublishedItem(item, 'enabled-skill'));
      },
    },
  },
  connector: {
    // 系统广场-官方连接器目录（服务端分页）：
    // GET /api/connector/providers?scope=official，点击具体分类追加 category 参数
    system: {
      mode: 'server',
      fetchPage: ({ page, pageSize, category, keyword }) =>
        apiConnectorProviderPageList({
          pageNum: page,
          pageSize,
          // 官方连接器目录维度
          scope: 'official',
          // 分类 key 即分类名称（如 通讯工具）；空串 = 全部，不传
          category: category || undefined,
          keyword: keyword || undefined,
        }),
      extract: (res, page, pageSize) =>
        extractConnectorPage(res, page, pageSize, 'system-conn'),
    },
    // 团队空间-空间连接器（服务端分页）：
    // "全部"页签 = scope=space 聚合全部空间（不带 spaceId）；
    // 具体空间 = 仅传 spaceId；两种口径均不带 status/connected 筛选
    team: {
      mode: 'server',
      fetchPage: ({ page, pageSize, keyword, spaceId }) =>
        apiConnectorProviderPageList({
          pageNum: page,
          pageSize,
          ...(spaceId ? { spaceId } : { scope: 'space' }),
          keyword: keyword || undefined,
        }),
      extract: (res, page, pageSize) =>
        extractConnectorPage(res, page, pageSize, 'space-conn'),
    },
    // 已连接的-当前用户已连接的连接器
    // （GET /api/connector/providers?connected=true 一次性全量返回，无分页；
    // 搜索与分类均走接口参数（keyword/category），本地跳过双重筛选）
    connected: {
      mode: 'client',
      serverKeyword: true,
      serverCategory: true,
      fetchAll: ({ keyword, category }) =>
        apiConnectorProviderPageList({
          connected: 'true',
          category: category || undefined,
          keyword: keyword || undefined,
        }),
      extractAll: (res) => {
        const data = res.data;
        // 不带分页参数时后端可能直接回数组、也可能仍套 records 分页壳，两者兼容
        const records = Array.isArray(data)
          ? (data as ConnectorProviderInfo[])
          : (data as { records?: ConnectorProviderInfo[] | null } | null)
              ?.records ?? [];
        return records.map((item) => mapConnectorItem(item, 'connected-conn'));
      },
    },
  },
};

export interface UseResourceListParams {
  /** 资源类型 */
  resourceType: ResourceTypeEnum;
  /** 数据源（系统广场/团队空间） */
  source: ResourceSourceEnum;
  /** 二级分类 key，空串表示全部 */
  category: string;
  /** 搜索关键字（已防抖） */
  keyword: string;
  /** 团队空间维度使用的空间 ID（system 源不依赖） */
  spaceId?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 归一化资源列表 hook
 */
const useResourceList = ({
  resourceType,
  source,
  category,
  keyword,
  spaceId,
  pageSize = 20,
}: UseResourceListParams) => {
  const [list, setList] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 当前页码（0 表示尚未加载）
  const pageRef = useRef<number>(0);
  // 全量数组接口的原始数据缓存
  const rawListRef = useRef<ResourceItem[] | null>(null);
  // 全量数组接口按筛选条件计算后的视图缓存
  const filteredListRef = useRef<ResourceItem[]>([]);
  // 进行中的请求标识（过期响应丢弃）
  const requestIdRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  const load = useCallback(
    async (reset: boolean) => {
      // 防重入：上一次请求仍在途中时忽略新的触发
      if (loadingRef.current) {
        return;
      }
      // 团队空间维度依赖 spaceId；连接器例外——"全部"页签经 scope=space
      // 聚合全部空间（不带 spaceId 也要发请求），具体空间页签才带 spaceId
      if (source === 'team' && !spaceId && resourceType !== 'connector') {
        return;
      }
      const adapter = RESOURCE_ADAPTERS[resourceType][source];
      // 该维度未配置数据源（专家/技能无"已连接的"tab，正常不会走到）
      if (!adapter) {
        return;
      }
      const requestId = ++requestIdRef.current;
      const nextPage = reset ? 1 : pageRef.current + 1;
      loadingRef.current = true;
      setLoading(true);
      try {
        if (adapter.mode === 'server') {
          const res = await adapter.fetchPage({
            page: nextPage,
            pageSize,
            category,
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
          } else if (reset) {
            setList([]);
            setHasMore(false);
          }
        } else {
          if (reset || rawListRef.current === null) {
            const res = await adapter.fetchAll({ spaceId, keyword, category });
            if (requestIdRef.current !== requestId) {
              return;
            }
            rawListRef.current =
              res?.code === SUCCESS_CODE ? adapter.extractAll(res) : [];
          }
          // 全量数据按分类/关键字做客户端筛选后内存切片；
          // serverKeyword/serverCategory 的维度接口已按对应条件过滤，
          // 本地跳过相应筛选，避免与接口口径不一致造成双重收窄
          const kw = adapter.serverKeyword ? '' : keyword.trim().toLowerCase();
          const cat = adapter.serverCategory ? '' : category;
          filteredListRef.current = (rawListRef.current || []).filter(
            (item) => {
              const categoryMatched =
                !cat || (!!item.category && item.category === cat);
              const keywordMatched =
                !kw ||
                item.name?.toLowerCase().includes(kw) ||
                item.description?.toLowerCase().includes(kw);
              return categoryMatched && keywordMatched;
            },
          );
          const start = (nextPage - 1) * pageSize;
          const slice = filteredListRef.current.slice(start, start + pageSize);
          setList((prev) => (reset ? slice : [...prev, ...slice]));
          pageRef.current = nextPage;
          setHasMore(start + pageSize < filteredListRef.current.length);
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
    filteredListRef.current = [];
    setList([]);
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

  /**
   * 就地更新单条卡片（断开连接等本地状态变更；不动筛选与分页，
   * 避免整页重拉丢失滚动加载位置）
   */
  const updateItem = useCallback((id: string, patch: Partial<ResourceItem>) => {
    const apply = (item: ResourceItem) =>
      item.id === id ? { ...item, ...patch } : item;
    setList((prev) => prev.map(apply));
    // 客户端筛选模式的两层缓存同步更新，避免重新筛选后旧状态复活
    if (rawListRef.current) {
      rawListRef.current = rawListRef.current.map(apply);
    }
    filteredListRef.current = filteredListRef.current.map(apply);
  }, []);

  return { list, loading, hasMore, loadMore, updateItem };
};

export default useResourceList;
