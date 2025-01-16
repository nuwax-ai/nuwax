import { CaretDownOutlined, FormOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 编排顶部title组件
 */
const ArrangeTitle: React.FC = () => {
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
      <div className={cx('flex', styles['drop-box'])}>
        <FormOutlined />
        <span>女娲智能体</span>
        <CaretDownOutlined />
      </div>
    </div>
  );
};

export default ArrangeTitle;
