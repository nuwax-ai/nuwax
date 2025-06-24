import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import TooltipIcon from '@/components/TooltipIcon';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { McpCollapseComponentListProps } from '@/types/interfaces/mcp';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import McpCollapseComponentItem from './McpCollapseComponentItem';

// Mcp手风琴组件列表
const McpCollapseComponentList: React.FC<McpCollapseComponentListProps> = ({
  textClassName,
  type,
  list,
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
      case AgentComponentTypeEnum.Knowledge:
        return {
          text: '将文档、URL、三方数据源上传为文本知识库后，用户发送消息时，智能体能够引用文本知识中的内容回答用户问题。',
          image: knowledgeImage,
        };
      case AgentComponentTypeEnum.Table:
        return {
          text: '以表格结构组织数据，可实现类似书签和图书管理等功能。',
          image: databaseImage,
        };
    }
  };
  return !list?.length ? (
    <p className={textClassName}>{getInfo(type)?.text}</p>
  ) : (
    list.map((item, index) => (
      <McpCollapseComponentItem
        key={item?.targetId || index}
        componentInfo={item}
        defaultImage={getInfo(type)?.image}
        extra={
          <TooltipIcon
            title="删除"
            icon={<DeleteOutlined className={'cursor-pointer'} />}
            onClick={() => onDel(item.targetId, item.type)}
          />
        }
      />
    ))
  );
};

export default McpCollapseComponentList;
