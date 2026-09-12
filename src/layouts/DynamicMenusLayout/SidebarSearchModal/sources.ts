/**
 * 搜索弹窗分类数据适配层
 * @description 六个分类 tab 的列表/搜索/最近访问数据源，统一输出 SearchResultItem：
 * - 屏蔽服务端分页（会话/项目/广场发布项/空间连接器）与全量数组+本地过滤
 *   （空间智能体/技能、系统连接器）两种取数模式的差异
 * - 专家/技能/连接器 = 系统广场 + 团队空间双源并发合并（单源失败不拖垮整 tab），
 *   各接口取值口径与 ExpertSkillConnector 页面 useResourceList 的适配器保持一致
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiAgentConfigList,
  apiAgentConversationList,
} from '@/services/agentConfig';
import { apiSkillList } from '@/services/library';
import { apiRepoRecentlyAccessedPages, apiRepoSearch } from '@/services/repo';
import {
  apiPublishedAgentList,
  apiPublishedSkillList,
} from '@/services/square';
import {
  apiConnectorProviderPageList,
  apiSystemConnectorProviderList,
} from '@/services/systemManage';
import { apiUserProjectTabPageQuery } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { SkillInfo } from '@/types/interfaces/library';
import type {
  RepoPageSearchItem,
  RepoPortalPageInfo,
} from '@/types/interfaces/repo';
import type { RequestResponse } from '@/types/interfaces/request';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
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

/** 双源分类（专家/技能/连接器）的来源标记 */
export type SearchItemSource = 'official' | 'team';

/** 统一搜索结果条目（kind 决定行渲染与点击分发） */
export interface SearchResultItem {
  kind: SearchTab;
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
  /** 专家：智能体 ID（召唤透传用） */
  agentId?: number;
  /** 技能：技能 ID（选择透传用） */
  skillId?: number;
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

export const mapPublishedExpertItem = (
  item: SquarePublishedItemInfo,
): SearchResultItem => ({
  kind: 'expert',
  id: `expert-official-${item.id}`,
  name: item.name,
  description: item.description || undefined,
  icon: item.icon || undefined,
  source: 'official',
  // 发布项 targetId 即智能体 ID，召唤透传用（与专家页口径一致）
  agentId: item.targetId,
});

export const mapSpaceExpertItem = (
  item: AgentConfigInfo,
): SearchResultItem => ({
  kind: 'expert',
  id: `expert-team-${item.id}`,
  name: item.name,
  description: item.description || undefined,
  icon: item.icon || undefined,
  source: 'team',
  // 空间智能体 id 即智能体 ID，召唤透传用（与专家页口径一致）
  agentId: item.id,
});

export const mapPublishedSkillItem = (
  item: SquarePublishedItemInfo,
): SearchResultItem => ({
  kind: 'skill',
  id: `skill-official-${item.id}`,
  name: item.name,
  description: item.description || undefined,
  icon: item.icon || undefined,
  source: 'official',
  // 发布项 targetId 即技能 ID，选择透传用（与技能页口径一致）
  skillId: item.targetId,
});

export const mapSpaceSkillItem = (item: SkillInfo): SearchResultItem => ({
  kind: 'skill',
  id: `skill-team-${item.id}`,
  name: item.name,
  description: item.description || undefined,
  icon: item.icon || undefined,
  source: 'team',
  // 空间技能 id 即技能 ID，选择透传用（与技能页口径一致）
  skillId: item.id,
});

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

/** 专家&专家团：系统广场官方发布 + 团队空间智能体（全量本地过滤）双源合并 */
export async function fetchExpertList({
  keyword,
  limit,
  spaceId,
}: SearchFetchParams): Promise<SearchResultItem[]> {
  const [systemRes, teamRes] = await Promise.all([
    safe(
      apiPublishedAgentList({
        page: 1,
        pageSize: limit,
        category: '',
        kw: keyword || undefined,
        // 查询智能体需设置目标子类型：ChatBot 含对话型与通用型，排除网页应用
        targetType: AgentComponentTypeEnum.Agent,
        targetSubType: 'ChatBot',
        // 仅官方发布智能体
        official: true,
      }),
      null,
    ),
    spaceId ? safe(apiAgentConfigList(spaceId), null) : null,
  ]);
  const items = (unwrap(systemRes)?.records ?? []).map(mapPublishedExpertItem);
  const teamItems = (teamRes ? unwrap(teamRes) : [])
    ?.filter((item) => matchKeyword(keyword, item.name, item.description))
    .slice(0, limit)
    .map(mapSpaceExpertItem);
  return [...items, ...(teamItems ?? [])];
}

/** 技能：系统广场官方发布 + 团队空间技能（全量本地过滤）双源合并 */
export async function fetchSkillList({
  keyword,
  limit,
  spaceId,
}: SearchFetchParams): Promise<SearchResultItem[]> {
  const [systemRes, teamRes] = await Promise.all([
    safe(
      apiPublishedSkillList({
        page: 1,
        pageSize: limit,
        category: '',
        kw: keyword || undefined,
      }),
      null,
    ),
    spaceId ? safe(apiSkillList({ spaceId }), null) : null,
  ]);
  const items = (unwrap(systemRes)?.records ?? []).map(mapPublishedSkillItem);
  const teamItems = (teamRes ? unwrap(teamRes) : [])
    ?.filter((item) => matchKeyword(keyword, item.name, item.description))
    .slice(0, limit)
    .map(mapSpaceSkillItem);
  return [...items, ...(teamItems ?? [])];
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

/** 分类 → 取数器（组件层统一调度） */
export const SEARCH_FETCHERS: Record<
  SearchTab,
  (params: SearchFetchParams) => Promise<SearchResultItem[]>
> = {
  task: fetchTaskList,
  project: fetchProjectList,
  expert: fetchExpertList,
  skill: fetchSkillList,
  connector: fetchConnectorList,
  repo: fetchRepoList,
};
