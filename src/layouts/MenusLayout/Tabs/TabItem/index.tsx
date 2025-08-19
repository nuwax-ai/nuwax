import type { TabItemProps } from '@/types/interfaces/layouts';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const TabItem: React.FC<TabItemProps & { isSecondMenuCollapsed?: boolean }> = ({
  active,
  type,
  icon,
  onClick,
  text,
  onMouseEnter,
  onMouseLeave,
  isSecondMenuCollapsed = false,
}) => {
  // 当二级菜单收起时，不显示Tooltip，避免与悬浮菜单冲突
  if (isSecondMenuCollapsed) {
    return (
      <div
        onClick={() => onClick(type)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
  }

  // 二级菜单展开时，正常显示Tooltip
  return (
    <Tooltip
      title={text}
      placement="right"
      color={'#fff'}
      styles={{
        body: { color: '#000' },
      }}
    >
      <div
        onClick={() => onClick(type)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
    </Tooltip>
  );
};

export default TabItem;
