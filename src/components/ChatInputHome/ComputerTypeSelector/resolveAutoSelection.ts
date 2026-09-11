import type { ComputerOption } from './types';

/**
 * 自动选择决策结果
 */
export interface AutoSelectionDecision {
  /** 决策出的目标选中项；null 表示保持当前值不动 */
  selectedId: string | null;
  /**
   * 决策命中原因：memory=按智能体记忆顶替 / keep-current=保持当前有效选择 /
   * fallback-first=当前值无效回落列表第一项 / none=无候选
   */
  reason: 'memory' | 'keep-current' | 'fallback-first' | 'none';
}

interface ResolveParams {
  /**
   * 严格模式（首页场景）：切换智能体时当前有效选择不再被清空/回落——
   * 仅当新智能体存在「在当前列表内」的记忆时顶替（保留按智能体记忆的产品设计，
   * 列表外的脏记忆如 cloudOnly 过滤残留、已下线电脑不顶替）；无有效记忆时保持当前值。
   * 关闭（默认 legacy）：保持既有行为——记忆无条件顶替（含不在列表内的值）。
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
 * legacy 分支与既有 effect 行为逐句等价；strict 分支修复首页切换智能体时
 * 沙箱被清空的问题（切换过程只允许「记忆顶替」或「保持」，不允许任意回落）。
 */
export function resolveAutoSelection({
  strictAgentMemory = false,
  agentId,
  value,
  computerList,
  agentSelectedMap,
}: ResolveParams): AutoSelectionDecision {
  const isValueValid = isInList(computerList, value);
  const savedSelection = agentId
    ? agentSelectedMap?.[String(agentId)]
    : undefined;

  if (strictAgentMemory) {
    if (isInList(computerList, savedSelection)) {
      return { selectedId: savedSelection!, reason: 'memory' };
    }
    if (isValueValid) {
      return { selectedId: null, reason: 'keep-current' };
    }
    if (computerList.length === 0) {
      return { selectedId: null, reason: 'none' };
    }
    return { selectedId: computerList[0].id, reason: 'fallback-first' };
  }

  // legacy：与既有 effect 行为一致（记忆无条件顶替，不校验是否在列表内）
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
