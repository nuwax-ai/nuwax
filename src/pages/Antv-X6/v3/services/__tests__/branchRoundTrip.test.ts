import {
  ExceptionHandleTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { Graph } from '@antv/x6';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { normalizeHitlNodeConfig } from '../../agentFlow/adapters/qaConfigAdapter';
import { HitlAnswerTypeEnum } from '../../agentFlow/enums/hitlAnswerType';
import { humanInteractionHandler } from '../../agentFlow/handlers/humanInteraction';
import { routeDecisionHandler } from '../../agentFlow/handlers/routeDecision';
import { normalizeLoadedNodes } from '../../agentFlow/nodeTypeMapping';
import { extensionRegistry } from '../../extensions/registry';
import type { BranchNodeHandler } from '../../extensions/types';
import { SpecialPortType } from '../../types/enums';
import type { EdgeV3 } from '../../types/interfaces';
import { getEdges } from '../../utils/graphV3';
import WorkflowSaveService from '../WorkflowSaveService';
import WorkflowProxyV3 from '../workflowProxyV3';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));

// 本测试不渲染画布；仅隔离尺寸计算模块，保存、序列化、重载和 getEdges 均执行真实实现。
vi.mock('../../utils/workflowV3', () => ({
  getWidthAndHeight: () => ({ width: 200, height: 100 }),
}));

// X6 3.x 发布包的 CJS 入口不能被 Vitest 作为 ESM 加载；此链只消费 Graph 接口。
vi.mock('@antv/x6', () => ({
  Cell: class {},
  Edge: class {},
  Graph: class {},
  Node: class {},
}));

const CUSTOM_BRANCH = 'TestReviewBranch' as NodeTypeEnum;
const UNKNOWN_NODE = 'TestUnknownNode' as NodeTypeEnum;
const ROUTE_UUID = '9f9d9478-8b79-4201-b995-93f339d7dce8';
const OTHER_UUID = '6f766cbd-9330-441a-a258-2f85c5b3c8ac';
const OPTION_UUID = '376b484b-6baa-430f-ac9a-1220a2f39162';

const node = (
  id: number,
  type: NodeTypeEnum,
  config: Record<string, any> = {},
  overrides: Partial<ChildNode> = {},
): ChildNode => ({
  id,
  type,
  name: String(type),
  description: '',
  workflowId: 1,
  shape: NodeShapeEnum.General,
  icon: '',
  nextNodeIds: [],
  nodeConfig: config,
  ...overrides,
});

const workflowNodes = (branch: ChildNode) => [
  node(1, NodeTypeEnum.Start),
  branch,
  node(3, NodeTypeEnum.Agent),
  node(4, NodeTypeEnum.End),
];

const details = (nodes: ChildNode[]) => ({
  id: 1,
  name: 'Branch round trip',
  description: '',
  nodes,
  startNode: nodes[0],
  endNode: nodes[nodes.length - 1],
});

const canvas = (nodes: ChildNode[], edges: EdgeV3[]): Graph =>
  ({
    getNodes: () =>
      nodes.map((data) => ({
        getData: () => data,
        getPosition: () => ({ x: 10, y: 20 }),
        getSize: () => ({ width: 200, height: 100 }),
      })),
    getEdges: () =>
      edges.map((edge) => ({
        getSource: () => ({ cell: edge.source, port: edge.sourcePort }),
        getTarget: () => ({ cell: edge.target, port: edge.targetPort }),
        getSourcePortId: () => edge.sourcePort,
        getTargetPortId: () => edge.targetPort,
      })),
  } as unknown as Graph);

const reload = (nodes: ChildNode[]): ChildNode[] =>
  normalizeLoadedNodes(nodes, true).map((loadedNode) =>
    loadedNode.type === NodeTypeEnum.HumanInteraction
      ? {
          ...loadedNode,
          nodeConfig: normalizeHitlNodeConfig(loadedNode.nodeConfig),
        }
      : loadedNode,
  );

const roundTrip = (nodes: ChildNode[], edges: EdgeV3[]) => {
  const service = new WorkflowSaveService();
  service.initialize(details(nodes) as any);
  const payload = service.buildPayload(canvas(nodes, edges));
  expect(payload).not.toBeNull();
  // 模拟真实后端 JSON 存储边界；边 ID 不参与节点持久化。
  const backendNodes = JSON.parse(
    JSON.stringify(payload!.nodes),
  ) as ChildNode[];
  const loadedNodes = reload(backendNodes);
  return { backendNodes, loadedNodes, edges: getEdges(loadedNodes) };
};

const syncAndRoundTrip = (nodes: ChildNode[], edges: EdgeV3[]) => {
  const proxy = new WorkflowProxyV3();
  proxy.initialize({ workflowId: 1, nodes, edges: [] });
  proxy.setWorkflowInfo(details(nodes) as any);
  proxy.syncFromGraph(nodes, edges);
  const payload = proxy.buildFullConfig()!;
  const loadedNodes = reload(JSON.parse(JSON.stringify(payload.nodes)));
  return { nodes: proxy.getNodes(), loadedNodes, edges: getEdges(loadedNodes) };
};

const customHandler: BranchNodeHandler = {
  nodeType: CUSTOM_BRANCH,
  generateEdges(branch, { isLoopNode }) {
    return ((branch.nodeConfig as any).choices || []).flatMap((choice: any) =>
      (choice.nextNodeIds || []).map((targetId: number) => ({
        source: `${branch.id}-review-${choice.uuid}-out`,
        target: String(targetId),
        zIndex: isLoopNode ? 5 : 1,
      })),
    );
  },
  parseSourcePort(_branch, port) {
    const match = port.match(/-review-(.+)-out$/);
    // 使用现有枚举，证明扩展分支无需加入核心的 SpecialPortType 白名单。
    return match ? { type: SpecialPortType.Normal, uuid: match[1] } : null;
  },
  getBranchKey(port) {
    return port.uuid ? `review-${port.uuid}` : undefined;
  },
  resetBranchData(branch) {
    (branch.nodeConfig as any).choices.forEach((choice: any) => {
      choice.nextNodeIds = [];
    });
  },
  updateConnection(branch, port, targetId, action) {
    const choice = (branch.nodeConfig as any).choices.find(
      (item: any) => item.uuid === port.uuid,
    );
    if (!choice) return false;
    if (action === 'add') {
      if (!choice.nextNodeIds.includes(targetId))
        choice.nextNodeIds.push(targetId);
    } else {
      choice.nextNodeIds = choice.nextNodeIds.filter(
        (id: number) => id !== targetId,
      );
    }
    return true;
  },
  initBranchMap(branch) {
    return new Map(
      (branch.nodeConfig as any).choices.map((choice: any) => [
        `review-${choice.uuid}`,
        [],
      ]),
    );
  },
  mergeBranchData(branch, branches) {
    (branch.nodeConfig as any).choices.forEach((choice: any) => {
      choice.nextNodeIds = branches.get(`review-${choice.uuid}`) || [];
    });
  },
  isSpecialBranchNode: () => true,
};

beforeAll(() => {
  extensionRegistry.register(routeDecisionHandler);
  extensionRegistry.register(humanInteractionHandler);
  extensionRegistry.register(customHandler);
});

describe('分支节点真实保存与重载', () => {
  it('保留 Route NORMAL、OTHER 和旧 default 的完整 UUID 端口与后端类型', () => {
    const nodes = workflowNodes(
      node(
        2,
        NodeTypeEnum.RouteDecision,
        {
          defaultNextNodeIds: [99],
          intentConfigs: [
            { uuid: ROUTE_UUID, intentType: 'NORMAL', nextNodeIds: [99] },
            { uuid: OTHER_UUID, intentType: 'OTHER', nextNodeIds: [99] },
          ],
        },
        { loopNodeId: 10, nextNodeIds: [99] },
      ),
    );
    const result = roundTrip(nodes, [
      { source: '2', target: '3', sourcePort: `2-route-${ROUTE_UUID}-out` },
      { source: '2', target: '4', sourcePort: `2-route-${OTHER_UUID}-out` },
      { source: '2', target: '4', sourcePort: '2-route-default-out' },
    ]);
    expect(result.backendNodes[1].type).toBe(NodeTypeEnum.IntentRecognition);
    expect(result.backendNodes[1].nextNodeIds).toEqual([]);
    expect((result.backendNodes[1].nodeConfig as any).intentConfigs).toEqual([
      expect.objectContaining({
        uuid: ROUTE_UUID,
        intentType: 'NORMAL',
        nextNodeIds: [3],
      }),
      expect.objectContaining({
        uuid: OTHER_UUID,
        intentType: 'OTHER',
        nextNodeIds: [4],
      }),
    ]);
    expect(result.loadedNodes[1].type).toBe(NodeTypeEnum.RouteDecision);
    expect(result.edges).toEqual([
      { source: '2-route-default-out', target: '4', zIndex: 5 },
      { source: `2-route-${ROUTE_UUID}-out`, target: '3', zIndex: 5 },
      { source: `2-route-${OTHER_UUID}-out`, target: '4', zIndex: 5 },
    ]);
  });

  it('Human SELECT 的多个选项连接同一目标时保留各自分支', () => {
    const nodes = workflowNodes(
      node(2, NodeTypeEnum.HumanInteraction, {
        answerType: HitlAnswerTypeEnum.SELECT,
        options: [
          { uuid: OPTION_UUID, content: 'A', nextNodeIds: [99] },
          { uuid: 'other-option-uuid', content: 'B', nextNodeIds: [99] },
        ],
      }),
    );
    const result = roundTrip(nodes, [
      {
        source: '2',
        target: '3',
        sourcePort: `2-hitl-option-${OPTION_UUID}-out`,
      },
      {
        source: '2',
        target: '3',
        sourcePort: '2-hitl-option-other-option-uuid-out',
      },
    ]);
    expect(result.backendNodes[1].type).toBe(NodeTypeEnum.QA);
    expect(
      (result.backendNodes[1].nodeConfig as any).options.map(
        (option: any) => option.nextNodeIds,
      ),
    ).toEqual([[3], [3]]);
    expect(result.loadedNodes[1].type).toBe(NodeTypeEnum.HumanInteraction);
    expect(result.edges).toEqual([
      { source: `2-hitl-option-${OPTION_UUID}-out`, target: '3', zIndex: 1 },
      { source: '2-hitl-option-other-option-uuid-out', target: '3', zIndex: 1 },
    ]);
  });

  it.each([HitlAnswerTypeEnum.TEXT, HitlAnswerTypeEnum.FORM])(
    'Human %s 保留普通 nextNodeIds',
    (answerType) => {
      const result = roundTrip(
        workflowNodes(
          node(2, NodeTypeEnum.HumanInteraction, {
            answerType,
            options: [{ uuid: OPTION_UUID, nextNodeIds: [99] }],
            formArgs:
              answerType === HitlAnswerTypeEnum.FORM
                ? [{ name: 'reply', inputType: 'Text' }]
                : [],
          }),
        ),
        [{ source: '2', target: '3', sourcePort: '2-out' }],
      );
      expect(result.backendNodes[1].type).toBe(NodeTypeEnum.QA);
      expect(result.backendNodes[1].nodeConfig?.answerType).toBe(answerType);
      expect(result.backendNodes[1].nextNodeIds).toEqual([3]);
      expect(result.edges).toEqual([{ source: '2', target: '3', zIndex: 1 }]);
    },
  );

  it.each([
    { name: '空 options', options: [] },
    { name: '选项未连线', options: [{ uuid: OPTION_UUID, nextNodeIds: [] }] },
  ])('SELECT 没有实际选项边时保留普通 fallback（$name）', ({ options }) => {
    const result = roundTrip(
      workflowNodes(
        node(2, NodeTypeEnum.HumanInteraction, {
          answerType: HitlAnswerTypeEnum.SELECT,
          options,
        }),
      ),
      [{ source: '2', target: '3', sourcePort: '2-out' }],
    );
    expect(result.backendNodes[1].nextNodeIds).toEqual([3]);
    expect(result.edges).toEqual([{ source: '2', target: '3', zIndex: 1 }]);
  });

  it.each([NodeTypeEnum.RouteDecision, NodeTypeEnum.HumanInteraction])(
    '删边后 %s 的旧分支引用不会持久化',
    (type) => {
      const result = roundTrip(
        workflowNodes(
          node(2, type, {
            defaultNextNodeIds: [3],
            intentConfigs: [{ uuid: ROUTE_UUID, nextNodeIds: [3] }],
            answerType: HitlAnswerTypeEnum.SELECT,
            options: [{ uuid: OPTION_UUID, nextNodeIds: [3] }],
          }),
        ),
        [],
      );
      const nc = result.backendNodes[1].nodeConfig as any;
      if (type === NodeTypeEnum.RouteDecision) {
        expect(nc.defaultNextNodeIds).toEqual([]);
        expect(nc.intentConfigs[0].nextNodeIds).toEqual([]);
      } else {
        expect(nc.options[0].nextNodeIds).toEqual([]);
      }
      expect(result.edges).toEqual([]);
    },
  );

  it('未注册节点类型保存和重载走普通连线', () => {
    const result = roundTrip(workflowNodes(node(2, UNKNOWN_NODE)), [
      { source: '2', target: '3', sourcePort: '2-out' },
    ]);
    expect(result.backendNodes[1].type).toBe(UNKNOWN_NODE);
    expect(result.edges).toEqual([{ source: '2', target: '3', zIndex: 1 }]);
  });

  it('新注册 handler 可保存和重载分支，无需修改核心节点白名单', () => {
    const result = roundTrip(
      workflowNodes(
        node(2, CUSTOM_BRANCH, {
          choices: [{ uuid: OPTION_UUID, nextNodeIds: [99] }],
        }),
      ),
      [{ source: '2', target: '3', sourcePort: `2-review-${OPTION_UUID}-out` }],
    );
    expect(
      (result.backendNodes[1].nodeConfig as any).choices[0].nextNodeIds,
    ).toEqual([3]);
    expect(result.backendNodes[1].type).toBe(CUSTOM_BRANCH);
    expect(result.edges).toEqual([
      { source: `2-review-${OPTION_UUID}-out`, target: '3', zIndex: 1 },
    ]);
  });
});

describe('proxy 同步后真实重载回归', () => {
  it.each([
    { name: '空 options', options: [] },
    { name: '选项未连线', options: [{ uuid: OPTION_UUID, nextNodeIds: [] }] },
    {
      name: '旧选项边已删除',
      options: [{ uuid: OPTION_UUID, nextNodeIds: [4] }],
    },
  ])('SELECT 普通 fallback 同步后不会丢失（$name）', ({ options }) => {
    const result = syncAndRoundTrip(
      workflowNodes(
        node(2, NodeTypeEnum.HumanInteraction, {
          answerType: HitlAnswerTypeEnum.SELECT,
          options,
        }),
      ),
      [{ source: '2', target: '3', sourcePort: '2-out' }],
    );
    expect(result.nodes[1].nextNodeIds).toEqual([3]);
    expect(
      (result.nodes[1].nodeConfig?.options || []).every(
        (option) => option.nextNodeIds?.length === 0,
      ),
    ).toBe(true);
    expect(result.edges).toEqual([{ source: '2', target: '3', zIndex: 1 }]);
  });

  it('SELECT 首次接上选项边后清掉普通路径并保留分支目标', () => {
    const result = syncAndRoundTrip(
      workflowNodes(
        node(
          2,
          NodeTypeEnum.HumanInteraction,
          {
            answerType: HitlAnswerTypeEnum.SELECT,
            options: [{ uuid: OPTION_UUID, nextNodeIds: [] }],
          },
          { nextNodeIds: [4] },
        ),
      ),
      [
        {
          source: '2',
          target: '3',
          sourcePort: `2-hitl-option-${OPTION_UUID}-out`,
        },
      ],
    );
    expect(result.nodes[1].nextNodeIds).toEqual([]);
    expect(result.nodes[1].nodeConfig?.options?.[0].nextNodeIds).toEqual([3]);
    expect(result.edges).toEqual([
      { source: `2-hitl-option-${OPTION_UUID}-out`, target: '3', zIndex: 1 },
    ]);
  });

  it('SELECT 删掉全部选项边后不会从旧配置复活', () => {
    const result = syncAndRoundTrip(
      workflowNodes(
        node(2, NodeTypeEnum.HumanInteraction, {
          answerType: HitlAnswerTypeEnum.SELECT,
          options: [{ uuid: OPTION_UUID, nextNodeIds: [3] }],
        }),
      ),
      [],
    );
    expect(result.nodes[1].nodeConfig?.options?.[0].nextNodeIds).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('扩展 handler 的 branch key 优先于旧 Normal 枚举路径', () => {
    const result = syncAndRoundTrip(
      workflowNodes(
        node(2, CUSTOM_BRANCH, {
          choices: [{ uuid: OPTION_UUID, nextNodeIds: [] }],
        }),
      ),
      [
        { source: '2', target: '3', sourcePort: `2-review-${OPTION_UUID}-out` },
        { source: '2', target: '3', sourcePort: `2-review-${OPTION_UUID}-out` },
      ],
    );
    expect((result.nodes[1].nodeConfig as any).choices[0].nextNodeIds).toEqual([
      3,
    ]);
    expect(result.nodes[1].nextNodeIds).toEqual([]);
    expect(result.edges).toEqual([
      { source: `2-review-${OPTION_UUID}-out`, target: '3', zIndex: 1 },
    ]);
  });
});

describe('扩展边生成的核心边界', () => {
  it('handler 返回 [] 时不回落，null 和未实现时回落普通 nextNodeIds', () => {
    const EMPTY_HANDLER = 'TestEmptyBranchHandler' as NodeTypeEnum;
    const FALLBACK_HANDLER = 'TestFallbackBranchHandler' as NodeTypeEnum;
    const METADATA_HANDLER = 'TestMetadataHandler' as NodeTypeEnum;
    extensionRegistry.register({
      nodeType: EMPTY_HANDLER,
      generateEdges: () => [],
    });
    extensionRegistry.register({
      nodeType: FALLBACK_HANDLER,
      generateEdges: () => null,
    });
    extensionRegistry.register({ nodeType: METADATA_HANDLER });
    expect(
      getEdges([
        node(2, EMPTY_HANDLER, {}, { nextNodeIds: [3] }),
        node(5, FALLBACK_HANDLER, {}, { nextNodeIds: [3] }),
        node(6, METADATA_HANDLER, {}, { nextNodeIds: [3] }),
        node(3, NodeTypeEnum.End),
      ]),
    ).toEqual([
      { source: '5', target: '3', zIndex: 1 },
      { source: '6', target: '3', zIndex: 1 },
    ]);
  });

  it('Route 空分支不回落旧 nextNodeIds', () => {
    expect(
      getEdges(
        workflowNodes(
          node(
            2,
            NodeTypeEnum.RouteDecision,
            {
              defaultNextNodeIds: [],
              intentConfigs: [],
            },
            { nextNodeIds: [3] },
          ),
        ),
      ),
    ).toEqual([]);
  });

  it('扩展生成边仍经过统一目标校验、去重和异常边追加', () => {
    const GENERATED_HANDLER = 'TestGeneratedEdgesHandler' as NodeTypeEnum;
    extensionRegistry.register({
      nodeType: GENERATED_HANDLER,
      generateEdges: () => [
        { source: '2-choice-full-uuid-out', target: '3', zIndex: 1 },
        { source: '2-choice-full-uuid-out', target: '3', zIndex: 1 },
        { source: '2-choice-full-uuid-out', target: '99', zIndex: 1 },
      ],
    });
    const generatedNodes = workflowNodes(node(2, GENERATED_HANDLER));
    const exceptionalNode = node(
      5,
      NodeTypeEnum.LLM,
      {
        exceptionHandleConfig: {
          exceptionHandleType: ExceptionHandleTypeEnum.EXECUTE_EXCEPTION_FLOW,
          exceptionHandleNodeIds: [4],
        },
      },
      { loopNodeId: 10 },
    );
    expect(getEdges([...generatedNodes, exceptionalNode])).toEqual([
      { source: '2-choice-full-uuid-out', target: '3', zIndex: 1 },
      { source: '5-exception-out', target: '4', zIndex: 5 },
    ]);
    expect(getEdges(generatedNodes, false)).toEqual([
      { source: '2-choice-full-uuid-out', target: '3', zIndex: 1 },
      { source: '2-choice-full-uuid-out', target: '99', zIndex: 1 },
    ]);
  });
});
