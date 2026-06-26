import { dict } from '@/services/i18nRuntime';
import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/graph';
import { FormInstance } from 'antd';
import React from 'react';
import AgentFlowNodes from '../agentFlow/forms';
import ComplexNode from '../component/complexNode';
import ConditionNode from '../component/condition';
import Database from '../component/database';
import Library from '../component/library';
import NodeItem from '../component/nodeItem';
import ReferenceNode from '../component/pluginNode';
import { isAgentFlowPanelNode } from '../flowKind/flowKindConfig';

const {
  StartNode,
  EndNode,
  CycleNode,
  VariableNode,
  VariableAggregationNode,
  TextProcessingNode,
  CodeNode,
  DocumentExtractionNode,
} = NodeItem;
const { ModelNode, IntentionNode, QuestionsNode, HttpToolNode } = ComplexNode;
const { PluginInNode } = ReferenceNode;
const { KnowledgeNode, KnowledgeInsertNode } = Library;
const {
  AgentFlowStartNode,
  AgentFlowEndNode,
  AgentFlowWorkflowNode,
  AgentNode,
  HumanInteractionNode,
  RouteDecisionNode,
} = AgentFlowNodes;

const LoopContinue: React.FC = () => {
  return (
    <div className="node-title-style">
      {dict('PC.Pages.AntvX6.loopContinueDesc')}
    </div>
  );
};

const LoopBreak: React.FC = () => {
  return (
    <div className="node-title-style">
      {dict('PC.Pages.AntvX6.loopBreakDesc')}
    </div>
  );
};

export interface NodeComponentProps {
  type: NodeTypeEnum;
  id: number;
  form: FormInstance;
  nodeConfig: any;
}

/**
 * AgentFlow 下有独立属性面板的节点 → 组件映射。
 * 配合 `isAgentFlowPanelNode()` 守卫使用，不在此映射中的节点走通用 nodeMap。
 */
const agentFlowPanelMap: Partial<
  Record<NodeTypeEnum, (p: NodeComponentProps) => React.ReactElement>
> = {
  [NodeTypeEnum.Start]: (p) => <AgentFlowStartNode {...p} />,
  [NodeTypeEnum.End]: (p) => <AgentFlowEndNode {...p} />,
  [NodeTypeEnum.Output]: (p) => <AgentFlowEndNode {...p} />,
  [NodeTypeEnum.Workflow]: (p) => <AgentFlowWorkflowNode {...p} />,
  [NodeTypeEnum.Agent]: (p) => <AgentNode {...p} />,
  [NodeTypeEnum.HumanInteraction]: (p) => <HumanInteractionNode {...p} />,
  [NodeTypeEnum.RouteDecision]: (p) => <RouteDecisionNode {...p} />,
};

/**
 * 通用（Workflow）节点 → 组件映射。
 * LoopStart / LoopEnd / LoopCondition / Interval 等内部节点无需属性面板，不在此映射中。
 */
const nodeMap: Partial<
  Record<NodeTypeEnum, (p: NodeComponentProps) => React.ReactElement>
> = {
  [NodeTypeEnum.Start]: (p) => <StartNode {...p} />,
  [NodeTypeEnum.DocumentExtraction]: (p) => <DocumentExtractionNode {...p} />,
  [NodeTypeEnum.End]: (p) => <EndNode {...p} />,
  [NodeTypeEnum.Output]: (p) => <EndNode {...p} />,
  [NodeTypeEnum.Loop]: (p) => <CycleNode {...p} />,
  [NodeTypeEnum.Variable]: (p) => <VariableNode {...p} />,
  [NodeTypeEnum.VariableAggregation]: (p) => <VariableAggregationNode {...p} />,
  [NodeTypeEnum.TextProcessing]: (p) => <TextProcessingNode {...p} />,
  [NodeTypeEnum.LLM]: (p) => <ModelNode {...p} />,
  [NodeTypeEnum.Plugin]: (p) => <PluginInNode {...p} />,
  [NodeTypeEnum.Workflow]: (p) => <PluginInNode {...p} />,
  [NodeTypeEnum.LongTermMemory]: (p) => <PluginInNode {...p} />,
  [NodeTypeEnum.MCP]: (p) => <PluginInNode {...p} />,
  [NodeTypeEnum.Code]: (p) => <CodeNode {...p} />,
  [NodeTypeEnum.QA]: (p) => <QuestionsNode {...p} />,
  [NodeTypeEnum.HTTPRequest]: (p) => <HttpToolNode {...p} />,
  [NodeTypeEnum.Knowledge]: (p) => <KnowledgeNode {...p} />,
  [NodeTypeEnum.KnowledgeInsert]: (p) => <KnowledgeInsertNode {...p} />,
  [NodeTypeEnum.Condition]: (p) => <ConditionNode {...p} />,
  [NodeTypeEnum.IntentRecognition]: (p) => <IntentionNode {...p} />,
  [NodeTypeEnum.LoopBreak]: () => <LoopBreak />,
  [NodeTypeEnum.LoopContinue]: () => <LoopContinue />,
  [NodeTypeEnum.TableDataAdd]: (p) => <Database {...p} />,
  [NodeTypeEnum.TableDataDelete]: (p) => <Database {...p} />,
  [NodeTypeEnum.TableDataUpdate]: (p) => <Database {...p} />,
  [NodeTypeEnum.TableDataQuery]: (p) => <Database {...p} />,
  [NodeTypeEnum.TableSQL]: (p) => <Database {...p} />,
  [NodeTypeEnum.Agent]: (p) => <AgentNode {...p} />,
  [NodeTypeEnum.HumanInteraction]: (p) => <HumanInteractionNode {...p} />,
  [NodeTypeEnum.RouteDecision]: (p) => <RouteDecisionNode {...p} />,
};

/**
 * 根据节点类型与 flowKind 渲染属性面板。
 * AgentFlow 走 agentFlow/forms/* 独立面板；Workflow 走原有 nodeItem/complexNode 等。
 */
export const getNodeComponent = (
  params: ChildNode,
  form: FormInstance,
  flowKind?: FlowKindEnum,
) => {
  const nodeType: NodeTypeEnum = params.type;
  const commonProps: NodeComponentProps = {
    type: params.type,
    id: params.id,
    form,
    nodeConfig: params.nodeConfig,
  };

  // AgentFlow 模式：优先使用 AgentFlow 专属面板
  if (
    flowKind === FlowKindEnum.AgentFlow &&
    isAgentFlowPanelNode(nodeType) &&
    agentFlowPanelMap[nodeType]
  ) {
    return agentFlowPanelMap[nodeType]!(commonProps);
  }

  return nodeMap[nodeType]?.(commonProps) ?? <></>;
};
