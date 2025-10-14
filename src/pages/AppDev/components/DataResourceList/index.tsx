import type { DataSourceSelection } from '@/types/interfaces/appDev';
import type { DataResource } from '@/types/interfaces/dataResource';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Checkbox, Empty, message, Typography } from 'antd';
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
    try {
      setActionLoading((prev) => ({ ...prev, [resourceId]: true }));
      await onDelete?.(resourceId);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    } finally {
      setActionLoading((prev) => ({ ...prev, [resourceId]: false }));
    }
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
    <div className="dataResourceList" style={{ minHeight: '200px' }}>
      {resources.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无数据资源"
          style={{ marginTop: 60 }}
        >
          <Text type="secondary">
            点击右上角的&ldquo;+&rdquo;按钮添加新的数据资源
          </Text>
        </Empty>
      ) : (
        <div style={{ height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
          {resources.map((resource) => renderResourceItem(resource))}
        </div>
      )}
    </div>
  );
};

export default DataResourceList;
