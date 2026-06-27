/**
 * flowKind 节点归属与 UI 配置（单一数据源）
 *
 * 所有 flowKind 相关的节点类型分组、AgentFlow UI 行为开关、纯工具函数
 * 统一在此维护。供 NodeRegistry / ParamsV3 / 布局组件等共享 v3 代码消费。
 *
 * 注意：此处同时覆盖 Workflow 与 AgentFlow 两种模式，故置于中立位置
 *（不放在 agentFlow/ 下，避免共享代码倒依赖 AgentFlow 子目录）。
 */

import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';

// ──────────────────────────────────────────────
//  1. 节点类型 → flowKind 归属
// ──────────────────────────────────────────────

/**
 * 仅在 Workflow 模式侧边栏展示的节点类型。
 * 不在此集合中的公共节点（Start / End 等）两种模式都可见。
 */
export const WORKFLOW_ONLY_NODE_TYPES: ReadonlySet<NodeTypeEnum> = new Set([
  NodeTypeEnum.LLM,
  NodeTypeEnum.Code,
  NodeTypeEnum.Condition,
  NodeTypeEnum.Loop,
  NodeTypeEnum.LoopBreak,
  NodeTypeEnum.LoopContinue,
  NodeTypeEnum.Knowledge,
  NodeTypeEnum.KnowledgeInsert,
  NodeTypeEnum.Variable,
  NodeTypeEnum.VariableAggregation,
  NodeTypeEnum.LongTermMemory,
  NodeTypeEnum.QA,
  NodeTypeEnum.TextProcessing,
  NodeTypeEnum.DocumentExtraction,
  NodeTypeEnum.MCP,
  NodeTypeEnum.HTTPRequest,
  NodeTypeEnum.IntentRecognition,
  NodeTypeEnum.TableDataAdd,
  NodeTypeEnum.Plugin,
  NodeTypeEnum.Output,
  NodeTypeEnum.TableDataDelete,
  NodeTypeEnum.TableDataUpdate,
  NodeTypeEnum.TableDataQuery,
  NodeTypeEnum.TableSQL,
]);

/**
 * AgentFlow 专属节点类型（extensionRegistry 注册范围一致）。
 */
export const AGENT_FLOW_NODE_TYPES: ReadonlySet<NodeTypeEnum> = new Set([
  NodeTypeEnum.Agent,
  NodeTypeEnum.HumanInteraction,
  NodeTypeEnum.RouteDecision,
]);

// ──────────────────────────────────────────────
//  2. AgentFlow 属性面板映射
// ──────────────────────────────────────────────

/**
 * AgentFlow 下拥有独立属性面板的节点类型。
 * 包含 AgentFlow 专属节点 + 在 AgentFlow 下有不同表单的公共节点。
 */
export const AGENT_FLOW_PANEL_NODE_TYPES: ReadonlySet<NodeTypeEnum> = new Set([
  // AgentFlow 专属
  NodeTypeEnum.Agent,
  NodeTypeEnum.HumanInteraction,
  NodeTypeEnum.RouteDecision,
  // 公共节点在 AgentFlow 下有独立表单
  NodeTypeEnum.Start,
  NodeTypeEnum.End,
  NodeTypeEnum.Output,
  NodeTypeEnum.Workflow,
]);

// ──────────────────────────────────────────────
//  3. AgentFlow UI 开关配置
// ──────────────────────────────────────────────

/**
 * AgentFlow 模式下的 UI 行为差异。
 * 组件层不再各自 `isAgentFlow && ...`，统一读取此配置。
 */
export const AGENTFLOW_UI_CONFIG = {
  /** AgentFlow 嵌入 EditAgent 时隐藏自带 Header */
  headerHidden: true,
  /** AgentFlow 不展示调试 / 试运行按钮 */
  debugHidden: true,
  /** AgentFlow 新增节点后不自动聚焦属性面板 */
  focusNewNode: false,
  /** AgentFlow Created 弹窗 z-index（避免 EditAgent 遮罩层级问题） */
  modalZIndex: 1100,
} as const;

// ──────────────────────────────────────────────
//  4. 工具函数
// ──────────────────────────────────────────────

/**
 * 判断节点类型是否属于 AgentFlow 专用节点。
 */
export function isAgentFlowType(
  type: NodeTypeEnum | string | undefined | null,
): boolean {
  if (!type) return false;
  return AGENT_FLOW_NODE_TYPES.has(type as NodeTypeEnum);
}

/**
 * 判断节点类型在 AgentFlow 下是否有独立属性面板。
 */
export function isAgentFlowPanelNode(type: NodeTypeEnum): boolean {
  return AGENT_FLOW_PANEL_NODE_TYPES.has(type);
}

/**
 * 判断节点类型是否仅在 Workflow 模式可见。
 */
export function isWorkflowOnlyNode(type: NodeTypeEnum): boolean {
  return WORKFLOW_ONLY_NODE_TYPES.has(type);
}

/**
 * 获取节点类型在侧边栏应展示的 flowKinds 数组。
 * - Workflow 专属节点 → [FlowKindEnum.Workflow]
 * - AgentFlow 专属节点 → [FlowKindEnum.AgentFlow]
 * - 公共节点 → undefined（两种模式都可见）
 */
export function getFlowKindsForNode(
  type: NodeTypeEnum,
): FlowKindEnum[] | undefined {
  if (WORKFLOW_ONLY_NODE_TYPES.has(type)) return [FlowKindEnum.Workflow];
  if (AGENT_FLOW_NODE_TYPES.has(type)) return [FlowKindEnum.AgentFlow];
  return undefined;
}

/**
 * 为侧边栏节点定义自动附加 flowKinds 属性（纯函数，不修改原对象）。
 */
export function assignFlowKinds<T extends { type: NodeTypeEnum }>(
  node: T,
): T & { flowKinds?: FlowKindEnum[] } {
  const flowKinds = getFlowKindsForNode(node.type);
  return flowKinds ? { ...node, flowKinds } : node;
}
