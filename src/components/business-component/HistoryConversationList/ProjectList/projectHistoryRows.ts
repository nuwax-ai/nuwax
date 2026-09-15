import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';

/**
 * 历史会话页「项目」tab 的行过滤 / 分页追拉纯函数（口径与任务 tab 一致）：
 * - 全部：隐藏归档项目，置顶项目稳定排前
 * - 已收藏：服务端 collectedFilter=only + archivedFilter=all（收藏跨归档，
 *   与任务 tab 同口径），回包打标再滤一遍兜底
 * - 已归档：服务端 archivedFilter=only 已过滤（2026-09-15 testagent 实测
 *   后端支持本参数，且不传时默认剔除归档行），回包打标再滤一遍兜底
 */
export type ProjectViewMode = 'all' | 'collected' | 'archived';

/** 三视图的项目行过滤 + 全部视图置顶排前 */
export function filterProjectRows(
  projects: UserProjectTabItem[],
  viewMode: ProjectViewMode,
): UserProjectTabItem[] {
  if (viewMode === 'archived') {
    return projects.filter((project) => project.archived === true);
  }
  if (viewMode === 'collected') {
    return projects.filter((project) => project.collected === true);
  }
  const nonArchived = projects.filter((project) => project.archived !== true);
  return [...nonArchived].sort(
    (a, b) => Number(b.pinned === true) - Number(a.pinned === true),
  );
}

/**
 * 项目组内子会话过滤：全部/已收藏视图隐藏归档会话；
 * 已归档视图整组展示（归档的项目不再对其会话二次过滤）。
 */
export function filterProjectConversations(
  conversations: ConversationInfo[] | undefined,
  viewMode: ProjectViewMode,
): ConversationInfo[] {
  const list = conversations ?? [];
  if (viewMode === 'archived') {
    return list;
  }
  return list.filter((conversation) => conversation.archived !== true);
}

/**
 * 页码分页是否还有下一页：优先后端 pages 回读；
 * 未回读时退「满页视为还有」（SidebarSearchModal.fetchProjectPage 同口径）。
 */
export function computeHasMore(
  fetchedPage: number,
  totalPages: number | undefined,
  lastRecordCount: number,
  requestedSize: number,
): boolean {
  if (typeof totalPages === 'number' && totalPages > 0) {
    return fetchedPage < totalPages;
  }
  return lastRecordCount >= requestedSize;
}

/**
 * 前端过滤后可见行数不足最小展示量时是否继续追拉下一页
 * （已归档视图后端无过滤参数，归档项目稀疏时单页可能全部滤掉）。
 */
export function needsChase(
  visibleCount: number,
  minVisible: number,
  fetchedPage: number,
  totalPages: number | undefined,
  lastRecordCount: number,
  requestedSize: number,
): boolean {
  if (visibleCount >= minVisible) {
    return false;
  }
  return computeHasMore(
    fetchedPage,
    totalPages,
    lastRecordCount,
    requestedSize,
  );
}

/** 追加拉取页按 projectId 去重（后端页间偶发重复行，同 id 保留先到） */
export function appendProjectRowsDedup(
  base: UserProjectTabItem[],
  incoming: UserProjectTabItem[],
): UserProjectTabItem[] {
  const seen = new Set(base.map((project) => project.projectId));
  return [
    ...base,
    ...incoming.filter((project) => !seen.has(project.projectId)),
  ];
}
