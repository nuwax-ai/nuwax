import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import type { ProjectChildItem, ProjectItem } from './index';

/** 项目列表分页大小（tab 接口 current/pageSize/total 契约，首页 20 条 + 查看更多追加） */
export const PROJECT_PAGE_SIZE = 20;

/**
 * tab 接口记录行 → 面板项目项。
 * fallbackConversationName 为子项空主题兜底文案（调用方传 dict 结果，保持本模块纯函数可测）。
 */
export function toProjectItem(
  record: UserProjectTabItem,
  fallbackConversationName: string,
): ProjectItem {
  return {
    id: record.projectId,
    name: record.name,
    projectType: record.projectType,
    spaceId: record.spaceId,
    icon: record.icon,
    sandboxId: record.sandboxId,
    devAgentId: record.devAgentId,
    children: (record.conversations ?? []).map(
      (conversation): ProjectChildItem => ({
        id: conversation.id,
        // 空主题回退与任务列表 ConversationItem 同口径
        name:
          conversation.topic ||
          conversation.agent?.name ||
          fallbackConversationName,
        modified: conversation.modified,
        taskStatus: conversation.taskStatus,
        conversation,
      }),
    ),
  };
}

/** 追加一页项目：按 id 去重合并（保持既有顺序，新项排后），翻页重复回包时幂等 */
export function appendProjectsPage(
  previous: ProjectItem[],
  incoming: ProjectItem[],
): ProjectItem[] {
  const seen = new Set(previous.map((item) => item.id));
  const merged = [...previous];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

/** 置顶/归档标记增量合并：追加页只并入新标记，不回退已加载页的标记 */
export function mergeFlagIds(
  previous: Set<number>,
  incoming: Set<number>,
): Set<number> {
  return new Set([...previous, ...incoming]);
}

/** 是否还有未加载页（total 为 0 或已全部加载时为 false） */
export function hasMoreProjects(loadedCount: number, total: number): boolean {
  return total > 0 && loadedCount < total;
}

/** 剩余未加载数（total 缺失或超发时钳为 0） */
export function remainingProjects(loadedCount: number, total: number): number {
  return Math.max(0, total - loadedCount);
}

/**
 * 按路由会话 id 反查所属项目 id（未命中返回 null）。
 * 会话条目（ConversationInfo）不带项目归属字段，只能基于已加载的项目数据反查；
 * 调用方传可见列表（visibleProjects），归档项目天然不命中。
 */
export function findProjectIdByConversation(
  projects: ProjectItem[],
  conversationId?: string,
): number | null {
  if (!conversationId) return null;
  const found = projects.find((project) =>
    (project.children ?? []).some(
      (child) => String(child.id) === conversationId,
    ),
  );
  return found?.id ?? null;
}
