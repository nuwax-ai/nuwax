import EditableTitle from '@/components/editableTitle';
import { ICON_WORKFLOW_LOOP } from '@/constants/images.constants';
import {
  answerTypeMap,
  branchTypeMap,
  compareTypeMap,
  EXCEPTION_HANDLE_OPTIONS,
  optionsMap,
} from '@/constants/node.constants';
import useNodeSelection from '@/hooks/useNodeSelection';
import {
  returnBackgroundColor,
  returnImg,
} from '@/pages/Antv-X6/v3/utils/workflowV3';
import {
  AnswerTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
  RunResultStatusEnum,
} from '@/types/enums/common';
import { ConditionBranchTypeEnum } from '@/types/enums/node';
import { ChildNode, NodeProps, RunResultItem } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Tag } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import '../indexV3.less';
import { showExceptionHandle } from '../utils/graphV3';
import './registerCustomNodes.less';
import RunResult from './runResult';
// 定义那些节点有试运行

// 条件节点
const ConditionNode: React.FC<{ data: ChildNode }> = ({ data }) => {
  const conditionBranchConfigs = data.nodeConfig.conditionBranchConfigs;

  return (
    <div className="condition-node-content-style">
      {conditionBranchConfigs?.map((item) => {
        const firstArgName = item.conditionArgs
          ? item.conditionArgs[0]?.firstArg?.name
          : '';
        const secondArgName =
          item.conditionArgs[0]?.secondArg?.name ||
          item.conditionArgs[0]?.secondArg?.bindValue ||
          '';
        return (
          <div key={item.uuid} className="dis-left condition-item-style">
            <span className="condition-title-sytle">
              {
                branchTypeMap[
                  item.branchType || ConditionBranchTypeEnum.ELSE_IF
                ]
              }
            </span>
            <div className="flex-1 condition-node-left-input">
              {firstArgName}
            </div>
            {item.conditionArgs && item.conditionArgs.length > 0 && (
              <div className="dis-left">
                {/* 添加空值检查，确保 compareType 不是 null 或 undefined */}
                <span className="condition-node-compare-type">
                  {item.conditionArgs[0]?.compareType
                    ? compareTypeMap[
                        item.conditionArgs[0]
                          .compareType as keyof typeof compareTypeMap
                      ]
                    : ''}
                </span>
                <div className="condition-node-right-input">
                  {secondArgName}
                </div>
              </div>
            )}
          </div>
        );
      })}
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
        {inputArgs?.slice(0, 2).map((item, index) => (
          <Tag key={`inputArgs-${item.name}-${index}`}>{item.name}</Tag>
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
          <div
            key={`options-${item.uuid || optionsMap[index]}-${index}`}
            className="dis-left"
          >
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
  data: RunResultItem[] | [];
}> = ({ data }) => {
  const time = (
    (data?.reduce((acc, item) => {
      return (
        acc + ((item?.options?.endTime || 0) - (item?.options?.startTime || 0))
      );
    }, 0) || 0) / 1000
  ).toFixed(3);
  const total = data?.length || 0;
  const [pageTotal, setPageTotal] = useState(total);
  // 当前页码
  const [current, setCurrent] = useState(1);
  // 是否只看错误
  const [onlyError, setOnlyError] = useState(false);
  // 是否展开
  const [expanded, setExpanded] = useState(false);
  const [innerData, setInnerData] = useState<RunResultItem[] | []>([]);

  const success = data.every(
    (item) => item?.status === RunResultStatusEnum.FINISHED,
  );
  const isExecuting = data.some(
    (item) =>
      item?.status === RunResultStatusEnum.EXECUTING ||
      item?.status === RunResultStatusEnum.STOP_WAIT_ANSWER,
  );

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

  useEffect(() => {
    setInnerData(data);
  }, [data]);

  useEffect(() => {
    if (onlyError && !success) {
      const _data = data.filter(
        (item) => item?.status === RunResultStatusEnum.FAILED,
      );
      setInnerData(_data.length > 0 ? _data : []);
    } else {
      setInnerData(data);
    }
  }, [onlyError, success]);

  useEffect(() => {
    setPageTotal(innerData.length);
    setCurrent(1);
  }, [innerData]);
  const genRunResultTitle = useCallback(() => {
    const statusList = data.map((item) => item?.status);

    switch (true) {
      case statusList.some(
        (status) => status === RunResultStatusEnum.STOP_WAIT_ANSWER,
      ):
        return '请答复问题';
      case statusList.some(
        (status) => status === RunResultStatusEnum.EXECUTING,
      ):
        return '运行中';
      case statusList.some((status) => status === RunResultStatusEnum.FAILED):
        return '运行失败';
      case statusList.every(
        (status) => status === RunResultStatusEnum.FINISHED,
      ):
        return '运行成功';
      default:
        return '运行失败';
    }
  }, [data]);

  if (data?.length === 0) {
    return null;
  }
  return (
    <RunResult
      success={success}
      title={genRunResultTitle()}
      loading={isExecuting}
      collapsible={!isExecuting}
      time={`${time}s`}
      total={pageTotal}
      current={current}
      onlyError={onlyError}
      onPageChange={handlePageChange}
      onOnlyErrorChange={handleOnlyErrorChange}
      expanded={expanded}
      onExpandChange={handleExpandChange}
      inputParams={innerData[current - 1]?.options?.input || {}}
      outputResult={innerData[current - 1]?.options?.data || {}}
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
    setEditValue(saveValue);
    graph.trigger('node:custom:save', {
      data: node.getData<ChildNode>(),
      payload: { name: saveValue },
    });
    return true;
  };

  const canNotEditNode = DISABLE_EDIT_NODE_TYPES.includes(data.type);
  const runResults = data.runResults || [];
  const showRunResult = [NodeTypeEnum.LoopStart, NodeTypeEnum.LoopEnd].includes(
    data.type,
  )
    ? false
    : !!runResults.length; //循环内的开始结果节点不展示
  const showException = showExceptionHandle(data);

  if (!data) {
    return null;
  }

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
            dataId={data.id.toString()}
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
        {showException && (
          <ExceptionHandle data={data.nodeConfig.exceptionHandleConfig} />
        )}
      </div>
      {/* 运行结果 */}
      {showRunResult && <NodeRunResult data={runResults} />}
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
  const handleEditingStatusChange = (val: boolean) => {
    // 编辑中不能移动节点
    node.setData({ enableMove: !val });
  };

  // 处理保存
  const handleSave = (saveValue: string): boolean => {
    setEditValue(saveValue);
    graph.trigger('node:custom:save', {
      data: node.getData<ChildNode>(),
      payload: { name: saveValue },
    });
    return true;
  };
  const runResults = data.runResults || [];
  const showRunResult = !!runResults.length;
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
            dataId={data.id.toString()}
            onEditingStatusChange={handleEditingStatusChange}
            onSave={handleSave}
          />
        </div>
        <div className="loop-node-content" />
      </div>
      {showRunResult && <NodeRunResult data={runResults} />}
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
