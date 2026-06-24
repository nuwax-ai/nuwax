import {
  BG_ICON_AGENTFLOW_AGENT,
  BG_ICON_AGENTFLOW_HUMAN_ASK,
  BG_ICON_AGENTFLOW_ROUTE_DECISION,
} from '@/constants/images.constants';
import { t } from '@/services/i18nRuntime';
import {
  FlowKindEnum,
  HitlModeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import type { StencilList } from '@/types/interfaces/graph';
import {
  InputConfigs,
  asideList as baseAsideList,
  cycleOption,
  dataTypes,
  intentionConfigs,
  leftMenuList,
  modelConfigs,
  modelTypes,
  options,
  outPutConfigs,
  tableOptions,
} from '../params';

// ── 仅 Workflow 可见的节点类型（AgentFlow 下不展示） ──
const WORKFLOW_ONLY_TYPES = new Set<NodeTypeEnum>([
  NodeTypeEnum.LLM,
  NodeTypeEnum.Code,
  NodeTypeEnum.Condition,
  NodeTypeEnum.Loop,
  NodeTypeEnum.LoopBreak,
  NodeTypeEnum.LoopContinue,
  NodeTypeEnum.Knowledge,
  NodeTypeEnum.Variable,
  NodeTypeEnum.VariableAggregation,
  NodeTypeEnum.LongTermMemory,
  NodeTypeEnum.QA,
  NodeTypeEnum.TextProcessing,
  NodeTypeEnum.DocumentExtraction,
  NodeTypeEnum.MCP,
  NodeTypeEnum.HTTPRequest,
  NodeTypeEnum.IntentRecognition,
  NodeTypeEnum.TableDataAdd,
  NodeTypeEnum.Plugin,
  NodeTypeEnum.Output,
  NodeTypeEnum.TableDataDelete,
  NodeTypeEnum.TableDataUpdate,
  NodeTypeEnum.TableDataQuery,
  NodeTypeEnum.TableSQL,
]);

const buildV3AsideList = (): StencilList[] => {
  const variableNode = baseAsideList
    .flatMap((group) => group.children || [])
    .find((child) => child.type === NodeTypeEnum.Variable);

  const variableAggregationNode = {
    name: t('PC.Pages.AntvX6Params.nodeVariableAggregationName'),
    icon: variableNode?.icon || null,
    bgIcon: variableNode?.bgIcon || '',
    type: NodeTypeEnum.VariableAggregation,
    shape: NodeShapeEnum.General,
    description: t('PC.Pages.AntvX6Params.nodeVariableAggregationDescription'),
  };

  return baseAsideList.map((group) => {
    if (group.key !== 'group3') {
      // 给非 group3 的节点添加 flowKinds 限制
      return {
        ...group,
        children: (group.children || []).map((child) => {
          if (WORKFLOW_ONLY_TYPES.has(child.type)) {
            return { ...child, flowKinds: [FlowKindEnum.Workflow] };
          }
          return child;
        }),
      };
    }

    // group3: 添加 VariableAggregation，并添加 flowKinds 限制
    if (
      (group.children || []).some(
        (child) => child.type === NodeTypeEnum.VariableAggregation,
      )
    ) {
      return {
        ...group,
        children: (group.children || []).map((child) => {
          if (WORKFLOW_ONLY_TYPES.has(child.type)) {
            return { ...child, flowKinds: [FlowKindEnum.Workflow] };
          }
          return child;
        }),
      };
    }

    const children = [...(group.children || [])];
    const variableIndex = children.findIndex(
      (child) => child.type === NodeTypeEnum.Variable,
    );
    const insertIndex =
      variableIndex >= 0 ? variableIndex + 1 : children.length;

    children.splice(insertIndex, 0, variableAggregationNode);

    return {
      ...group,
      children: children.map((child) => {
        if (WORKFLOW_ONLY_TYPES.has(child.type)) {
          return { ...child, flowKinds: [FlowKindEnum.Workflow] };
        }
        return child;
      }),
    };
  });
};

// ── AgentFlow 处理节点组 ──
const agentFlowProcessGroup: StencilList = {
  name: t('PC.Pages.AgentFlowParams.groupAgentFlowProcess'),
  key: 'groupAgentFlowProcess',
  children: [
    {
      name: t('PC.Pages.AgentFlowParams.nodeRouteDecisionName'),
      icon: null,
      bgIcon: BG_ICON_AGENTFLOW_ROUTE_DECISION,
      type: NodeTypeEnum.RouteDecision,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeRouteDecisionDescription'),
      flowKinds: [FlowKindEnum.AgentFlow],
    },
    {
      name: t('PC.Pages.AgentFlowParams.nodeAgentName'),
      icon: null,
      bgIcon: BG_ICON_AGENTFLOW_AGENT,
      type: NodeTypeEnum.Agent,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeAgentDescription'),
      flowKinds: [FlowKindEnum.AgentFlow],
    },
    {
      name: t('PC.Pages.AgentFlowParams.nodeHumanAskName'),
      icon: null,
      bgIcon: BG_ICON_AGENTFLOW_HUMAN_ASK,
      type: NodeTypeEnum.HumanInteraction,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeHumanAskDescription'),
      flowKinds: [FlowKindEnum.AgentFlow],
      nodeConfig: { hitlMode: HitlModeEnum.Ask } as any,
    },
  ],
};

export const asideList: StencilList[] = [
  ...buildV3AsideList(),
  agentFlowProcessGroup,
];

export {
  InputConfigs,
  cycleOption,
  dataTypes,
  intentionConfigs,
  leftMenuList,
  modelConfigs,
  modelTypes,
  options,
  outPutConfigs,
  tableOptions,
};
