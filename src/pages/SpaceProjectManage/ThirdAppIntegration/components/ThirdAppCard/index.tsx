import { dict } from '@/services/i18nRuntime';
import type { UserProjectItem } from '@/types/interfaces/userProject';
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 三方应用卡片属性 */
export interface ThirdAppCardProps {
  /** 三方应用数据 */
  item: UserProjectItem;
  /** 点击卡片 */
  onClick: (item: UserProjectItem) => void;
  /** 编辑应用 */
  onEdit: (item: UserProjectItem) => void;
  /** 删除应用 */
  onDelete: (item: UserProjectItem) => void;
}

/**
 * 三方应用专用卡片。
 *
 * 展示应用图标、名称和描述，右侧更多菜单提供编辑及删除操作。
 *
 * @param props 卡片属性
 * @returns 三方应用卡片
 */
const ThirdAppCard: React.FC<ThirdAppCardProps> = ({
  item,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [iconLoadFailed, setIconLoadFailed] = useState(false);

  /** 图标地址变化后允许重新加载 */
  useEffect(() => {
    setIconLoadFailed(false);
  }, [item.icon]);

  /** 更多菜单配置 */
  const menuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: dict('PC.Common.Global.edit'),
      },
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined />,
        label: dict('PC.Common.Global.delete'),
      },
    ],
    [],
  );

  /** 处理更多菜单操作 */
  const handleMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === 'edit') {
        onEdit(item);
        return;
      }
      if (key === 'delete') {
        onDelete(item);
      }
    },
    [item, onDelete, onEdit],
  );

  return (
    <div className={cx(styles.card)} onClick={() => onClick(item)}>
      <div className={cx(styles.icon)}>
        {item.icon && !iconLoadFailed ? (
          <img src={item.icon} alt="" onError={() => setIconLoadFailed(true)} />
        ) : (
          <AppstoreOutlined />
        )}
      </div>

      <div className={cx(styles.content)}>
        <h3 className={cx(styles.name, 'text-ellipsis')}>{item.name}</h3>
        <p className={cx(styles.description, 'text-ellipsis')}>
          {item.description || ''}
        </p>
      </div>

      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{ items: menuItems, onClick: handleMenuClick }}
      >
        <Button
          type="text"
          className={cx(styles.more)}
          aria-label={dict('PC.Components.ActionMenu.more')}
          icon={<MoreOutlined />}
          onClick={(event) => event.stopPropagation()}
        />
      </Dropdown>
    </div>
  );
};

export default ThirdAppCard;
