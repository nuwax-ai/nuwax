import databaseImage from '@/assets/images/database_image.png';
import mcpImage from '@/assets/images/mcp_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import CollapseComponentItem from '@/components/CollapseComponentItem';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentComponentInfo } from '@/types/interfaces/agent';
import type { CollapseComponentListProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import React from 'react';

// 手风琴组件列表
const CollapseComponentList: React.FC<CollapseComponentListProps> = ({
  textClassName,
  itemClassName,
  type,
  list,
  deleteList,
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
      case AgentComponentTypeEnum.MCP:
        return {
          text: '智能体可以通过标准化协议（MCP）连接各类服务API并发起调用。', // TODO 这里需要确认 mcp默认文本
          image: mcpImage, // TODO 这里需要确认 mcp默认图片
        };
      case AgentComponentTypeEnum.Table:
        return {
          text: '以表格结构组织数据，可实现类似书签和图书管理等功能。',
          image: databaseImage,
        };
    }
  };

  // 是否正在删除
  const isDeling = (
    id: number,
    targetId: number,
    type: AgentComponentTypeEnum,
  ) => {
    return deleteList?.some(
      (item) =>
        item.id === id && item.targetId === targetId && item.type === type,
    );
  };

  // 删除组件
  const handleDelete = (item: AgentComponentInfo) => {
    const { id, targetId, type } = item;
    if (isDeling(id, targetId, type)) {
      return;
    }
    onDel(item.id, item.targetId, item.type, item.bindConfig?.toolName || '');
  };

  return !list?.length ? (
    <p className={textClassName}>{getInfo(type)?.text}</p>
  ) : (
    list.map((item) => (
      <CollapseComponentItem
        key={item.id}
        className={itemClassName}
        showImage={type !== AgentComponentTypeEnum.MCP}
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
              icon={
                isDeling(item.id, item.targetId, item.type) ? (
                  <LoadingOutlined />
                ) : (
                  <DeleteOutlined className="cursor-pointer" />
                )
              }
              onClick={() => handleDelete(item)}
            />
          </>
        }
      />
    ))
  );
};

export default CollapseComponentList;
