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

    return (
      <div
        className="general-node"
        style={{
          width: data.width ? data.width : 304,
          height: data.height ? data.height : 83,
        }}
      >
        <div className="general-node-header">
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

export class ParentNode extends React.Component<NodeProps> {
  render() {
    const { node } = this.props;
    const data = node.getData<Child>(); // 明确告诉 getData 返回的数据类型

    if (!data) {
      return null; // 或者返回一个默认的内容，以防止渲染错误
    }

    return <div className="parent-Node" style={{}}></div>;
  }
}

// 连接桩的样式
const ports = {
  groups: {
    in: {
      position: { name: 'top' },
      attrs: {
        fo: {
          width: 12,
          height: 12,
          x: -6,
          y: -6,
          magnet: 'true',
        },
      },
      zIndex: 1,
    },

    out: {
      position: { name: 'bottom' },
      attrs: {
        fo: {
          width: 12,
          height: 12,
          x: -6,
          y: -6,
        },
      },
      zIndex: 1,
    },
  },
  items: [
    {
      group: 'in',
    },
    {
      group: 'out',
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
