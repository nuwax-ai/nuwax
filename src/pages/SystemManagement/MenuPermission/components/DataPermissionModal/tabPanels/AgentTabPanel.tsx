/**
 * 数据权限弹窗 —「智能体」Tab 面板
 *
 * 功能：顶部搜索；左侧广场智能体列表支持无限滚动加载；右侧展示按 id 拉取的已选智能体详情。
 * 滚动容器 id 为 `agent-list-scroll`，需与 InfiniteScrollDiv 的 scrollableTarget 一致。
 *
 * @see DataPermissionModal
 */
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { RefObject } from 'react';
import ResourceItem from '../components/ResourceItem';
import styles from '../index.less';

const cx = classNames.bind(styles);

/** 智能体 Tab：搜索关键词、分页列表与选中列表由父组件管理 */
export interface AgentTabPanelProps {
  /** 搜索框受控值 */
  agentSearchKw: string;
  /** 更新搜索关键词（输入框 onChange） */
  onAgentSearchKwChange: (v: string) => void;
  /** 触发搜索（回车/搜索按钮），通常请求第一页并传 keyword */
  onAgentSearch: (value: string) => void;
  /** 左侧列表滚动容器 ref，搜索时用于 scrollTo 顶部 */
  agentListScrollRef: RefObject<HTMLDivElement>;
  /** 列表请求加载中 */
  agentLoading: boolean;
  /** 当前页合并后的广场智能体列表 */
  agentList: SquarePublishedItemInfo[];
  /** 是否还有下一页 */
  agentHasMore: boolean;
  /** 触底加载下一页（父组件内应拼接页码并发起请求） */
  onLoadMoreAgent: () => void;
  /** 已选智能体 id（左侧 isAdded） */
  selectedAgentIds: number[];
  /** 右侧已选详情（由父组件按 id 批量查询） */
  selectedAgentList: AgentConfigInfo[];
  /** 加入已选 */
  onToggleAgent: (targetId: number) => void;
  /** 从已选移除 */
  onRemoveAgent: (agentId: number) => void;
}

const AgentTabPanel: React.FC<AgentTabPanelProps> = ({
  agentSearchKw,
  onAgentSearchKwChange,
  onAgentSearch,
  agentListScrollRef,
  agentLoading,
  agentList,
  agentHasMore,
  onLoadMoreAgent,
  selectedAgentIds,
  selectedAgentList,
  onToggleAgent,
  onRemoveAgent,
}) => (
  <div className={cx('flex', 'h-full')}>
    {/* 左侧：搜索 + 可滚动列表（InfiniteScroll） */}
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
        key="agentSearch"
        placeholder={dict('PC.Pages.DataPermissionTabPanel.searchAgent')}
        allowClear
        className={cx(styles.searchInput)}
        value={agentSearchKw}
        onChange={(e) => onAgentSearchKwChange(e.target.value)}
        onSearch={(value) => {
          onAgentSearchKwChange(value);
          if (agentListScrollRef.current) {
            agentListScrollRef.current.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }
          onAgentSearch(value);
        }}
      />
      <div
        ref={agentListScrollRef}
        id="agent-list-scroll"
        className={cx('flex-1', 'overflow-y', 'h-full')}
      >
        {agentLoading && !agentList?.length ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : (
          <InfiniteScrollDiv
            scrollableTarget="agent-list-scroll"
            list={agentList}
            hasMore={agentHasMore}
            onScroll={() => {
              if (!agentLoading && agentHasMore) {
                onLoadMoreAgent();
              }
            }}
          >
            {agentList?.map((item) => (
              <ResourceItem
                key={item.targetId}
                icon={item.icon}
                name={item.name}
                description={item.description}
                targetId={item.targetId}
                onAdd={onToggleAgent}
                isAdded={selectedAgentIds.includes(item.targetId)}
              />
            ))}
          </InfiniteScrollDiv>
        )}
      </div>
    </div>
    <div className={cx(styles.rightSeparator)} />
    {/* 右侧：已选智能体 */}
    <div className={cx(styles.rightList, 'flex-1')}>
      {selectedAgentList.length ? (
        selectedAgentList.map((item) => (
          <ResourceItem
            key={item.id}
            icon={item.icon}
            name={item.name}
            description={item.description}
            targetId={item.id}
            onDelete={onRemoveAgent}
          />
        ))
      ) : (
        <div className={cx(styles.empty)}>
          {dict('PC.Pages.DataPermissionTabPanel.noSelectedAgent')}
        </div>
      )}
    </div>
  </div>
);

export default AgentTabPanel;
