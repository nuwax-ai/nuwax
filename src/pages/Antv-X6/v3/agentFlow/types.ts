/**
 * AgentFlow 节点类型相关共享类型与守卫
 *
 * 用于 React 组件层 / handler 层 / 样式层共享类型判断。
 * 注：判断时走 `NodeTypeEnum` 字面量匹配，不走"是否注册了 extension"
 * 避免循环依赖。
 */

import { NodeTypeEnum } from '@/types/enums/common';

/** AgentFlow 流的节点类型集合（与 extensionRegistry 注册范围一致） */
export const AGENT_FLOW_NODE_TYPES: ReadonlyArray<NodeTypeEnum> = [
  NodeTypeEnum.Agent,
  NodeTypeEnum.HumanInteraction,
  NodeTypeEnum.RouteDecision,
] as const;

/**
 * 判断节点类型是否属于 AgentFlow 专用节点
 *
 * 注意：非 AgentFlow 流下也可能拖出这些节点（暂未做硬隔离），但视觉/行为
 * 改造一律用此守卫限定，避免误伤普通 Workflow 节点。
 */
export function isAgentFlowType(
  type: NodeTypeEnum | string | undefined | null,
): boolean {
  if (!type) return false;
  return AGENT_FLOW_NODE_TYPES.includes(type as NodeTypeEnum);
}
