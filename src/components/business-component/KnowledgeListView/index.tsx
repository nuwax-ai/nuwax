/**
 * KnowledgeListView — 独立资料库列表组件（数据内聚 + 双布局变体）
 * @description 只做「资料库列表」：按 type 两场景拉数（最近访问全量 /
 * 指定空间 repo 树先序平铺 + 客户端切片）、关键字防抖过滤、滚动分页、
 * 横向资料卡渲染。资料无付费拦截，选中经 onSelect 直调（整行点击与
 * 悬停「选择」按钮均为选中入口）。空间 pill 行（含「最近访问」pill）、
 * 搜索框等宿主 UI 不在组件内。
 *
 * 用法：
 * ```tsx
 * <KnowledgeListView
 *   type={recentView ? 'recent' : 'space'}
 *   spaceId={spaceId}
 *   keyword={keyword}
 *   onSelect={(item) => insertDocChip(item)}
 * />
 * ```
 */
import { t } from '@/services/i18nRuntime';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';
import KnowledgeRow from './KnowledgeRow';
import useKnowledgeList from './hooks/useKnowledgeList';
import styles from './index.less';
import type { KnowledgeListViewProps } from './types';

const cx = classNames.bind(styles);

const KnowledgeListView: React.FC<KnowledgeListViewProps> = ({
  type,
  variant = 'grid',
  keyword,
  spaceId,
  onSelect,
  pageSize = 20,
  className,
}) => {
  const { list, loading, hasMore, loadMore } = useKnowledgeList({
    type,
    keyword,
    spaceId,
    pageSize,
  });

  // ---- 滚动分页与首屏补拉（滚动容器为组件根节点）----
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 48 &&
      !loading &&
      hasMore
    ) {
      loadMore();
    }
  };
  // 列表未填满容器且还有数据时自动补拉
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore || list.length === 0) {
      return;
    }
    if (el.scrollHeight <= el.clientHeight) {
      loadMore();
    }
  }, [list, loading, hasMore, loadMore]);

  const initialLoading = loading && list.length === 0;

  return (
    <div
      ref={scrollRef}
      className={cx(
        styles.root,
        variant === 'grid' ? styles['root-grid'] : styles['root-list'],
        className,
      )}
      onScroll={handleScroll}
    >
      {initialLoading ? (
        <div className={cx(styles.state)}>
          <Spin size="large" />
        </div>
      ) : list.length === 0 ? (
        <div className={cx(styles.state)}>
          <Empty description={t('PC.Common.Global.emptyData')} />
        </div>
      ) : (
        <>
          {list.map((item) => (
            <KnowledgeRow
              key={item.key}
              item={item}
              variant={variant}
              onSelect={onSelect}
            />
          ))}
          {loading && (
            <div className={cx(styles['state-loading'])}>
              <Spin size="small" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KnowledgeListView;
export type {
  KnowledgeListItem,
  KnowledgeListSourceType,
  KnowledgeListVariant,
  KnowledgeListViewProps,
} from './types';
