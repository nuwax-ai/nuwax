/**
 * V2 渲染偏好 · 预设与逐类覆盖解析（spec「Rendering and Configuration」）。
 *
 * 三档预设（默认 balanced）：
 * | 节点类型                      | focused | balanced | detailed        |
 * | 思考、上下文、中间说明         | 隐藏    | 摘要     | 已完成节点展开   |
 * | 工具、子智能体                | 摘要    | 摘要     | 摘要             |
 * | 计划、已完成交互、未知节点     | 摘要    | 摘要     | 摘要             |
 *
 * 高级设置可把任一类型改为 hidden/summary/expanded；失败节点即使配置隐藏
 * 也至少恢复为错误摘要；隐藏节点不占轨迹行，由「另有 N 项已隐藏」入口恢复。
 */
import type {
  ConversationProcessNode,
  ConversationProcessNodeKind,
  ConversationRenderPreferencesV2,
  ConversationRendererPreset,
  ConversationTurnPresentationV2,
  NodePresentationMode,
} from './types';

export const DEFAULT_V2_PRESET: ConversationRendererPreset = 'balanced';

export const PROCESS_NODE_KINDS: ConversationProcessNodeKind[] = [
  'reasoning',
  'context',
  'narration',
  'tool',
  'subagent',
  'plan',
  'completed-interaction',
  'unknown',
];

export const PRESET_NODE_MODES: Record<
  ConversationRendererPreset,
  Record<ConversationProcessNodeKind, NodePresentationMode>
> = {
  focused: {
    reasoning: 'hidden',
    context: 'hidden',
    narration: 'hidden',
    tool: 'summary',
    subagent: 'summary',
    plan: 'summary',
    'completed-interaction': 'summary',
    unknown: 'summary',
  },
  balanced: {
    reasoning: 'summary',
    context: 'summary',
    narration: 'summary',
    tool: 'summary',
    subagent: 'summary',
    plan: 'summary',
    'completed-interaction': 'summary',
    unknown: 'summary',
  },
  detailed: {
    reasoning: 'expanded',
    context: 'expanded',
    narration: 'expanded',
    tool: 'summary',
    subagent: 'summary',
    plan: 'summary',
    'completed-interaction': 'summary',
    unknown: 'summary',
  },
};

export const isRendererPreset = (
  value: unknown,
): value is ConversationRendererPreset =>
  value === 'focused' || value === 'balanced' || value === 'detailed';

export const isNodePresentationMode = (
  value: unknown,
): value is NodePresentationMode =>
  value === 'hidden' || value === 'summary' || value === 'expanded';

/**
 * 解析单节点有效档位：高级覆盖 > 预设表 > summary。
 * 失败节点配置 hidden 时至少恢复为错误摘要（可追溯性下限）。
 */
export function resolveNodeMode(
  node: Pick<ConversationProcessNode, 'kind' | 'failed'>,
  preferences: ConversationRenderPreferencesV2,
): NodePresentationMode {
  const presetModes =
    PRESET_NODE_MODES[preferences.preset] ?? PRESET_NODE_MODES.balanced;
  const overridden = preferences.nodeOverrides?.[node.kind];
  const mode = overridden ?? presetModes[node.kind] ?? 'summary';
  if (mode === 'hidden' && node.failed) {
    return 'summary';
  }
  return mode;
}

export interface TurnNodeVisibility {
  /** 按原序保留的可见节点（mode !== hidden） */
  visibleNodes: ConversationProcessNode[];
  /** 被隐藏的节点数（供「另有 N 项已隐藏」入口） */
  hiddenCount: number;
}

export function splitNodesByVisibility(
  nodes: ConversationProcessNode[],
  preferences: ConversationRenderPreferencesV2,
): TurnNodeVisibility {
  const visibleNodes: ConversationProcessNode[] = [];
  let hiddenCount = 0;
  nodes.forEach((node) => {
    if (resolveNodeMode(node, preferences) === 'hidden') {
      hiddenCount += 1;
      return;
    }
    visibleNodes.push(node);
  });
  return { visibleNodes, hiddenCount };
}

/**
 * 外层轨迹默认展开态：运行轮恒展开；终态 focused/balanced 收起、detailed 展开。
 * 用户手动操作后由渲染层固定，本函数只提供「未手动干预时」的默认值。
 */
export function defaultTraceExpanded(
  turn: Pick<ConversationTurnPresentationV2, 'running'>,
  preset: ConversationRendererPreset,
): boolean {
  if (turn.running) return true;
  return preset === 'detailed';
}
