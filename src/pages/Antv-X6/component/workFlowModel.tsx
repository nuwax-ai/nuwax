import Content from '@/components/Content';
import ModelBox from '@/components/ModelBox';
import { UseModelBoxProps } from '@/types/interfaces/common';
import {
  DownOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import React from 'react';
import {
  leftMenuList,
  pluginNodeContentExample,
  pluginNodeLeftMenu,
  rightContent,
} from '../params';
import './workFlowModel.less';

import {PlugInItem,WorkFlowItem} from '@/types/interfaces/common'
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

const WorkflowAdd: React.FC<UseModelBoxProps> = ({ title, onAdd }) => {
  // 定义一个回调函数，它将在 OptionItem 中被调用，这里主要是创建工作流
  const handleAddClick = (item: WorkFlowItem|PlugInItem) => {
    const _child = {
      // 子节点标题
      title: item.label,
      icon: item.icon,
      key: 'workflowNode',
      type: 'general-Node',
      content: item.desc,
      // 描述
      desc: item.desc,
      other: item,
    };
    onAdd(_child);
    // 在这里执行你想要的操作，比如调用父组件的父组件事件
  };

  // 创建工作流的按钮
  const createNode = (
    <Dropdown menu={{ items }}>
      <Button style={{ width: '100%' }}>
        创建工作流 <DownOutlined />
      </Button>
    </Dropdown>
  );

  //   创建插件的按钮
  const createPlugin = <Button style={{ width: '100%' }}>创建插件</Button>;

  //  点击了左侧菜单，需要 切换右侧的选项
  const changeMenu = (key: string) => {
    // 在这里执行你想要的操作，比如调用父组件的父组件事件
    console.log(key);
  };

  return (
    <ModelBox
      title={title}
      leftMenuList={title === '添加工作流' ? leftMenuList : pluginNodeLeftMenu}
      createNode={title === '添加工作流' ? createNode : createPlugin}
      searchBar={true}
      changeMenu={changeMenu}
      Content={() => (
        <Content
          rightContent={
            title === '添加工作流' ? (rightContent as WorkFlowItem[])  : (pluginNodeContentExample as PlugInItem[])
          }
          onAdd={handleAddClick}
        />
      )} // 传递回调函数给 Content
      width={1000}
    ></ModelBox>
  );
};

export default WorkflowAdd;
