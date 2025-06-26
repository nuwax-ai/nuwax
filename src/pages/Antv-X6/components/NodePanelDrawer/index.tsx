import { ExceptionHandleTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { ChildNode, ExceptionItemProps } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { showExceptionHandle } from '@/utils/graph';
import { Form, FormInstance } from 'antd';
import ComplexNode from '../../component/complexNode';
import ConditionNode from '../../component/condition';
import Database from '../../component/database';
import { ExceptionItem } from '../../component/ExceptionItem';
import Library from '../../component/library';
import NodeItem from '../../component/nodeItem';
import ReferenceNode from '../../component/pluginNode';
import '../../index.less';
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
  const nodeType: NodeTypeEnum = params.type;
  switch (nodeType) {
    case NodeTypeEnum.Start:
      // 如果这和 'Start' 是同样的组件，请考虑重用组件或创建一个新的组件。
      return <StartNode type={params.type} form={form} />;
    case NodeTypeEnum.DocumentExtraction:
      return <DocumentExtractionNode form={form} type={params.type} />;
    case NodeTypeEnum.End:
    case NodeTypeEnum.Output:
      return <EndNode form={form} type={params.type} />;
    case NodeTypeEnum.Loop:
      return <CycleNode form={form} />;
    case NodeTypeEnum.Variable:
      return <VariableNode form={form} />;
    case NodeTypeEnum.TextProcessing:
      return <TextProcessingNode form={form} />;
    case NodeTypeEnum.LLM:
      return (
        <ModelNode form={form} id={params.id} maxTokensLimit={maxTokensLimit} />
      );

    case NodeTypeEnum.Plugin:
    case NodeTypeEnum.Workflow:
    case NodeTypeEnum.LongTermMemory:
    case NodeTypeEnum.MCP:
      return <PluginInNode type={params.type} form={form} />;
    case NodeTypeEnum.Code:
      return <CodeNode form={form} />;
    case NodeTypeEnum.QA:
      return <QuestionsNode form={form} maxTokensLimit={maxTokensLimit} />;
    case NodeTypeEnum.HTTPRequest:
      return <HttpToolNode form={form} />;
    case NodeTypeEnum.Knowledge:
      return <KnowledgeNode form={form} />;
    // 条件分支需要实时的调用接口
    case NodeTypeEnum.Condition:
      return <ConditionNode form={form} />;
    case NodeTypeEnum.IntentRecognition:
      return <IntentionNode form={form} maxTokensLimit={maxTokensLimit} />;
    case NodeTypeEnum.LoopBreak:
      return <LoopBreak />;
    case NodeTypeEnum.LoopContinue:
      return <LoopContinue />;
    case NodeTypeEnum.TableDataAdd:
    case NodeTypeEnum.TableDataDelete:
    case NodeTypeEnum.TableDataUpdate:
    case NodeTypeEnum.TableDataQuery:
    case NodeTypeEnum.TableSQL:
      return <Database form={form} type={params.type} />;
    default:
      return <></>;
  }
};
const ExceptionHandle: React.FC<{
  data: ExceptionHandleConfig | undefined;
}> = ({ data }) => {
  const exceptionItemProps: ExceptionItemProps = {
    exceptionHandleType: ExceptionHandleTypeEnum.INTERRUPT,
    timeout: 180,
    retryCount: 0,
    ...(data || {}),
    name: 'exceptionHandleConfig',
  };

  return <ExceptionItem {...exceptionItemProps} />;
};

// 由于 所有节点支持异常配置根据后端返回的 nodeConfig.exceptionHandleConfig 来决定是否显示异常配置
// 通过HOC 方案把所有组件包裹一层，然后根据后端返回的 nodeConfig.exceptionHandleConfig 来决定是否显示异常配置
export default function NodePanelDrawer({ params }: { params: ChildNode }) {
  const form = Form.useFormInstance();
  const showException = showExceptionHandle(params); // 是否显示异常配置
  return (
    <>
      {nodeTemplate(params, form)}
      {/* 处理节点异常项展示*/}
      {showException && (
        <ExceptionHandle data={params.nodeConfig?.exceptionHandleConfig} />
      )}
    </>
  );
}
