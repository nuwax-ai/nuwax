import {
  BG_ICON_AGENTFLOW_AGENT,
  BG_ICON_AGENTFLOW_HUMAN_ASK,
  BG_ICON_AGENTFLOW_ROUTE_DECISION,
} from '@/constants/images.constants';
import { t } from '@/services/i18nRuntime';
import { NodeShapeEnum, NodeTypeEnum } from '@/types/enums/common';
import type { StencilChildNode, StencilList } from '@/types/interfaces/graph';
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
import { HitlModeEnum } from './agentFlow/enums/hitlMode';
import { assignFlowKinds } from './flowKind/flowKindConfig';

/** 给子节点列表统一附加 flowKinds 标记 */
const tagFlowKinds = (children: StencilChildNode[]) =>
  children.map(assignFlowKinds);

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
    // group3 需要额外插入 VariableAggregation 节点
    if (group.key === 'group3') {
      const hasAggregation = (group.children || []).some(
        (child) => child.type === NodeTypeEnum.VariableAggregation,
      );
      if (!hasAggregation) {
        const children = [...(group.children || [])];
        const variableIndex = children.findIndex(
          (child) => child.type === NodeTypeEnum.Variable,
        );
        const insertIndex =
          variableIndex >= 0 ? variableIndex + 1 : children.length;
        children.splice(insertIndex, 0, variableAggregationNode);
        return { ...group, children: tagFlowKinds(children) };
      }
    }

    return { ...group, children: tagFlowKinds(group.children || []) };
  });
};

// ── AgentFlow 处理节点组（flowKinds 由 assignFlowKinds 自动附加） ──
const agentFlowProcessGroup: StencilList = {
  name: t('PC.Pages.AgentFlowParams.groupAgentFlowProcess'),
  key: 'groupAgentFlowProcess',
  children: tagFlowKinds([
    {
      name: t('PC.Pages.AgentFlowParams.nodeRouteDecisionName'),
      icon: null,
      bgIcon: BG_ICON_AGENTFLOW_ROUTE_DECISION,
      type: NodeTypeEnum.RouteDecision,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeRouteDecisionDescription'),
    },
    {
      name: t('PC.Pages.AgentFlowParams.nodeAgentName'),
      icon: null,
      bgIcon: BG_ICON_AGENTFLOW_AGENT,
      type: NodeTypeEnum.Agent,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeAgentDescription'),
    },
    {
      name: t('PC.Pages.AgentFlowParams.nodeHumanAskName'),
      icon: null,
      bgIcon: BG_ICON_AGENTFLOW_HUMAN_ASK,
      type: NodeTypeEnum.HumanInteraction,
      shape: NodeShapeEnum.General,
      description: t('PC.Pages.AgentFlowParams.nodeHumanAskDescription'),
      nodeConfig: { hitlMode: HitlModeEnum.Ask } as any,
    },
  ]),
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
