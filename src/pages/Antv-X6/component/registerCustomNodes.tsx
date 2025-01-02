import { DashOutlined } from '@ant-design/icons';
import { register } from '@antv/x6-react-shape';
import { Popover } from 'antd';
import React from 'react';
import '../index.less';
import { Child, NodeProps } from '../type';

export class GeneralNode extends React.Component<NodeProps> {
  changeNode = (val: string) => {
    console.log(val);
  };

  content = (
    <>
      <p onClick={() => this.changeNode('Rename')}>重命名</p>
      <p onClick={() => this.changeNode('Duplicate')}>创建副本</p>
      <p onClick={() => this.changeNode('Delete')}>删除</p>
    </>
  );

  render() {
    const { node } = this.props;
    const data = node.getData<Child>(); // 明确告诉 getData 返回的数据类型

    if (!data) {
      return null; // 或者返回一个默认的内容，以防止渲染错误
    }

    // 确保宽度和高度是有效的数字
    const width = typeof data.width === 'number' ? data.width : 304;
    const height = typeof data.height === 'number' ? data.height : 83;
    // 构造渐变背景字符串
    const gradientBackground = data.backgroundColor
      ? `linear-gradient(to bottom, ${data.backgroundColor} 0%, white 45%)`
      : 'white'; // 如果没有提供 backgroundColor，则默认为白色

    return (
      <div
        className="general-node"
        style={{
          width: width,
          height: height,
        }}
      >
        <div
          className="general-node-header"
          style={{ background: gradientBackground }}
        >
          <div className="general-node-header-image">
            <img src={data.image} alt="" />
            <span>{data.title}</span>
          </div>
          <Popover content={this.content} trigger="click">
            <DashOutlined />
          </Popover>
        </div>
        <div className="general-node-content">
          {typeof data.content === 'string' ? (
            <div>{data.content}</div>
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

// 连接桩的样式
const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
  },
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
    shape: 'general-Node',
    component: GeneralNode,
    ports: ports, // 添加连接桩配置
    // 设置 embeddable 属性以决定是否允许嵌套
    embeddable: ({ data }: { data: Child }) => data && data.isParent,
  });
}
