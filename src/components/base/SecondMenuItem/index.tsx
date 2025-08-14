import { DownOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 二级菜单项组件
export interface SecondMenuItemProps {
  icon?: React.ReactNode;
  isFirst?: boolean;
  isOpen?: boolean;
  name: string;
  isActive: boolean;
  isDown?: boolean;
  onClick: () => void;
}

// 二级菜单项组件
const SecondMenuItem: React.FC<SecondMenuItemProps> = ({
  icon,
  name,
  isActive,
  isFirst = false,
  isDown,
  isOpen = false,
  onClick,
}) => {
  return (
    <div
      className={cx(
        'flex',
        'items-center',
        styles.row,
        isDown ? styles.headItem : styles.normalItem,
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
        {icon}
      </span>
      <Typography.Text className={cx('flex-1')}>{name}</Typography.Text>
      {isDown ? <DownOutlined className={cx(styles['icon-dropdown'])} /> : null}
    </div>
  );
};

export default SecondMenuItem;
