import {
  DeleteOutlined,
  EditOutlined,
  MenuOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { MenuNodeInfo } from '../../../types/menu-manage';
import { MenuStatusEnum } from '../../../types/menu-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MenuItemProps {
  /** 菜单信息 */
  menu: MenuNodeInfo;
  /** 层级深度（用于缩进） */
  level?: number;
  /** 编辑回调 */
  onEdit: (menu: MenuNodeInfo) => void;
  /** 删除回调 */
  onDelete: (menu: MenuNodeInfo) => void;
  /** 新增子菜单回调 */
  onAddChild: (parentMenu: MenuNodeInfo) => void;
  /** 删除加载状态 */
  deleteLoading?: boolean;
}

/**
 * 菜单项组件
 * 递归展示菜单，支持层次结构
 */
const MenuItem: React.FC<MenuItemProps> = ({
  menu,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  deleteLoading = false,
}) => {
  // 处理编辑点击
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(menu);
  };

  // 处理删除确认
  const handleDelete = () => {
    onDelete(menu);
  };

  // 处理新增子菜单
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild(menu);
  };

  return (
    <>
      <div
        className={cx(styles.menuItem)}
        style={{
          marginLeft: level > 0 ? `${level * 24 + 16}px` : '0',
        }}
      >
        {/* 左侧：拖拽手柄、图标和内容 */}
        <div className={cx(styles.leftContent)}>
          {/* 拖拽手柄 */}
          <div className={cx(styles.dragHandle)}>
            <MenuOutlined />
          </div>

          {/* 标题和标签 */}
          <div className={cx(styles.titleSection)}>
            <div className={cx(styles.titleRow)}>
              <h3 className={cx(styles.title)}>{menu.name}</h3>
              <div className={cx(styles.tags)}>
                <Tag>{menu.code}</Tag>
                <Tag
                  color={
                    menu.status === MenuStatusEnum.Enabled
                      ? 'success'
                      : 'default'
                  }
                >
                  {menu.status === MenuStatusEnum.Enabled ? '启用' : '禁用'}
                </Tag>
              </div>
            </div>
            {menu.path && (
              <div className={cx(styles.pathRow)}>
                <span className={cx(styles.pathIcon)}>→</span>
                <span className={cx(styles.path)}>{menu.path}</span>
              </div>
            )}
            {/* 关联资源码（仅末级菜单显示） */}
            {menu.resourceTree && menu.resourceTree.length > 0 && (
              <div className={cx(styles.resourceCodesRow)}>
                <span className={cx(styles.resourceCodesLabel)}>
                  关联资源码:
                </span>
                <span className={cx(styles.resourceCodes)}>
                  {menu.resourceTree.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className={cx(styles.rightContent)}>
          <div className={cx(styles.actions)}>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddChild}
              className={cx(styles.actionButton)}
            >
              新增子菜单
            </Button>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={handleEdit}
              className={cx(styles.actionButton)}
            />
            <Popconfirm
              title="删除菜单"
              description={`确认删除菜单 "${menu.name}" 吗？`}
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

      {/* 递归渲染子菜单 */}
      {menu.children && menu.children.length > 0 && (
        <div className={cx(styles.children)}>
          {menu.children.map((child) => (
            <MenuItem
              key={child.id}
              menu={child}
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

export default MenuItem;
