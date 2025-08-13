import ConditionRender from '@/components/ConditionRender';
import type { SquareMenuItemProps } from '@/types/interfaces/square';
import { DownOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 广场菜单项组件
const SquareMenuItem: React.FC<SquareMenuItemProps> = ({
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
      <ConditionRender condition={isDown}>
        <DownOutlined className={cx(styles['icon-dropdown'])} />
      </ConditionRender>
    </div>
  );
};

export default SquareMenuItem;
