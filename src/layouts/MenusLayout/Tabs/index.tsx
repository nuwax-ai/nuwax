import { TABS } from '@/constants/menus.constants';
import { TabsEnum } from '@/types/enums/menus';
import type { TabsType } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React from 'react';
import { useLocation } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Tabs: React.FC<TabsType> = ({ onClick }) => {
  const location = useLocation();
  const handleActive = (type) => {
    return (
      (type === TabsEnum.Home &&
        (location.pathname === '/' || location.pathname.includes('home'))) ||
      (type === TabsEnum.Space && location.pathname.includes('space')) ||
      (type === TabsEnum.Square && location.pathname.includes('square')) ||
      (type === TabsEnum.System_Manage && location.pathname.includes('system'))
    );
  };
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
              { [styles.active]: handleActive(item.type) },
            )}
          >
            <span
              className={cx(
                styles.icon,
                'flex',
                'items-center',
                'content-center',
              )}
            >
              {item.icon}
            </span>
            <span className={cx(styles.text)}>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Tabs;
