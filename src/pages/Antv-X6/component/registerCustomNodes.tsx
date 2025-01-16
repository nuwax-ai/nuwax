import { ChildNode, NodeProps } from '@/types/interfaces/workflow';
import { returnBackgroundColor, returnImg } from '@/utils/workflow';
import { DashOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { register } from '@antv/x6-react-shape';
import { Input, Popover } from 'antd';
import React from 'react';
import '../index.less';
// 定义组件的状态类型
interface GeneralNodeState {
  isEditingTitle: boolean;
  editedTitle: string;
}
/**
 * 定义 GeneralNode 类组件，代表一个通用节点，该节点可以是流程图或其他图形编辑器中的元素。
 */
export class GeneralNode extends React.Component<NodeProps, GeneralNodeState> {
  constructor(props: NodeProps) {
    super(props);
    console.log(this.props.node.getData());
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
    if (typeof this.props.node.getData().onChange === 'function') {
      this.props.node.getData().onChange(val, node); // 调用父组件提供的回调函数
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
      const updatedData = { ...data, title: this.state.editedTitle };
      node.setData(updatedData);
    });
  };

  // 改变节点的宽高
  handleResized = () => {
    console.log('Node has been resized.');
    // const { node } = this.props;
    // const data = node.getData<NodeProps>();
    // const width = data.width ? data.width : 304;
    // const height = data.height ? data.height : 83;
    // node.setSize(width, height);
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
    // 或者返回一个默认的内容，以防止渲染错误
    if (!data) {
      return null;
    }

    console.log(data);
    // 确保宽度和高度是有效的数字
    const width = data.nodeConfig.extension?.width
      ? data.nodeConfig.extension.width
      : 304;
    const height = data.nodeConfig.extension?.height
      ? data.nodeConfig.extension.height
      : 83;
    // 构造渐变背景字符串
    const gradientBackground = `linear-gradient(to bottom, ${returnBackgroundColor(
      data.type,
    )} 0%, white 70%)`;

    return (
      <div
        className="general-node"
        style={{
          width: width,
          height: height,
        }}
      >
        {/* 节点头部，包含标题、图像和操作菜单 */}
        <div
          className="general-node-header"
          style={{ background: gradientBackground }}
        >
          <div className="general-node-header-image">
            {returnImg(data.type)}
            {this.state.isEditingTitle ? (
              <Input
                value={this.state.editedTitle}
                onChange={this.handleTitleChange}
                onBlur={this.finishEditTitle}
                onPressEnter={this.finishEditTitle}
                autoFocus
              />
            ) : (
              <span>{data.name}</span>
            )}
          </div>
          <div>
            {data.type !== 'Start' && (
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
            {/* 使用 Popover 渲染右侧三个点 */}
            {data.type !== 'Start' && (
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
        <div className="general-node-content">
          <div className="text-ellipsis">{data.description}</div>
        </div>
      </div>
    );
  }
}

/**
 * 定义连接桩的样式配置，包括四个方向上的连接桩（上、右、下、左）。
 * 每个连接桩都是一个小圆圈，具有特定的颜色、大小和可见性设置。
 */

// 定义单个连接桩的样式
const portItemStyle = {
  circle: {
    // 圆形连接桩的半径
    r: 4,
    // 标记为磁铁，使它能够成为连接线的目标
    magnet: true,
    // 连接桩边框颜色
    stroke: '#5F95FF',
    // 边框宽度
    strokeWidth: 1,
    // 填充颜色
    fill: '#fff',
    style: {
      // 默认隐藏连接桩，直到有连接线时才显示
      visibility: 'hidden',
    },
  },
};

/**
 * 定义 插件和工作流的节点
 * 插件和工作流应该先弹出一个model，显示可以选择的选项，再添加节点
 */
// const markup=[{
//   tagName: 'circle',
//   selector: 'portBody',
// }]

const ports = {
  groups: {
    // 上方的连接桩
    top: {
      position: 'top',
      attrs: portItemStyle,
    },
    // 右边的连接桩
    right: {
      position: 'right',
      attrs: portItemStyle,
    },
    // 下方的连接桩
    bottom: {
      position: 'bottom',
      attrs: portItemStyle,
    },
    // 左边的连接桩
    left: {
      position: 'left',
      attrs: portItemStyle,
    },
  },
  // 运用哪些连接桩，如果不需要就删除掉，或者动态传入
  items: [
    {
      group: 'top',
    },
    {
      group: 'right',
    },
    {
      group: 'bottom',
    },
    {
      group: 'left',
    },
  ],
};

// 注册组件时，确保传递了正确的类型
export function registerCustomNodes() {
  // 将自定义节点正确注册
  register({
    // 用哪个自定义节点，现在只有这一个
    shape: 'general-Node',
    //
    component: GeneralNode,
    // 添加连接桩配置
    ports: ports,
    // 设置 embeddable 属性以决定是否允许嵌套
    embeddable: ({ data }: { data: ChildNode }) => data.type === 'Loop',
    // 启用节点大小调整
    resizable: true,
  });
}
