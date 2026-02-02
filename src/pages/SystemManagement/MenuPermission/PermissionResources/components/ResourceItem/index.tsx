import { modalConfirm } from '@/utils/ant-custom';
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ResourceTreeNode } from '../../../types/permission-resources';
import {
  ResourceStatusEnum,
  ResourceTypeEnum,
} from '../../../types/permission-resources';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ResourceItemProps {
  /** 资源信息 */
  resource: ResourceTreeNode;
  /** 层级深度（用于缩进） */
  level?: number;
  /** 编辑回调 */
  onEdit: (resource: ResourceTreeNode) => void;
  /** 删除回调 */
  onDelete: (resource: ResourceTreeNode) => void;
  /** 新增子资源回调 */
  onAddChild: (parentResource: ResourceTreeNode) => void;
  /** 删除加载状态 */
  deleteLoading?: boolean;
}

/**
 * 获取资源类型显示文本和图标
 * 根据资源类型和路径判断是模块、菜单还是接口
 */
const getResourceTypeInfo = (
  type: ResourceTypeEnum,
): { text: string; icon: React.ReactNode } => {
  // 根据类型判断
  switch (type) {
    case ResourceTypeEnum.Module:
      return {
        text: '模块',
        icon: <AppstoreOutlined />,
      };
    case ResourceTypeEnum.Component:
      return {
        text: '组件',
        icon: <AppstoreOutlined />,
      };
    default:
      return {
        text: '未知',
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
    modalConfirm('删除资源', `确认删除资源 "${resource.name}" 吗？`, () => {
      onDelete(resource);
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
  };

  // 处理新增子资源
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild(resource);
  };

  // 获取资源类型信息
  const typeInfo = getResourceTypeInfo(resource.type as ResourceTypeEnum);

  return (
    <>
      {resource?.id !== 0 && (
        <div
          className={cx(styles.resourceItem)}
          style={{
            marginLeft: level > 0 ? `${(level - 1) * 24}px` : '0',
          }}
        >
          {/* 左侧：图标和内容 */}
          <div className={cx(styles.leftContent)}>
            {/* 图标 */}
            <div className={cx(styles.iconWrapper)}>
              {resource.icon ? (
                <img
                  className={cx('w-full h-full')}
                  src={resource.icon}
                  alt={resource.name}
                />
              ) : (
                <div
                  className={cx(styles.defaultIcon, 'overflow-hidden', {
                    [styles.moduleIcon]: typeInfo.text === '模块',
                    [styles.menuIcon]: typeInfo.text === '菜单',
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
                  <Tag>{typeInfo.text}</Tag>
                  <Tag>{resource.code}</Tag>
                  {/* 状态标签 */}
                  <Tag
                    color={
                      resource.status === ResourceStatusEnum.Enabled
                        ? 'success'
                        : 'default'
                    }
                    className={cx(styles.statusTag)}
                  >
                    {resource.status === ResourceStatusEnum.Enabled
                      ? '启用'
                      : '禁用'}
                  </Tag>
                </div>
              </div>
              {resource.path && (
                <p className={cx(styles.path)}>{resource.path}</p>
              )}
            </div>
          </div>

          {/* 右侧：状态和操作按钮 */}
          <div className={cx(styles.rightContent)}>
            {/* 操作按钮 */}
            <div className={cx(styles.actions)}>
              {resource.type !== ResourceTypeEnum.Component && (
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddChild}
                  className={cx(styles.actionButton)}
                >
                  新增子资源
                </Button>
              )}

              {/* 编辑图标，根节点资源不能编辑（根节点是不存在的资源） */}
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={handleEdit}
                className={cx(styles.actionButton)}
              />
              {/* 删除图标，用户自定义资源才能删除 */}
              {/* {resource.source === ResourceSourceEnum.UserDefined && ( */}
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                loading={deleteLoading}
                className={cx(styles.actionButton)}
              />
              {/* )} */}
            </div>
          </div>
        </div>
      )}

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
