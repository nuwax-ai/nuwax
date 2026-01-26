import { modalConfirm } from '@/utils/ant-custom';
import { DeleteOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
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
  /** 编辑回调 */
  onEdit: (userGroup: UserGroupInfo) => void;
  /** 删除回调 */
  onDelete: (userGroup: UserGroupInfo) => void;
  /** 删除加载状态 */
  deleteLoading?: boolean;
}

/**
 * 用户组卡片组件
 * 用于展示单个用户组的详细信息，包括用户组名称、代码、描述、关联角色、数据范围等
 */
const UserGroupCard: React.FC<UserGroupCardProps> = ({
  userGroup,
  onEdit,
  onDelete,
  deleteLoading = false,
}) => {
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
        {/* 头部：图标和用户组名称 */}
        <div className={cx(styles.header)}>
          <div className={cx(styles.iconWrapper)}>
            <TeamOutlined className={cx(styles.icon)} />
          </div>
          <div className={cx(styles.titleSection)}>
            <h3 className={cx(styles.title)}>{userGroup.name}</h3>
            <p className={cx(styles.code)}>{userGroup.code}</p>
          </div>
        </div>

        {/* 描述 */}
        <p className={cx(styles.description)}>{userGroup.description}</p>

        {/* 关联角色 */}
        {/* {userGroup.roles && userGroup.roles.length > 0 && (
          <div className={cx(styles.rolesSection)}>
            <span className={cx(styles.rolesLabel)}>关联角色:</span>
            <div className={cx(styles.rolesTags)}>
              {userGroup.roles.map((role) => (
                <Tag key={role.id} color="blue">
                  {role.name}
                </Tag>
              ))}
            </div>
          </div>
        )} */}

        {/* 信息项 */}
        <div className={cx(styles.infoSection)}>
          {/* 最大用户数 */}
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>最大用户数:</span>
            <span className={cx(styles.infoValue)}>
              {userGroup.maxUserCount ? userGroup.maxUserCount : '不限制'}
            </span>
          </div>

          {/* token限制 */}
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>token限制:</span>
            <span className={cx(styles.infoValue)}>
              {userGroup.tokenLimit?.limitPerDay
                ? `${userGroup.tokenLimit.limitPerDay}次`
                : '无限制'}
            </span>
          </div>

          {/* 模型 */}
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>模型:</span>
            <span className={cx(styles.infoValue)}>
              {userGroup.modelIds?.length
                ? `${userGroup.modelIds.length}项`
                : '暂未配置模型'}
            </span>
          </div>

          {/* 菜单权限 */}
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>菜单权限:</span>
            <span className={cx(styles.infoValue)}>
              {/* {role.menuIds?.length ? `${role.menuIds.length}项` : '暂未设置'} */}
            </span>
          </div>
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className={cx(styles.footer)}>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={handleEdit}
          className={cx(styles.actionButton)}
        >
          编辑
        </Button>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          loading={deleteLoading}
          className={cx(styles.actionButton)}
        >
          删除
        </Button>
      </div>
    </div>
  );
};

export default UserGroupCard;
