/**
 * flowKind 连线规则
 *
 * 从 graph.tsx 抽取的 AgentFlow 连线约束逻辑，
 * 供 createNodeAndEdge / validateConnection 等场景复用。
 */

import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { Edge, Graph } from '@antv/x6';

export interface StartOutgoingEdgeInfo {
  edge: Edge;
  tailNode: ChildNode;
}

/**
 * 检查 Start 节点是否已有出边（AgentFlow 单出口约束）。
 *
 * @param graph      X6 画布实例
 * @param flowKind   当前流类型
 * @param startCellId Start 节点的 cell ID（字符串）
 * @param excludeEdgeId  排除的边 ID（拖拽/重连时排除当前边）
 * @param edges      可选：调用方已快照的边数组，避免在热路径（如 validateConnection）重复 getEdges()
 * @returns true 表示应阻止连线
 */
export function shouldBlockStartOutgoing(params: {
  graph: Graph;
  flowKind: FlowKindEnum | undefined;
  startCellId: string;
  excludeEdgeId?: string;
  edges?: ReturnType<Graph['getEdges']>;
}): boolean {
  const { graph, flowKind, startCellId, excludeEdgeId, edges } = params;

  if (flowKind !== FlowKindEnum.AgentFlow) return false;

  const list = edges ?? graph.getEdges();
  return list.some((edge) => {
    // 排除当前正在操作的边
    if (excludeEdgeId && String(edge.id) === excludeEdgeId) return false;

    const source = edge.getSource();
    return (
      typeof source === 'object' &&
      source !== null &&
      'cell' in source &&
      String((source as { cell: unknown }).cell) === startCellId
    );
  });
}

/**
 * 判断源节点是否为 Start 类型（用于简化调用侧的类型判断）。
 */
export function isStartNode(
  nodeType: NodeTypeEnum | string | undefined,
): boolean {
  return nodeType === NodeTypeEnum.Start;
}

/**
 * 查找 AgentFlow Start 节点当前出边及原后继节点（用于「第二条拖线 = 中间插入」）。
 *
 * @param excludeEdgeId 排除的边 ID（拖线过程中排除正在创建的新边）
 */
export function findStartOutgoingEdge(params: {
  graph: Graph;
  flowKind: FlowKindEnum | undefined;
  startCellId: string;
  excludeEdgeId?: string;
  edges?: ReturnType<Graph['getEdges']>;
}): StartOutgoingEdgeInfo | undefined {
  const { graph, flowKind, startCellId, excludeEdgeId, edges } = params;

  if (flowKind !== FlowKindEnum.AgentFlow) return undefined;

  const list = edges ?? graph.getEdges();
  for (const edge of list) {
    if (excludeEdgeId && String(edge.id) === excludeEdgeId) continue;

    const source = edge.getSource();
    if (
      typeof source === 'object' &&
      source !== null &&
      'cell' in source &&
      String((source as { cell: unknown }).cell) === startCellId
    ) {
      const tailNode = edge.getTargetCell()?.getData() as ChildNode | undefined;
      if (tailNode) {
        return { edge, tailNode };
      }
    }
  }
  return undefined;
}
