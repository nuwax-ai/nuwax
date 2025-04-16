import { ICON_WORKFLOW_LOOP } from '@/constants/images.constants';
import {
  ansewerTypeMap,
  branchTypeMap,
  compareTypeMap,
  optionsMap,
  testRunList,
} from '@/constants/node.constants';
import { ChildNode, NodeProps } from '@/types/interfaces/graph';
import { returnBackgroundColor, returnImg } from '@/utils/workflow';
import { DashOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import { Input, Popover, Tag } from 'antd';
import React from 'react';
import '../index.less';

// 定义组件的状态类型
interface GeneralNodeState {
  isEditingTitle: boolean;
  editedTitle: string;
}
// 定义那些节点有试运行

/**
 * 定义 GeneralNode 类组件，代表一个通用节点，该节点可以是流程图或其他图形编辑器中的元素。
 */
export class GeneralNode extends React.Component<NodeProps, GeneralNodeState> {
  // 新增实例属性保存回调引用
  private onChangeRef: ((val: string, data: NodeProps) => void) | null = null;

  constructor(props: NodeProps) {
    super(props);
    // 初始化时缓存回调函数
    this.onChangeRef = this.props.node.getData().onChange;
    this.state = {
      // 标题编辑状态
      isEditingTitle: false,
      // 标题的内容
      editedTitle: this.props.node.getData<ChildNode>().name || '',
    };
  }
  /**
   * changeNode 是一个事件处理函数，当用户点击操作菜单项时触发。
   * @param val - 操作名称（例如：'Rename', 'Duplicate', 'Delete'）
   */
  changeNode = (val: string) => {
    // 检查 onChange 是否存在并且是一个函数
    const { node } = this.props;
    const data = node.getData<NodeProps>();
    if (typeof this.onChangeRef === 'function') {
      this.onChangeRef(val, data);
    }
  };
  // 将输入的值替换掉节点名称
  handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ editedTitle: e.target.value });
  };

  // 将节点名称渲染为input框
  startEditTitle = () => {
    this.setState({ isEditingTitle: true });
  };

  // 修改节点名称
  finishEditTitle = () => {
    this.setState({ isEditingTitle: false }, () => {
      const { node } = this.props;
      const data = node.getData<NodeProps>();
      const updatedData = { ...data, name: this.state.editedTitle };
      node.setData(updatedData);
      // 使用缓存的回调引用
      if (typeof this.onChangeRef === 'function') {
        this.onChangeRef('Rename', updatedData);
      }
    });
  };

  /**
   * 右侧三个点的操作列表。
   */
  content = (
    <>
      <p onClick={() => this.startEditTitle()} className="cursor-pointer">
        重命名
      </p>
      <p
        onClick={() => this.changeNode('Duplicate')}
        className="cursor-pointer"
      >
        创建副本
      </p>
      <p onClick={() => this.changeNode('Delete')} className="cursor-pointer">
        删除
      </p>
    </>
  );

  /**
   * 通过render返回节点的样式和内容
   */
  render() {
    const { node } = this.props;
    // 明确告诉 getData 返回的数据类型
    const data = node.getData<ChildNode>();
    const isSelected = !!data.selected; // 判断是否选中
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
    )} 0%, white 70%)`;
    return (
      <div
        className={`general-node ${isSelected ? 'selected-general-node' : ''}`} // 根据选中状态应用类名
      >
        {/* 节点头部，包含标题、图像和操作菜单 */}
        <div
          className="general-node-header"
          style={{ background: gradientBackground }}
        >
          <div className="dis-left general-node-header-image">
            {returnImg(data.type)}
            {this.state.isEditingTitle ? (
              <Input
                value={this.state.editedTitle}
                onChange={this.handleTitleChange}
                // onBlur={this.finishEditTitle}
                onPressEnter={this.finishEditTitle}
                autoFocus
              />
            ) : (
              <span className="general-node-header-title">{data.name}</span>
            )}
          </div>
          <div className="other-action-style">
            {testRunList.includes(data.type) && (
              <Popover placement="top" content={'测试该节点'}>
                <PlayCircleOutlined
                  onClick={(e) => {
                    e.stopPropagation();
                    // 触发父组件的事件
                    this.changeNode('TestRun');
                  }}
                />
              </Popover>
            )}

            {data.type !== 'Start' && data.type !== 'End' && (
              <Popover content={this.content} trigger="hover">
                <DashOutlined
                  style={{ marginLeft: '10px' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popover>
            )}
          </div>
        </div>
        {/* 节点内容区，根据 data.content 的类型显示不同的内容 */}
        {data.type !== 'IntentRecognition' &&
          data.type !== 'Condition' &&
          data.type !== 'QA' && (
            <div className="general-node-content">
              <div className="text-ellipsis">{data.description}</div>
            </div>
          )}
        {data.type === 'Condition' && (
          <div className="condition-node-content-style">
            {data.nodeConfig.conditionBranchConfigs?.map((item) => {
              return (
                <div key={item.uuid} className="dis-left condition-item-style">
                  <span className="condition-title-sytle">
                    {branchTypeMap[item.branchType || 'ELSE_IF']}
                  </span>
                  <Input
                    value={
                      item.conditionArgs
                        ? item.conditionArgs[0]?.firstArg?.name
                        : ''
                    }
                    className="flex-1"
                    disabled
                  />
                  {item.conditionArgs && item.conditionArgs.length > 0 && (
                    <div className="dis-left">
                      {/* 添加空值检查，确保 compareType 不是 null 或 undefined */}
                      <span style={{ width: '18px', textAlign: 'center' }}>
                        {item.conditionArgs[0]?.compareType
                          ? compareTypeMap[
                              item.conditionArgs[0]
                                .compareType as keyof typeof compareTypeMap
                            ]
                          : ''}
                      </span>
                      <Input
                        disabled
                        value={
                          item.conditionArgs[0]?.secondArg?.name ||
                          item.conditionArgs[0]?.secondArg?.bindValue ||
                          ''
                        }
                        className="condition-right-input"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* [0].secondArg?.bindValue */}
        {/* ?item.conditionArgs[0].firstArg?.bindValue:'' */}
        {data.type === 'QA' && (
          <div className="qa-node-content-style">
            <div className="dis-left">
              <span className="text-right qa-title-style">输入</span>

              {data.nodeConfig.inputArgs &&
                data.nodeConfig?.inputArgs.map((item) => {
                  return <Tag key={item.name}>{item.name}</Tag>;
                })}
              {!data.nodeConfig.inputArgs && <span>未配置输入内容</span>}
            </div>
            <div className="dis-left">
              <span className="text-right qa-title-style">提问内容</span>
              <span>{data.nodeConfig.question || '未配置提问内容'}</span>
            </div>
            <div className="dis-left">
              <span className="text-right qa-title-style">问答类型</span>
              <span>
                {
                  ansewerTypeMap[
                    (data.nodeConfig.answerType as 'TEXT' | 'SELECT') ?? 'TEXT'
                  ]
                }
              </span>
            </div>
            {data.nodeConfig.answerType === 'SELECT' &&
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
        )}

        {data.type === 'IntentRecognition' && (
          <div className="qa-node-content-style">
            {data.nodeConfig.intentConfigs?.map((item, index) => (
              <div className="dis-left" key={index}>
                <span className="qa-title-style">选项{index + 1}</span>
                <span className="qa-content-style">
                  {item.intent || '未配置意图'}
                </span>
              </div>
            ))}
          </div>
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
export const LoopNode: React.FC<NodeProps> = ({ node }) => {
  const data = node.getData<ChildNode>();
  const isSelected = !!data.selected; // 判断是否选中
  const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
    data.type,
  )} 0%, white 70%)`;
  return (
    <div
      className={`loop-node-style general-node ${
        isSelected ? 'selected-general-node' : ''
      }`}
    >
      <div
        className="loop-node-title-style dis-left"
        style={{ background: gradientBackground }}
      >
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
    shape: 'general-Node',
    component: GeneralNode,
  });
  register({
    shape: 'loop-node',
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
