import type { TabItemProps } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const TabItem: React.FC<TabItemProps> = ({ active, type, icon, onClick }) => {
  return (
    <div
      onClick={() => onClick(type)}
      className={cx(
        'flex',
        'flex-col',
        'items-center',
        'content-center',
        'cursor-pointer',
        styles.box,
        { [styles.active]: active },
      )}
    >
      <div className={cx(styles['active-icon-container'])}>{icon}</div>
      {/* <span className={cx(styles.text)}>{text}</span> */}
    </div>
  );
};

export default TabItem;
