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
  return loading ? (
    <div className={cx('flex', styles['loading-box'])}>
      <LoadingOutlined />
    </div>
  ) : chatSuggestList?.length > 0 ? (
    <div className={cx(styles.container, 'flex', 'flex-col', className)}>
      {chatSuggestList?.map((item, index) => {
        if (!item) {
          return null;
        }
        return (
          <div
            key={index}
            onClick={() => onClick(item)}
            className={cx(
              styles.box,
              'px-16',
              'cursor-pointer',
              'hover-box',
              itemClassName,
            )}
          >
            {item}
          </div>
        );
      })}
    </div>
  ) : null;
};

export default RecommendList;
