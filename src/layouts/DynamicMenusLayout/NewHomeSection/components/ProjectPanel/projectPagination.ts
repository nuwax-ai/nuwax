import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import type { ProjectChildItem, ProjectItem } from './index';

/**
 * 项目列表分页大小（统一接口 current/pageSize/total 契约，首页 20 条 + 查看更多追加）
 */
export const PROJECT_PAGE_SIZE = 20;

/**
 * 项目唯一键：`${projectType}:${projectId}`。
 * 后端 user-project 列表合并常规项目/全栈应用两套编号，projectId 数字会跨类型撞车
 * （2026-09-17 实测：UserApp 94 与 NormalProject 94 同列表共存），所有身份判断
 * （React key、置顶/归档/收藏/折叠标记、改名删除定位）必须走复合键。
 */
export function projectKeyOf(project: {
  id: number | string;
  projectType?: string;
}): string {
  return `${project.projectType ?? AgentComponentTypeEnum.NormalProject}:${
    project.id
  }`;
}

/**
 * 会话列表 → 面板子项。undefined 透传（未加载）与空数组（已加载无会话）
 * 是两种状态，懒加载以 children === undefined 判断是否补拉。
 * fallbackConversationName 为子项空主题兜底文案（调用方传 dict 结果，保持本模块纯函数可测）。
 */
export function toProjectChildren(
  conversations: ConversationInfo[] | undefined,
  fallbackConversationName: string,
): ProjectChildItem[] | undefined {
  return conversations?.map(
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
  );
}

/**
 * 列表记录行 → 面板项目项。统一接口不回 conversations（tab 接口已下线），
 * children 初始 undefined，由组件层懒加载 apiUserProjectConversations 补齐。
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
    owner: record.owner,
    children: toProjectChildren(record.conversations, fallbackConversationName),
  };
}

/** 追加一页项目：按复合键去重合并（保持既有顺序，新项排后），翻页重复回包时幂等。
 *  勿退回裸 id 去重——projectId 跨项目类型会撞车（见 projectKeyOf 注释）。 */
export function appendProjectsPage(
  previous: ProjectItem[],
  incoming: ProjectItem[],
): ProjectItem[] {
  const seen = new Set(previous.map((item) => projectKeyOf(item)));
  const merged = [...previous];
  for (const item of incoming) {
    const key = projectKeyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

/** 置顶/归档标记增量合并：追加页只并入新标记，不回退已加载页的标记
 *  （集合存复合键，见 projectKeyOf） */
export function mergeFlagIds(
  previous: Set<string>,
  incoming: Set<string>,
): Set<string> {
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
 * 按路由会话 id 反查所属项目复合键（未命中返回 null）。
 * 会话条目（ConversationInfo）不带项目归属字段，只能基于已加载的项目数据反查；
 * 调用方传可见列表（visibleProjects），归档项目天然不命中。
 * 返回复合键（projectKeyOf）：projectId 跨类型撞车，裸 id 无法唯一定位项目。
 */
export function findProjectKeyByConversation(
  projects: ProjectItem[],
  conversationId?: string,
): string | null {
  if (!conversationId) return null;
  const found = projects.find((project) =>
    (project.children ?? []).some(
      (child) => String(child.id) === conversationId,
    ),
  );
  return found ? projectKeyOf(found) : null;
}
