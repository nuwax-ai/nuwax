import ModelBox from '@/components/ModelBox';
import {
  DownOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Tag } from 'antd';
import React from 'react';
import { leftMenuList, rightContent } from '../params';
import { Child } from '../type';
import './workFlowModel.less';
// 每个选项的样式

const OptionItem: React.FC<{
  icon: JSX.Element;
  label: string;
  desc: string;
  tag: string;
  time: string;
  onAdd: () => void; // 接收来自 Content 的回调函数
}> = ({ icon, label, desc, tag, time, onAdd }) => {
  return (
    <div className="dis-sb item-style">
      <div className="dis-left ">
        {/* 左侧的图片 */}
        {icon}
        {/* 具体的内容 */}
        <div className="dis-col">
          <p className="label-style">{label}</p>
          <p className="desc-style">{desc}</p>
          <Tag className="tag-style">{tag}</Tag>
          <p className="desc-style">发布于 {time}</p>
        </div>
      </div>
      <Button onClick={onAdd}>复制并添加</Button>
    </div>
  );
};

const items = [
  {
    label: '创建工作流',
    key: '1',
    icon: <ShareAltOutlined />,
  },
  {
    label: '创建对话流',
    key: '2',
    icon: <MessageOutlined />,
  },
];

const Content: React.FC<{
  onAdd: (item: (typeof rightContent)[number]) => void;
}> = ({ onAdd }) => {
  return (
    <div className="dis-col">
      {rightContent.map((item, index) => (
        <OptionItem
          icon={item.icon}
          label={item.label}
          desc={item.desc}
          tag={item.tag}
          time={item.time}
          key={index}
          onAdd={() => onAdd(item)} // 将回调函数传递给 OptionItem
        />
      ))}
    </div>
  );
};

const WorkflowAdd: React.FC<{ onAdd: (item: Child) => void }> = ({ onAdd }) => {
  // 定义一个回调函数，它将在 OptionItem 中被调用
  const handleAddClick = (item: (typeof rightContent)[number]) => {
    const _child = {
      // 子节点标题
      title: item.label,
      icon: item.icon,
      key: 'workflowNode',
      type: 'general-Node',
      content: item.desc,
      // 描述
      desc: item.desc,
    };
    onAdd(_child);
    // 在这里执行你想要的操作，比如调用父组件的父组件事件
  };

  // 创建的按钮
  const createNode = (
    <Dropdown menu={{ items }}>
      <Button style={{ width: '100%' }}>
        创建工作流 <DownOutlined />
      </Button>
    </Dropdown>
  );

  return (
    <ModelBox
      title="添加工作流"
      leftMenuList={leftMenuList}
      createNode={createNode}
      searchBar={true}
      Content={() => <Content onAdd={handleAddClick} />} // 传递回调函数给 Content
      width={1000}
    ></ModelBox>
  );
};

export default WorkflowAdd;
