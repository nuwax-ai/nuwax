import { EXCEPTION_NODES_TYPE } from '@/constants/node.constants';
import { useSpecificContent } from '@/hooks/useSpecificContent';
import { ExceptionHandleTypeEnum } from '@/types/enums/common';
import { ChildNode, ExceptionItemProps } from '@/types/interfaces/graph';
import { Form, FormInstance } from 'antd';
import { useEffect, useState } from 'react';
import ComplexNode from './component/complexNode';
import ConditionNode from './component/condition';
import Database from './component/database';
import { ExceptionItem } from './component/ExceptionItem';
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

const nodeTemplate = (params: ChildNode, form: FormInstance) => {
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
// 由于 所有节点支持异常配置根据后端返回的 nodeConfig.exceptionHandleConfig 来决定是否显示异常配置
// 通过HOC 方案把所有组件包裹一层，然后根据后端返回的 nodeConfig.exceptionHandleConfig 来决定是否显示异常配置
export default function RenderNodeDrawer({ params }: { params: ChildNode }) {
  const form = Form.useFormInstance();
  const { exceptionHandleConfig } = params.nodeConfig || {};
  const [exceptionItemProps, setExceptionItemProps] =
    useState<ExceptionItemProps>({
      exceptionHandleType: ExceptionHandleTypeEnum.INTERRUPT,
      timeout: 180,
      retryCount: 0,
      ...(exceptionHandleConfig || {}),
      name: 'exceptionHandleConfig',
    });
  // 处理输入 编辑器 同步输出参数及同步之前录入内容
  const { specificContent } = useSpecificContent({
    exceptionItemProps,
    watchField: 'outputArgs',
  });

  useEffect(() => {
    setExceptionItemProps({
      ...exceptionItemProps,
      specificContent: JSON.stringify(specificContent, null, 2),
    });
  }, [specificContent]);
  const showExceptionHandle =
    exceptionHandleConfig && EXCEPTION_NODES_TYPE.includes(params.type);
  return (
    <>
      {nodeTemplate(params, form)}
      {/* 处理节点异常项展示*/}
      {showExceptionHandle && <ExceptionItem {...exceptionItemProps} />}
    </>
  );
}
