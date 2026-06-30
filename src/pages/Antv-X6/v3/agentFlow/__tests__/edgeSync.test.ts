import type { Edge, Graph } from '@antv/x6';
import { vi } from 'vitest';
import {
  findGraphEdgesBetween,
  hasGraphEdgeBetween,
  purgeEdgeBetween,
  purgeNodeIncidentEdges,
} from '../edgeSync';

const mockDeleteEdge = vi.fn();
const mockGetEdges = vi.fn();

vi.mock('../../services/workflowProxyV3', () => ({
  workflowProxy: {
    deleteEdge: (...args: unknown[]) => mockDeleteEdge(...args),
    getEdges: () => mockGetEdges(),
  },
}));

const makeEdge = (id: string, source: string, target: string): Edge =>
  ({
    id,
    getSourceCellId: () => source,
    getTargetCellId: () => target,
    getSourcePortId: () => `${source}-out`,
  } as unknown as Edge);

describe('edgeSync', () => {
  beforeEach(() => {
    mockDeleteEdge.mockClear();
    mockGetEdges.mockReturnValue([]);
  });

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
});
