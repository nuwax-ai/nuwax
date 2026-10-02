import {
  AnswerTypeEnum,
  DataTypeEnum,
  FlowKindEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { describe, expect, it, vi } from 'vitest';
import { asideList } from '../../ParamsV3';
import {
  isFrontendMappedType,
  normalizeLoadedNode,
  serializeNodeForBackend,
  toBackendNodeType,
} from '../../agentFlow/nodeTypeMapping';
import {
  AGENT_FLOW_NODE_TYPES,
  AGENT_FLOW_STENCIL_ORDER,
  assignFlowKinds,
  getFlowKindsForNode,
} from '../../flowKind/flowKindConfig';
import {
  createDefaultNodeConfig,
  NODE_DEFAULT_NAMES,
} from '../../utils/nodeDefaultConfigFactory';
import {
  getNodeDefinition,
  getNodeDefinitionsForFlow,
  NODE_DEFINITIONS,
} from '../nodeDefinitions';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => `translated:${key}`,
}));

// 原有 Workflow palette 是外部输入；验证新增定义不会改写其创建配置。
vi.mock('@/pages/Antv-X6/params', async () => {
  const { NodeTypeEnum } = await import('@/types/enums/common');
  return {
    asideList: [
      {
        key: 'group1',
        name: 'existing',
        children: [
          {
            type: NodeTypeEnum.Workflow,
            name: 'Workflow',
            bgIcon: 'workflow.svg',
            nodeConfig: { workflowId: 42 },
          },
          { type: NodeTypeEnum.QA, name: 'QA', bgIcon: 'qa.svg' },
        ],
      },
      {
        key: 'group3',
        name: 'variables',
        children: [
          {
            type: NodeTypeEnum.Variable,
            name: 'Variable',
            bgIcon: 'variable.svg',
          },
        ],
      },
    ],
    InputConfigs: [],
    cycleOption: [],
    dataTypes: [],
    intentionConfigs: [],
    leftMenuList: [],
    modelConfigs: [],
    modelTypes: [],
    options: [],
    outPutConfigs: [],
    tableOptions: [],
  };
});

const expectedTypes = [
  NodeTypeEnum.Agent,
  NodeTypeEnum.RouteDecision,
  NodeTypeEnum.HumanInteraction,
];

function expectDistinctObjects(first: unknown, second: unknown): void {
  if (
    first &&
    second &&
    typeof first === 'object' &&
    typeof second === 'object'
  ) {
    expect(first).not.toBe(second);
    for (const key of Object.keys(first)) {
      expectDistinctObjects(
        (first as Record<string, unknown>)[key],
        (second as Record<string, unknown>)[key],
      );
    }
  }
}

describe('node definitions', () => {
  it('只迁移已有 3 个 AgentFlow 节点，保留调色板与第 4 项 Workflow 顺序', () => {
    expect(NODE_DEFINITIONS.map(({ type }) => type)).toEqual(expectedTypes);
    expect(
      getNodeDefinitionsForFlow(FlowKindEnum.AgentFlow).map(({ type }) => type),
    ).toEqual(expectedTypes);
    expect(getNodeDefinitionsForFlow(FlowKindEnum.Workflow)).toEqual([]);
    expect([...AGENT_FLOW_NODE_TYPES]).toEqual(expectedTypes);
    expect(AGENT_FLOW_STENCIL_ORDER).toEqual([
      ...expectedTypes,
      NodeTypeEnum.Workflow,
    ]);
  });

  it.each([
    [NodeTypeEnum.Agent, '智能体', 'output', 'Agent reply'],
    [NodeTypeEnum.RouteDecision, '路由决策', 'matchedIntent', 'Matched intent'],
    [NodeTypeEnum.HumanInteraction, '询问用户', 'answer', 'User answer'],
  ])('%s 保留默认名称、参数字段与异常配置', (type, name, key, description) => {
    const config = createDefaultNodeConfig(type as NodeTypeEnum);
    expect(NODE_DEFAULT_NAMES[type as NodeTypeEnum]).toBe(name);
    expect(config.extension).toEqual({ x: 0, y: 0 });
    expect(config.exceptionHandleConfig).toEqual({
      retryCount: 0,
      timeout: 180,
      exceptionHandleType: 'INTERRUPT',
      specificContent: {},
      exceptionHandleNodeIds: [],
    });
    expect(config.inputArgs).toEqual([]);
    expect(config.outputArgs).toEqual([
      {
        key,
        name: key,
        displayName: null,
        description,
        dataType: DataTypeEnum.String,
        originDataType: null,
        require: true,
        enable: true,
        systemVariable: true,
        bindValueType: null,
        bindValue: null,
        subArgs: null,
        inputType: null,
        selectConfig: null,
        loopId: null,
        children: null,
      },
    ]);
  });

  it.each(expectedTypes)('%s 每次新建配置的所有嵌套对象均独立', (type) => {
    const definition = getNodeDefinition(type)!;
    const extension = { x: 10, y: 20 };
    const first = definition.createDefaultConfig(extension);
    const second = createDefaultNodeConfig(type, extension);
    expectDistinctObjects(first, second);
    first.extension!.x = 99;
    first.outputArgs![0].description = 'changed';
    first.exceptionHandleConfig!.exceptionHandleNodeIds!.push(123);
    expect(second.extension).toEqual(extension);
    expect(extension.x).toBe(10);
    expect(second.outputArgs![0].description).not.toBe('changed');
    expect(second.exceptionHandleConfig!.exceptionHandleNodeIds).toEqual([]);
  });

  it('保留路由默认分支、询问默认文本以及智能体额外配置', () => {
    const route = createDefaultNodeConfig(NodeTypeEnum.RouteDecision);
    expect(route.intentConfigs).toHaveLength(2);
    expect(route.intentConfigs![0]).toMatchObject({
      intentType: 'NORMAL',
      conditionType: 'AND',
      conditionArgs: [{ compareType: 'EQUAL' }],
      nextNodeIds: [],
    });
    expect(route.intentConfigs![0].uuid).toMatch(/^intent-/);
    expect(route.intentConfigs![1]).toMatchObject({
      name: '其他意图',
      intentType: 'OTHER',
      conditionArgs: [],
      nextNodeIds: [],
    });
    expect(
      createDefaultNodeConfig(NodeTypeEnum.HumanInteraction),
    ).toMatchObject({
      question: '',
      answerType: AnswerTypeEnum.TEXT,
      options: [],
      formArgs: [],
    });
    expect(createDefaultNodeConfig(NodeTypeEnum.Agent)).toMatchObject({
      extraPrompt: '',
      selfLoopTimes: 0,
      reminderPrompt: '',
    });
  });

  it('palette 从定义取文案与资源，HumanInteraction 创建标记仍为 ask', () => {
    const children = asideList.find(
      ({ key }) => key === 'groupAgentFlowProcess',
    )!.children;
    expect(children.map(({ type }) => type)).toEqual(expectedTypes);
    for (const node of children) {
      const definition = getNodeDefinition(node.type)!;
      expect(node.name).toBe(`translated:${definition.palette.nameKey}`);
      expect(node.description).toBe(
        `translated:${definition.palette.descriptionKey}`,
      );
      expect(node.bgIcon).toBe(definition.appearance.bgIcon);
      expect(node.shape).toBe(NodeShapeEnum.General);
      expect(node.flowKinds).toEqual([FlowKindEnum.AgentFlow]);
    }
    expect(children[2].nodeConfig).toEqual({ hitlMode: 'ask' });
    expect(
      createDefaultNodeConfig(NodeTypeEnum.HumanInteraction).hitlMode,
    ).toBeUndefined();
    const createPaletteConfig = getNodeDefinition(
      NodeTypeEnum.HumanInteraction,
    )!.palette.createNodeConfig!;
    expect(createPaletteConfig()).not.toBe(createPaletteConfig());
  });

  it('前后端类型映射与定义一致，Agent identity 不产生复制或配置改写', () => {
    for (const type of expectedTypes) {
      const definition = getNodeDefinition(type)!;
      const local = { type, nodeConfig: definition.createDefaultConfig() };
      const backendType = definition.backendType ?? type;
      expect(toBackendNodeType(type)).toBe(backendType);
      expect(isFrontendMappedType(type)).toBe(backendType !== type);
      const serialized = serializeNodeForBackend(local);
      expect(serialized.type).toBe(backendType);
      expect(serialized.nodeConfig).toBe(local.nodeConfig);
      expect(normalizeLoadedNode(serialized, true).type).toBe(type);
      if (backendType === type) expect(serialized).toBe(local);
    }
  });

  it('保留公共 Workflow palette、Workflow 专属节点与未知类型 fallback', () => {
    const workflow = asideList[0].children[0];
    expect(workflow.flowKinds).toBeUndefined();
    expect(workflow.nodeConfig).toEqual({ workflowId: 42 });
    expect(asideList[0].children[1].flowKinds).toEqual([FlowKindEnum.Workflow]);
    expect(getFlowKindsForNode(NodeTypeEnum.Start)).toBeUndefined();
    const unknown = { type: 'LegacyUnknown' as NodeTypeEnum, name: 'saved' };
    expect(getNodeDefinition(unknown.type)).toBeUndefined();
    expect(assignFlowKinds(unknown)).toBe(unknown);
    expect(toBackendNodeType(unknown.type)).toBe(unknown.type);
    expect(normalizeLoadedNode(unknown, true)).toBe(unknown);
    expect(createDefaultNodeConfig(unknown.type)).toMatchObject({
      extension: { x: 0, y: 0 },
      inputArgs: [],
      outputArgs: [],
    });
  });

  it('未迁移的 QA/意图/条件/Workflow 默认工厂保持原有结构', () => {
    const qa = createDefaultNodeConfig(NodeTypeEnum.QA);
    expect(qa.answerType).toBe(AnswerTypeEnum.SELECT);
    expect(qa.options).toEqual([
      {
        uuid: expect.stringMatching(/^option-/),
        index: 0,
        content: 'Option 1',
        nextNodeIds: [],
      },
    ]);
    const intent = createDefaultNodeConfig(NodeTypeEnum.IntentRecognition);
    expect(intent.intentConfigs!.map(({ intentType }) => intentType)).toEqual([
      'NORMAL',
      'OTHER',
    ]);
    expect(intent.outputArgs![0].key).toBe('matchedIntent');
    expect(
      createDefaultNodeConfig(
        NodeTypeEnum.Condition,
      ).conditionBranchConfigs!.map(({ branchType }) => branchType),
    ).toEqual(['IF', 'ELSE']);
    const extension = { x: 11, y: 12 };
    const workflow = createDefaultNodeConfig(NodeTypeEnum.Workflow, extension);
    expect(workflow.extension).toBe(extension);
    expect(workflow.inputArgs).toEqual([]);
    expect(workflow.outputArgs).toEqual([]);
    expect(NODE_DEFAULT_NAMES[NodeTypeEnum.Workflow]).toBe('Workflow');
  });

  it('flowKinds 返回独立数组，消费者修改不会污染定义或后续查询', () => {
    const first = getFlowKindsForNode(NodeTypeEnum.Agent)!;
    first.push(FlowKindEnum.Workflow);
    expect(getFlowKindsForNode(NodeTypeEnum.Agent)).toEqual([
      FlowKindEnum.AgentFlow,
    ]);
    const node = { type: NodeTypeEnum.Agent };
    expect(assignFlowKinds(node)).toEqual({
      type: NodeTypeEnum.Agent,
      flowKinds: [FlowKindEnum.AgentFlow],
    });
    expect(node).toEqual({ type: NodeTypeEnum.Agent });
  });
});
