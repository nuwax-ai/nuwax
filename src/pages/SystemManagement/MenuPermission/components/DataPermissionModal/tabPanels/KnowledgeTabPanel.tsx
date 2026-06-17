/**
 * 数据权限弹窗 —「知识库」Tab 面板
 *
 * 功能：搜索 + 左侧系统知识库分页列表（无限滚动）；右侧为按 id 查询的已选知识库详情。
 * 左侧列表项使用知识库 id 作为 targetId，与 selectedKnowledgeIds 对齐。
 *
 * @see DataPermissionModal
 */
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import type {
  KnowledgeInfoById,
  SystemKnowledgeInfo,
} from '@/types/interfaces/systemManage';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { RefObject } from 'react';
import ResourceItem from '../ResourceItem';
import styles from '../index.less';

const cx = classNames.bind(styles);

/** 知识库 Tab：搜索、分页与选中由父组件管理 */
export interface KnowledgeTabPanelProps {
  /** 搜索框受控值 */
  knowledgeSearchKw: string;
  onKnowledgeSearchKwChange: (v: string) => void;
  /** 搜索第一页 */
  onKnowledgeSearch: (value: string) => void;
  /** 左侧列表滚动容器 */
  knowledgeListScrollRef: RefObject<HTMLDivElement>;
  knowledgeLoading: boolean;
  knowledgeList: SystemKnowledgeInfo[];
  knowledgeHasMore: boolean;
  /** 触底加载下一页 */
  onLoadMoreKnowledge: () => void;
  /** 已选知识库 id */
  selectedKnowledgeIds: number[];
  /** 右侧已选详情 */
  selectedKnowledgeList: KnowledgeInfoById[];
  /** 加入已选 */
  onToggleKnowledge: (targetId: number) => void;
  /** 从已选移除 */
  onRemoveKnowledge: (knowledgeId: number) => void;
}

const KnowledgeTabPanel: React.FC<KnowledgeTabPanelProps> = ({
  knowledgeSearchKw,
  onKnowledgeSearchKwChange,
  onKnowledgeSearch,
  knowledgeListScrollRef,
  knowledgeLoading,
  knowledgeList,
  knowledgeHasMore,
  onLoadMoreKnowledge,
  selectedKnowledgeIds,
  selectedKnowledgeList,
  onToggleKnowledge,
  onRemoveKnowledge,
}) => (
  <div className={cx('flex', 'h-full')}>
    {/* 左侧：搜索 + 知识库列表（无限滚动，scrollTarget: knowledge-list-scroll） */}
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
        key="knowledgeSearch"
        placeholder={dict('PC.Pages.DataPermissionTabPanel.searchKnowledge')}
        allowClear
        className={cx(styles.searchInput)}
        value={knowledgeSearchKw}
        onChange={(e) => onKnowledgeSearchKwChange(e.target.value)}
        onSearch={(value) => {
          onKnowledgeSearchKwChange(value);
          if (knowledgeListScrollRef.current) {
            knowledgeListScrollRef.current.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }
          onKnowledgeSearch(value);
        }}
      />
      <div
        ref={knowledgeListScrollRef}
        id="knowledge-list-scroll"
        className={cx('flex-1', 'overflow-y', 'h-full')}
      >
        {knowledgeLoading && !knowledgeList?.length ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : (
          <InfiniteScrollDiv
            scrollableTarget="knowledge-list-scroll"
            list={knowledgeList}
            hasMore={knowledgeHasMore}
            onScroll={() => {
              if (!knowledgeLoading && knowledgeHasMore) {
                onLoadMoreKnowledge();
              }
            }}
          >
            {knowledgeList?.map((item) => (
              <ResourceItem
                key={item.id}
                showIcon={false}
                name={item.name}
                description={item.description}
                targetId={item.id}
                onAdd={onToggleKnowledge}
                isAdded={selectedKnowledgeIds.includes(item.id)}
              />
            ))}
          </InfiniteScrollDiv>
        )}
      </div>
    </div>
    <div className={cx(styles.rightSeparator)} />
    {/* 右侧：已选知识库 */}
    <div className={cx(styles.rightList, 'flex-1')}>
      {selectedKnowledgeList.length ? (
        selectedKnowledgeList.map((item) => (
          <ResourceItem
            key={item.id}
            showIcon={false}
            name={item.name}
            description={item.description}
            targetId={item.id}
            onDelete={onRemoveKnowledge}
          />
        ))
      ) : (
        <div className={cx(styles.empty)}>
          {dict('PC.Pages.DataPermissionTabPanel.noSelectedKnowledge')}
        </div>
      )}
    </div>
  </div>
);

export default KnowledgeTabPanel;
