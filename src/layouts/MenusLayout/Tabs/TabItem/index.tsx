import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { TabItemProps } from '@/types/interfaces/layouts';

const cx = classNames.bind(styles);

const TabItem: React.FC<TabItemProps> = ({
  active,
  type,
  icon,
  text,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(type)}
      className={cx(
        'flex',
        'flex-col',
        'items-center',
        'content-center',
        'hover-box',
        'cursor-pointer',
        styles.box,
        { [styles.active]: active },
      )}
    >
      <span
        className={cx(styles.icon, 'flex', 'items-center', 'content-center')}
      >
        {icon}
      </span>
      <span className={cx(styles.text)}>{text}</span>
    </div>
  );
};

export default TabItem;
