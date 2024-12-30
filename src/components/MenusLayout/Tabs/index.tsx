import { TABS } from '@/constants/menus.constants';
import type { TabsType } from '@/types/interfaces/menus';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Tabs: React.FC<TabsType> = ({ onClick }) => {
  return (
    <div className={cx('flex-1', 'overflow-y')}>
      {TABS.map((item, index) => {
        return (
          <div
            key={index}
            onClick={() => onClick(item.type)}
            className={cx(
              'flex',
              'flex-col',
              'items-center',
              'content-center',
              'hover-box',
              'cursor-pointer',
              styles.box,
            )}
          >
            {item.icon}
            <span className={cx(styles.text)}>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Tabs;
