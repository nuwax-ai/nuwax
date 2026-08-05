/**
 * 画布边与 workflowProxy 边数据双向对齐（修复「数据有、画布无」导致的 Edge already exists）
 */

import type { ChildNode } from '@/types/interfaces/graph';
import type { Edge, Graph } from '@antv/x6';
import { workflowProxy } from '../services/workflowProxyV3';
import {
  applyAgentFlowBranchEdgeDisconnect,
  isAgentFlowBranchEdgeConnect,
} from './edgeConnect';

/** 按节点 cellId 匹配（忽略 port 后缀） */
export function findGraphEdgesBetween(
  graph: Graph,
  sourceCellId: string,
  targetCellId: string,
): Edge[] {
  const source = String(sourceCellId);
  const target = String(targetCellId);
  return graph.getEdges().filter((edge) => {
    return (
      edge.getSourceCellId() === source && edge.getTargetCellId() === target
    );
  });
}

export function hasGraphEdgeBetween(
  graph: Graph,
  sourceCellId: string,
  targetCellId: string,
): boolean {
  return findGraphEdgesBetween(graph, sourceCellId, targetCellId).length > 0;
}

/**
 * 从数据模型移除一条边。
 * RouteDecision / HumanInteraction（SELECT 选项端口）的连线在 nodeConfig 分支字段中，
 * 不在 workflowProxy.edges，须走 handler 断开；其余走 deleteEdge。
 */
export function removeEdgeFromDataModel(params: {
  sourceNode: ChildNode;
  targetNodeId: number | string;
  sourcePort?: string;
}): boolean {
  const { sourceNode, targetNodeId, sourcePort } = params;
  const target = String(targetNodeId);

  if (sourcePort && isAgentFlowBranchEdgeConnect(sourceNode, sourcePort)) {
    const updated = applyAgentFlowBranchEdgeDisconnect(
      sourceNode,
      Number(target),
      sourcePort,
    );
    if (updated) {
      return workflowProxy.updateNode(updated).success;
    }
    return false;
  }

  // 普通边：历史 workflowProxy.edges 通常不含 sourcePort，优先按 source+target 删除，
  // 避免画布 edge 带 port 但数据层无 port 时精确匹配报 Edge does not exist
  const res = workflowProxy.deleteEdge(String(sourceNode.id), target);
  if (res.success) {
    return true;
  }
  if (sourcePort) {
    return workflowProxy.deleteEdge(String(sourceNode.id), target, sourcePort)
      .success;
  }
  return false;
}

/**
 * 从数据模型与画布移除 source→target（幂等，尽量多种 source 格式）
 */
export function purgeEdgeBetween(params: {
  graph?: Graph;
  sourceCellId: string;
  targetCellId: string;
  sourcePort?: string;
  /** 已知源节点时可传入，避免 proxy 中节点快照滞后 */
  sourceNode?: ChildNode;
  graphDeleteEdge?: (edgeId: string) => void;
}): void {
  const {
    graph,
    sourceCellId,
    targetCellId,
    sourcePort,
    sourceNode: sourceNodeParam,
    graphDeleteEdge,
  } = params;
  const source = String(sourceCellId);
  const target = String(targetCellId);

  const sourceNode =
    sourceNodeParam ?? workflowProxy.getNodeById(Number(sourceCellId));
  if (sourceNode) {
    removeEdgeFromDataModel({ sourceNode, targetNodeId: target, sourcePort });
  } else {
    workflowProxy.deleteEdge(source, target, sourcePort);
    if (sourcePort) {
      workflowProxy.deleteEdge(source, target);
    }
  }

  if (graph && graphDeleteEdge) {
    findGraphEdgesBetween(graph, source, target).forEach((edge) => {
      graphDeleteEdge(String(edge.id));
    });
  }
}

/**
 * 清理节点在数据模型 + 画布上的所有关联边（含仅存在于 proxy 的残留边）
 */
export function purgeNodeIncidentEdges(params: {
  graph?: Graph;
  nodeId: string;
  excludeEdgeIds?: string[];
  graphDeleteEdge?: (edgeId: string) => void;
}): void {
  const { graph, nodeId, excludeEdgeIds = [], graphDeleteEdge } = params;
  const id = String(nodeId);
  const exclude = new Set(excludeEdgeIds.map(String));

  const proxyEdges = workflowProxy
    .getEdges()
    .filter((e) => String(e.source) === id || String(e.target) === id);
  for (const e of proxyEdges) {
    workflowProxy.deleteEdge(String(e.source), String(e.target), e.sourcePort);
  }

  if (graph && graphDeleteEdge) {
    graph.getEdges().forEach((edge) => {
      if (exclude.has(String(edge.id))) return;
      const src = edge.getSourceCellId();
      const tgt = edge.getTargetCellId();
      if (src === id || tgt === id) {
        graphDeleteEdge(String(edge.id));
      }
    });
  }
}
