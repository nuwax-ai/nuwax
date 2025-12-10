/**
 * V2 自定义节点注册
 *
 * 注册工作流中使用的自定义节点类型
 * 参考 V1 实现，保持相同的视觉效果
 */

import { Graph, Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Tag } from 'antd';
import React, { useEffect, useState } from 'react';

import {
  ICON_END,
  ICON_NEW_AGENT,
  ICON_START,
  ICON_WORKFLOW_CODE,
  ICON_WORKFLOW_CONDITION,
  ICON_WORKFLOW_DATABASE,
  ICON_WORKFLOW_DATABASEADD,
  ICON_WORKFLOW_DATABASEDELETE,
  ICON_WORKFLOW_DATABASEQUERY,
  ICON_WORKFLOW_DATABASEUPDATE,
  ICON_WORKFLOW_DOCUMENT_EXTRACTION,
  ICON_WORKFLOW_HTTP_REQUEST,
  ICON_WORKFLOW_INTENT_RECOGNITION,
  ICON_WORKFLOW_KNOWLEDGE_BASE,
  ICON_WORKFLOW_LLM,
  ICON_WORKFLOW_LONG_TERM_MEMORY,
  ICON_WORKFLOW_LOOP,
  ICON_WORKFLOW_LOOPBREAK,
  ICON_WORKFLOW_LOOPCONTINUE,
  ICON_WORKFLOW_MCP,
  ICON_WORKFLOW_OUTPUT,
  ICON_WORKFLOW_PLUGIN,
  ICON_WORKFLOW_QA,
  ICON_WORKFLOW_TEXT_PROCESSING,
  ICON_WORKFLOW_VARIABLE,
  ICON_WORKFLOW_WORKFLOW,
} from '@/constants/images.constants';
import useNodeSelection from '@/hooks/useNodeSelection';
import {
  EXCEPTION_HANDLE_OPTIONS_V2,
  EXCEPTION_NODES_TYPE_V2,
  PORT_GROUPS_V2,
} from '../constants';

import type { ChildNodeV2, RunResultItemV2 } from '../types';
import {
  NodeShapeEnumV2,
  NodeTypeEnumV2,
  RunResultStatusEnumV2,
} from '../types';
import './registerCustomNodesV2.less';

// ==================== 工具函数 ====================

/**
 * 根据节点类型返回图标
 */
const returnImgV2 = (type: NodeTypeEnumV2): React.ReactNode => {
  switch (type) {
    case NodeTypeEnumV2.Start:
    case NodeTypeEnumV2.LoopStart:
      return <ICON_START />;
    case NodeTypeEnumV2.End:
    case NodeTypeEnumV2.LoopEnd:
      return <ICON_END />;
    case NodeTypeEnumV2.Output:
      return <ICON_WORKFLOW_OUTPUT />;
    case NodeTypeEnumV2.Code:
      return <ICON_WORKFLOW_CODE />;
    case NodeTypeEnumV2.Condition:
      return <ICON_WORKFLOW_CONDITION />;
    case NodeTypeEnumV2.DocumentExtraction:
      return <ICON_WORKFLOW_DOCUMENT_EXTRACTION />;
    case NodeTypeEnumV2.HTTPRequest:
      return <ICON_WORKFLOW_HTTP_REQUEST />;
    case NodeTypeEnumV2.IntentRecognition:
      return <ICON_WORKFLOW_INTENT_RECOGNITION />;
    case NodeTypeEnumV2.Knowledge:
      return <ICON_WORKFLOW_KNOWLEDGE_BASE />;
    case NodeTypeEnumV2.LLM:
      return <ICON_WORKFLOW_LLM />;
    case NodeTypeEnumV2.LongTermMemory:
      return <ICON_WORKFLOW_LONG_TERM_MEMORY />;
    case NodeTypeEnumV2.Loop:
      return <ICON_WORKFLOW_LOOP />;
    case NodeTypeEnumV2.LoopContinue:
      return <ICON_WORKFLOW_LOOPCONTINUE />;
    case NodeTypeEnumV2.LoopBreak:
      return <ICON_WORKFLOW_LOOPBREAK />;
    case NodeTypeEnumV2.Plugin:
      return <ICON_WORKFLOW_PLUGIN />;
    case NodeTypeEnumV2.QA:
      return <ICON_WORKFLOW_QA />;
    case NodeTypeEnumV2.TextProcessing:
      return <ICON_WORKFLOW_TEXT_PROCESSING />;
    case NodeTypeEnumV2.Variable:
      return <ICON_WORKFLOW_VARIABLE />;
    case NodeTypeEnumV2.Workflow:
      return <ICON_WORKFLOW_WORKFLOW />;
    case NodeTypeEnumV2.TableDataAdd:
      return <ICON_WORKFLOW_DATABASEADD />;
    case NodeTypeEnumV2.TableDataDelete:
      return <ICON_WORKFLOW_DATABASEDELETE />;
    case NodeTypeEnumV2.TableDataUpdate:
      return <ICON_WORKFLOW_DATABASEUPDATE />;
    case NodeTypeEnumV2.TableDataQuery:
      return <ICON_WORKFLOW_DATABASEQUERY />;
    case NodeTypeEnumV2.TableSQL:
      return <ICON_WORKFLOW_DATABASE />;
    case NodeTypeEnumV2.MCP:
      return <ICON_WORKFLOW_MCP />;
    default:
      return <ICON_NEW_AGENT />;
  }
};

/**
 * 根据节点类型返回背景色
 */
const returnBackgroundColorV2 = (type: NodeTypeEnumV2): string => {
  switch (type) {
    case NodeTypeEnumV2.Start:
    case NodeTypeEnumV2.End:
      return '#EEEEFF';
    case NodeTypeEnumV2.Code:
    case NodeTypeEnumV2.Loop:
    case NodeTypeEnumV2.LoopContinue:
    case NodeTypeEnumV2.LoopBreak:
    case NodeTypeEnumV2.Condition:
    case NodeTypeEnumV2.IntentRecognition:
      return '#ebf9f9';
    case NodeTypeEnumV2.Knowledge:
    case NodeTypeEnumV2.Variable:
    case NodeTypeEnumV2.LongTermMemory:
    case NodeTypeEnumV2.MCP:
      return '#FFF0DF';
    case NodeTypeEnumV2.QA:
    case NodeTypeEnumV2.DocumentExtraction:
    case NodeTypeEnumV2.TextProcessing:
    case NodeTypeEnumV2.HTTPRequest:
      return '#fef9eb';
    case NodeTypeEnumV2.LLM:
      return '#E9EBED';
    case NodeTypeEnumV2.Plugin:
      return '#E7E1FF';
    case NodeTypeEnumV2.Workflow:
      return '#D0FFDB';
    case NodeTypeEnumV2.Output:
      return '#E7E1FF';
    default:
      return '#EEEEFF';
  }
};

// 条件分支类型映射
const branchTypeMapV2: Record<string, string> = {
  IF: '如果',
  ELSE_IF: '否则如果',
  ELSE: '否则',
};

// 比较类型映射
const compareTypeMapV2: Record<string, string> = {
  EQ: '=',
  NEQ: '≠',
  GT: '>',
  GTE: '≥',
  LT: '<',
  LTE: '≤',
  CONTAINS: '包含',
  NOT_CONTAINS: '不包含',
  IS_EMPTY: '为空',
  IS_NOT_EMPTY: '不为空',
};

// 回答类型映射
const answerTypeMapV2: Record<string, string> = {
  TEXT: '文本输入',
  SELECT: '选项选择',
  FILE: '文件上传',
};

// 选项标签
const optionsMapV2 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ==================== 节点组件 ====================

interface NodeComponentProps {
  node: {
    getData: () => ChildNodeV2 & {
      isFocus?: boolean;
      runResults?: RunResultItemV2[];
      enableMove?: boolean;
    };
    getSize: () => { width: number; height: number };
    setData: (data: any) => void;
  };
  graph: Graph;
}

/**
 * 条件节点内容
 */
const ConditionNodeContent: React.FC<{ data: ChildNodeV2 }> = ({ data }) => {
  const conditionBranchConfigs = data.nodeConfig?.conditionBranchConfigs || [];

  return (
    <div className="condition-node-content-v2">
      {conditionBranchConfigs.map((item) => {
        const firstArgName = item.conditionArgs?.[0]?.firstArg?.name || '';
        const secondArgName =
          item.conditionArgs?.[0]?.secondArg?.name ||
          item.conditionArgs?.[0]?.secondArg?.bindValue ||
          '';
        const compareType = item.conditionArgs?.[0]?.compareType;

        return (
          <div key={item.uuid} className="condition-item-v2">
            <span className="condition-title-v2">
              {branchTypeMapV2[item.branchType || 'ELSE_IF']}
            </span>
            <div className="condition-input-v2">{firstArgName}</div>
            {item.conditionArgs && item.conditionArgs.length > 0 && (
              <>
                <span className="condition-compare-v2">
                  {compareType ? compareTypeMapV2[compareType] : ''}
                </span>
                <div className="condition-input-v2">{secondArgName}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * 问答节点内容
 */
const QANodeContent: React.FC<{ data: ChildNodeV2 }> = ({ data }) => {
  const inputArgs = data.nodeConfig?.inputArgs;
  const question = data.nodeConfig?.question;
  const answerType = data.nodeConfig?.answerType || 'TEXT';
  const options = data.nodeConfig?.options || [];

  return (
    <div className="qa-node-content-v2">
      <div className="qa-item-v2">
        <span className="qa-title-v2">输入</span>
        <div>
          {inputArgs?.slice(0, 2).map((item, index) => (
            <Tag key={`inputArgs-${item.name}-${index}`}>{item.name}</Tag>
          ))}
          {inputArgs && inputArgs.length > 2 && (
            <Tag>+{inputArgs.length - 2}</Tag>
          )}
          {!inputArgs && <span>未配置输入内容</span>}
        </div>
      </div>
      <div className="qa-item-v2">
        <span className="qa-title-v2">提问内容</span>
        <span className="qa-content-v2">{question || '未配置提问内容'}</span>
      </div>
      <div className="qa-item-v2">
        <span className="qa-title-v2">问答类型</span>
        <span>{answerTypeMapV2[answerType]}</span>
      </div>
      {answerType === 'SELECT' &&
        options.map((item, index) => (
          <div
            key={`options-${item.uuid || optionsMapV2[index]}-${index}`}
            className="qa-item-v2"
          >
            <span className="qa-title-v2"></span>
            <Tag>{optionsMapV2[index]}</Tag>
            <span className="qa-content-v2">
              {item.content || '未配置内容'}
            </span>
          </div>
        ))}
    </div>
  );
};

/**
 * 意图识别节点内容
 */
const IntentRecognitionContent: React.FC<{ data: ChildNodeV2 }> = ({
  data,
}) => {
  const intentConfigs = data.nodeConfig?.intentConfigs || [];

  return (
    <div className="intent-node-content-v2">
      {intentConfigs.map((item, index) => (
        <div className="intent-item-v2" key={index}>
          <span className="intent-title-v2">选项{index + 1}</span>
          <span className="intent-content-v2">
            {item.intent || '未配置意图'}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 异常处理展示
 */
const ExceptionHandleV2: React.FC<{ type?: string }> = ({ type }) => {
  const label =
    EXCEPTION_HANDLE_OPTIONS_V2.find((item) => item.value === type)?.label ||
    '未配置';

  return (
    <div className="exception-handle-v2">
      <span className="exception-title-v2">异常时</span>
      <span className="exception-content-v2">{label}</span>
    </div>
  );
};

/**
 * 通用节点组件 - 参考 V1 GeneralNode
 */
const GeneralNodeComponent: React.FC<NodeComponentProps> = ({
  node,
  graph,
}) => {
  const data = node.getData();
  const [editValue, setEditValue] = useState(data?.name || '');

  // 使用节点选中 hook
  const isSelected = useNodeSelection({ graph, nodeId: data?.id });

  useEffect(() => {
    setEditValue(data?.name || '');
  }, [data?.name]);

  if (!data) {
    return null;
  }

  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColorV2(
    data.type,
  )} 0%, white 100%)`;

  const isSpecialNode = [
    NodeTypeEnumV2.QA,
    NodeTypeEnumV2.Condition,
    NodeTypeEnumV2.IntentRecognition,
  ].includes(data.type);
  const marginBottom = isSpecialNode ? '10px' : '0';

  // 运行状态
  const runResults = data.runResults || [];
  const lastResult = runResults[runResults.length - 1];
  const isRunning = lastResult?.status === RunResultStatusEnumV2.EXECUTING;
  const isError = lastResult?.status === RunResultStatusEnumV2.FAILED;
  const isSuccess = lastResult?.status === RunResultStatusEnumV2.FINISHED;
  const showException = EXCEPTION_NODES_TYPE_V2.includes(data.type);
  const exceptionHandleType =
    data.nodeConfig?.exceptionHandleConfig?.exceptionHandleType;

  const nodeClassName = [
    'general-node-v2',
    isSelected ? 'selected' : '',
    isRunning ? 'running' : '',
    isSuccess ? 'success' : '',
    isError ? 'error' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={nodeClassName}>
      {/* 节点头部 */}
      <div
        className="general-node-header-v2"
        style={{
          background: gradientBackground,
          marginBottom,
        }}
      >
        <div className="general-node-header-image-v2">
          {returnImgV2(data.type)}
        </div>
        <span className="general-node-header-title-v2">{editValue}</span>
      </div>

      {/* 条件节点内容 */}
      {data.type === NodeTypeEnumV2.Condition && (
        <ConditionNodeContent data={data} />
      )}

      {/* 问答节点内容 */}
      {data.type === NodeTypeEnumV2.QA && <QANodeContent data={data} />}

      {/* 意图识别节点内容 */}
      {data.type === NodeTypeEnumV2.IntentRecognition && (
        <IntentRecognitionContent data={data} />
      )}

      {/* 异常处理展示 */}
      {showException && <ExceptionHandleV2 type={exceptionHandleType} />}
    </div>
  );
};

/**
 * 循环节点组件 - 参考 V1 LoopNode
 */
const LoopNodeComponent: React.FC<NodeComponentProps> = ({ node, graph }) => {
  const data = node.getData();
  const [editValue, setEditValue] = useState(data?.name || '');

  // 使用节点选中 hook
  const isSelected = useNodeSelection({ graph, nodeId: data?.id });

  useEffect(() => {
    setEditValue(data?.name || '');
  }, [data?.name]);

  if (!data) {
    return null;
  }

  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColorV2(
    data.type,
  )} 0%, white 42px)`;

  return (
    <div
      className={`loop-node-v2 general-node-v2 ${isSelected ? 'selected' : ''}`}
      style={{ background: gradientBackground }}
    >
      <div className="loop-node-title-v2">
        <ICON_WORKFLOW_LOOP />
        <span className="loop-title-text-v2">{editValue}</span>
      </div>
      <div className="loop-node-content-v2" />
    </div>
  );
};

// ==================== 注册节点 ====================

let isRegistered = false;

/**
 * 注册自定义节点
 */
export function registerCustomNodesV2(): void {
  if (isRegistered) {
    return;
  }

  // 注册通用节点
  register({
    shape: NodeShapeEnumV2.General,
    width: 220,
    height: 44,
    component: GeneralNodeComponent,
    ports: { groups: PORT_GROUPS_V2 },
  });

  // 注册循环节点
  register({
    shape: NodeShapeEnumV2.Loop,
    width: 660,
    height: 240,
    component: LoopNodeComponent,
    ports: { groups: PORT_GROUPS_V2 },
  });

  isRegistered = true;
}

// ==================== 自定义连接器 ====================

/**
 * 创建曲线路径（用于连线）- 参考 V1 createCurvePath
 */
export function createCurvePathV2(
  sourcePoint: { x: number; y: number },
  targetPoint: { x: number; y: number },
  _vertices: { x: number; y: number }[],
  _options: any,
): string {
  const startOffset = 2;
  const endOffset = 2;
  const deltaX = Math.abs(targetPoint.x - sourcePoint.x);
  const control = Math.floor((deltaX / 3) * 2);

  let newStartX =
    sourcePoint.x < targetPoint.x
      ? sourcePoint.x + startOffset
      : sourcePoint.x - startOffset;
  let newEndX =
    targetPoint.x > sourcePoint.x
      ? targetPoint.x - endOffset
      : targetPoint.x + endOffset;

  const startY = sourcePoint.y;
  const endY = targetPoint.y;

  const v1 = { x: newStartX + control, y: startY };
  const v2 = { x: newEndX - control, y: endY };

  return Path.normalize(
    `M ${newStartX} ${startY}
     L ${
       newStartX + (sourcePoint.x < targetPoint.x ? startOffset : -startOffset)
     } ${startY}
     C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${newEndX} ${endY}
     L ${newEndX} ${endY}
    `,
  );
}

/**
 * 注册自定义连接器
 */
export function registerCustomConnectorV2(): void {
  Graph.registerConnector('curveConnectorV2', createCurvePathV2, true);
}

export default {
  registerCustomNodesV2,
  registerCustomConnectorV2,
  createCurvePathV2,
};
