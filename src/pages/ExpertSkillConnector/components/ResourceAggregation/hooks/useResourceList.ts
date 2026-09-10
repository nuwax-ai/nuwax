/**
 * 归一化资源列表数据层
 * @description 屏蔽各资源类型/数据源接口的分页差异（服务端分页 vs 全量数组），
 * 对外统一提供 { list, loading, hasMore, loadMore } 语义：
 * - 服务端分页接口（已发布智能体/技能、空间连接器）直接透传分页参数
 * - 全量数组接口（空间智能体/技能、系统连接器）首次全量拉取后内存切片，模拟滚动加载
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConfigList } from '@/services/agentConfig';
import { apiSkillList } from '@/services/library';
import {
  apiPublishedAgentList,
  apiPublishedSkillList,
} from '@/services/square';
import {
  apiConnectorProviderPageList,
  apiSystemConnectorProviderList,
} from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { SkillInfo } from '@/types/interfaces/library';
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
  fetchAll: (
    params: Pick<ServerFetchParams, 'spaceId'>,
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
  // 仅专家（前缀 agent）填：targetId 即智能体 ID，供「召唤」跳转 home 使用；
  // 技能（前缀 skill）的 targetId 是技能 ID，不能当 agentId 用
  agentId: idPrefix === 'agent' ? item.targetId : undefined,
  name: item.name,
  description: item.description,
  icon: item.icon,
  category: item.category || undefined,
  publishUser: item.publishUser,
  stats: mapPublishedStats(item.statistics),
});

/**
 * 连接器提供方归一化
 * 卡片不展示工具数统计（需求下线）；connected / authType 驱动
 * 标题下方的连接状态行与 hover 右上角的 连接/断开 按钮
 */
const mapConnectorItem = (
  item: ConnectorProviderInfo,
  idPrefix: string,
): ResourceItem => ({
  id: `${idPrefix}-${item.service || item.id}`,
  name: item.displayName || item.service,
  description: item.description,
  icon: item.icon,
  category: item.category || undefined,
  tags: item.tags,
  connected: item.connected,
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
 * 各资源类型 × 数据源的接口适配器
 */
const RESOURCE_ADAPTERS: Record<
  ResourceTypeEnum,
  Record<ResourceSourceEnum, ResourceAdapter>
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
    // 团队空间-空间内智能体（全量数组）
    team: {
      mode: 'client',
      fetchAll: ({ spaceId }) => apiAgentConfigList(spaceId as number),
      extractAll: (res) => {
        const records = (res.data as AgentConfigInfo[] | null) || [];
        return records.map((item) => ({
          id: `space-agent-${item.id}`,
          // 空间智能体 id 即智能体 ID，供「召唤」跳转 home 使用
          agentId: item.id,
          name: item.name,
          description: item.description,
          icon: item.icon,
          // 创建人以发布者行展示（与系统广场卡片同款：头像+昵称）
          publishUser: item.creator,
          // 统计行与系统广场卡片同款（用户人数/会话次数/收藏次数），取 agentStatistics
          stats: mapPublishedStats(item.agentStatistics),
        }));
      },
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
    // 团队空间-空间内技能（全量数组）
    team: {
      mode: 'client',
      fetchAll: ({ spaceId }) => apiSkillList({ spaceId }),
      extractAll: (res) => {
        const records = (res.data as SkillInfo[] | null) || [];
        return records.map((item) => ({
          id: `space-skill-${item.id}`,
          name: item.name,
          description: item.description,
          icon: item.icon,
          category: item.category || undefined,
          // 创建人映射为发布者行展示（与系统广场技能卡片同款；
          // SkillInfo 无头像/昵称，头像走默认头像兜底）
          publishUser: item.creatorName
            ? {
                userId: item.creatorId ?? 0,
                userName: item.creatorName,
                nickName: item.creatorName,
                avatar: '',
              }
            : undefined,
        }));
      },
    },
  },
  connector: {
    // 系统广场-系统连接器（全量数组）
    system: {
      mode: 'client',
      fetchAll: () => apiSystemConnectorProviderList(),
      extractAll: (res) => {
        const records = (res.data as ConnectorProviderInfo[] | null) || [];
        return records.map((item) => mapConnectorItem(item, 'system-conn'));
      },
    },
    // 团队空间-空间连接器（服务端分页）
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
          items: records.map((item) => mapConnectorItem(item, 'space-conn')),
          // 该接口无总页数字段，按"本页取满"判断是否还有下一页
          hasMore: current === page && records.length >= pageSize,
        };
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
      // 团队空间维度依赖 spaceId
      if (source === 'team' && !spaceId) {
        return;
      }
      const adapter = RESOURCE_ADAPTERS[resourceType][source];
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
            const res = await adapter.fetchAll({ spaceId });
            if (requestIdRef.current !== requestId) {
              return;
            }
            rawListRef.current =
              res?.code === SUCCESS_CODE ? adapter.extractAll(res) : [];
          }
          // 全量数据按分类/关键字做客户端筛选后内存切片
          const kw = keyword.trim().toLowerCase();
          filteredListRef.current = (rawListRef.current || []).filter(
            (item) => {
              const categoryMatched =
                !category || (!!item.category && item.category === category);
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

  return { list, loading, hasMore, loadMore };
};

export default useResourceList;
