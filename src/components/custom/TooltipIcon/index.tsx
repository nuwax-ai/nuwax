import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { TooltipIconProps } from '@/types/interfaces/space';
import { PlusOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 带icon的Tooltip组件
 */
const TooltipIcon: React.FC<TooltipIconProps> = ({
  className,
  type = TooltipTitleTypeEnum.Blank,
  icon,
  title,
  onClick,
}) => {
  const bg =
    type === TooltipTitleTypeEnum.Blank ? 'tooltip-blank' : 'tooltip-white';
  return (
    <Tooltip title={title} classNames={{ root: bg }}>
      <span
        className={cx(
          'hover-box',
          'flex',
          'content-center',
          'items-center',
          'cursor-pointer',
          styles.box,
          className,
        )}
        onClick={onClick}
      >
        {/*默认加号（+）*/}
        {icon || <PlusOutlined />}
      </span>
    </Tooltip>
  );
};

export default TooltipIcon;
