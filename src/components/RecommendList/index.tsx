import type { RecommendListProps } from '@/types/interfaces/agentConfig';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const RecommendList: React.FC<RecommendListProps> = ({
  className,
  itemClassName,
  loading,
  chatSuggestList,
  onClick,
}) => {
  return (
    <div className={cx(styles.container, 'flex', 'flex-col', className)}>
      {loading ? (
        <div className={cx('flex')}>
          <LoadingOutlined />
        </div>
      ) : (
        chatSuggestList?.map((item, index) => (
          <div
            key={index}
            onClick={() => onClick(item)}
            className={cx(
              styles.box,
              'px-16',
              'radius-6',
              'cursor-pointer',
              'hover-box',
              itemClassName,
            )}
          >
            {item}
          </div>
        ))
      )}
    </div>
  );
};

export default RecommendList;
