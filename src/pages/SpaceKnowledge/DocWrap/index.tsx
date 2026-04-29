import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import type { DocWrapProps } from '@/types/interfaces/knowledge';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';
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
  // 滚动容器与内容区域，用于自动补全加载
  const containerRef = useRef<HTMLUListElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /**
   * 检查文档列表内容是否填满容器，如果未填满且还有更多数据，则自动加载下一页
   */
  const checkAndAutoFill = useCallback(() => {
    if (
      !containerRef.current ||
      !contentRef.current ||
      loading ||
      !hasMore ||
      !documentList ||
      documentList.length === 0
    ) {
      return;
    }

    const containerHeight = containerRef.current.clientHeight;
    const contentHeight = contentRef.current.scrollHeight;

    if (contentHeight <= containerHeight) {
      onScroll();
    }
  }, [loading, hasMore, documentList, onScroll]);

  // 文档列表变化后检查是否需要自动补充加载
  useEffect(() => {
    const timer = window.setTimeout(checkAndAutoFill, 100);
    return () => window.clearTimeout(timer);
  }, [documentList, checkAndAutoFill]);

  // 窗口大小变化时重新检查
  useEffect(() => {
    const handleResize = () => {
      checkAndAutoFill();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [checkAndAutoFill]);

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <Input.Search
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
        <ul
          className={cx('flex-1', 'scroll-container')}
          id="docListDiv"
          ref={containerRef}
        >
          <InfiniteScrollDiv
            scrollableTarget="docListDiv"
            list={documentList}
            hasMore={hasMore}
            onScroll={onScroll}
          >
            <div ref={contentRef}>
              {documentList?.map((item) => (
                <DocItem
                  key={item.id}
                  currentDocId={currentDocId}
                  info={item}
                  onClick={onClick}
                  onSetAnalyzed={onSetAnalyzed}
                />
              ))}
            </div>
          </InfiniteScrollDiv>
        </ul>
      )}
    </div>
  );
};

export default DocWrap;
