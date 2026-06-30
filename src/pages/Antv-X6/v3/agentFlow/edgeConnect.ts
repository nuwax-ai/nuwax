/**
 * AgentFlow 画布手动拖线：RouteDecision / HumanInteraction 分支端口
 *
 * 与后端类型的映射关系：
 *   RouteDecision      ↔ IntentRecognition（intentConfigs / route-* 端口）
 *   HumanInteraction   ↔ QA SELECT（options[].nextNodeIds / hitl-option-* 端口）
 *
 * 逻辑集中在 agentFlow，不改动 Workflow 侧 handleSpecialNodeTypes 等既有实现。
 */

import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { Edge, Graph } from '@antv/x6';
import { extensionRegistry } from '../extensions/registry';
import { isHitlOptionsBranchMode } from './adapters/qaConfigAdapter';

/**
 * 是否为 AgentFlow 分支端口拖线（应写 nodeConfig 分支字段，而非节点级 nextNodeIds）
 */
export function isAgentFlowBranchEdgeConnect(
  sourceNode: ChildNode,
  sourcePort: string,
): boolean {
  if (sourceNode.type === NodeTypeEnum.RouteDecision) {
    return true;
  }
  if (
    sourceNode.type === NodeTypeEnum.HumanInteraction &&
    isHitlOptionsBranchMode(sourceNode.nodeConfig as Record<string, unknown>)
  ) {
    const handler = extensionRegistry.get(NodeTypeEnum.HumanInteraction);
    return !!handler?.parseSourcePort?.(sourceNode, sourcePort);
  }
  return false;
}

/**
 * 拖线连入后更新源节点分支配置（委托 extensionRegistry 已注册的 handler）
 */
export function applyAgentFlowBranchEdgeConnect(
  sourceNode: ChildNode,
  targetNode: ChildNode,
  sourcePort: string,
): ChildNode | null {
  const handler = extensionRegistry.get(sourceNode.type as NodeTypeEnum);
  return (
    handler?.handleSpecialNextIndex?.(
      sourceNode,
      sourcePort,
      targetNode.id,
      targetNode,
    ) ?? null
  );
}

/**
 * 拖线结束时边通常已在画布上；仅在缺失且实例仍有效时补加，
 * 避免代理回滚 dispose 后对同一实例 graph.addEdge 触发 shape 序列化错误。
 */
export function ensureEdgeOnGraph(graph: Graph, edge: Edge): void {
  if (graph.getCellById(edge.id)) {
    return;
  }
  const prop = edge.prop();
  if (prop?.shape) {
    graph.addEdge(prop);
  }
}
