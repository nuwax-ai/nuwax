/**
 * 搜索弹窗分类数据适配层
 * @description 六个分类 tab 的列表/搜索/最近访问数据源，统一输出 SearchResultItem：
 * - 屏蔽服务端分页（会话/项目/广场发布项/空间连接器）与全量数组+本地过滤
 *   （空间智能体/技能、系统连接器）两种取数模式的差异
 * - 专家/技能/连接器 = 系统广场 + 团队空间双源并发合并（单源失败不拖垮整 tab），
 *   各接口取值口径与 ExpertSkillConnector 页面 useResourceList 的适配器保持一致
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConversationList } from '@/services/agentConfig';
import { apiRepoRecentlyAccessedPages, apiRepoSearch } from '@/services/repo';
import {
  apiConnectorProviderPageList,
  apiSystemConnectorProviderList,
} from '@/services/systemManage';
import { apiUserProjectTabPageQuery } from '@/services/userProjectApp';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type {
  RepoPageSearchItem,
  RepoPortalPageInfo,
} from '@/types/interfaces/repo';
import type { RequestResponse } from '@/types/interfaces/request';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import { formatModifiedTime } from '../NewHomeSection/utils';

/** 搜索分类 tab key */
export type SearchTab =
  | 'task'
  | 'project'
  | 'expert'
  | 'skill'
  | 'connector'
  | 'repo';

/** 弹窗自渲染行的分类（技能/专家 tab 由对应列表组件自渲染，不在其中） */
export type SearchRowKind = Exclude<SearchTab, 'skill' | 'expert'>;

/** 双源分类（专家/技能/连接器）的来源标记 */
export type SearchItemSource = 'official' | 'team';

/** 统一搜索结果条目（kind 决定行渲染与点击分发） */
export interface SearchResultItem {
  kind: SearchRowKind;
  /** 行唯一 key（渲染 + 键盘导航） */
  id: string;
  /** 主标题 */
  name: string;
  /** 次要说明（专家/技能/连接器描述、资料库命中摘要） */
  description?: string;
  /** 图标 URL（可能为 /api/f/ 受保护地址，展示走 useAuthProtectedImageSrc） */
  icon?: string;
  /** 右侧 meta 文本（任务/项目=更新时间，资料库=编辑时间） */
  meta?: string;
  /** 来源标记（双源分类使用） */
  source?: SearchItemSource;
  /** 任务：会话详情（点击走 devTargetType 分发） */
  conversation?: ConversationInfo;
  /** 项目：项目下最新一条会话（无则置灰不可点） */
  projectConversation?: ConversationInfo;
  /** 资料库：文档短链标识（深链 /repo/doc/{slugId} 用） */
  slugId?: string;
}

/** 分类拉取入参（keyword 空串 = 无关键词的列表第一页） */
export interface SearchFetchParams {
  keyword: string;
  limit: number;
  /** 当前团队空间 ID（项目与各分类空间源依赖；缺省跳过空间源） */
  spaceId?: number;
}

/** 单源失败不拖垮整 tab（双源并发合并用） */
const safe = async <T>(task: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await task;
  } catch {
    return fallback;
  }
};

/** 响应信封解包（code 非成功返回 null） */
const unwrap = <T>(res: RequestResponse<T> | null): T | null =>
  res?.code === SUCCESS_CODE ? res.data : null;

/** 剥离搜索摘要里的高亮标签等 HTML 片段（行内纯文本展示） */
export const stripHtml = (input?: string): string | undefined =>
  input?.replace(/<[^>]*>/g, '').trim() || undefined;

/** 关键字本地过滤（名称/描述包含，大小写不敏感；与专家技能页内存过滤同口径） */
export const matchKeyword = (
  keyword: string,
  ...fields: Array<string | undefined>
): boolean => {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return true;
  return fields.some((field) => field?.toLowerCase().includes(kw));
};

/* ---------------- 各分类行映射（导出供单测） ---------------- */

export const mapConversationItem = (
  item: ConversationInfo,
): SearchResultItem => ({
  kind: 'task',
  id: `task-${item.id}`,
  name: item.topic || '--',
  meta: formatModifiedTime(item.modified),
  conversation: item,
});

export const mapProjectItem = (item: UserProjectTabItem): SearchResultItem => {
  // 项目绑定的最新会话优先按 conversationId 匹配，列表未回读时退首条
  const latest = item.conversations?.find(
    (conv) => String(conv.id) === String(item.conversationId),
  );
  return {
    kind: 'project',
    id: `project-${item.projectId}`,
    name: item.name,
    description: item.description || undefined,
    icon: item.icon || undefined,
    meta: formatModifiedTime(item.modified),
    projectConversation: latest ?? item.conversations?.[0],
  };
};

export const mapConnectorItem = (
  item: ConnectorProviderInfo,
  source: SearchItemSource,
  idPrefix: string,
): SearchResultItem => ({
  kind: 'connector',
  id: `connector-${idPrefix}-${item.service || item.id}`,
  name: item.displayName || item.service,
  description: item.description || undefined,
  icon: item.icon || undefined,
  source,
});

export const mapRepoSearchItem = (
  item: RepoPageSearchItem,
): SearchResultItem => ({
  kind: 'repo',
  id: `repo-search-${item.slugId ?? item.pageId}`,
  name: item.title || '--',
  description: stripHtml(item.snippet),
  meta: formatModifiedTime(item.editedAt),
  slugId: item.slugId,
});

export const mapRepoRecentItem = (
  item: RepoPortalPageInfo,
): SearchResultItem => ({
  kind: 'repo',
  id: `repo-recent-${item.slugId}`,
  name: item.title || '--',
  meta: formatModifiedTime(item.time),
  slugId: item.slugId,
});

/* ---------------- 各分类取数（导出供单测） ---------------- */

/** 任务「最近访问」：最近 limit 条会话 */
export async function fetchRecentTasks(
  limit: number,
): Promise<SearchResultItem[]> {
  const data = unwrap(
    await apiAgentConversationList({ agentId: null, lastId: null, limit }),
  );
  return (data ?? []).map(mapConversationItem);
}

export async function fetchTaskList({
  keyword,
  limit,
}: SearchFetchParams): Promise<SearchResultItem[]> {
  const data = unwrap(
    await apiAgentConversationList({
      agentId: null,
      lastId: null,
      limit,
      topic: keyword || undefined,
    }),
  );
  return (data ?? []).map(mapConversationItem);
}

export async function fetchProjectList({
  keyword,
  limit,
  spaceId,
}: SearchFetchParams): Promise<SearchResultItem[]> {
  // name 模糊匹配为契约先行（类型已声明，侧栏此前未传过），后端未生效时以列表兜底
  const res = await apiUserProjectTabPageQuery({
    queryFilter: { spaceId, name: keyword || undefined },
    current: 1,
    pageSize: limit,
    orders: [],
    filters: [],
    columns: [],
  });
  return unwrap(res)?.records?.map(mapProjectItem) ?? [];
}

/** 连接器：系统连接器（全量本地过滤）+ 空间连接器（keyword 服务端搜）双源合并 */
export async function fetchConnectorList({
  keyword,
  limit,
  spaceId,
}: SearchFetchParams): Promise<SearchResultItem[]> {
  const [systemRes, teamRes] = await Promise.all([
    safe(apiSystemConnectorProviderList(), null),
    spaceId
      ? safe(
          apiConnectorProviderPageList({
            spaceId,
            pageNum: 1,
            pageSize: limit,
            // 与空间连接器页保持一致的空间维度查询参数
            scope: 'space',
            status: 'all',
            connected: 'all',
            keyword: keyword || undefined,
          }),
          null,
        )
      : null,
  ]);
  const systemItems = (unwrap(systemRes) ?? [])
    .filter((item) =>
      matchKeyword(keyword, item.displayName, item.service, item.description),
    )
    .slice(0, limit)
    .map((item) => mapConnectorItem(item, 'official', 'system'));
  const teamItems = (teamRes ? unwrap(teamRes)?.records : [])?.map((item) =>
    mapConnectorItem(item, 'team', 'space'),
  );
  return [...systemItems, ...(teamItems ?? [])];
}

/** 资料库搜索：ES 关键字搜（不传 spaceId 跨全部空间） */
export async function fetchRepoList({
  keyword,
  limit,
}: SearchFetchParams): Promise<SearchResultItem[]> {
  const data = unwrap(await apiRepoSearch({ keyword, from: 0, size: limit }));
  return (data ?? []).map(mapRepoSearchItem);
}

/** 资料库「最近访问」 */
export async function fetchRecentRepos(
  limit: number,
): Promise<SearchResultItem[]> {
  const data = unwrap(
    await apiRepoRecentlyAccessedPages({ from: 0, size: limit }),
  );
  // 无 slugId 的行无法深链，直接过滤
  return (data ?? []).filter((item) => item.slugId).map(mapRepoRecentItem);
}

/** 分类 → 取数器（组件层统一调度；技能 tab 由 SkillListView 自取不在其中） */
export const SEARCH_FETCHERS: Record<
  SearchRowKind,
  (params: SearchFetchParams) => Promise<SearchResultItem[]>
> = {
  task: fetchTaskList,
  project: fetchProjectList,
  connector: fetchConnectorList,
  repo: fetchRepoList,
};
