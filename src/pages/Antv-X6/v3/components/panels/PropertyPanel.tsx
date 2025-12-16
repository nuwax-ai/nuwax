import { ExceptionHandleTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { ChildNode, ExceptionItemProps } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { showExceptionHandle } from '@/utils/graph';
import { Form, FormInstance } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import '../../../index.less';
import ComplexNode from '../../component/complexNode';
import ConditionNode from '../../component/condition';
import Database from '../../component/database';
import { ExceptionItem } from '../../component/ExceptionItem';
import Library from '../../component/library';
import NodeItem from '../../component/nodeItem';
import ReferenceNode from '../../component/pluginNode';

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

const nodeTemplate = (params: ChildNode, form: FormInstance) => {
  const nodeType: NodeTypeEnum = params.type;
  const commonProps = {
    type: params.type,
    id: params.id,
    form,
    nodeConfig: params.nodeConfig,
  };
  switch (nodeType) {
    case NodeTypeEnum.Start:
      return <StartNode {...commonProps} />;
    case NodeTypeEnum.DocumentExtraction:
      return <DocumentExtractionNode {...commonProps} />;
    case NodeTypeEnum.End:
    case NodeTypeEnum.Output:
      return <EndNode {...commonProps} />;
    case NodeTypeEnum.Loop:
      return <CycleNode {...commonProps} />;
    case NodeTypeEnum.Variable:
      return <VariableNode {...commonProps} />;
    case NodeTypeEnum.VariableAggregation:
      return <VariableAggregationNode {...commonProps} />;
    case NodeTypeEnum.TextProcessing:
      return <TextProcessingNode {...commonProps} />;
    case NodeTypeEnum.LLM:
      return <ModelNode {...commonProps} />;

    case NodeTypeEnum.Plugin:
    case NodeTypeEnum.Workflow:
    case NodeTypeEnum.LongTermMemory:
    case NodeTypeEnum.MCP:
      return <PluginInNode {...commonProps} />;
    case NodeTypeEnum.Code:
      return <CodeNode {...commonProps} />;
    case NodeTypeEnum.QA:
      return <QuestionsNode {...commonProps} />;
    case NodeTypeEnum.HTTPRequest:
      return <HttpToolNode {...commonProps} />;
    case NodeTypeEnum.Knowledge:
      return <KnowledgeNode {...commonProps} />;
    // 条件分支需要实时的调用接口
    case NodeTypeEnum.Condition:
      return <ConditionNode {...commonProps} />;
    case NodeTypeEnum.IntentRecognition:
      return <IntentionNode {...commonProps} />;
    case NodeTypeEnum.LoopBreak:
      return <LoopBreak />;
    case NodeTypeEnum.LoopContinue:
      return <LoopContinue />;
    case NodeTypeEnum.TableDataAdd:
    case NodeTypeEnum.TableDataDelete:
    case NodeTypeEnum.TableDataUpdate:
    case NodeTypeEnum.TableDataQuery:
    case NodeTypeEnum.TableSQL:
      return <Database {...commonProps} />;
    default:
      return <></>;
  }
};

const ExceptionHandle: React.FC<{
  data: ExceptionHandleConfig | undefined;
}> = ({ data }) => {
  const defaultExceptionItemProps: ExceptionItemProps = useMemo(
    () => ({
      exceptionHandleType: ExceptionHandleTypeEnum.INTERRUPT,
      timeout: 180,
      retryCount: 0,
      name: 'exceptionHandleConfig',
    }),
    [],
  );
  const [exceptionItemProps, setExceptionItemProps] =
    useState<ExceptionItemProps>(defaultExceptionItemProps);
  useEffect(() => {
    setExceptionItemProps((prev) => ({
      ...prev,
      ...(data || {}),
    }));
    return () => {
      setExceptionItemProps(defaultExceptionItemProps);
    };
  }, []);

  return <ExceptionItem {...exceptionItemProps} />;
};

/**
 * V3 专用的 NodePanelDrawer
 * 参考 v1 版本（src/pages/Antv-X6/components/NodePanelDrawer）实现
 * 区别：从 V3 的 component 目录导入组件，而非 src/pages/Antv-X6/component/
 */
export default function NodePanelDrawerV3({ params }: { params: ChildNode }) {
  const form = Form.useFormInstance();
  const showException = showExceptionHandle(params);
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
