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
        className,
      )}
      onClick={(e) => {
        // Popover 内容在 Portal 中渲染，但 React 事件仍会沿组件树冒泡；
        // 若父级（如 BaseTemplate 的 footer）有 onClick 打开菜单，会再次 setOpenAdmin(true)，导致菜单关不掉。
        e.stopPropagation();
        onClick(type);
      }}
    >
      {icon}
      <span className={cx('text-ellipsis')}>{text}</span>
    </div>
  );
};

export default UserActionItem;
