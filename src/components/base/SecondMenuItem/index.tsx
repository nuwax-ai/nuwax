import CustomPopover from '@/components/CustomPopover';
import { DownOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 二级菜单项组件
export interface SecondMenuItemProps {
  icon?: React.ReactNode | string;
  isFirst?: boolean;
  isOpen?: boolean;
  name: string;
  isActive?: boolean;
  isHead?: boolean;
  isDown?: boolean;
  onClick: () => void;
  onCancelCollect?: () => void;
}

// 二级菜单项组件
const SecondMenuItem: React.FC<SecondMenuItemProps> = ({
  icon,
  name,
  isActive = false,
  isFirst = false,
  isHead = false,
  isDown,
  isOpen = false,
  onClick,
  onCancelCollect,
}) => {
  return (
    <div
      className={cx(
        'flex',
        'items-center',
        styles.row,
        icon || isHead ? styles.headItem : styles.normalItem,
        {
          [styles.active]: isActive,
          [styles.first]: isFirst,
          [styles.open]: isOpen,
        },
      )}
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
          <img className={cx(styles['icon-image'])} src={icon} alt={name} />
        ) : (
          icon
        )}
      </span>
      <Typography.Text className={cx('flex-1')}>{name}</Typography.Text>
      {isDown ? <DownOutlined className={cx(styles['icon-dropdown'])} /> : null}
      {onCancelCollect && (
        <CustomPopover list={[{ label: '取消收藏' }]} onClick={onCancelCollect}>
          <EllipsisOutlined className={cx(styles.collectIcon)} />
        </CustomPopover>
      )}
    </div>
  );
};

export default SecondMenuItem;
