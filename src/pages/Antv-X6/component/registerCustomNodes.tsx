import { ICON_WORKFLOW_LOOP } from '@/constants/images.constants';
import {
  answerTypeMap,
  branchTypeMap,
  compareTypeMap,
  optionsMap,
} from '@/constants/node.constants';
import { NodeTypeEnum } from '@/types/enums/common';
import {
  AnswerTypeEnum,
  ChildNode,
  CompareTypeEnum,
  NodeProps,
} from '@/types/interfaces/graph';
import {
  NodeShapeEnum,
  returnBackgroundColor,
  returnImg,
} from '@/utils/workflow';
import { Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Tag } from 'antd';
import React from 'react';
import '../index.less';

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
          <div key={index} className="dis-left mb-16">
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

export class GeneralNode extends React.Component<NodeProps> {
  /**
   * 通过render返回节点的样式和内容
   */
  render() {
    const { node, graph } = this.props;
    // 明确告诉 getData 返回的数据类型
    const data = node.getData<ChildNode>();
    // console.log(node.isSelected())
    let isSelected = graph.isSelected(node); // 判断是否选中

    graph.on('blank:click', () => {
      if (isSelected) {
        // console.log(graph.cleanSelection())
        this.forceUpdate();
        // graph.cleanSelection()
      }
    });
    // 或者返回一个默认的内容，以防止渲染错误
    if (!data) {
      return null;
    }
    // 确保宽度和高度是有效的数字
    // const width = data.nodeConfig?.extension?.width ?? 304;
    // const height = data.nodeConfig?.extension?.height ?? 83;
    // 构造渐变背景字符串
    const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
      data.type,
    )} 0%, white 100%)`;
    const isSpecialNode = [
      NodeTypeEnum.QA,
      NodeTypeEnum.Condition,
      NodeTypeEnum.IntentRecognition,
    ].includes(data.type);
    const marginBottom = isSpecialNode ? '10px' : '0';
    return (
      <div
        className={`general-node ${isSelected ? 'selected-general-node' : ''}`} // 根据选中状态应用类名
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
            <span className="general-node-header-title text-ellipsis">
              {data.name}
            </span>
          </div>
        </div>

        {data.type === NodeTypeEnum.Condition && <ConditionNode data={data} />}

        {data.type === NodeTypeEnum.QA && <QANode data={data} />}

        {data.type === NodeTypeEnum.IntentRecognition && (
          <IntentRecognitionNode data={data} />
        )}
      </div>
    );
  }
}

/**
 * 定义循环的节点
 */

// 添加循环体节点
// 优化后的 LoopNode 组件
export const LoopNode: React.FC<NodeProps> = ({ node, graph }) => {
  const data = node.getData<ChildNode>();
  let isSelected = graph.isSelected(node); // 判断是否选中
  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
    data.type,
  )} 0%, white 42px)`;
  return (
    <div
      className={`loop-node-style general-node ${
        isSelected ? 'selected-general-node' : ''
      }`}
      style={{ background: gradientBackground }}
    >
      <div className="loop-node-title-style dis-left">
        <ICON_WORKFLOW_LOOP style={{ marginRight: '6px' }} />
        <span>{data.name}</span>
      </div>
      <div className="loop-node-content" />
    </div>
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
