import agentImage from '@/assets/images/agent_image.png';
import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { McpCollapseComponentListProps } from '@/types/interfaces/mcp';
import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import McpCollapseComponentItem from './McpCollapseComponentItem';
import styles from './index.less';

// Mcp手风琴组件列表
const McpCollapseComponentList: React.FC<McpCollapseComponentListProps> = ({
  type,
  list,
  onDel,
}) => {
  const getInfo = (type: AgentComponentTypeEnum) => {
    switch (type) {
      case AgentComponentTypeEnum.Agent:
        return {
          text: dict('PC.Components.McpCollapseComponentList.agentDesc'),
          image: agentImage,
        };
      case AgentComponentTypeEnum.Plugin:
        return {
          text: dict('PC.Components.McpCollapseComponentList.pluginDesc'),
          image: pluginImage,
        };
      case AgentComponentTypeEnum.Workflow:
        return {
          text: dict('PC.Components.McpCollapseComponentList.workflowDesc'),
          image: workflowImage,
        };
      case AgentComponentTypeEnum.Knowledge:
        return {
          text: dict('PC.Components.McpCollapseComponentList.knowledgeDesc'),
          image: knowledgeImage,
        };
      case AgentComponentTypeEnum.Table:
        return {
          text: dict('PC.Components.McpCollapseComponentList.tableDesc'),
          image: databaseImage,
        };
    }
  };
  return !list?.length ? (
    <p className={styles.text}>{getInfo(type)?.text}</p>
  ) : (
    list.map((item, index) => (
      <McpCollapseComponentItem
        key={item?.targetId || index}
        componentInfo={item}
        defaultImage={getInfo(type)?.image}
        extra={
          <TooltipIcon
            title={dict('PC.Components.McpCollapseComponentList.delete')}
            icon={<DeleteOutlined className={'cursor-pointer'} />}
            onClick={() => onDel(item.targetId, item.type)}
          />
        }
      />
    ))
  );
};

export default McpCollapseComponentList;
