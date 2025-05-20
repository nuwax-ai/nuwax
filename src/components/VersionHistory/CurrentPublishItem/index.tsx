import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 当前发布组件属性
export interface CurrentPublishItemProps {
  onOff: () => void;
}

// 当前发布组件
const CurrentPublishItem: React.FC<CurrentPublishItemProps> = ({ onOff }) => {
  return (
    <div className={cx('flex', 'items-center', styles.container)}>
      <div className={cx('flex', 'flex-col', 'flex-1', styles['p-info'])}>
        <span className={cx(styles['p-name'], 'text-ellipsis')}>系统广场</span>
        <span className={cx(styles['p-time'], 'text-ellipsis')}>
          xxx发布于2025-02-15
        </span>
      </div>
      <div
        className={cx(
          'flex',
          'items-center',
          'content-center',
          'radius-6',
          'cursor-pointer',
          styles['off-btn'],
        )}
        onClick={onOff}
      >
        下架
      </div>
    </div>
  );
};

export default CurrentPublishItem;
