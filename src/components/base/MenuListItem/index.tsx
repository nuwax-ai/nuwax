import agentImage from '@/assets/images/agent_image.png';
import CustomPopover from '@/components/CustomPopover';
import { dict } from '@/services/i18nRuntime';
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

  /**
   * 远程图标加载：0 首次；1 已用 cache bust 重试过原图；2 已切到默认图并结束
   */
  const imageLoadRetryRef = useRef<0 | 1 | 2>(0);

  useEffect(() => {
    imageLoadRetryRef.current = 0;
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
        {/* 存在图标且图标为字符串 */}
        {hasIcon && typeof icon === 'string' ? (
          icon?.includes('.png') ||
          icon?.includes('.jpg') ||
          icon?.includes('.jpeg') ? (
            <img
              className={cx(styles['icon-image'])}
              src={icon}
              alt={name}
              onError={(e) => {
                const img = e.currentTarget;

                // 首次失败：原 URL 带时间戳再请求一次
                if (imageLoadRetryRef.current === 0) {
                  imageLoadRetryRef.current = 1;
                  const separator = icon.includes('?') ? '&' : '?';
                  img.src = `${icon}${separator}_retry=${Date.now()}`;
                  return;
                }

                // 第二次失败：换默认图，并摘掉 onerror（默认图失败也不再重试）
                img.onerror = null;
                imageLoadRetryRef.current = 2;
                img.src = agentImage;
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
        <CustomPopover
          list={[{ label: dict('PC.Components.MenuListItem.cancelCollect') }]}
          onClick={onCancelCollect}
        >
          <EllipsisOutlined className={cx(styles.collectIcon)} />
        </CustomPopover>
      )}
    </div>
  );
};

export default MenuListItem;
