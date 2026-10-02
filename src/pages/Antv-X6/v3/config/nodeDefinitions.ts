/**
 * 已迁移节点的静态定义。只存纯数据与配置构造函数；React 面板和分支行为
 * 分别留在 NodeRegistry / extensionRegistry，不能从这里导入。
 */
import agentBgIcon from '@/assets/workflow/workflow-Agent.svg';
import humanAskBgIcon from '@/assets/workflow/workflow-HumanAsk.svg';
import routeDecisionBgIcon from '@/assets/workflow/workflow-RouteDecision.svg';
import {
  AnswerTypeEnum,
  DataTypeEnum,
  FlowKindEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import type { Extension, NodeConfig } from '@/types/interfaces/node';
import { HitlModeEnum } from '../agentFlow/enums/hitlMode';
import {
  createDefaultArg,
  createDefaultExceptionHandleConfig,
  createDefaultIntentConfig,
} from './nodeDefaultHelpers';

/** 纯资源键，由画布展示层绑定现有 SVG React 组件。 */
export type NodeCanvasIcon = 'agent' | 'routeDecision' | 'humanAsk';

export interface NodeDefinition {
  readonly type: NodeTypeEnum;
  readonly palette: {
    readonly nameKey: string;
    readonly descriptionKey: string;
    readonly shape: NodeShapeEnum;
    readonly createNodeConfig?: () => NodeConfig;
  };
  readonly flowKinds: readonly FlowKindEnum[];
  readonly order: number;
  readonly defaultName: string;
  readonly createDefaultConfig: (extension?: Extension) => NodeConfig;
  readonly appearance: {
    readonly bgIcon: string;
    readonly bgColor: string;
    readonly canvasIcon: NodeCanvasIcon;
    readonly customIcon?: boolean;
  };
  /** 缺省表示前后端 type 一致。 */
  readonly backendType?: NodeTypeEnum;
}

const createBaseConfig = (extension?: Extension): NodeConfig => ({
  extension: extension ? { ...extension } : { x: 0, y: 0 },
  exceptionHandleConfig: createDefaultExceptionHandleConfig(),
});

export const NODE_DEFINITIONS: readonly NodeDefinition[] = [
  {
    type: NodeTypeEnum.Agent,
    palette: {
      nameKey: 'PC.Pages.AgentFlowParams.nodeAgentName',
      descriptionKey: 'PC.Pages.AgentFlowParams.nodeAgentDescription',
      shape: NodeShapeEnum.General,
    },
    flowKinds: [FlowKindEnum.AgentFlow],
    order: 0,
    defaultName: '智能体',
    createDefaultConfig: (extension) => ({
      ...createBaseConfig(extension),
      extraPrompt: '',
      selfLoopTimes: 0,
      reminderPrompt: '',
      inputArgs: [],
      outputArgs: [
        createDefaultArg({
          key: 'output',
          name: 'output',
          dataType: DataTypeEnum.String,
          description: 'Agent reply',
          require: true,
          systemVariable: true,
        }),
      ],
    }),
    appearance: {
      bgIcon: agentBgIcon,
      bgColor: '#E8F5E9',
      canvasIcon: 'agent',
      customIcon: true,
    },
  },
  {
    type: NodeTypeEnum.RouteDecision,
    palette: {
      nameKey: 'PC.Pages.AgentFlowParams.nodeRouteDecisionName',
      descriptionKey: 'PC.Pages.AgentFlowParams.nodeRouteDecisionDescription',
      shape: NodeShapeEnum.General,
    },
    flowKinds: [FlowKindEnum.AgentFlow],
    order: 1,
    defaultName: '路由决策',
    createDefaultConfig: (extension) => ({
      ...createBaseConfig(extension),
      intentConfigs: createDefaultIntentConfig(),
      extraPrompt: '',
      modelId: undefined,
      inputArgs: [],
      outputArgs: [
        createDefaultArg({
          key: 'matchedIntent',
          name: 'matchedIntent',
          dataType: DataTypeEnum.String,
          description: 'Matched intent',
          require: true,
          systemVariable: true,
        }),
      ],
    }),
    appearance: {
      bgIcon: routeDecisionBgIcon,
      bgColor: '#FFF3E0',
      canvasIcon: 'routeDecision',
    },
    backendType: NodeTypeEnum.IntentRecognition,
  },
  {
    type: NodeTypeEnum.HumanInteraction,
    palette: {
      nameKey: 'PC.Pages.AgentFlowParams.nodeHumanAskName',
      descriptionKey: 'PC.Pages.AgentFlowParams.nodeHumanAskDescription',
      shape: NodeShapeEnum.General,
      createNodeConfig: () => ({ hitlMode: HitlModeEnum.Ask }),
    },
    flowKinds: [FlowKindEnum.AgentFlow],
    order: 2,
    defaultName: '询问用户',
    createDefaultConfig: (extension) => ({
      ...createBaseConfig(extension),
      question: '',
      answerType: AnswerTypeEnum.TEXT,
      options: [],
      formArgs: [],
      inputArgs: [],
      outputArgs: [
        createDefaultArg({
          key: 'answer',
          name: 'answer',
          dataType: DataTypeEnum.String,
          description: 'User answer',
          require: true,
          systemVariable: true,
        }),
      ],
    }),
    appearance: {
      bgIcon: humanAskBgIcon,
      bgColor: '#E3F2FD',
      canvasIcon: 'humanAsk',
    },
    backendType: NodeTypeEnum.QA,
  },
];

const definitionsByType = new Map(
  NODE_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function getNodeDefinition(
  type: NodeTypeEnum | string | undefined | null,
): NodeDefinition | undefined {
  return type ? definitionsByType.get(type as NodeTypeEnum) : undefined;
}

export function getNodeDefinitionsForFlow(
  flowKind: FlowKindEnum,
): NodeDefinition[] {
  return NODE_DEFINITIONS.filter((definition) =>
    definition.flowKinds.includes(flowKind),
  ).sort((a, b) => a.order - b.order);
}
