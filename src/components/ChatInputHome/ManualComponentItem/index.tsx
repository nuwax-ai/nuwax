import { ManualComponentItemProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 手动选择组件
 */
const ManualComponentItem: React.FC<ManualComponentItemProps> = ({
  manualComponents,
  selectedComponentList,
  onSelectComponent,
}) => {
  return (
    <div
      className={cx(
        'flex-1',
        'flex',
        'items-center',
        styles['manual-container'],
      )}
    >
      {manualComponents?.map((item, index) => {
        return (
          <span
            key={index}
            className={cx(
              styles['manual-box'],
              'flex',
              'items-center',
              'cursor-pointer',
              {
                [styles.active]: selectedComponentList?.some(
                  (c) => c.id === item.id,
                ),
              },
            )}
            onClick={() => onSelectComponent?.(item)}
          >
            {item.name}
          </span>
        );
      })}
    </div>
  );
};

export default ManualComponentItem;
