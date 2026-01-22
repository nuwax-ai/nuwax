import {
  DeleteOutlined,
  EditOutlined,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Popconfirm, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { RoleInfo } from '../../type';
import { DataScopeEnum, RoleStatusEnum } from '../../type';
import styles from './index.less';

const cx = classNames.bind(styles);

interface RoleCardProps {
  /** 角色信息 */
  role: RoleInfo;
  /** 编辑回调 */
  onEdit: (role: RoleInfo) => void;
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
  onEdit,
  onDelete,
  deleteLoading = false,
}) => {
  // 获取数据范围显示文本
  const getDataScopeText = (scope: DataScopeEnum): string => {
    switch (scope) {
      case DataScopeEnum.All:
        return '全部数据';
      case DataScopeEnum.Department:
        return '本部门数据';
      case DataScopeEnum.Self:
        return '仅本人数据';
      default:
        return '未知';
    }
  };

  // 处理编辑点击
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(role);
  };

  // 处理删除确认
  const handleDelete = () => {
    onDelete(role);
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
          <div className={cx(styles.iconWrapper)}>
            <SafetyOutlined className={cx(styles.icon)} />
          </div>
          <div className={cx(styles.titleSection)}>
            <h3 className={cx(styles.title)}>{role.name}</h3>
            <p className={cx(styles.code)}>{role.code}</p>
          </div>
        </div>

        {/* 描述 */}
        <p className={cx(styles.description)}>{role.description}</p>

        {/* 信息项 */}
        <div className={cx(styles.infoSection)}>
          {/* 数据范围 */}
          <div className={cx(styles.infoItem)}>
            <TeamOutlined className={cx(styles.infoIcon)} />
            <span className={cx(styles.infoLabel)}>数据范围:</span>
            <span className={cx(styles.infoValue)}>
              {getDataScopeText(role.dataScope)}
            </span>
          </div>

          {/* 菜单权限 */}
          <div className={cx(styles.infoItem)}>
            <span className={cx(styles.infoLabel)}>菜单权限:</span>
            <span className={cx(styles.infoValue)}>
              {role.menuPermissionCount}项
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
          title="删除角色"
          description={`确认删除角色 "${role.name}" 吗？`}
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

export default RoleCard;
