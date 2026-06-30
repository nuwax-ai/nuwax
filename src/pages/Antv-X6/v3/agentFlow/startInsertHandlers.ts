/**
 * AgentFlow 开始节点「第二条拖线 / 端口点击」= 连线中间插入
 *
 * 从 graph.tsx 抽离，避免画布初始化文件膨胀；仅 flowKind === AgentFlow 时生效。
 */

import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import type {
  ChildNode,
  InsertNodeBetweenParams,
} from '@/types/interfaces/graph';
import type { Cell, Edge, Graph } from '@antv/x6';
import {
  findStartOutgoingEdge,
  isStartNode,
  shouldBlockStartOutgoing,
} from '../flowKind/flowKindRules';

export type StartPortQuickAddRedirect =
  | {
      kind: 'redirect';
      sourcePort: string;
      tailNode: ChildNode;
      edgeId: string;
    }
  | { kind: 'blocked' }
  | { kind: 'skip' };

/**
 * Start out port 已连出时：转发为在 Start→后继 连线上快捷插入，或提示单出口限制。
 */
export function resolveStartPortQuickAddRedirect(params: {
  graph: Graph;
  flowKind: FlowKindEnum | undefined;
  sourceNode: ChildNode;
  edgeId?: string;
}): StartPortQuickAddRedirect {
  const { graph, flowKind, sourceNode, edgeId } = params;

  if (
    !isStartNode(sourceNode?.type) ||
    edgeId ||
    !shouldBlockStartOutgoing({
      graph,
      flowKind,
      startCellId: String(sourceNode.id),
    })
  ) {
    return { kind: 'skip' };
  }

  const found = findStartOutgoingEdge({
    graph,
    flowKind,
    startCellId: String(sourceNode.id),
  });
  const sourcePort = found?.edge.getSourcePortId();
  if (found && sourcePort) {
    return {
      kind: 'redirect',
      sourcePort,
      tailNode: found.tailNode,
      edgeId: String(found.edge.id),
    };
  }

  return { kind: 'blocked' };
}

function canInsertOnStartSecondDrag(params: {
  flowKind: FlowKindEnum | undefined;
  targetCell: Cell;
  found: ReturnType<typeof findStartOutgoingEdge>;
}): boolean {
  const { flowKind, targetCell, found } = params;
  const targetNodeData = targetCell.getData();
  return (
    flowKind === FlowKindEnum.AgentFlow &&
    targetNodeData?.type !== NodeTypeEnum.End &&
    !!found &&
    String(found.tailNode.id) !== String(targetCell.id)
  );
}

/**
 * validateConnection：AgentFlow Start 已有出边时，是否应拒绝本次拖线。
 * @returns true 拒绝；false 放行（中间插入拖线）
 */
export function shouldRejectStartSecondDrag(params: {
  graph: Graph;
  flowKind: FlowKindEnum | undefined;
  sourceCell: Cell;
  targetCell: Cell;
  excludeEdgeId?: string;
  edges: ReturnType<Graph['getEdges']>;
}): boolean {
  const { graph, flowKind, sourceCell, targetCell, excludeEdgeId, edges } =
    params;

  if (
    !isStartNode(sourceCell.getData()?.type) ||
    !shouldBlockStartOutgoing({
      graph,
      flowKind,
      startCellId: String(sourceCell.id),
      excludeEdgeId,
      edges,
    })
  ) {
    return false;
  }

  return !canInsertOnStartSecondDrag({
    flowKind,
    targetCell,
    found: findStartOutgoingEdge({
      graph,
      flowKind,
      startCellId: String(sourceCell.id),
      excludeEdgeId,
      edges,
    }),
  });
}

/**
 * edge:connected：处理 Start 第二条拖线插入。返回 true 表示已消费该事件。
 */
export function handleAgentFlowStartDragInsert(params: {
  graph: Graph;
  flowKind: FlowKindEnum | undefined;
  edge: Edge;
  edges: ReturnType<Graph['getEdges']>;
  sourceNode: ChildNode;
  targetNode: ChildNode;
  sourcePort: string;
  insertNodeBetween?: (config: InsertNodeBetweenParams) => Promise<void>;
  onComplete?: () => void;
}): boolean {
  const {
    graph,
    flowKind,
    edge,
    edges,
    sourceNode,
    targetNode,
    sourcePort,
    insertNodeBetween,
    onComplete,
  } = params;

  if (
    flowKind !== FlowKindEnum.AgentFlow ||
    !isStartNode(sourceNode.type) ||
    !insertNodeBetween
  ) {
    return false;
  }

  const found = findStartOutgoingEdge({
    graph,
    flowKind,
    startCellId: String(sourceNode.id),
    excludeEdgeId: String(edge.id),
    edges,
  });

  if (
    !found ||
    targetNode.type === NodeTypeEnum.End ||
    String(targetNode.id) === String(found.tailNode.id)
  ) {
    return false;
  }

  edge.remove();
  void insertNodeBetween({
    sourceNode,
    middleNode: targetNode,
    tailNode: found.tailNode,
    oldEdgeId: String(found.edge.id),
    portId: sourcePort,
  })
    .then(() => {
      onComplete?.();
    })
    .catch((err) => {
      console.error('[handleAgentFlowStartDragInsert]', err);
    });

  return true;
}
