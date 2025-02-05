import type {
  CustomPopoverItem,
  CustomPopoverProps,
} from '@/types/interfaces/common';
import { Popover } from 'antd';
import classNames from 'classnames';
import type { PropsWithChildren } from 'react';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const CustomPopover: React.FC<PropsWithChildren<CustomPopoverProps>> = ({
  children,
  list,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const handleHoverChange = (open: boolean) => {
    setHovered(open);
  };

  const handleClick = (e, item: CustomPopoverItem) => {
    e.stopPropagation();
    onClick(item);
    setHovered(false);
  };

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
              onClick={(e) => handleClick(e, item)}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>
      }
      trigger="hover"
      open={hovered}
      onClick={(e) => e.stopPropagation()}
      onOpenChange={handleHoverChange}
      placement="bottomRight"
      arrow={false}
    >
      {children}
    </Popover>
  );
};

export default CustomPopover;
