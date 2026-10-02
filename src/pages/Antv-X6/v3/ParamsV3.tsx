import { t } from '@/services/i18nRuntime';
import {
  FlowKindEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
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
import { getNodeDefinitionsForFlow } from './config/nodeDefinitions';
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
  children: getNodeDefinitionsForFlow(FlowKindEnum.AgentFlow).map(
    ({ type, palette, appearance, flowKinds }) => ({
      type,
      name: t(palette.nameKey),
      description: t(palette.descriptionKey),
      icon: null,
      bgIcon: appearance.bgIcon,
      shape: palette.shape,
      flowKinds: [...flowKinds],
      ...(palette.createNodeConfig && {
        nodeConfig: palette.createNodeConfig(),
      }),
    }),
  ),
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
