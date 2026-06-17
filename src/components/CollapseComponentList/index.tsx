import databaseImage from '@/assets/images/database_image.png';
import mcpImage from '@/assets/images/mcp_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import CollapseComponentItem from '@/components/CollapseComponentItem';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { dict } from '@/services/i18nRuntime';
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
          text: dict('PC.Components.CollapseComponentList.pluginDesc'),
          image: pluginImage,
        };
      case AgentComponentTypeEnum.Workflow:
        return {
          text: dict('PC.Components.CollapseComponentList.workflowDesc'),
          image: workflowImage,
        };
      case AgentComponentTypeEnum.MCP:
        return {
          text: dict('PC.Components.CollapseComponentList.mcpDesc'),
          image: mcpImage,
        };
      case AgentComponentTypeEnum.Table:
        return {
          text: dict('PC.Components.CollapseComponentList.tableDesc'),
          image: databaseImage,
        };
      // 页面
      case AgentComponentTypeEnum.Page:
        return {
          text: dict('PC.Components.CollapseComponentList.pageDesc'),
          image: databaseImage,
        };
      // 技能
      case AgentComponentTypeEnum.Skill:
        return {
          text: dict('PC.Components.CollapseComponentList.skillDesc'),
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
              title={dict('PC.Components.CollapseComponentList.settings')}
              icon={<ICON_SETTING className={'cursor-pointer'} />}
              onClick={() => onSet(item.id)}
            />
            <TooltipIcon
              title={dict('PC.Components.CollapseComponentList.delete')}
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
