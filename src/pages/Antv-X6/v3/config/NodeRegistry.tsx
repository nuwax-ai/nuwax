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
 * 根据节点类型与 flowKind 渲染属性面板。
 * AgentFlow 走 agentFlow/forms/* 独立面板；Workflow 走原有 nodeItem/complexNode 等。
 */
export const getNodeComponent = (
  params: ChildNode,
  form: FormInstance,
  flowKind?: FlowKindEnum,
) => {
  const nodeType: NodeTypeEnum = params.type;
  const commonProps = {
    type: params.type,
    id: params.id,
    form,
    nodeConfig: params.nodeConfig,
  };

  if (flowKind === FlowKindEnum.AgentFlow) {
    const agentFlowMap: Partial<Record<string, React.ReactElement>> = {
      [NodeTypeEnum.Start]: <AgentFlowStartNode {...commonProps} />,
      [NodeTypeEnum.End]: <AgentFlowEndNode {...commonProps} />,
      [NodeTypeEnum.Output]: <AgentFlowEndNode {...commonProps} />,
      [NodeTypeEnum.Workflow]: <AgentFlowWorkflowNode {...commonProps} />,
      [NodeTypeEnum.Agent]: <AgentNode {...commonProps} />,
      [NodeTypeEnum.HumanInteraction]: (
        <HumanInteractionNode {...commonProps} />
      ),
      [NodeTypeEnum.RouteDecision]: <RouteDecisionNode {...commonProps} />,
    };
    if (agentFlowMap[nodeType]) {
      return agentFlowMap[nodeType];
    }
  }

  const nodeMap: Record<string, React.ReactElement> = {
    [NodeTypeEnum.Start]: <StartNode {...commonProps} />,
    [NodeTypeEnum.DocumentExtraction]: (
      <DocumentExtractionNode {...commonProps} />
    ),
    [NodeTypeEnum.End]: <EndNode {...commonProps} />,
    [NodeTypeEnum.Output]: <EndNode {...commonProps} />,
    [NodeTypeEnum.Loop]: <CycleNode {...commonProps} />,
    [NodeTypeEnum.Variable]: <VariableNode {...commonProps} />,
    [NodeTypeEnum.VariableAggregation]: (
      <VariableAggregationNode {...commonProps} />
    ),
    [NodeTypeEnum.TextProcessing]: <TextProcessingNode {...commonProps} />,
    [NodeTypeEnum.LLM]: <ModelNode {...commonProps} />,
    [NodeTypeEnum.Plugin]: <PluginInNode {...commonProps} />,
    [NodeTypeEnum.Workflow]: <PluginInNode {...commonProps} />,
    [NodeTypeEnum.LongTermMemory]: <PluginInNode {...commonProps} />,
    [NodeTypeEnum.MCP]: <PluginInNode {...commonProps} />,
    [NodeTypeEnum.Code]: <CodeNode {...commonProps} />,
    [NodeTypeEnum.QA]: <QuestionsNode {...commonProps} />,
    [NodeTypeEnum.HTTPRequest]: <HttpToolNode {...commonProps} />,
    [NodeTypeEnum.Knowledge]: <KnowledgeNode {...commonProps} />,
    [NodeTypeEnum.KnowledgeInsert]: <KnowledgeInsertNode {...commonProps} />,
    [NodeTypeEnum.Condition]: <ConditionNode {...commonProps} />,
    [NodeTypeEnum.IntentRecognition]: <IntentionNode {...commonProps} />,
    [NodeTypeEnum.LoopBreak]: <LoopBreak />,
    [NodeTypeEnum.LoopContinue]: <LoopContinue />,
    [NodeTypeEnum.TableDataAdd]: <Database {...commonProps} />,
    [NodeTypeEnum.TableDataDelete]: <Database {...commonProps} />,
    [NodeTypeEnum.TableDataUpdate]: <Database {...commonProps} />,
    [NodeTypeEnum.TableDataQuery]: <Database {...commonProps} />,
    [NodeTypeEnum.TableSQL]: <Database {...commonProps} />,
    [NodeTypeEnum.Agent]: <AgentNode {...commonProps} />,
    [NodeTypeEnum.HumanInteraction]: <HumanInteractionNode {...commonProps} />,
    [NodeTypeEnum.RouteDecision]: <RouteDecisionNode {...commonProps} />,
  };

  return nodeMap[nodeType] || <></>;
};
