import { DashOutlined } from '@ant-design/icons';
import { register } from '@antv/x6-react-shape';
import { Popover } from 'antd';
import React from 'react';
import '../index.less';
import { Child, NodeProps } from '../type';
/**
 * 定义 GeneralNode 类组件，代表一个通用节点，该节点可以是流程图或其他图形编辑器中的元素。
 */
export class GeneralNode extends React.Component<NodeProps> {
  /**
   * changeNode 是一个事件处理函数，当用户点击操作菜单项时触发。
   * @param val - 操作名称（例如：'Rename', 'Duplicate', 'Delete'）
   */
  changeNode = (val: string) => {
    // 检查 onChange 是否存在并且是一个函数
    if (typeof this.props.onChange === 'function') {
      const { node } = this.props;
      const data = node.getData<Child>();
      this.props.onChange(val, data); // 调用父组件提供的回调函数
    }
  };
  /**
   * 右侧三个点的操作列表。
   */
  content = (
    <>
      <p onClick={() => this.changeNode('Rename')} className="cursor-pointer">
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
    const data = node.getData<Child>();
    // 或者返回一个默认的内容，以防止渲染错误
    if (!data) {
      return null;
    }

    // 确保宽度和高度是有效的数字
    const width = data.width ? data.width : 304;
    const height = data.height ? data.height : 83;
    // 构造渐变背景字符串
    const gradientBackground = data.backgroundColor
      ? `linear-gradient(to bottom, ${data.backgroundColor} 0%, white 70%)`
      : // 如果没有提供 backgroundColor，则默认为白色
        'white';

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
            {data.icon}
            <span>{data.title}</span>
          </div>
          {/* 使用 Popover 渲染右侧三个点 */}
          {!data.noPopover && (
            <Popover content={this.content} trigger="hover">
              <DashOutlined />
            </Popover>
          )}
        </div>
        {/* 节点内容区，根据 data.content 的类型显示不同的内容 */}
        <div className="general-node-content">
          {typeof data.content === 'string' ? (
            <div className="text-ellipsis">{data.content}</div>
          ) : (
            <div className="general-node-content-list">
              {data.content.map((item) => (
                <div className="general-node-content-item" key={item.label}>
                  <span className="general-node-content-label">
                    {item.label}
                  </span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          )}
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
    embeddable: ({ data }: { data: Child }) => data && data.isParent,
    // 启用节点大小调整
    resizable: true,
  });
}
