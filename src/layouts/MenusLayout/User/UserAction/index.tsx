import type { UserActionItemType } from '@/types/interfaces/menus';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 用户操作选项
 */
const UserActionItem: React.FC<UserActionItemType> = ({
  className,
  onClick,
  type,
  icon,
  text,
}) => {
  return (
    <div
      className={cx(
        styles.row,
        'flex',
        'items-center',
        'hover-box',
        'cursor-pointer',
        'px-16',
        className,
      )}
      onClick={() => onClick(type)}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};

export default UserActionItem;
