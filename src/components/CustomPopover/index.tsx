import type { CustomPopoverProps } from '@/types/interfaces/common';
import { Popover } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const CustomPopover: React.FC<PropsWithChildren<CustomPopoverProps>> = ({
  children,
  list,
  onClick,
}) => {
  return (
    <Popover
      overlayClassName={cx(styles['popover-box'])}
      content={
        <ul className={cx(styles['popover-list'])}>
          {list.map((item, index) => (
            <li
              key={index}
              className={cx(
                styles['p-box'],
                'hover-box',
                'cursor-pointer',
                'flex',
                { [styles.del]: item.isDel },
              )}
              onClick={() => onClick(item)}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>
      }
      placement="bottomRight"
      arrow={false}
    >
      {children}
    </Popover>
  );
};

export default CustomPopover;
