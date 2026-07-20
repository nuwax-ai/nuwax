import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { Edge, Graph } from '@antv/x6';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extensionRegistry } from '../../extensions/registry';
import {
  findGraphEdgesBetween,
  hasGraphEdgeBetween,
  purgeEdgeBetween,
  purgeNodeIncidentEdges,
  removeEdgeFromDataModel,
} from '../edgeSync';
import { HitlAnswerTypeEnum } from '../enums/hitlAnswerType';
import { humanInteractionHandler } from '../handlers/humanInteraction';
import { routeDecisionHandler } from '../handlers/routeDecision';

const mockDeleteEdge = vi.fn();
const mockGetEdges = vi.fn();
const mockGetNodeById = vi.fn();
const mockUpdateNode = vi.fn();

vi.mock('../../services/workflowProxyV3', () => ({
  workflowProxy: {
    deleteEdge: (...args: unknown[]) => mockDeleteEdge(...args),
    getEdges: () => mockGetEdges(),
    getNodeById: (...args: unknown[]) => mockGetNodeById(...args),
    updateNode: (...args: unknown[]) => mockUpdateNode(...args),
  },
}));

beforeEach(() => {
  extensionRegistry.register(humanInteractionHandler);
  extensionRegistry.register(routeDecisionHandler);
  mockDeleteEdge.mockClear();
  mockGetEdges.mockReturnValue([]);
  mockGetNodeById.mockReturnValue(undefined);
  mockUpdateNode.mockReturnValue({ success: true });
});

const makeEdge = (id: string, source: string, target: string): Edge =>
  ({
    id,
    getSourceCellId: () => source,
    getTargetCellId: () => target,
    getSourcePortId: () => `${source}-out`,
  } as unknown as Edge);

describe('edgeSync', () => {
  it('findGraphEdgesBetween 按 cellId 匹配', () => {
    const graph = {
      getEdges: () => [makeEdge('e1', '1', '2'), makeEdge('e2', '1', '3')],
    } as unknown as Graph;
    expect(findGraphEdgesBetween(graph, '1', '2').map((e) => e.id)).toEqual([
      'e1',
    ]);
  });

  it('hasGraphEdgeBetween', () => {
    const graph = {
      getEdges: () => [makeEdge('e1', '1', '2')],
    } as unknown as Graph;
    expect(hasGraphEdgeBetween(graph, '1', '2')).toBe(true);
    expect(hasGraphEdgeBetween(graph, '1', '9')).toBe(false);
  });

  it('purgeEdgeBetween 同步删除 proxy 与画布', () => {
    const graph = {
      getEdges: () => [makeEdge('e1', '1', '2')],
    } as unknown as Graph;
    const deleted: string[] = [];

    purgeEdgeBetween({
      graph,
      sourceCellId: '1',
      targetCellId: '2',
      graphDeleteEdge: (id) => deleted.push(id),
    });

    expect(mockDeleteEdge).toHaveBeenCalled();
    expect(deleted).toEqual(['e1']);
  });

  it('purgeNodeIncidentEdges 清理 proxy 与画布关联边', () => {
    mockGetEdges.mockReturnValue([
      { source: '3', target: '5' },
      { source: '1', target: '2' },
    ]);
    const graph = {
      getEdges: () => [makeEdge('e1', '3', '5'), makeEdge('e2', '9', '1')],
    } as unknown as Graph;
    const deleted: string[] = [];

    purgeNodeIncidentEdges({
      graph,
      nodeId: '3',
      graphDeleteEdge: (id) => deleted.push(id),
    });

    expect(mockDeleteEdge).toHaveBeenCalled();
    expect(deleted).toContain('e1');
    expect(deleted).not.toContain('e2');
  });

  it('removeEdgeFromDataModel：HumanInteraction SELECT 选项边走 updateNode', () => {
    const node = {
      id: 2,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: {
        answerType: HitlAnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', nextNodeIds: [3, 4] }],
      },
    } as ChildNode;

    const ok = removeEdgeFromDataModel({
      sourceNode: node,
      targetNodeId: 3,
      sourcePort: '2-hitl-option-o1-out',
    });

    expect(ok).toBe(true);
    expect(mockUpdateNode).toHaveBeenCalled();
    expect(mockDeleteEdge).not.toHaveBeenCalled();
    const updated = mockUpdateNode.mock.calls[0][0] as ChildNode;
    expect(updated.nodeConfig?.options?.[0].nextNodeIds).toEqual([4]);
  });

  it('removeEdgeFromDataModel：普通边走 deleteEdge', () => {
    mockDeleteEdge.mockReturnValue({ success: true });
    const node = {
      id: 3,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: { answerType: HitlAnswerTypeEnum.TEXT },
    } as ChildNode;

    const ok = removeEdgeFromDataModel({
      sourceNode: node,
      targetNodeId: 9,
    });

    expect(ok).toBe(true);
    expect(mockDeleteEdge).toHaveBeenCalledWith('3', '9', undefined);
    expect(mockUpdateNode).not.toHaveBeenCalled();
  });

  it('purgeEdgeBetween 传入 sourceNode 时清理 HumanInteraction 分支边', () => {
    const node = {
      id: 2,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: {
        answerType: HitlAnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', nextNodeIds: [5] }],
      },
    } as ChildNode;
    const graph = {
      getEdges: () => [makeEdge('e1', '2', '5')],
    } as unknown as Graph;
    const deleted: string[] = [];

    purgeEdgeBetween({
      graph,
      sourceCellId: '2',
      targetCellId: '5',
      sourcePort: '2-hitl-option-o1-out',
      sourceNode: node,
      graphDeleteEdge: (id) => deleted.push(id),
    });

    expect(mockUpdateNode).toHaveBeenCalled();
    expect(deleted).toEqual(['e1']);
  });
});
