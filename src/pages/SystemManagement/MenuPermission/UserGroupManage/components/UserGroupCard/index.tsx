import { DeleteOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { UserGroupInfo } from '../../type';
import { UserGroupStatusEnum } from '../../type';
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
    onDelete(userGroup);
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
          {/* 数据范围 */}
          {/* <div className={cx(styles.infoItem)}>
            <DatabaseOutlined className={cx(styles.infoIcon)} />
            <span className={cx(styles.infoLabel)}>数据范围:</span>
            <span className={cx(styles.infoValue)}>
              {getDataScopeText(userGroup.dataScope)}
            </span>
          </div> */}

          {/* 最大用户数 */}
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>最大用户数:</span>
            <span className={cx(styles.infoValue)}>
              {userGroup.maxUsers === 0 ? '不限制' : userGroup.maxUsers}
            </span>
          </div>

          {/* 菜单权限 */}
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>菜单权限:</span>
            <span className={cx(styles.infoValue)}>
              {/* {userGroup.menuPermissionCount || 0}项 */}
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
        <Popconfirm
          title="删除用户组"
          description={`确认删除用户组 "${userGroup.name}" 吗？`}
          onConfirm={handleDelete}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ loading: deleteLoading }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            className={cx(styles.actionButton)}
          >
            删除
          </Button>
        </Popconfirm>
      </div>
    </div>
  );
};

export default UserGroupCard;
