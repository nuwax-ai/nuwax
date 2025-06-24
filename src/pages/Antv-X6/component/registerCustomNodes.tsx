import EditableTitle from '@/components/editableTitle';
import { ICON_WORKFLOW_LOOP } from '@/constants/images.constants';
import {
  answerTypeMap,
  branchTypeMap,
  compareTypeMap,
  EXCEPTION_HANDLE_OPTIONS,
  EXCEPTION_NODES_TYPE,
  optionsMap,
} from '@/constants/node.constants';
import useNodeSelection from '@/hooks/useNodeSelection';
import {
  AnswerTypeEnum,
  CompareTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { ChildNode, NodeProps, RunResultItem } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { returnBackgroundColor, returnImg } from '@/utils/workflow';
import { Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import '../index.less';
import './registerCustomNodes.less';
import RunResult from './runResult';
// 定义那些节点有试运行

// 条件节点
const ConditionNode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const conditionBranchConfigs = data.nodeConfig.conditionBranchConfigs;
  const conditionArgs = conditionBranchConfigs?.[0]?.conditionArgs;
  const compareType = conditionArgs?.[0]?.compareType as CompareTypeEnum;
  const firstArg = conditionArgs?.[0]?.firstArg;
  const secondArg = conditionArgs?.[0]?.secondArg;
  return (
    <div className="condition-node-content-style">
      {conditionBranchConfigs?.map((item) => (
        <div key={item.uuid} className="dis-left condition-item-style">
          <span className="condition-title-sytle">
            {branchTypeMap[item.branchType || 'ELSE_IF']}
          </span>
          <div className="flex-1 border-box">
            {firstArg ? firstArg.name : ''}
          </div>
          {conditionArgs && conditionArgs.length > 0 && (
            <div className="dis-left">
              <span style={{ width: '18px', textAlign: 'center' }}>
                {compareType ? compareTypeMap[compareType] : ''}
              </span>
              <div className="condition-right-input border-box">
                {secondArg ? secondArg.name || secondArg.bindValue : ''}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// 问答节点
const QANode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const inputArgs = data.nodeConfig.inputArgs;
  const question = data.nodeConfig.question;
  const answerType = data.nodeConfig.answerType as AnswerTypeEnum;
  return (
    <div className="qa-node-content-style">
      <div className="dis-left">
        <span className="text-right qa-title-style">输入</span>
        {inputArgs?.slice(0, 2).map((item) => (
          <Tag key={item.name}>{item.name}</Tag>
        ))}
        {inputArgs && inputArgs.length > 2 && (
          <Tag>+{inputArgs.length - 2}</Tag>
        )}
        {!inputArgs && <span>未配置输入内容</span>}
      </div>
      <div className="dis-left">
        <span className="text-right qa-title-style">提问内容</span>
        <span className="question-content-style">
          {question || '未配置提问内容'}
        </span>
      </div>
      <div className="dis-left">
        <span className="text-right qa-title-style">问答类型</span>
        <span>{answerTypeMap[answerType]}</span>
      </div>
      {answerType === AnswerTypeEnum.SELECT &&
        data.nodeConfig.options?.map((item, index) => (
          <div key={`${item.uuid}`} className="dis-left">
            <span className="text-right qa-title-style"></span>
            <Tag>{optionsMap[index]}</Tag>
            <span className="qa-content-style">
              {item.content || '未配置内容'}
            </span>
          </div>
        ))}
    </div>
  );
};

// 意图识别节点
const IntentRecognitionNode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const intentConfigs = data.nodeConfig.intentConfigs;
  return (
    <div className="qa-node-content-style">
      {intentConfigs?.map((item, index) => (
        <div className="dis-left" key={index}>
          <span className="qa-title-style">选项{index + 1}</span>
          <span className="qa-content-style">
            {item.intent || '未配置意图'}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 定义 GeneralNode 类组件，代表一个通用节点，该节点可以是流程图或其他图形编辑器中的元素。
 */
const DISABLE_EDIT_NODE_TYPES = [
  NodeTypeEnum.LoopStart,
  NodeTypeEnum.LoopEnd,
  NodeTypeEnum.Start,
  NodeTypeEnum.End,
];
const NodeRunResult: React.FC<{
  options?: RunResultItem['options'];
  status?: RunResultItem['status'];
}> = ({ options, status }) => {
  const time =
    options?.startTime && options?.endTime
      ? `${(options.endTime - options.startTime) / 1000}s`
      : '0.000s';
  const total = (options?.input || []).length;
  // 当前页码
  const [current, setCurrent] = useState(total > 1 ? 1 : 0);
  // 是否只看错误
  const [onlyError, setOnlyError] = useState(false);
  // 是否展开
  const [expanded, setExpanded] = useState(false);

  if (!options || !status) {
    return null;
  }

  const success = status === 'FINISHED';
  const isExecuting = status === 'EXECUTING';

  // 处理页码变化
  const handlePageChange = (page: number) => {
    console.log('页码变化：', page);
    setCurrent(page);
  };

  // 处理只看错误变化
  const handleOnlyErrorChange = (checked: boolean) => {
    console.log('只看错误变化：', checked);
    setOnlyError(checked);
  };

  // 处理展开/收起变化
  const handleExpandChange = (expanded: boolean) => {
    console.log('展开/收起变化：', expanded);
    setExpanded(expanded);
  };

  return (
    <RunResult
      success={success}
      loading={isExecuting}
      collapsible={!isExecuting}
      time={time}
      total={total}
      current={current}
      onlyError={onlyError}
      onPageChange={handlePageChange}
      onOnlyErrorChange={handleOnlyErrorChange}
      expanded={expanded}
      onExpandChange={handleExpandChange}
      batchVariables={options.data || {}}
      inputParams={options.input || {}}
      outputResult={options.data || {}}
    />
  );
};

const ExceptionHandle: React.FC<{
  data: ExceptionHandleConfig | undefined;
}> = ({ data }) => {
  return (
    <div className="exception-handle-style">
      <span className="exception-handle-title">异常时</span>
      <p className="exception-handle-content">
        {
          EXCEPTION_HANDLE_OPTIONS.find(
            (item) => item.value === data?.exceptionHandleType,
          )?.label
        }
      </p>
    </div>
  );
};

export const GeneralNode: React.FC<NodeProps> = (props) => {
  /**
   * 通过render返回节点的样式和内容
   */
  const { node, graph } = props;
  const data = node.getData<ChildNode>();
  const selected = useNodeSelection({ graph, nodeId: data?.id });
  const [editValue, setEditValue] = useState(data?.name || '');
  useEffect(() => {
    setEditValue(data?.name || '');
  }, [data?.name]);

  if (!data) {
    return null;
  }

  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
    data.type,
  )} 0%, white 100%)`;
  const isSpecialNode = [
    NodeTypeEnum.QA,
    NodeTypeEnum.Condition,
    NodeTypeEnum.IntentRecognition,
  ].includes(data.type);
  const marginBottom = isSpecialNode ? '10px' : '0';

  const handleEditingStatusChange = (val: boolean) => {
    // 编辑中不能移动节点
    node.setData({ enableMove: !val });
  };

  // 处理保存
  const handleSave = (saveValue: string): boolean => {
    // TODO 更新节点名称
    setEditValue(saveValue);
    graph.trigger('node:custom:save', {
      data: node.getData<ChildNode>(),
      payload: { name: saveValue },
    });
    return true;
  };

  const canNotEditNode = DISABLE_EDIT_NODE_TYPES.includes(data.type);
  const showRunResult = data.runResult;
  const showExceptionHandle =
    data.nodeConfig.exceptionHandleConfig &&
    EXCEPTION_NODES_TYPE.includes(data.type);
  return (
    <>
      <div
        className={`general-node ${selected ? 'selected-general-node' : ''}`} // 根据选中状态应用类名
      >
        {/* 节点头部，包含标题、图像和操作菜单 */}
        <div
          className="general-node-header"
          style={{
            background: gradientBackground,
            marginBottom,
          }} // 应用渐变背景
        >
          <div className="dis-left general-node-header-image">
            {returnImg(data.type)}
          </div>
          <EditableTitle
            key={data.id.toString()}
            value={editValue}
            onSave={handleSave}
            disabled={canNotEditNode}
            onEditingStatusChange={handleEditingStatusChange}
          />
        </div>

        {data.type === NodeTypeEnum.Condition && <ConditionNode data={data} />}

        {data.type === NodeTypeEnum.QA && <QANode data={data} />}

        {data.type === NodeTypeEnum.IntentRecognition && (
          <IntentRecognitionNode data={data} />
        )}
        {/* 异常处理 */}
        {showExceptionHandle && (
          <ExceptionHandle data={data.nodeConfig.exceptionHandleConfig} />
        )}
      </div>
      {/* 运行结果 */}
      {showRunResult && (
        <NodeRunResult
          options={data.runResult?.options}
          status={data.runResult?.status}
        />
      )}
    </>
  );
};

/**
 * 定义循环的节点
 */

// 添加循环体节点
// 优化后的 LoopNode 组件
export const LoopNode: React.FC<NodeProps> = ({ node, graph }) => {
  const data = node.getData<ChildNode>();
  const [editValue, setEditValue] = useState(data?.name || '');
  const selected = useNodeSelection({ graph, nodeId: data?.id });
  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
    data.type,
  )} 0%, white 42px)`;
  useEffect(() => {
    setEditValue(data?.name || '');
  }, [data?.name]);
  const handleSave = () => {
    setEditValue(editValue);
    node.setData({ name: editValue });
    return true;
  };
  const showRunResult = data.runResult;
  return (
    <>
      <div
        className={`loop-node-style general-node ${
          selected ? 'selected-general-node' : ''
        }`}
        style={{ background: gradientBackground }}
      >
        <div className="loop-node-title-style dis-left">
          <ICON_WORKFLOW_LOOP style={{ marginRight: '6px' }} />
          <EditableTitle
            key={data.id.toString()}
            value={editValue}
            onChange={(val) => {
              console.log('onChange', val);
              return true;
            }}
            onSave={handleSave}
          />
        </div>
        <div className="loop-node-content" />
      </div>
      {showRunResult && (
        <NodeRunResult
          options={data.runResult?.options}
          status={data.runResult?.status}
        />
      )}
    </>
  );
};

/**
 * 定义连接桩的样式配置，包括四个方向上的连接桩（上、右、下、左）。
 * 每个连接桩都是一个小圆圈，具有特定的颜色、大小和可见性设置。
 */

// 注册组件时，确保传递了正确的类型

export function registerCustomNodes() {
  // 将自定义节点正确注册
  register({
    shape: NodeShapeEnum.General,
    component: GeneralNode,
  });
  register({
    shape: NodeShapeEnum.Loop,
    component: LoopNode,
    resizable: true,
    draggable: true,
    // enabled: true
  });
}

interface Point {
  x: number;
  y: number;
}

export const createCurvePath = (s: Point, e: Point) => {
  const startOffset = 2; // 起点偏移量
  const endOffset = 2; // 终点偏移量
  const deltaX = Math.abs(e.x - s.x);
  const control = Math.floor((deltaX / 3) * 2); // 控制点的计算

  // 计算新的起点和终点位置，考虑到偏移量
  let newStartX = s.x < e.x ? s.x + startOffset : s.x - startOffset;
  let newEndX = e.x > s.x ? e.x - endOffset : e.x + endOffset;

  // 根据原始方向调整Y轴位置
  const startY = s.y;
  const endY = e.y;

  // 计算控制点的位置
  const v1 = { x: newStartX + control, y: startY };
  const v2 = { x: newEndX - control, y: endY };

  return Path.normalize(
    `M ${newStartX} ${startY}
     L ${newStartX + (s.x < e.x ? startOffset : -startOffset)} ${startY}
     C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${newEndX} ${endY}
     L ${newEndX} ${endY}
    `,
  );
};
