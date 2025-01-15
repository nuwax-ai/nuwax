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
  type = 'blank',
  icon,
  title,
  onClick,
}) => {
  const bg = type === 'blank' ? 'tooltip-blank' : 'tooltip-white';
  return (
    <Tooltip title={title} overlayClassName={bg}>
      <span
        className={cx(
          'hover-box',
          'flex',
          'content-center',
          'items-center',
          styles.box,
        )}
      >
        {icon || <PlusOutlined onClick={onClick} />}
      </span>
    </Tooltip>
  );
};

export default TooltipIcon;
