import { t } from '@/services/i18nRuntime';
import {
  FlowKindEnum,
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
      return group;
    }

    if (
      (group.children || []).some(
        (child) => child.type === NodeTypeEnum.VariableAggregation,
      )
    ) {
      return group;
    }

    const children = [...(group.children || [])];
    const variableIndex = children.findIndex(
      (child) => child.type === NodeTypeEnum.Variable,
    );
    const insertIndex =
      variableIndex >= 0 ? variableIndex + 1 : children.length;

    children.splice(insertIndex, 0, variableAggregationNode);
    return { ...group, children };
  });
};

// AgentFlow 专用节点：仅在 flowKind=AgentFlow 时显示在 Stencil 里
const agentFlowGroup: StencilList = {
  name: t('PC.Pages.AgentFlowParams.groupAgentFlow'),
  key: 'groupAgentFlow',
  children: [
    {
      name: t('PC.Pages.AgentFlowParams.nodeAgentName'),
      icon: null,
      bgIcon: '',
      type: NodeTypeEnum.Agent,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeAgentDescription'),
      flowKinds: [FlowKindEnum.AgentFlow],
    },
    {
      name: t('PC.Pages.AgentFlowParams.nodeEvalGateName'),
      icon: null,
      bgIcon: '',
      type: NodeTypeEnum.EvalGate,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeEvalGateDescription'),
      flowKinds: [FlowKindEnum.AgentFlow],
    },
    {
      name: t('PC.Pages.AgentFlowParams.nodeHumanInteractionName'),
      icon: null,
      bgIcon: '',
      type: NodeTypeEnum.HumanInteraction,
      shape: NodeShapeEnum.General,
      description: t(
        'PC.Pages.AgentFlowParams.nodeHumanInteractionDescription',
      ),
      flowKinds: [FlowKindEnum.AgentFlow],
    },
    {
      name: t('PC.Pages.AgentFlowParams.nodeExternalConnectorName'),
      icon: null,
      bgIcon: '',
      type: NodeTypeEnum.ExternalConnector,
      shape: NodeShapeEnum.General,
      description: t(
        'PC.Pages.AgentFlowParams.nodeExternalConnectorDescription',
      ),
      flowKinds: [FlowKindEnum.AgentFlow],
    },
  ],
};

export const asideList: StencilList[] = [...buildV3AsideList(), agentFlowGroup];

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
