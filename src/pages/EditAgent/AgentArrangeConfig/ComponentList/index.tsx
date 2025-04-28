import databaseImage from '@/assets/images/database_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import TooltipIcon from '@/components/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ComponentListProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import AgentModelComponent from '../AgentModelComponent';

// 插件组件列表
const ComponentList: React.FC<ComponentListProps> = ({
  type,
  list,
  onSet,
  onDel,
}) => {
  const getInfo = (type: AgentComponentTypeEnum) => {
    switch (type) {
      case AgentComponentTypeEnum.Plugin:
        return {
          text: '插件能够让智能体调用外部API，例如搜索信息、浏览网页、生成图片等，扩展智能体的能力和使用场景。',
          image: pluginImage,
        };
      case AgentComponentTypeEnum.Workflow:
        return {
          text: '工作流支持通过可视化的方式，对插件、大语言模型、代码块等功能进行组合，从而实现复杂、稳定的业务流程编排，例如旅行规划、报告分析等。',
          image: workflowImage,
        };
      case AgentComponentTypeEnum.Table:
        return {
          text: '以表格结构组织数据，可实现类似书签和图书管理等功能。',
          image: databaseImage,
        };
    }
  };
  return !list?.length ? (
    <p>{getInfo(type)?.text}</p>
  ) : (
    list.map((item) => (
      <AgentModelComponent
        key={item.id}
        agentComponentInfo={item}
        defaultImage={getInfo(type)?.image}
        extra={
          <>
            <TooltipIcon
              title="设置"
              icon={<ICON_SETTING className={'cursor-pointer'} />}
              onClick={() => onSet(item.id)}
            />
            <TooltipIcon
              title="删除"
              icon={<DeleteOutlined className={'cursor-pointer'} />}
              onClick={() => onDel(item.id, item.targetId, item.type)}
            />
          </>
        }
      />
    ))
  );
};

export default ComponentList;
