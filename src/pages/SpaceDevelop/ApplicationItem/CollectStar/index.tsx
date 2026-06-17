import type { CollectStarProps } from '@/types/interfaces/space';
import { StarFilled } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 收藏star
 */
const CollectStar: React.FC<CollectStarProps> = ({ devCollected, onClick }) => {
  // 收藏、取消收藏事件
  const handlerCollect = async (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <span
      className={cx(
        styles['icon-box'],
        'flex',
        'content-center',
        'items-center',
        'hover-box',
        { [styles['collected']]: devCollected },
      )}
      onClick={handlerCollect}
    >
      <StarFilled />
    </span>
  );
};

export default CollectStar;
