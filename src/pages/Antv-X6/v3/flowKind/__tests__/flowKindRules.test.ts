import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { Edge, Graph } from '@antv/x6';
import {
  findStartOutgoingEdge,
  isStartNode,
  shouldBlockStartOutgoing,
} from '../flowKindRules';

const makeEdge = (
  id: string,
  sourceCellId: string,
  tailNode: ChildNode,
): Edge =>
  ({
    id,
    getSource: () => ({ cell: sourceCellId, port: `${sourceCellId}-out` }),
    getSourcePortId: () => `${sourceCellId}-out`,
    getTargetCell: () => ({
      getData: () => tailNode,
    }),
  } as unknown as Edge);

const makeGraph = (edges: Edge[]): Graph =>
  ({
    getEdges: () => edges,
  } as unknown as Graph);

describe('flowKindRules', () => {
  const tailNode: ChildNode = {
    id: 2,
    type: NodeTypeEnum.Agent,
    name: 'AgentA',
  } as ChildNode;

  describe('isStartNode', () => {
    it('识别 Start 类型', () => {
      expect(isStartNode(NodeTypeEnum.Start)).toBe(true);
      expect(isStartNode(NodeTypeEnum.Agent)).toBe(false);
    });
  });

  describe('shouldBlockStartOutgoing', () => {
    it('AgentFlow 下 Start 已有出边时返回 true', () => {
      const graph = makeGraph([makeEdge('e1', '1', tailNode)]);
      expect(
        shouldBlockStartOutgoing({
          graph,
          flowKind: FlowKindEnum.AgentFlow,
          startCellId: '1',
        }),
      ).toBe(true);
    });

    it('非 AgentFlow 不拦截', () => {
      const graph = makeGraph([makeEdge('e1', '1', tailNode)]);
      expect(
        shouldBlockStartOutgoing({
          graph,
          flowKind: FlowKindEnum.Workflow,
          startCellId: '1',
        }),
      ).toBe(false);
    });
  });

  describe('findStartOutgoingEdge', () => {
    it('返回 Start 出边及原后继节点', () => {
      const edge = makeEdge('e1', '1', tailNode);
      const graph = makeGraph([edge]);
      const found = findStartOutgoingEdge({
        graph,
        flowKind: FlowKindEnum.AgentFlow,
        startCellId: '1',
      });
      expect(found?.edge).toBe(edge);
      expect(found?.tailNode).toBe(tailNode);
    });

    it('excludeEdgeId 排除指定边', () => {
      const oldEdge = makeEdge('e-old', '1', tailNode);
      const newEdge = makeEdge('e-new', '1', {
        id: 3,
        type: NodeTypeEnum.Agent,
        name: 'AgentB',
      } as ChildNode);
      const graph = makeGraph([oldEdge, newEdge]);
      const found = findStartOutgoingEdge({
        graph,
        flowKind: FlowKindEnum.AgentFlow,
        startCellId: '1',
        excludeEdgeId: 'e-new',
      });
      expect(found?.edge.id).toBe('e-old');
    });

    it('非 AgentFlow 返回 undefined', () => {
      const graph = makeGraph([makeEdge('e1', '1', tailNode)]);
      expect(
        findStartOutgoingEdge({
          graph,
          flowKind: FlowKindEnum.Workflow,
          startCellId: '1',
        }),
      ).toBeUndefined();
    });

    it('无匹配出边返回 undefined', () => {
      const graph = makeGraph([]);
      expect(
        findStartOutgoingEdge({
          graph,
          flowKind: FlowKindEnum.AgentFlow,
          startCellId: '1',
        }),
      ).toBeUndefined();
    });
  });
});
