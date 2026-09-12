/**
 * 搜索弹窗分类数据适配层
 * @description 六个分类 tab 的列表/搜索/最近访问数据源：
 * - 任务/项目/资料库为弹窗自渲染行，统一走分页取数（SearchPageResult）：
 *   任务=lastId 会话游标、项目=页码、资料库=from 偏移（均触底续拉）
 * - 技能/专家/连接器 tab 由 SkillListView/ExpertListView/ConnectorListView
 *   搜索场景自取（数据/分页/付费拦截/连接流程组件内闭环）
 * - 各接口取值口径与 ExpertSkillConnector 页面适配器保持一致
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConversationList } from '@/services/agentConfig';
import { apiRepoRecentlyAccessedPages, apiRepoSearch } from '@/services/repo';
import { apiUserProjectTabPageQuery } from '@/services/userProjectApp';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type {
  RepoPageSearchItem,
  RepoPortalPageInfo,
} from '@/types/interfaces/repo';
import type { RequestResponse } from '@/types/interfaces/request';
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

/** 弹窗自渲染行的分类（技能/专家/连接器 tab 由对应列表组件自渲染，不在其中） */
export type SearchRowKind = Exclude<SearchTab, 'skill' | 'expert' | 'connector'>;

/** 统一搜索结果条目（kind 决定行渲染与点击分发） */
export interface SearchResultItem {
  kind: SearchRowKind;
  /** 行唯一 key（渲染 + 键盘导航） */
  id: string;
  /** 主标题 */
  name: string;
  /** 次要说明（资料库命中摘要） */
  description?: string;
  /** 图标 URL（可能为 /api/f/ 受保护地址，展示走 useAuthProtectedImageSrc） */
  icon?: string;
  /** 右侧 meta 文本（任务/项目=更新时间，资料库=编辑时间） */
  meta?: string;
  /** 任务：会话详情（点击走 devTargetType 分发） */
  conversation?: ConversationInfo;
  /** 项目：项目下最新一条会话（无则置灰不可点） */
  projectConversation?: ConversationInfo;
  /** 资料库：文档短链标识（深链 /repo/doc/{slugId} 用） */
  slugId?: string;
}

/** 分页游标：任务=会话 id，项目=页码，资料库=偏移量 */
export interface SearchPageCursor {
  /** 任务：最后一条会话 ID（conversation/list 的 lastId 游标） */
  lastId?: number;
  /** 项目：下一页页码（从 1 开始） */
  page?: number;
  /** 资料库：下一页偏移量 */
  from?: number;
}

/** 分页拉取结果 */
export interface SearchPageResult {
  items: SearchResultItem[];
  /** 是否还有下一页 */
  hasMore: boolean;
  /** 下一页游标（触底加载时透传回取数器） */
  cursor: SearchPageCursor;
}

/** 分页取数入参（keyword 空串 = 无关键词首屏：任务/资料库即「最近」数据） */
export interface SearchPageParams {
  keyword: string;
  /** 每页数量 */
  size: number;
  /** 分页游标（首页传空对象） */
  cursor: SearchPageCursor;
  /** 当前团队空间 ID（项目/空间维度依赖；缺省跳过空间源） */
  spaceId?: number;
}

/** 响应信封解包（code 非成功返回 null） */
const unwrap = <T>(res: RequestResponse<T> | null): T | null =>
  res?.code === SUCCESS_CODE ? res.data : null;

/** 剥离搜索摘要里的高亮标签等 HTML 片段（行内纯文本展示） */
export const stripHtml = (input?: string): string | undefined =>
  input?.replace(/<[^>]*>/g, '').trim() || undefined;

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

/* ---------------- 各分类分页取数（导出供单测） ---------------- */

/** 任务：conversation/list 的 lastId 游标分页（无关键词首屏即「最近」数据） */
export async function fetchTaskPage({
  keyword,
  size,
  cursor,
}: SearchPageParams): Promise<SearchPageResult> {
  const data = unwrap(
    await apiAgentConversationList({
      agentId: null,
      lastId: cursor.lastId ?? null,
      limit: size,
      topic: keyword || undefined,
    }),
  );
  const items = (data ?? []).map(mapConversationItem);
  return {
    items,
    hasMore: items.length >= size,
    cursor: { lastId: items[items.length - 1]?.conversation?.id },
  };
}

/** 项目：tab/page-query 页码分页（name 模糊匹配契约已实证生效） */
export async function fetchProjectPage({
  keyword,
  size,
  cursor,
  spaceId,
}: SearchPageParams): Promise<SearchPageResult> {
  const current = cursor.page ?? 1;
  const res = await apiUserProjectTabPageQuery({
    queryFilter: { spaceId, name: keyword || undefined },
    current,
    pageSize: size,
    orders: [],
    filters: [],
    columns: [],
  });
  const page = unwrap(res);
  const items = page?.records?.map(mapProjectItem) ?? [];
  return {
    items,
    // 后端回读 pages 用页码判定；未回读时退「满页视为还有」
    hasMore: page?.pages ? current < page.pages : items.length >= size,
    cursor: { page: current + 1 },
  };
}

/** 资料库：无关键词 = 门户「最近访问」，有关键词 = ES 全库搜索（from 偏移分页） */
export async function fetchRepoPage({
  keyword,
  size,
  cursor,
}: SearchPageParams): Promise<SearchPageResult> {
  const from = cursor.from ?? 0;
  if (keyword) {
    const data = unwrap(await apiRepoSearch({ keyword, from, size })) ?? [];
    return {
      items: data.map(mapRepoSearchItem),
      hasMore: data.length >= size,
      cursor: { from: from + size },
    };
  }
  const data = unwrap(await apiRepoRecentlyAccessedPages({ from, size })) ?? [];
  // 无 slugId 的行无法深链，直接过滤
  return {
    items: data.filter((item) => item.slugId).map(mapRepoRecentItem),
    hasMore: data.length >= size,
    cursor: { from: from + size },
  };
}

/**
 * 分类 → 分页取数器（组件层统一调度；技能/专家由列表组件自取不在其中）。
 * 触底加载：组件层把上一次返回的 cursor 透传回来续拉下一页并追加。
 */
export const SEARCH_FETCHERS: Record<
  SearchRowKind,
  (params: SearchPageParams) => Promise<SearchPageResult>
> = {
  task: fetchTaskPage,
  project: fetchProjectPage,
  repo: fetchRepoPage,
};
