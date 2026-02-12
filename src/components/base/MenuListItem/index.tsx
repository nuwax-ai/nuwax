import CustomPopover from '@/components/CustomPopover';
import { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import SvgIcon from '../SvgIcon';
import styles from './index.less';

const cx = classNames.bind(styles);

// 二级菜单项组件
export interface MenuListItemProps {
  icon?: React.ReactNode | string;
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
          icon?.includes('.png') ||
          icon?.includes('.jpg') ||
          icon?.includes('.jpeg') ? (
            <img
              className={cx(styles['icon-image'])}
              src={icon}
              alt={name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = icon;
              }}
            />
          ) : (
            <SvgIcon name={icon} />
          )
        ) : (
          icon
        )}
      </span>
      <div className={cx('flex-1', styles.name)}>{name}</div>
      {onCancelCollect && (
        <CustomPopover list={[{ label: '取消收藏' }]} onClick={onCancelCollect}>
          <EllipsisOutlined className={cx(styles.collectIcon)} />
        </CustomPopover>
      )}
    </div>
  );
};

export default MenuListItem;
