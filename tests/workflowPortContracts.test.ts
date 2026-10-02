import WorkflowProxyV3 from '@/pages/Antv-X6/v3/services/workflowProxyV3';
import { NodeShapeEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));

const node = (id: number, type: NodeTypeEnum): ChildNode => ({
  id,
  type,
  name: String(type),
  description: '',
  workflowId: 1,
  shape: NodeShapeEnum.General,
  icon: '',
  nodeConfig: {},
});

describe('workflow proxy edge port contract', () => {
  it('exposes both ports without losing type information and keeps returned copies isolated', () => {
    const proxy = new WorkflowProxyV3();
    proxy.initialize({
      workflowId: 1,
      nodes: [node(1, NodeTypeEnum.Start), node(2, NodeTypeEnum.End)],
      edges: [
        { source: '1', target: '2', sourcePort: '1-out', targetPort: '2-in' },
      ],
    });

    const edges = proxy.getEdges();
    const sourcePort: string | undefined = edges[0].sourcePort;
    const targetPort: string | undefined = edges[0].targetPort;
    expect([sourcePort, targetPort]).toEqual(['1-out', '2-in']);

    edges[0].sourcePort = 'mutated';
    edges[0].targetPort = undefined;
    edges.splice(0, 1);
    expect(proxy.getEdges()).toEqual([
      { source: '1', target: '2', sourcePort: '1-out', targetPort: '2-in' },
    ]);
  });

  it('keeps the uninitialized result typed and empty', () => {
    const proxy = new WorkflowProxyV3();
    expect(proxy.getEdges()).toEqual([]);
  });
});
