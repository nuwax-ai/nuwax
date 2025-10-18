import { unbindDataSource } from '@/services/appDev';
import type { DataSourceSelection } from '@/types/interfaces/appDev';
import type { DataResource } from '@/types/interfaces/dataResource';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Checkbox, Empty, message, Modal, Typography } from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

/**
 * 数据资源列表组件属性
 */
interface DataResourceListProps {
  /** 数据资源列表 */
  resources: DataResource[];
  /** 加载状态 */
  loading?: boolean;
  /** 删除资源回调 */
  onDelete?: (resourceId: string) => Promise<void>;
  /** 选中的数据源列表 */
  selectedResourceIds?: DataSourceSelection[];
  /** 选择变化回调 */
  onSelectionChange?: (selectedDataSources: DataSourceSelection[]) => void;
  /** 是否正在AI聊天加载中或版本对比模式 */
  isChatLoading?: boolean;
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
  selectedResourceIds = [],
  onSelectionChange,
  isChatLoading = false,
  projectId,
}) => {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );

  /**
   * 处理复选框变化
   */
  const handleCheckboxChange = (resource: DataResource, checked: boolean) => {
    const resourceSelection: DataSourceSelection = {
      dataSourceId: parseInt(resource.id),
      type: resource.type === 'plugin' ? 'plugin' : 'workflow',
      name: resource.name, // 添加数据源名称
    };

    const newSelectedDataSources = checked
      ? [...selectedResourceIds, resourceSelection]
      : selectedResourceIds.filter(
          (item) => item.dataSourceId !== resourceSelection.dataSourceId,
        );

    onSelectionChange?.(newSelectedDataSources);
  };

  /**
   * 处理删除资源
   */
  const handleDelete = async (resourceId: string) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) {
      message.error('未找到要删除的数据源');
      return;
    }

    // 显示二次确认弹窗
    Modal.confirm({
      content: `确定要删除数据资源 "${resource.name}" 吗？`,
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
              dataSourceId: parseInt(resourceId),
            });

            if (result?.code === '0000') {
              // 先取消勾选
              handleCheckboxChange(resource, false);
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
   * 渲染资源项
   */
  const renderResourceItem = (resource: DataResource) => {
    const isLoading = actionLoading[resource.id] || false;

    return (
      <div
        key={resource.id}
        className="resourceItem"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(0, 0, 0, 5%)',
          transition: 'background-color 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 3%)';
          const actionButton = e.currentTarget.querySelector(
            '.resourceActionButton',
          ) as HTMLElement;
          if (actionButton) {
            actionButton.style.opacity = '1';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          const actionButton = e.currentTarget.querySelector(
            '.resourceActionButton',
          ) as HTMLElement;
          if (actionButton) {
            actionButton.style.opacity = '0';
          }
        }}
      >
        {/* 左侧复选框 */}
        <Checkbox
          checked={selectedResourceIds.some(
            (item) => item.dataSourceId === parseInt(resource.id),
          )}
          onChange={(e) => handleCheckboxChange(resource, e.target.checked)}
          disabled={isChatLoading}
          style={{ marginRight: '12px' }}
        />

        {/* 中间内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: '14px', color: '#1e293b' }}>
            {resource.name}
          </Text>
        </div>

        {/* 右侧删除按钮 */}
        <div
          className="resourceActionButton"
          style={{
            marginLeft: '8px',
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <Button
            type="text"
            icon={<DeleteOutlined />}
            loading={isLoading}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(resource.id);
            }}
            style={{
              width: '24px',
              height: '24px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff4d4f',
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className="dataResourceList scroll-container"
      style={{ height: '200px' }}
    >
      {resources.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="点击&ldquo;+&rdquo;添加数据资源"
        />
      ) : (
        <div>{resources.map((resource) => renderResourceItem(resource))}</div>
      )}
    </div>
  );
};

export default DataResourceList;
