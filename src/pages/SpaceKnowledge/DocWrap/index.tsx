import InfiniteScrollDiv from '@/components/InfiniteScrollDiv';
import Loading from '@/components/Loading';
import type { DocWrapProps } from '@/types/interfaces/knowledge';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import DocItem from './DocItem';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 文档列表（带搜索文档）
 */
const DocWrap: React.FC<DocWrapProps> = ({
  currentDocId,
  onChange,
  loading,
  documentList,
  onClick,
  onSetAnalyzed,
  hasMore,
  onScroll,
}) => {
  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <Input
        placeholder="搜索"
        size="large"
        onChange={(e) => onChange(e.target.value)}
        allowClear
        prefix={<SearchOutlined className={cx(styles['search-icon'])} />}
      />
      <p className={cx(styles['document-title'])}>文档列表</p>
      {loading ? (
        <Loading />
      ) : (
        <ul className={cx('flex-1', 'overflow-y')} id="scrollableDiv">
          <InfiniteScrollDiv
            scrollableTarget="scrollableDiv"
            list={documentList}
            hasMore={hasMore}
            onScroll={onScroll}
          >
            {documentList?.map((item) => (
              <DocItem
                key={item.id}
                currentDocId={currentDocId}
                info={item}
                onClick={onClick}
                onSetAnalyzed={onSetAnalyzed}
              />
            ))}
          </InfiniteScrollDiv>
        </ul>
      )}
    </div>
  );
};

export default DocWrap;
