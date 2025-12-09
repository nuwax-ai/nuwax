import type {
  CustomPopoverItem,
  CustomPopoverProps,
} from '@/types/interfaces/common';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Popover, Tooltip } from 'antd';
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

  const handleClick = (
    e: React.MouseEvent<HTMLElement>,
    item: CustomPopoverItem,
  ) => {
    e.stopPropagation();
    onClick(item);
    setHovered(false);
  };

  return (
    <Popover
      classNames={{
        root: styles['popover-box'],
      }}
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
                'items-center',
                { [styles.del]: item.isDel },
              )}
              onClick={(e) => handleClick(e, item)}
            >
              {item.icon}
              {item.label}
              {item.tooltip && (
                <Tooltip title={item.tooltip}>
                  <InfoCircleOutlined />
                </Tooltip>
              )}
            </li>
          ))}
        </ul>
      }
      trigger="hover"
      open={hovered}
      onOpenChange={handleHoverChange}
      placement="bottomRight"
      arrow={false}
    >
      <div onClick={(e) => e.stopPropagation()} className="flex">
        {children}
      </div>
    </Popover>
  );
};

export default CustomPopover;
