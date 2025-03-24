import type { UserActionItemType } from '@/types/interfaces/layouts';
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
      <span className={cx('text-ellipsis')}>{text}</span>
    </div>
  );
};

export default UserActionItem;
