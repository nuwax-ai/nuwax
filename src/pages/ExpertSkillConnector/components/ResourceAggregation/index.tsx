/**
 * 通用资源聚合内容区
 * @description 专家/技能/连接器三个页面共用的内容组件：
 * 工具栏（主tab/二级tab/搜索/更多）+ 卡片网格 + 滚动加载
 */

import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation } from 'umi';
import type { ResourceSourceEnum, ResourceTypeEnum } from '../../types';
import ResourceToolbar from '../ResourceToolbar';
import ResourceCard from './components/ResourceCard';
import useResourceCategories from './hooks/useResourceCategories';
import useResourceList from './hooks/useResourceList';
import useTeamSpaceId from './hooks/useTeamSpaceId';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 滚动容器 id 自增序号（保证多实例共存时 id 唯一） */
let scrollIdSeq = 0;

export interface ResourceAggregationProps {
  /** 资源类型 */
  resourceType: ResourceTypeEnum;
}

const ResourceAggregation: React.FC<ResourceAggregationProps> = ({
  resourceType,
}) => {
  const location = useLocation();

  // 初始状态优先从 URL 恢复（刷新/分享可还原筛选状态）
  const initialParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const source = searchParams.get('source');
    return {
      source: source === 'team' ? ('team' as const) : ('system' as const),
      category: searchParams.get('category') || '',
      keyword: searchParams.get('kw') || '',
    };
    // 仅挂载时读取一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 主 tab：系统广场/团队空间
  const [source, setSource] = useState<ResourceSourceEnum>(
    initialParams.source,
  );
  // 二级分类 key（空串=全部）
  const [category, setCategory] = useState<string>(initialParams.category);
  // 搜索关键字（输入值 + 防抖值）
  const [keywordInput, setKeywordInput] = useState<string>(
    initialParams.keyword,
  );
  const [keyword, setKeyword] = useState<string>(initialParams.keyword);

  // 分类字典
  const categories = useResourceCategories(resourceType, source);
  // 团队空间维度空间 ID
  const spaceId = useTeamSpaceId();

  // 归一化列表数据
  const { list, loading, hasMore, loadMore } = useResourceList({
    resourceType,
    source,
    category,
    keyword,
    spaceId,
    pageSize: 20,
  });

  // 搜索防抖 400ms
  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(keywordInput), 400);
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  // 筛选状态同步 URL（replace 不产生历史记录）
  useEffect(() => {
    const searchParams = new URLSearchParams();
    if (source !== 'system') {
      searchParams.set('source', source);
    }
    if (category) {
      searchParams.set('category', category);
    }
    if (keyword) {
      searchParams.set('kw', keyword);
    }
    const search = searchParams.toString();
    if (`?${search}` !== location.search) {
      history.replace({
        pathname: location.pathname,
        search: search ? `?${search}` : '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, category, keyword]);

  // 滚动容器与内容区域，用于不满屏自动补拉
  const scrollIdRef = useRef<string>(`esc-scroll-container-${++scrollIdSeq}`);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /**
   * 检查列表内容是否填满容器，如果未填满且还有更多数据，则自动加载下一页
   */
  const checkAndAutoFill = useCallback(() => {
    if (
      !containerRef.current ||
      !contentRef.current ||
      loading ||
      !hasMore ||
      list.length === 0
    ) {
      return;
    }
    if (contentRef.current.scrollHeight <= containerRef.current.clientHeight) {
      loadMore();
    }
  }, [loading, hasMore, list, loadMore]);

  // 数据更新后检查是否需要自动补充加载
  useEffect(() => {
    const timer = window.setTimeout(checkAndAutoFill, 100);
    return () => window.clearTimeout(timer);
  }, [list, checkAndAutoFill]);

  // 窗口大小变化时重新检查
  useEffect(() => {
    const handleResize = () => checkAndAutoFill();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkAndAutoFill]);

  // 团队空间维度等待空间 ID 加载
  const waitingSpace = source === 'team' && !spaceId;
  // 首屏加载（非滚动加载更多）才显示整屏 Loading
  const initialLoading = (loading || waitingSpace) && list.length === 0;

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'flex-1')}>
      <ResourceToolbar
        resourceType={resourceType}
        source={source}
        onSourceChange={setSource}
        categories={categories}
        activeCategory={category}
        onCategoryChange={setCategory}
        keyword={keywordInput}
        onKeywordChange={setKeywordInput}
        // 连接器页不展示"更多"入口（产品要求），专家/技能页保留
        showMore={resourceType !== 'connector'}
      />

      {initialLoading ? (
        <Loading />
      ) : list.length > 0 ? (
        <div
          className={cx('flex-1', 'scroll-container-hide')}
          id={scrollIdRef.current}
          ref={containerRef}
        >
          <InfiniteScrollDiv
            scrollableTarget={scrollIdRef.current}
            list={list}
            hasMore={hasMore}
            onScroll={loadMore}
          >
            <div className={cx(styles['list-section'])} ref={contentRef}>
              {list.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  showSummon={resourceType === 'expert'}
                  showUse={resourceType === 'skill'}
                  // 技能卡片不展示底部统计行（使用用户数等）
                  showStats={resourceType !== 'skill'}
                />
              ))}
            </div>
          </InfiniteScrollDiv>
        </div>
      ) : (
        <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
          <Empty description={dict('PC.Common.Global.emptyData')} />
        </div>
      )}
    </div>
  );
};

export default ResourceAggregation;
