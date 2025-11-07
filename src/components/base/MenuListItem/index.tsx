import agentImage from '@/assets/images/agent_image.png';
import CustomPopover from '@/components/CustomPopover';
import { EllipsisOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 二级菜单项组件
export interface MenuListItemProps {
  icon?: React.ReactNode | string;
  isFirst?: boolean;
  name: string;
  isActive?: boolean;
  onClick: () => void;
  onCancelCollect?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// 二级菜单项组件
const MenuListItem: React.FC<MenuListItemProps> = ({
  icon,
  name,
  isActive = false,
  isFirst = false,
  onClick,
  onCancelCollect,
  className,
  style,
}) => {
  const hasIcon = useMemo(() => {
    return !!icon;
  }, [icon]);
  return (
    <div
      className={cx(
        'flex',
        'items-center',
        styles.row,
        styles.menuItem,
        {
          [styles.active]: isActive,
          [styles.first]: isFirst,
          [styles['has-icon']]: hasIcon,
        },
        className,
      )}
      style={style}
      onClick={onClick}
    >
      <span
        className={cx(
          styles['icon-box'],
          'flex',
          'items-center',
          'content-center',
        )}
      >
        {typeof icon === 'string' ? (
          <img
            className={cx(styles['icon-image'])}
            src={icon}
            alt={name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = agentImage;
            }}
          />
        ) : (
          icon
        )}
      </span>
      <Typography.Text className={cx('flex-1', styles.name)} ellipsis={true}>
        {name}
      </Typography.Text>
      {onCancelCollect && (
        <CustomPopover list={[{ label: '取消收藏' }]} onClick={onCancelCollect}>
          <EllipsisOutlined className={cx(styles.collectIcon)} />
        </CustomPopover>
      )}
    </div>
  );
};

export default MenuListItem;
