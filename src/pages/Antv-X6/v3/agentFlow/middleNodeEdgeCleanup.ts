/**
 * AgentFlow 中间节点插入前：清理节点上已有连线（画布 + 由调用方同步数据模型）
 */

import type { Edge, Graph } from '@antv/x6';

/**
 * 收集并删除与 nodeId 关联的所有边（入边 + 出边）。
 * @param excludeEdgeIds 跳过的边（如即将重建的 Start→tail）
 */
export async function clearNodeIncidentEdges(params: {
  graph: Graph;
  nodeId: string;
  excludeEdgeIds?: string[];
  deleteEdge: (edge: Edge) => void | Promise<void>;
}): Promise<void> {
  const { graph, nodeId, excludeEdgeIds = [], deleteEdge } = params;
  const id = String(nodeId);
  const exclude = new Set(excludeEdgeIds.map(String));

  const incident = graph.getEdges().filter((edge) => {
    if (exclude.has(String(edge.id))) return false;
    const src = edge.getSourceCellId();
    const tgt = edge.getTargetCellId();
    return src === id || tgt === id;
  });

  for (const edge of incident) {
    await deleteEdge(edge);
  }
}
