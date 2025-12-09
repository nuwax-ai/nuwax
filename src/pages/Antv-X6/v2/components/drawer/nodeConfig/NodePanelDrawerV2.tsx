/**
 * V2 节点配置面板组件
 *
 * 根据节点类型显示不同的配置表单
 * 完全独立，不依赖 V1
 */

import { FormInstance } from 'antd';
import React from 'react';

import type { ChildNodeV2, NodeConfigV2 } from '../../../types';
import { NodeTypeEnumV2 } from '../../../types';

// 导入节点配置组件
import ComplexNodeV2 from './complexNodeV2';
import ConditionNodeV2 from './ConditionNodeV2';
import DatabaseNodeV2 from './DatabaseNodeV2';
import { ExceptionItemV2, showExceptionHandleV2 } from './ExceptionItemV2';
import KnowledgeNodeV2 from './KnowledgeNodeV2';
import NodeItemV2 from './nodeItemV2';
import PluginNodeV2 from './PluginNodeV2';

const {
  StartNodeV2,
  EndNodeV2,
  CycleNodeV2,
  VariableNodeV2,
  CodeNodeV2,
  TextProcessingNodeV2,
  DocumentExtractionNodeV2,
  LoopContinueV2,
  LoopBreakV2,
} = NodeItemV2;

const { ModelNodeV2, IntentionNodeV2, QuestionsNodeV2, HttpToolNodeV2 } =
  ComplexNodeV2;

// ==================== 类型定义 ====================

export interface NodePanelDrawerV2Props {
  /** 当前节点数据 */
  node: ChildNodeV2;
  /** 表单实例 */
  form: FormInstance;
  /** 变量引用数据 */
  referenceData?: any;
}

// ==================== 工具函数 ====================

/**
 * 根据节点类型返回对应的配置组件
 */
const nodeTemplate = (
  node: ChildNodeV2,
  form: FormInstance,
  referenceData?: any,
) => {
  const nodeType = node.type as NodeTypeEnumV2;
  const commonProps = {
    type: node.type,
    id: node.id,
    form,
    nodeConfig: node.nodeConfig as NodeConfigV2,
    referenceData,
  };

  switch (nodeType) {
    // 开始节点
    case NodeTypeEnumV2.Start:
      return <StartNodeV2 {...commonProps} />;

    // 文档提取节点
    case NodeTypeEnumV2.DocumentExtraction:
      return <DocumentExtractionNodeV2 {...commonProps} />;

    // 结束和输出节点
    case NodeTypeEnumV2.End:
    case NodeTypeEnumV2.Output:
      return <EndNodeV2 {...commonProps} />;

    // 循环节点
    case NodeTypeEnumV2.Loop:
      return <CycleNodeV2 {...commonProps} />;

    // 变量节点
    case NodeTypeEnumV2.Variable:
      return <VariableNodeV2 {...commonProps} />;

    // 文本处理节点
    case NodeTypeEnumV2.TextProcessing:
      return <TextProcessingNodeV2 {...commonProps} />;

    // LLM 大模型节点
    case NodeTypeEnumV2.LLM:
      return <ModelNodeV2 {...commonProps} />;

    // 代码节点
    case NodeTypeEnumV2.Code:
      return <CodeNodeV2 {...commonProps} />;

    // 问答节点
    case NodeTypeEnumV2.QA:
      return <QuestionsNodeV2 {...commonProps} />;

    // HTTP 请求节点
    case NodeTypeEnumV2.HTTPRequest:
      return <HttpToolNodeV2 {...commonProps} />;

    // 意图识别节点
    case NodeTypeEnumV2.IntentRecognition:
      return <IntentionNodeV2 {...commonProps} />;

    // 循环继续节点
    case NodeTypeEnumV2.LoopContinue:
      return <LoopContinueV2 />;

    // 循环终止节点
    case NodeTypeEnumV2.LoopBreak:
      return <LoopBreakV2 />;

    // 条件分支节点
    case NodeTypeEnumV2.Condition:
      return <ConditionNodeV2 {...commonProps} />;

    // 知识库节点
    case NodeTypeEnumV2.Knowledge:
      return <KnowledgeNodeV2 {...commonProps} />;

    // 插件、工作流、MCP、长期记忆节点
    case NodeTypeEnumV2.Plugin:
    case NodeTypeEnumV2.Workflow:
    case NodeTypeEnumV2.LongTermMemory:
    case NodeTypeEnumV2.MCP:
      return <PluginNodeV2 {...commonProps} />;

    // 数据库相关节点
    case NodeTypeEnumV2.TableDataAdd:
    case NodeTypeEnumV2.TableDataDelete:
    case NodeTypeEnumV2.TableDataUpdate:
    case NodeTypeEnumV2.TableDataQuery:
    case NodeTypeEnumV2.TableSQL:
      return <DatabaseNodeV2 {...commonProps} />;

    default:
      return (
        <div className="node-title-style-v2">暂不支持此节点类型的配置</div>
      );
  }
};

// ==================== 组件实现 ====================

/**
 * 节点配置面板
 * 根据节点类型渲染不同的配置表单
 */
const NodePanelDrawerV2: React.FC<NodePanelDrawerV2Props> = ({
  node,
  form,
  referenceData,
}) => {
  // 判断是否显示异常处理配置
  const showException = showExceptionHandleV2(node);
  const exceptionConfig = node.nodeConfig?.exceptionHandleConfig;

  return (
    <>
      {nodeTemplate(node, form, referenceData)}
      {/* 处理节点异常项展示 */}
      {showException && (
        <ExceptionItemV2
          form={form}
          timeout={exceptionConfig?.timeout}
          retryCount={exceptionConfig?.retryCount}
          exceptionHandleType={exceptionConfig?.exceptionHandleType}
          specificContent={exceptionConfig?.specificContent}
          exceptionHandleNodeIds={exceptionConfig?.exceptionHandleNodeIds}
        />
      )}
    </>
  );
};

export default NodePanelDrawerV2;
