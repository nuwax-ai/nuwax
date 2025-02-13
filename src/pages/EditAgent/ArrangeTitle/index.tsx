import type { ArrangeTitleProps } from '@/types/interfaces/agentConfig';
import { CaretDownOutlined, FormOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 编排顶部title组件
 */
const ArrangeTitle: React.FC<ArrangeTitleProps> = ({ modelName, onClick }) => {
  return (
    <div
      className={cx(
        'flex',
        'content-between',
        'items-center',
        'px-16',
        styles['edit-header'],
      )}
    >
      <h3>编排</h3>
      <div
        className={cx('flex', 'cursor-pointer', styles['drop-box'])}
        onClick={onClick}
      >
        <FormOutlined />
        <span>{modelName}</span>
        <CaretDownOutlined />
      </div>
    </div>
  );
};

export default ArrangeTitle;
