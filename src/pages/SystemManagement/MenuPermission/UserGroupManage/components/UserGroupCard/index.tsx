import { modalConfirm } from '@/utils/ant-custom';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import {
  UserGroupStatusEnum,
  type UserGroupInfo,
} from '../../../types/user-group-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface UserGroupCardProps {
  /** 用户组信息 */
  userGroup: UserGroupInfo;
  /** 绑定用户回调 */
  onBindUser: (userGroup: UserGroupInfo) => void;
  /** 编辑回调 */
  onEdit: (userGroup: UserGroupInfo) => void;
  /** 删除回调 */
  onDelete: (userGroup: UserGroupInfo) => void;
  /** 菜单权限回调 */
  onMenuPermission: (userGroup: UserGroupInfo) => void;
  /** 删除加载状态 */
  deleteLoading?: boolean;
}

/**
 * 用户组卡片组件
 * 用于展示单个用户组的详细信息，包括用户组名称、代码、描述、关联角色、数据范围等
 */
const UserGroupCard: React.FC<UserGroupCardProps> = ({
  userGroup,
  onBindUser,
  onEdit,
  onDelete,
  onMenuPermission,
  deleteLoading = false,
}) => {
  // 处理绑定用户点击
  const handleBindUser = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBindUser(userGroup);
  };

  // 处理菜单权限点击
  const handleMenuPermission = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuPermission(userGroup);
  };

  // 处理编辑点击
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(userGroup);
  };

  // 处理删除确认
  const handleDelete = () => {
    modalConfirm(
      '删除用户组',
      `确认删除用户组 "${userGroup.name}" 吗？`,
      () => {
        onDelete(userGroup);
        return new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      },
    );
  };

  return (
    <div className={cx(styles.card)}>
      {/* 状态标签 */}
      <div className={cx(styles.statusTag)}>
        <Tag
          color={
            userGroup.status === UserGroupStatusEnum.Enabled
              ? 'success'
              : 'default'
          }
        >
          {userGroup.status === UserGroupStatusEnum.Enabled ? '启用' : '禁用'}
        </Tag>
      </div>

      {/* 卡片内容 */}
      <div className={cx(styles.content)}>
        {/* 头部：用户组名称 */}
        <div className={cx(styles.header)}>
          <div className={cx(styles.titleSection)}>
            <h3 className={cx(styles.title, 'text-ellipsis')}>
              {userGroup.name}
            </h3>
            <p className={cx(styles.code, 'text-ellipsis')}>{userGroup.code}</p>
          </div>
        </div>

        {/* 描述 */}
        <p className={cx(styles.description, 'text-ellipsis-2')}>
          {userGroup.description}
        </p>

        {/* 信息项 */}
        {/* <div className={cx(styles.infoSection)}>
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>最大用户数:</span>
            <span className={cx(styles.infoValue)}>
              {userGroup.maxUserCount ? userGroup.maxUserCount : '--'}
            </span>
          </div>

          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>每日token限制:</span>
            <span className={cx(styles.infoValue)}>
              {userGroup.tokenLimit?.limitPerDay
                ? `${userGroup.tokenLimit.limitPerDay}次`
                : '无限制'}
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
        {/* 用户自定义用户组才能显示菜单权限、编辑、删除按钮 */}
        {/* {userGroup.source === UserGroupSourceEnum.UserDefined && ( */}
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

export default UserGroupCard;
