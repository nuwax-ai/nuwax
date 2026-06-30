/**
 * 画布边与 workflowProxy 边数据双向对齐（修复「数据有、画布无」导致的 Edge already exists）
 */

import type { Edge, Graph } from '@antv/x6';
import { workflowProxy } from '../services/workflowProxyV3';

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
 * 从数据模型与画布移除 source→target（幂等，尽量多种 source 格式）
 */
export function purgeEdgeBetween(params: {
  graph?: Graph;
  sourceCellId: string;
  targetCellId: string;
  sourcePort?: string;
  graphDeleteEdge?: (edgeId: string) => void;
}): void {
  const { graph, sourceCellId, targetCellId, sourcePort, graphDeleteEdge } =
    params;
  const source = String(sourceCellId);
  const target = String(targetCellId);

  workflowProxy.deleteEdge(source, target, sourcePort);
  if (sourcePort) {
    workflowProxy.deleteEdge(source, target);
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
