import { InfiniteScrollDivProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import Loading from '../Loading';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 无限滚动组件
 */
const InfiniteScrollDiv: React.FC<
  PropsWithChildren<InfiniteScrollDivProps>
> = ({
  scrollableTarget,
  list,
  hasMore,
  showLoader = true,
  onScroll,
  children,
}) => {
  return (
    <InfiniteScroll
      dataLength={list.length}
      next={onScroll}
      hasMore={hasMore}
      loader={
        showLoader ? <Loading className={cx(styles['end-loading'])} /> : null
      }
      scrollableTarget={scrollableTarget}
    >
      {children}
    </InfiniteScroll>
  );
};

export default InfiniteScrollDiv;
