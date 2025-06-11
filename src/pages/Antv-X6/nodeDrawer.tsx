import { ChildNode } from '@/types/interfaces/graph';

import { FormInstance } from 'antd';
import ComplexNode from './component/complexNode';
import ConditionNode from './component/condition';
import Database from './component/database';
import Library from './component/library';
import NodeItem from './component/nodeItem';
import ReferenceNode from './component/pluginNode';
import './index.less';
const {
  StartNode,
  EndNode,
  CycleNode,
  VariableNode,
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

// 移除 React.FC，直接使用函数组件定义
export const renderNodeContent = (params: ChildNode, form: FormInstance) => {
  const { maxTokens: maxTokensLimit } = params.nodeConfig?.modelConfig || {};
  switch (params.type) {
    case 'Start':
      // 如果这和 'Start' 是同样的组件，请考虑重用组件或创建一个新的组件。
      return <StartNode type={params.type} form={form} />;
    case 'DocumentExtraction':
      return <DocumentExtractionNode form={form} type={params.type} />;
    case 'End':
    case 'Output':
      return <EndNode form={form} type={params.type} />;
    case 'Loop':
      return <CycleNode form={form} />;
    case 'Variable':
      return <VariableNode form={form} />;
    case 'TextProcessing':
      return <TextProcessingNode form={form} />;
    case 'LLM':
      return (
        <ModelNode form={form} id={params.id} maxTokensLimit={maxTokensLimit} />
      );

    case 'Plugin':
    case 'Workflow':
    case 'LongTermMemory':
      return <PluginInNode type={params.type} form={form} />;
    case 'Code':
      return <CodeNode form={form} />;
    case 'QA':
      return <QuestionsNode form={form} maxTokensLimit={maxTokensLimit} />;
    case 'HTTPRequest':
      return <HttpToolNode form={form} />;
    case 'Knowledge':
      return <KnowledgeNode form={form} />;
    // 条件分支需要实时的调用接口
    case 'Condition':
      return <ConditionNode form={form} />;
    case 'IntentRecognition':
      return <IntentionNode form={form} maxTokensLimit={maxTokensLimit} />;
    case 'LoopBreak':
      return <LoopBreak />;
    case 'LoopContinue':
      return <LoopContinue />;
    case 'TableDataAdd':
    case 'TableDataDelete':
    case 'TableDataUpdate':
    case 'TableDataQuery':
    case 'TableSQL':
      return <Database form={form} type={params.type} />;
    default:
      return;
  }
};
