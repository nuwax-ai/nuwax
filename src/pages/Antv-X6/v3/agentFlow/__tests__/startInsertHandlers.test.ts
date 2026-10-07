import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { Cell, Edge, Graph } from '@antv/x6';
import {
  handleAgentFlowStartDragInsert,
  resolveStartPortQuickAddRedirect,
  shouldRejectStartSecondDrag,
} from '../startInsertHandlers';

const tailNode: ChildNode = {
  id: 2,
  type: NodeTypeEnum.Agent,
  name: 'A',
} as ChildNode;

const makeEdge = (id: string, sourceCellId: string): Edge =>
  ({
    id,
    remove: vi.fn(),
    getSource: () => ({ cell: sourceCellId, port: `${sourceCellId}-out` }),
    getSourcePortId: () => `${sourceCellId}-out`,
    getTargetCell: () => ({ getData: () => tailNode }),
  } as unknown as Edge);

const makeGraph = (edges: Edge[]): Graph =>
  ({ getEdges: () => edges } as unknown as Graph);

const makeCell = (id: string, type: NodeTypeEnum): Cell =>
  ({
    id,
    getData: () => ({ id: Number(id), type }),
  } as unknown as Cell);

describe('startInsertHandlers', () => {
  describe('resolveStartPortQuickAddRedirect', () => {
    it('Workflow 下不介入', () => {
      const graph = makeGraph([makeEdge('e1', '1')]);
      expect(
        resolveStartPortQuickAddRedirect({
          graph,
          flowKind: FlowKindEnum.Workflow,
          sourceNode: { id: 1, type: NodeTypeEnum.Start } as ChildNode,
        }),
      ).toEqual({ kind: 'skip' });
    });

    it('AgentFlow 已连出时返回 redirect', () => {
      const graph = makeGraph([makeEdge('e1', '1')]);
      expect(
        resolveStartPortQuickAddRedirect({
          graph,
          flowKind: FlowKindEnum.AgentFlow,
          sourceNode: { id: 1, type: NodeTypeEnum.Start } as ChildNode,
        }),
      ).toEqual({
        kind: 'redirect',
        sourcePort: '1-out',
        tailNode,
        edgeId: 'e1',
      });
    });
  });

  describe('shouldRejectStartSecondDrag', () => {
    it('拖向原后继时拒绝', () => {
      const graph = makeGraph([makeEdge('e1', '1')]);
      expect(
        shouldRejectStartSecondDrag({
          graph,
          flowKind: FlowKindEnum.AgentFlow,
          sourceCell: makeCell('1', NodeTypeEnum.Start),
          targetCell: makeCell('2', NodeTypeEnum.Agent),
          edges: graph.getEdges(),
        }),
      ).toBe(true);
    });

    it('拖向其他节点时放行', () => {
      const graph = makeGraph([makeEdge('e1', '1')]);
      expect(
        shouldRejectStartSecondDrag({
          graph,
          flowKind: FlowKindEnum.AgentFlow,
          sourceCell: makeCell('1', NodeTypeEnum.Start),
          targetCell: makeCell('3', NodeTypeEnum.Agent),
          excludeEdgeId: 'e-new',
          edges: graph.getEdges(),
        }),
      ).toBe(false);
    });
  });

  describe('handleAgentFlowStartDragInsert', () => {
    it('成功插入时移除临时边并调用 insertNodeBetween', async () => {
      const oldEdge = makeEdge('e-old', '1');
      const newEdge = makeEdge('e-new', '1');
      const graph = makeGraph([oldEdge, newEdge]);
      const insertNodeBetween = vi.fn().mockResolvedValue(undefined);
      const onComplete = vi.fn();

      const handled = handleAgentFlowStartDragInsert({
        graph,
        flowKind: FlowKindEnum.AgentFlow,
        edge: newEdge,
        edges: graph.getEdges(),
        sourceNode: { id: 1, type: NodeTypeEnum.Start } as ChildNode,
        targetNode: { id: 3, type: NodeTypeEnum.Agent } as ChildNode,
        sourcePort: '1-out',
        insertNodeBetween,
        onComplete,
      });

      expect(handled).toBe(true);
      expect(newEdge.remove).toHaveBeenCalled();
      expect(insertNodeBetween).toHaveBeenCalledWith(
        expect.objectContaining({
          middleNode: { id: 3, type: NodeTypeEnum.Agent },
          tailNode,
          oldEdgeId: 'e-old',
        }),
      );

      await Promise.resolve();
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
