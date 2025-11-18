import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import CollapseComponentItem from '@/components/CollapseComponentItem';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { unbindDataSource } from '@/services/appDev';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import type { AgentComponentInfo } from '@/types/interfaces/agent';
import type { DataResource } from '@/types/interfaces/dataResource';
import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { Empty, message, Modal } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';
/**
 * 获取资源类型的默认描述
 * @param type 资源类型
 * @returns 默认描述文本
 */
const getDefaultDescription = (type: string): string => {
  switch (type) {
    case 'plugin':
      return '插件资源，提供特定功能和服务';
    case 'workflow':
      return '工作流资源，支持复杂的业务流程编排';
    default:
      return '数据资源';
  }
};

/**
 * 将 DataResource 转换为 AgentComponentInfo
 * @param resource 数据资源
 * @returns AgentComponentInfo 对象
 */
const convertToAgentComponentInfo = (
  resource: DataResource,
): AgentComponentInfo => {
  return {
    id: Number(resource.id),
    targetId: Number(resource.id),
    name: resource.name,
    description: resource.description || getDefaultDescription(resource.type), // 使用默认描述确保总是有内容显示
    type:
      resource.type === 'plugin'
        ? AgentComponentTypeEnum.Plugin
        : AgentComponentTypeEnum.Workflow,
    icon: resource.icon || '', // 使用默认图标
    targetConfig: undefined, // 设置为 undefined 以禁用内部链接跳转
    spaceId: 0,
    bindConfig: undefined,
    tenantId: 0,
    agentId: 0,
    exceptionOut: DefaultSelectedEnum.No,
    fallbackMsg: '',
    modified: '',
    created: '',
    groupDescription: '',
    groupName: '',
  };
};

/**
 * 根据资源类型获取默认图标
 * @param type 资源类型
 * @returns 图标路径
 */
const getDefaultImage = (type: string): string => {
  // console.log('getDefaultImage called with type:', type); // 调试日志
  // console.log('pluginImage:', pluginImage); // 调试日志
  // console.log('workflowImage:', workflowImage); // 调试日志
  switch (type.toLowerCase()) {
    case 'plugin':
      return pluginImage;
    case 'workflow':
      return workflowImage;
    default:
      // console.log('Using default plugin image for type:', type); // 已被注释的调试日志
      return pluginImage;
  }
};

/**
 * 数据资源列表组件属性
 */
interface DataResourceListProps {
  /** 数据资源列表 */
  resources: DataResource[];
  /** 加载状态 */
  loading?: boolean;
  /** 删除资源回调 */
  onDelete?: (resourceId: number) => Promise<void>;
  // /** 选中的数据源列表 */
  // selectedResourceIds?: DataSourceSelection[];
  // /** 选择变化回调 */
  // onSelectionChange?: (selectedDataSources: DataSourceSelection[]) => void;
  /** 是否正在AI聊天加载中或版本对比模式 */
  // isChatLoading?: boolean;
  /** 项目ID，用于解绑数据源 */
  projectId?: number;
}

/**
 * 数据资源列表组件
 * 展示和管理数据资源
 */
const DataResourceList: React.FC<DataResourceListProps> = ({
  resources,
  onDelete,
  // selectedResourceIds = [],
  // onSelectionChange,
  // isChatLoading = false,
  projectId,
}) => {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );

  /**
   * 处理复选框变化
   */
  // const handleCheckboxChange = (resource: DataResource, checked: boolean) => {
  //   const resourceSelection: DataSourceSelection = {
  //     dataSourceId: parseInt(resource.id),
  //     type: resource.type === 'plugin' ? 'plugin' : 'workflow',
  //     name: resource.name, // 添加数据源名称
  //   };

  //   const newSelectedDataSources = checked
  //     ? [...selectedResourceIds, resourceSelection]
  //     : selectedResourceIds.filter(
  //         (item) => item.dataSourceId !== resourceSelection.dataSourceId,
  //       );

  //   onSelectionChange?.(newSelectedDataSources);
  // };

  /**
   * 处理删除资源
   */
  const handleDelete = async (resourceId: number) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) {
      message.error('未找到要删除的数据源');
      return;
    }

    // 显示二次确认弹窗
    Modal.confirm({
      content: `数据资源一旦删除，页面将失去对该资源的访问权限`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      icon: null,
      onOk: async () => {
        try {
          setActionLoading((prev) => ({ ...prev, [resourceId]: true }));

          // 如果有项目ID，先调用解绑数据源接口
          if (projectId) {
            // 将 DataResourceType 转换为解绑接口需要的类型
            const type =
              resource.type === 'plugin' || resource.type === 'workflow'
                ? resource.type
                : 'plugin'; // 默认值，实际应该根据业务逻辑确定

            const result = await unbindDataSource({
              projectId,
              type,
              dataSourceId: resourceId,
            });

            if (result?.code === '0000') {
              // 先取消勾选
              // handleCheckboxChange(resource, false);
              // 调用原有的删除回调
              await onDelete?.(resourceId);
            }
          }
        } finally {
          setActionLoading((prev) => ({ ...prev, [resourceId]: false }));
        }
      },
    });
  };

  /**
   * 处理资源点击跳转
   */
  const handleResourceClick = (resource: DataResource) => {
    if (resource.type === 'plugin') {
      window.open(
        `${process.env.BASE_URL}/square/publish/plugin/${resource.id}`,
        '_blank',
        'noopener,noreferrer',
      );
    } else if (resource.type === 'workflow') {
      window.open(
        `${process.env.BASE_URL}/square/publish/workflow/${resource.id}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
  };

  /**
   * 渲染资源项
   */
  const renderResourceItem = (resource: DataResource) => {
    const isLoading = actionLoading[resource.id] || false;
    const agentComponentInfo = convertToAgentComponentInfo(resource);
    const defaultImage = getDefaultImage(resource.type);

    // console.log('Rendering resource:', { // 已被注释的调试日志
    //   id: resource.id,
    //   name: resource.name,
    //   type: resource.type,
    //   defaultImage,
    //   agentComponentInfoIcon: agentComponentInfo.icon,
    // }); // 调试日志

    return (
      <div key={resource.id} onClick={() => handleResourceClick(resource)}>
        <CollapseComponentItem
          agentComponentInfo={agentComponentInfo}
          defaultImage={defaultImage}
          className={styles['dataResourceItem']}
          showImage={true}
          extra={
            <TooltipIcon
              title="删除"
              icon={
                isLoading ? (
                  <LoadingOutlined />
                ) : (
                  <DeleteOutlined className="cursor-pointer" />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(Number(resource.id));
              }}
            />
          }
        />
      </div>
    );
  };

  return (
    <div
      style={{
        height: '200px',
        padding: '8px',
        margin: '0 4px',
        overflow: 'auto',
      }}
    >
      {resources.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="点击&ldquo;+&rdquo;添加数据资源"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {resources.map((resource) => renderResourceItem(resource))}
        </div>
      )}
    </div>
  );
};

export default DataResourceList;
