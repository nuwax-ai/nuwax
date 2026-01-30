import { modalConfirm } from '@/utils/ant-custom';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { RoleStatusEnum, type RoleInfo } from '../../../types/role-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface RoleCardProps {
  /** 角色信息 */
  role: RoleInfo;
  /** 绑定用户回调 */
  onBindUser: (role: RoleInfo) => void;
  /** 编辑回调 */
  onEdit: (role: RoleInfo) => void;
  /** 菜单权限回调 */
  onMenuPermission: (role: RoleInfo) => void;
  /** 删除回调 */
  onDelete: (role: RoleInfo) => void;
  /** 删除加载状态 */
  deleteLoading?: boolean;
}

/**
 * 角色卡片组件
 * 用于展示单个角色的详细信息，包括角色名称、代码、描述、数据范围、菜单权限等
 */
const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onBindUser,
  onEdit,
  onDelete,
  onMenuPermission,
  deleteLoading = false,
}) => {
  // 处理绑定用户点击
  const handleBindUser = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBindUser(role);
  };
  // 处理编辑点击
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(role);
  };

  // 处理菜单权限点击
  const handleMenuPermission = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuPermission(role);
  };

  // 处理删除确认
  const handleDelete = () => {
    modalConfirm('删除角色', `确认删除角色 "${role.name}" 吗？`, () => {
      onDelete(role);
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
  };

  return (
    <div className={cx(styles.card)}>
      {/* 状态标签 */}
      <div className={cx(styles.statusTag)}>
        <Tag
          color={role.status === RoleStatusEnum.Enabled ? 'success' : 'default'}
        >
          {role.status === RoleStatusEnum.Enabled ? '启用' : '禁用'}
        </Tag>
      </div>

      {/* 卡片内容 */}
      <div className={cx(styles.content)}>
        {/* 头部：图标和角色名称 */}
        <div className={cx(styles.header)}>
          <div className={cx(styles.titleSection)}>
            <h3 className={cx(styles.title, 'text-ellipsis')}>{role.name}</h3>
            <p className={cx(styles.code, 'text-ellipsis')}>{role.code}</p>
          </div>
        </div>

        {/* 描述 */}
        <p className={cx(styles.description, 'text-ellipsis-2')}>
          {role.description}
        </p>

        {/* 信息项 */}
        {/* <div className={cx(styles.infoSection)}>
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>每日token限制:</span>
            <span className={cx(styles.infoValue)}>
              {role.tokenLimit?.limitPerDay
                ? `${role.tokenLimit.limitPerDay}次`
                : '无限制'}
            </span>
          </div>

          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>模型:</span>
            <span className={cx(styles.infoValue)}>
              {role.modelIds && role.modelIds.length > 0
                ? role.modelIds.length === 1 && role.modelIds[0] === 0
                  ? '已配置所有模型'
                  : `${role.modelIds.length}项`
                : '暂未配置模型'}
            </span>
          </div>
        </div> */}
      </div>

      {/* 底部操作按钮 */}
      <div className={cx(styles.footer)}>
        <Button
          type="text"
          onClick={handleBindUser}
          className={cx(styles.actionButton)}
        >
          绑定用户
        </Button>
        {/* 用户自定义角色才能显示菜单权限、编辑、删除按钮 */}
        {/* {role.source === RoleSourceEnum.UserDefined && ( */}
        <>
          <Button
            type="text"
            onClick={handleMenuPermission}
            className={cx(styles.actionButton)}
          >
            菜单权限
          </Button>
          <Button
            type="text"
            onClick={handleEdit}
            className={cx(styles.actionButton)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            onClick={handleDelete}
            loading={deleteLoading}
            className={cx(styles.actionButton)}
          >
            删除
          </Button>
        </>
        {/* )} */}
      </div>
    </div>
  );
};

export default RoleCard;
