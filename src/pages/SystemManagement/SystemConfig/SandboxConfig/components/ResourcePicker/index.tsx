import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { Input } from 'antd';
import classNames from 'classnames';
import { useRef } from 'react';
import ResourceItem from '../ResourceItem';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ResourcePickerProps<T> {
  /** 搜索关键词 */
  searchKw: string;
  /** 搜索关键词变更 */
  onSearchKwChange: (v: string) => void;
  /** 触发搜索 */
  onSearch: (value: string) => void;
  /** 列表加载中 */
  loading: boolean;
  /** 数据列表 */
  list: T[];
  /** 是否有更多 */
  hasMore: boolean;
  /** 加载更多 */
  onLoadMore: () => void;
  /** 已选ID列表 */
  selectedIds: number[];
  /** 已选详情列表 */
  selectedList: T[];
  /** 切换选择 */
  onToggle: (targetId: number) => void;
  /** 移除选择 */
  onRemove: (targetId: number) => void;
  /** 搜索框占位符 */
  searchPlaceholder?: string;
  /** 无数据提示 */
  emptyText?: string;
  /** 渲染项的回调，由外部决定如何展示 name */
  renderItem: (
    item: T,
    type: 'left' | 'right',
  ) => {
    id: number;
    name: string;
  };
  /** 滚动容器ID，用于无限滚动 */
  scrollId: string;
  /** 自定义类名 */
  className?: string;
}

const ResourcePicker = <T,>({
  searchKw,
  onSearchKwChange,
  onSearch,
  loading,
  list,
  hasMore,
  onLoadMore,
  selectedIds,
  selectedList,
  onToggle,
  onRemove,
  searchPlaceholder,
  emptyText,
  renderItem,
  scrollId,
  className,
}: ResourcePickerProps<T>) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cx(styles['tabs-content-wrapper'], className)}>
      <div className={cx(styles['tab-content'])}>
        {/* 左侧：搜索 + 列表 */}
        <div className={cx(styles['left-list'])}>
          <Input.Search
            placeholder={searchPlaceholder}
            allowClear
            value={searchKw}
            onChange={(e) => onSearchKwChange(e.target.value)}
            onSearch={(value) => {
              onSearchKwChange(value);
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
              onSearch(value);
            }}
          />
          <div
            ref={scrollRef}
            id={scrollId}
            className={cx(styles['resource-list-scroll'])}
            style={{ marginTop: 8 }}
          >
            {loading && !list?.length ? (
              <div className={cx(styles.empty)}>
                <Loading />
              </div>
            ) : (
              <InfiniteScrollDiv
                scrollableTarget={scrollId}
                list={list}
                hasMore={hasMore}
                onScroll={() => {
                  if (!loading && hasMore) {
                    onLoadMore();
                  }
                }}
              >
                {list?.map((item) => {
                  const props = renderItem(item, 'left');
                  return (
                    <ResourceItem
                      key={props.id}
                      name={props.name}
                      targetId={props.id}
                      onAdd={onToggle}
                      isAdded={selectedIds.includes(props.id)}
                    />
                  );
                })}
              </InfiniteScrollDiv>
            )}
          </div>
        </div>

        <div className={cx(styles['right-separator'])} />

        {/* 右侧：已选列表 */}
        <div className={cx(styles['right-list'])}>
          {selectedList.length ? (
            selectedList.map((item) => {
              const props = renderItem(item, 'right');
              return (
                <ResourceItem
                  key={props.id}
                  name={props.name}
                  targetId={props.id}
                  onDelete={onRemove}
                />
              );
            })
          ) : (
            <div className={cx(styles.empty)}>{emptyText}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourcePicker;
