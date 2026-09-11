import type { ComputerOption } from './types';

/** 云电脑哨兵值（平台默认沙箱） */
const CLOUD_SANDBOX_ID = '-1';

/**
 * 自动选择决策结果
 */
export interface AutoSelectionDecision {
  /** 决策出的目标选中项；null 表示保持当前值不动 */
  selectedId: string | null;
  /**
   * 决策命中原因：memory=该智能体的后端记忆 / default-cloud=未绑定过回落云端默认 /
   * fallback-first=列表无云端项时回落列表第一项 / none=无候选
   */
  reason: 'memory' | 'default-cloud' | 'fallback-first' | 'none';
}

interface ResolveParams {
  /**
   * 严格模式（首页场景）：沙箱选择按 agent 绑定——切到某 agent 即解析「该 agent 自己」
   * 的记忆（后端 agentSelected），未绑定过则回落云端默认；不继承上一个 agent 的选择。
   * 关闭（默认 legacy）：保持既有行为——记忆无条件顶替、当前值无效回落列表第一项。
   */
  strictAgentMemory?: boolean;
  agentId?: number;
  value?: string;
  computerList: ComputerOption[];
  agentSelectedMap?: Record<string, string>;
}

const isInList = (computerList: ComputerOption[], id?: string) =>
  !!id && computerList.some((opt) => String(opt.id) === String(id));

/**
 * 电脑自动选择决策（纯函数）
 * legacy 分支与既有 effect 行为逐句等价；strict 分支实现「沙箱按 agent 绑定」：
 * 每个 agent 显示自己的绑定选择，互不继承。
 */
export function resolveAutoSelection({
  strictAgentMemory = false,
  agentId,
  value,
  computerList,
  agentSelectedMap,
}: ResolveParams): AutoSelectionDecision {
  const savedSelection = agentId
    ? agentSelectedMap?.[String(agentId)]
    : undefined;

  if (strictAgentMemory) {
    // 该 agent 的绑定记忆（须在当前列表内，cloudOnly 过滤/已下线电脑的脏记忆不采用）
    if (isInList(computerList, savedSelection)) {
      return { selectedId: savedSelection!, reason: 'memory' };
    }
    // 未绑定过（或记忆失效）：回落云端默认
    if (isInList(computerList, CLOUD_SANDBOX_ID)) {
      return { selectedId: CLOUD_SANDBOX_ID, reason: 'default-cloud' };
    }
    // 异常列表（无云端项）：回落列表第一项
    if (computerList.length > 0) {
      return { selectedId: computerList[0].id, reason: 'fallback-first' };
    }
    return { selectedId: null, reason: 'none' };
  }

  // legacy：与既有 effect 行为一致（记忆无条件顶替，不校验是否在列表内）
  const isValueValid = isInList(computerList, value);
  let selectedId: string | null = null;
  let reason: AutoSelectionDecision['reason'] = 'none';
  if (savedSelection) {
    selectedId = savedSelection;
    reason = 'memory';
  }
  if (!selectedId && !isValueValid && computerList.length > 0) {
    selectedId = computerList[0].id;
    reason = 'fallback-first';
  }
  return { selectedId, reason };
}
