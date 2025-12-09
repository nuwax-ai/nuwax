/**
 * V2 NodePanel 路由组件
 *
 * 根据节点类型渲染对应的配置面板
 *
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../types';
import { NodeTypeEnumV2 } from '../../types';

// 导入各类型节点面板
import StartNodePanelV2 from './panels/StartNodePanelV2';
import EndNodePanelV2 from './panels/EndNodePanelV2';
import LLMNodePanelV2 from './panels/LLMNodePanelV2';
import CodeNodePanelV2 from './panels/CodeNodePanelV2';
import ConditionNodePanelV2 from './panels/ConditionNodePanelV2';
import LoopNodePanelV2 from './panels/LoopNodePanelV2';
import QANodePanelV2 from './panels/QANodePanelV2';
import HTTPNodePanelV2 from './panels/HTTPNodePanelV2';
import KnowledgeNodePanelV2 from './panels/KnowledgeNodePanelV2';
import VariableNodePanelV2 from './panels/VariableNodePanelV2';
import IntentNodePanelV2 from './panels/IntentNodePanelV2';
import TextProcessingNodePanelV2 from './panels/TextProcessingNodePanelV2';
import OutputNodePanelV2 from './panels/OutputNodePanelV2';
import PluginNodePanelV2 from './panels/PluginNodePanelV2';
import WorkflowNodePanelV2 from './panels/WorkflowNodePanelV2';
import DocumentExtractionNodePanelV2 from './panels/DocumentExtractionNodePanelV2';
import TableNodePanelV2 from './panels/TableNodePanelV2';
import LoopControlNodePanelV2 from './panels/LoopControlNodePanelV2';
import DefaultNodePanelV2 from './panels/DefaultNodePanelV2';

// ==================== 类型定义 ====================

export interface NodePanelV2Props {
  /** 节点数据 */
  node: ChildNodeV2;
  /** 变量引用数据 */
  referenceData?: NodePreviousAndArgMapV2;
}

// ==================== 组件实现 ====================

const NodePanelV2: React.FC<NodePanelV2Props> = ({ node, referenceData }) => {
  // 根据节点类型渲染对应的面板
  switch (node.type) {
    case NodeTypeEnumV2.Start:
      return <StartNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.End:
      return <EndNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.LLM:
      return <LLMNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Code:
      return <CodeNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Condition:
      return <ConditionNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.IntentRecognition:
      return <IntentNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Loop:
      return <LoopNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.LoopBreak:
    case NodeTypeEnumV2.LoopContinue:
      return <LoopControlNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.QA:
      return <QANodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.HTTPRequest:
      return <HTTPNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Knowledge:
      return <KnowledgeNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Variable:
      return <VariableNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.LongTermMemory:
      return <DefaultNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.TextProcessing:
      return <TextProcessingNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.DocumentExtraction:
      return <DocumentExtractionNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Output:
      return <OutputNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Plugin:
      return <PluginNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.Workflow:
      return <WorkflowNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.MCP:
      return <PluginNodePanelV2 node={node} referenceData={referenceData} />;

    case NodeTypeEnumV2.TableDataAdd:
    case NodeTypeEnumV2.TableDataDelete:
    case NodeTypeEnumV2.TableDataUpdate:
    case NodeTypeEnumV2.TableDataQuery:
    case NodeTypeEnumV2.TableSQL:
      return <TableNodePanelV2 node={node} referenceData={referenceData} />;

    default:
      return <DefaultNodePanelV2 node={node} referenceData={referenceData} />;
  }
};

export default NodePanelV2;
