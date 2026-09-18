/**
 * 项目子会话「切回核对」探针（2026-09-18 定调：页签切回只允许当前打开页面
 * 自身需要的接口，侧栏不再无差别全量补刷）。
 *
 * 原理：agent/conversation/list 的 projectFilter:'only' 一次拉回全部项目会话
 * （回包行不带 projectId 字段，不能直接当子行数据源），与面板已加载的子会话按
 * id 做指纹比对（taskStatus + modified），把「要不要逐项目重拉」收敛成三种结论：
 * - 无任何差异 → 一个子会话请求都不发（常态切回零请求）；
 * - 少数项目有差异 → 只重拉这些项目；
 * - 比对不可靠（回包满页可能截断 / 出现无法归属的新会话）→ 全量兜底（等价旧行为）。
 *
 * 真实数据校准的三个语义（2026-09-18 testagent 实测）：
 * 1. 探针行带 devTargetType/devTargetId 项目归属——不在面板加载范围（第 2 页/
 *    归档项目）的行直接忽略；归属命中已加载项目的行=该项目新增会话，只重拉该项目。
 *    归属必须按「类型+id」复合键比对（projectId 跨项目类型撞车，见 projectKeyOf）。
 * 2. 「已加载会话从探针中消失」不作为差异信号：children 接口与 list 接口的
 *    universe 结构性不一致（实测项目 29：children 回 7 条、list 只回 2 条），
 *    该信号永远误报；删除/归档的收敛交由导航/重挂载路径。
 * 3. 重叠会话的 taskStatus/modified 两接口完全一致——指纹比对口径可靠。
 *
 * 纯函数模块：只依赖 types/enums 与领域纯函数，不 import services/eventBus
 * （vitest 禁 umi 传递依赖，保证本模块可裸测）。
 */
import { isTerminalTaskStatus } from '@/features/conversation/domain/taskStatus';
import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { ProjectItem } from './index';
import { projectKeyOf } from './projectPagination';

/** 探针单页上限：满页视为可能截断，比对结果不可靠 */
export const CHILDREN_PROBE_LIMIT = 100;

/** 已加载 EXECUTING、探针已终态的会话（调用方 emit 终态补丁→本地翻新+未读蓝点） */
export interface ChildrenProbeTransition {
  conversationId: number | string;
  taskStatus: TaskStatus;
}

export interface ChildrenProbeResult {
  /** 子会话有差异（状态/时间变化，或归属命中该项目的新会话）需重拉的项目复合键 */
  changedProjectKeys: Set<string>;
  /** EXECUTING→终态跃迁清单 */
  finishedTransitions: ChildrenProbeTransition[];
  /** 出现无法归属且全部项目已加载的新会话：调用方应全量兜底 */
  hasUnknownConversation: boolean;
  /** 回包满页（可能截断）：比对不可靠，调用方应全量兜底 */
  truncated: boolean;
}

/** 探针行 → 归属项目（按「类型+id」复合键；devTarget 缺失返回 undefined） */
function findOwningProject(
  projects: ProjectItem[],
  row: ConversationInfo,
): ProjectItem | undefined {
  if (row.devTargetType === undefined || row.devTargetId === undefined) {
    return undefined;
  }
  return projects.find(
    (project) =>
      project.projectType === row.devTargetType &&
      String(project.id) === String(row.devTargetId),
  );
}

export function diffChildrenProbe(
  projects: ProjectItem[],
  probeRows: ConversationInfo[],
): ChildrenProbeResult {
  const probeById = new Map(probeRows.map((row) => [String(row.id), row]));
  const loadedIds = new Set<string>();
  const changedProjectKeys = new Set<string>();
  const finishedTransitions: ChildrenProbeTransition[] = [];
  let hasUnloadedChildren = false;

  for (const project of projects) {
    if (!project.children) {
      // 未加载（归档项目子会话永不加载/新项目在途）不参与比对，其会话行
      // 也不参与「无法归属」判定，否则归档项目会恒触发全量兜底
      hasUnloadedChildren = true;
      continue;
    }
    for (const child of project.children) {
      const id = String(child.id);
      loadedIds.add(id);
      const row = probeById.get(id);
      // 探针中不存在：两接口 universe 结构性不一致，忽略（见头注释 2）
      if (!row) continue;
      if (row.taskStatus !== child.taskStatus) {
        if (
          child.taskStatus === TaskStatus.EXECUTING &&
          isTerminalTaskStatus(row.taskStatus)
        ) {
          finishedTransitions.push({
            conversationId: child.id,
            taskStatus: row.taskStatus,
          });
        }
        changedProjectKeys.add(projectKeyOf(project));
      }
      if (row.modified !== child.modified) {
        changedProjectKeys.add(projectKeyOf(project));
      }
    }
  }

  // 面板范围外的探针行：按 devTarget 归属分流
  let hasUnknownConversation = false;
  for (const row of probeRows) {
    if (loadedIds.has(String(row.id))) continue;
    if (row.devTargetType !== undefined && row.devTargetId !== undefined) {
      const owner = findOwningProject(projects, row);
      // 归属命中已加载项目 = 该项目新增会话，重拉该项目；
      // 归属命中未加载 children 的项目（在途/归档）由懒加载 effect 收敛；
      // 归属在面板范围外（第 2 页/归档项目）忽略——不属于本面板 universe
      if (owner?.children) changedProjectKeys.add(projectKeyOf(owner));
      continue;
    }
    // 无 devTarget 归属且不在任何已加载子会话中：仅在全部项目已加载时
    // 视为真未知（走全量兜底），否则可能属于未加载项目，忽略
    if (!hasUnloadedChildren) hasUnknownConversation = true;
  }

  return {
    changedProjectKeys,
    finishedTransitions,
    hasUnknownConversation,
    truncated: probeRows.length >= CHILDREN_PROBE_LIMIT,
  };
}
