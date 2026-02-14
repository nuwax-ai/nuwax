import CustomPopover from '@/components/CustomPopover';
import { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef } from 'react';
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

  // 用于跟踪图片是否已经重试加载过一次
  const hasRetriedRef = useRef<boolean>(false);

  // 当 icon 变化时，重置重试状态
  useEffect(() => {
    hasRetriedRef.current = false;
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
                // 如果已经重试过一次，直接清除错误处理，不再重试
                if (hasRetriedRef.current) {
                  e.currentTarget.onerror = null;
                  return;
                }
                // 标记已重试
                hasRetriedRef.current = true;
                // 清除错误处理，防止无限循环
                e.currentTarget.onerror = null;
                // 重新设置 src，触发一次重试
                // 使用时间戳或随机参数确保浏览器会重新加载
                const separator = icon?.includes('?') ? '&' : '?';
                e.currentTarget.src = `${icon}${separator}_retry=${Date.now()}`;
              }}
            />
          ) : (
            <SvgIcon name={icon} />
          )
        ) : (
          icon
        )}
      </span>
      <div className={cx('flex-1', 'text-ellipsis', styles.name)}>{name}</div>
      {onCancelCollect && (
        <CustomPopover list={[{ label: '取消收藏' }]} onClick={onCancelCollect}>
          <EllipsisOutlined className={cx(styles.collectIcon)} />
        </CustomPopover>
      )}
    </div>
  );
};

export default MenuListItem;
