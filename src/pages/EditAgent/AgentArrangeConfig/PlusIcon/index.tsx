import type { PlusIconProps } from '@/types/interfaces/space';
import { PlusOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const PlusIcon: React.FC<PlusIconProps> = ({ title, onClick }) => {
  return (
    <Tooltip title={title}>
      <span
        className={cx(
          'hover-box',
          'flex',
          'content-center',
          'items-center',
          styles.box,
        )}
      >
        <PlusOutlined onClick={onClick} />
      </span>
    </Tooltip>
  );
};

export default PlusIcon;
