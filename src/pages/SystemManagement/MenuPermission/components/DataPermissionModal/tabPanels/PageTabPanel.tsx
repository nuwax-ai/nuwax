/**
 * 数据权限弹窗 —「网页应用」Tab 面板
 *
 * 功能：与智能体 Tab 结构相同；左侧为网页应用类型广场列表（无限滚动），右侧为已选网页应用详情。
 * 列表项主键在左侧为 targetId，右侧列表项为 devAgentId。
 *
 * @see DataPermissionModal
 */
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import type { CustomPageDto } from '@/types/interfaces/pageDev';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { RefObject } from 'react';
import ResourceItem from '../components/ResourceItem';
import styles from '../index.less';

const cx = classNames.bind(styles);

/** 网页应用 Tab：搜索、分页列表与选中列表由父组件管理 */
export interface PageTabPanelProps {
  /** 搜索框受控值 */
  pageSearchKw: string;
  onPageSearchKwChange: (v: string) => void;
  /** 搜索第一页，keyword 为当前关键词 */
  onPageSearch: (value: string) => void;
  /** 左侧列表滚动容器，搜索时滚回顶部 */
  pageListScrollRef: RefObject<HTMLDivElement>;
  pageLoading: boolean;
  pageList: SquarePublishedItemInfo[];
  pageHasMore: boolean;
  /** 触底加载下一页 */
  onLoadMorePage: () => void;
  /** 已选网页应用 id（与左侧 targetId 对应） */
  selectedPageAgentIds: number[];
  selectedPageList: CustomPageDto[];
  /** 加入已选 */
  onTogglePage: (targetId: number) => void;
  /** 右侧删除使用 devAgentId */
  onRemovePage: (devAgentId: number) => void;
}

const PageTabPanel: React.FC<PageTabPanelProps> = ({
  pageSearchKw,
  onPageSearchKwChange,
  onPageSearch,
  pageListScrollRef,
  pageLoading,
  pageList,
  pageHasMore,
  onLoadMorePage,
  selectedPageAgentIds,
  selectedPageList,
  onTogglePage,
  onRemovePage,
}) => (
  <div className={cx('flex', 'h-full')}>
    {/* 左侧：搜索 + 网页应用列表（无限滚动，scrollTarget: page-list-scroll） */}
    <div
      className={cx(
        'flex',
        'flex-col',
        'h-full',
        'flex-1',
        'overflow-hide',
        styles.leftList,
      )}
    >
      <Input.Search
        key="pageSearch"
        placeholder={dict('PC.Pages.DataPermissionTabPanel.searchPage')}
        allowClear
        className={cx(styles.searchInput)}
        value={pageSearchKw}
        onChange={(e) => onPageSearchKwChange(e.target.value)}
        onSearch={(value) => {
          onPageSearchKwChange(value);
          if (pageListScrollRef.current) {
            pageListScrollRef.current.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }
          onPageSearch(value);
        }}
      />
      <div
        ref={pageListScrollRef}
        id="page-list-scroll"
        className={cx('flex-1', 'overflow-y', 'h-full')}
      >
        {pageLoading && !pageList?.length ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : (
          <InfiniteScrollDiv
            scrollableTarget="page-list-scroll"
            list={pageList}
            hasMore={pageHasMore}
            onScroll={() => {
              if (!pageLoading && pageHasMore) {
                onLoadMorePage();
              }
            }}
          >
            {pageList?.map((item) => (
              <ResourceItem
                key={item.targetId}
                icon={item.coverImg || item.icon}
                name={item.name}
                description={item.description}
                targetId={item.targetId}
                onAdd={onTogglePage}
                isAdded={selectedPageAgentIds.includes(item.targetId)}
              />
            ))}
          </InfiniteScrollDiv>
        )}
      </div>
    </div>
    <div className={cx(styles.rightSeparator)} />
    {/* 右侧：已选网页应用 */}
    <div className={cx(styles.rightList, 'flex-1')}>
      {selectedPageList.length ? (
        selectedPageList.map((item) => (
          <ResourceItem
            key={item.devAgentId}
            icon={item.coverImg || item.icon}
            name={item.name}
            description={item.description}
            targetId={item.devAgentId}
            onDelete={onRemovePage}
          />
        ))
      ) : (
        <div className={cx(styles.empty)}>
          {dict('PC.Pages.DataPermissionTabPanel.noSelectedPage')}
        </div>
      )}
    </div>
  </div>
);

export default PageTabPanel;
