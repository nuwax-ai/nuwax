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
    this.state = {
      // 标题编辑状态
      isEditingTitle: false,
      // 标题的内容
      editedTitle: this.props.node.getData<ChildNode>().name || '',
    };
  }

  componentDidMount() {
    const { node } = this.props;
    // 监听节点大小变化事件
    node.on('resize', this.handleResized);
  }

  componentWillUnmount() {
    const { node } = this.props;
    // 移除监听器
    node.off('resize', this.handleResized);
  }

  handleResized = () => {
    console.log('Node has been resized.');
    // 调用 updatePorts 方法以根据新的尺寸更新端口位置
    // this.props.node.updatePorts();
  };
  /**
   * changeNode 是一个事件处理函数，当用户点击操作菜单项时触发。
   * @param val - 操作名称（例如：'Rename', 'Duplicate', 'Delete'）
   */
  changeNode = (val: string) => {
    // 检查 onChange 是否存在并且是一个函数
    const { node } = this.props;
    const data = node.getData<NodeProps>();
    if (typeof this.props.node.getData().onChange === 'function') {
      this.props.node.getData().onChange(val, data); // 调用父组件提供的回调函数
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
      this.props.node.getData().onChange('Rename', updatedData); // 调用父组件提供的回调函数
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
    // 或者返回一个默认的内容，以防止渲染错误
    if (!data) {
      return null;
    }
    // 确保宽度和高度是有效的数字
    const width =
      data.nodeConfig &&
      data.nodeConfig.extension &&
      data.nodeConfig.extension.width
        ? data.nodeConfig.extension.width
        : 304;
    const height =
      data.nodeConfig &&
      data.nodeConfig.extension &&
      data.nodeConfig.extension.height
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
          {data.type !== 'Start' &&
            data.type !== 'End' &&
            data.type !== 'Loop' && (
              <div>
                <Popover placement="top" content={'测试该节点'}>
                  <PlayCircleOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      // 触发父组件的事件
                      this.changeNode('TestRun');
                    }}
                  />
                </Popover>
                <Popover content={this.content} trigger="hover">
                  <DashOutlined
                    style={{ marginLeft: '10px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popover>
              </div>
            )}
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

// 定义端口生成函数
const ports = {
  groups: {
    out: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
        },
      },
      connectable: {
        source: true,
        target: false,
      },
    },
    in: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
        },
      },
      connectable: {
        source: false,
        target: true,
      },
    },
  },
  items: [
    { group: 'out', name: 'out-port' }, // 添加名字
    { group: 'in', name: 'in-port' }, // 添加名字
  ],
};

// 注册组件时，确保传递了正确的类型

export function registerCustomNodes() {
  // 将自定义节点正确注册
  register({
    shape: 'general-Node',
    component: GeneralNode,
    ports: ports, // 确保返回 PortMetadata[]
    embeddable: ({ data }: { data: ChildNode }) => data.type === 'Loop',
    resizable: true,
  });
}
