import {
  ApiOutlined,
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  MenuOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ResourceTreeOption } from '../../type';
import { ResourceStatusEnum, ResourceTypeEnum } from '../../type';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ResourceItemProps {
  /** 资源信息 */
  resource: ResourceTreeOption;
  /** 层级深度（用于缩进） */
  level?: number;
  /** 编辑回调 */
  onEdit: (resource: ResourceTreeOption) => void;
  /** 删除回调 */
  onDelete: (resource: ResourceTreeOption) => void;
  /** 新增子资源回调 */
  onAddChild: (parentResource: ResourceTreeOption) => void;
  /** 删除加载状态 */
  deleteLoading?: boolean;
}

/**
 * 获取资源类型显示文本和图标
 * 根据资源类型和路径判断是模块、菜单还是接口
 */
const getResourceTypeInfo = (
  type: ResourceTypeEnum,
  path?: string,
): { text: string; color: string; icon: React.ReactNode } => {
  // 如果路径以 /api/ 开头，认为是接口
  if (path?.startsWith('/api/')) {
    return {
      text: '接口',
      color: 'orange',
      icon: <ApiOutlined />,
    };
  }
  // 如果路径以 /system/ 或 /business/ 等开头，认为是菜单
  if (path && (path.startsWith('/system/') || path.startsWith('/business/'))) {
    return {
      text: '菜单',
      color: 'default',
      icon: <MenuOutlined />,
    };
  }
  // 根据类型判断
  switch (type) {
    case ResourceTypeEnum.Module:
      return {
        text: '模块',
        color: 'blue',
        icon: <AppstoreOutlined />,
      };
    case ResourceTypeEnum.Component:
      return {
        text: '组件',
        color: 'purple',
        icon: <AppstoreOutlined />,
      };
    case ResourceTypeEnum.Page:
      return {
        text: '页面',
        color: 'orange',
        icon: <AppstoreOutlined />,
      };
    default:
      return {
        text: '未知',
        color: 'default',
        icon: <AppstoreOutlined />,
      };
  }
};

/**
 * 资源项组件
 * 递归展示权限资源，支持层次结构
 */
const ResourceItem: React.FC<ResourceItemProps> = ({
  resource,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  deleteLoading = false,
}) => {
  // 处理编辑点击
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(resource);
  };

  // 处理删除确认
  const handleDelete = () => {
    onDelete(resource);
  };

  // 处理新增子资源
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild(resource);
  };

  // 获取资源类型信息
  const typeInfo = getResourceTypeInfo(resource.type, resource.path);

  return (
    <>
      <div
        className={cx(styles.resourceItem, {
          [styles.hasParent]: level > 0,
        })}
        style={{
          marginLeft: level > 0 ? `${level * 32 + 16}px` : '0',
        }}
      >
        {/* 左侧：图标和内容 */}
        <div className={cx(styles.leftContent)}>
          {/* 图标 */}
          <div className={cx(styles.iconWrapper)}>
            {resource.icon ? (
              <span className={cx(styles.icon, 'overflow-hidden')}>
                <img
                  className={cx('w-full h-full')}
                  src={resource.icon}
                  alt={resource.name}
                />
              </span>
            ) : (
              <div
                className={cx(styles.defaultIcon, 'overflow-hidden', {
                  [styles.moduleIcon]: typeInfo.text === '模块',
                  [styles.menuIcon]: typeInfo.text === '菜单',
                  [styles.apiIcon]: typeInfo.text === '接口',
                })}
              >
                {typeInfo.icon}
              </div>
            )}
          </div>

          {/* 标题和标签 */}
          <div className={cx(styles.titleSection)}>
            <div className={cx(styles.titleRow)}>
              <h3 className={cx(styles.title)}>{resource.name}</h3>
              <div className={cx(styles.tags)}>
                <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
                <Tag>{resource.code}</Tag>
              </div>
            </div>
            {resource.path && (
              <p className={cx(styles.path)}>{resource.path}</p>
            )}
          </div>
        </div>

        {/* 右侧：状态和操作按钮 */}
        <div className={cx(styles.rightContent)}>
          {/* 状态标签 */}
          <Tag
            color={
              resource.status === ResourceStatusEnum.Enabled
                ? 'success'
                : 'default'
            }
            className={cx(styles.statusTag)}
          >
            {resource.status === ResourceStatusEnum.Enabled ? '启用' : '禁用'}
          </Tag>

          {/* 操作按钮 */}
          <div className={cx(styles.actions)}>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddChild}
              className={cx(styles.actionButton)}
            >
              新增子资源
            </Button>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={handleEdit}
              className={cx(styles.actionButton)}
            />
            <Popconfirm
              title="删除资源"
              description={`确认删除资源 "${resource.name}" 吗？`}
              onConfirm={handleDelete}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ loading: deleteLoading }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                className={cx(styles.actionButton)}
              />
            </Popconfirm>
          </div>
        </div>
      </div>

      {/* 递归渲染子资源 */}
      {resource.children && resource.children.length > 0 && (
        <div className={cx(styles.children)}>
          {resource.children.map((child) => (
            <ResourceItem
              key={child.id}
              resource={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              deleteLoading={deleteLoading}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ResourceItem;
