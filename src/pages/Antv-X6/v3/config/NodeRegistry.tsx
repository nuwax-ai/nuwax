import { NodeTypeEnum } from '@/types/enums/common';
import { ChildNode } from '@/types/interfaces/graph';
import { FormInstance } from 'antd';
import React from 'react';
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
const { KnowledgeNode } = Library;

// 定义试运行,后面删除
const LoopContinue: React.FC = () => {
  return <div className="node-title-style">用于终止当前循环，执行下次循环</div>;
};

const LoopBreak: React.FC = () => {
  return (
    <div className="node-title-style">
      用于立即终止当前所在的循环，跳出循环体
    </div>
  );
};

export interface NodeComponentProps {
  type: NodeTypeEnum;
  id: number;
  form: FormInstance;
  nodeConfig: any;
}

export const getNodeComponent = (params: ChildNode, form: FormInstance) => {
  const nodeType: NodeTypeEnum = params.type;
  const commonProps = {
    type: params.type,
    id: params.id,
    form,
    nodeConfig: params.nodeConfig,
  };

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
    [NodeTypeEnum.Condition]: <ConditionNode {...commonProps} />,
    [NodeTypeEnum.IntentRecognition]: <IntentionNode {...commonProps} />,
    [NodeTypeEnum.LoopBreak]: <LoopBreak />,
    [NodeTypeEnum.LoopContinue]: <LoopContinue />,
    [NodeTypeEnum.TableDataAdd]: <Database {...commonProps} />,
    [NodeTypeEnum.TableDataDelete]: <Database {...commonProps} />,
    [NodeTypeEnum.TableDataUpdate]: <Database {...commonProps} />,
    [NodeTypeEnum.TableDataQuery]: <Database {...commonProps} />,
    [NodeTypeEnum.TableSQL]: <Database {...commonProps} />,
  };

  return nodeMap[nodeType] || <></>;
};
