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
> = ({ scrollableTarget, list, hasMore, onScroll, children }) => {
  return (
    <InfiniteScroll
      dataLength={list.length}
      next={onScroll}
      hasMore={hasMore}
      loader={<Loading className={cx(styles['end-loading'])} />}
      scrollableTarget={scrollableTarget}
      endMessage={
        list?.length > 0 && <p className={cx(styles['end-text'])}>到底了哦~~</p>
      }
    >
      {children}
    </InfiniteScroll>
  );
};

export default InfiniteScrollDiv;
