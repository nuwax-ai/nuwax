import type { Edge, Graph } from '@antv/x6';
import { clearNodeIncidentEdges } from '../middleNodeEdgeCleanup';

const makeEdge = (id: string, source: string, target: string): Edge =>
  ({
    id,
    getSourceCellId: () => source,
    getTargetCellId: () => target,
    getSourcePortId: () => `${source}-out`,
  } as unknown as Edge);

describe('clearNodeIncidentEdges', () => {
  it('删除与节点相关的入边和出边', async () => {
    const deleted: string[] = [];
    const graph = {
      getEdges: () => [
        makeEdge('e-in', '9', '3'),
        makeEdge('e-out', '3', '5'),
        makeEdge('e-other', '1', '2'),
      ],
    } as unknown as Graph;

    await clearNodeIncidentEdges({
      graph,
      nodeId: '3',
      deleteEdge: async (edge) => {
        deleted.push(String(edge.id));
      },
    });

    expect(deleted.sort()).toEqual(['e-in', 'e-out']);
  });

  it('支持 excludeEdgeIds', async () => {
    const deleted: string[] = [];
    const graph = {
      getEdges: () => [
        makeEdge('e-keep', '1', '3'),
        makeEdge('e-drop', '3', '2'),
      ],
    } as unknown as Graph;

    await clearNodeIncidentEdges({
      graph,
      nodeId: '3',
      excludeEdgeIds: ['e-keep'],
      deleteEdge: async (edge) => {
        deleted.push(String(edge.id));
      },
    });

    expect(deleted).toEqual(['e-drop']);
  });
});
