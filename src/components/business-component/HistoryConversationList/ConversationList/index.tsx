import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import { apiAgentConversationList } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  CONVERSATION_FAVORITES_EVENT,
  loadFavoriteConversationIds,
  removeFavoriteConversation,
} from '@/utils/conversationFavorites';
import {
  applyConversationFlagOverrides,
  ConversationFlagOverride,
  recordConversationFlagOverride,
} from '@/utils/conversationFlagOverrides';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useSize } from 'ahooks';
import { Space, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 列表视图：全部（默认，隐藏归档）/ 已收藏（本地）/ 已归档（服务端） */
type ListViewMode = 'all' | 'collected' | 'archived';

interface ConversationListProps {
  agentId?: number | null;
  keyword?: string;
  onItemClick?: (id: number, agentId: number) => void;
  onEdit?: (id: number, currentTopic: string) => void;
  onDelete?: (id: number) => void;
}

export interface ConversationListRef {
  updateItemTopic: (id: number, newTopic: string) => void;
  removeItem: (id: number) => void;
  refresh: () => void;
}

const ConversationList = React.forwardRef<
  ConversationListRef,
  ConversationListProps
>(({ agentId = null, keyword = '', onItemClick, onEdit, onDelete }, ref) => {
  const [list, setList] = useState<ConversationInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useSize(containerRef);
  const [viewMode, setViewMode] = useState<ListViewMode>('all');
  // 收藏为本地存储（后端接口未上线）：菜单 toggle / 其他列表变更后经全局事件重读
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(
    () => new Set(loadFavoriteConversationIds()),
  );
  // 标记（置顶/归档）本地覆盖：防止刷新的滞后回包把刚归档的会话复活回列表
  const flagOverridesRef = useRef(new Map<string, ConversationFlagOverride>());

  useEffect(() => {
    const refreshFavorites = () =>
      setFavoriteIds(new Set(loadFavoriteConversationIds()));
    window.addEventListener(CONVERSATION_FAVORITES_EVENT, refreshFavorites);
    // 会话删除后清理收藏残留（其他列表页删除的也一并生效）
    const handleDeleted = (event: Event) => {
      const id = (event as CustomEvent<{ id?: number }>).detail?.id;
      if (typeof id === 'number') {
        removeFavoriteConversation(id);
      }
    };
    window.addEventListener('conversation-deleted', handleDeleted);
    return () => {
      window.removeEventListener(
        CONVERSATION_FAVORITES_EVENT,
        refreshFavorites,
      );
      window.removeEventListener('conversation-deleted', handleDeleted);
    };
  }, []);

  // 展示列表：全部视图隐藏归档项、置顶项排前；收藏/归档视图按各自口径过滤
  const visibleList = useMemo(() => {
    if (viewMode === 'archived') {
      return list.filter((item) => item.archived === true);
    }
    if (viewMode === 'collected') {
      // 收藏是跨归档的个人视图：已归档但收藏过的也保留
      return list.filter((item) => favoriteIds.has(Number(item.id)));
    }
    const nonArchived = list.filter((item) => item.archived !== true);
    return [...nonArchived].sort(
      (a, b) => Number(b.pinned === true) - Number(a.pinned === true),
    );
  }, [list, viewMode, favoriteIds]);

  // 计算每页条数
  const calculatePageSize = () => {
    if (!size?.height) return 20;
    // 每项高度约 60px (56px content + 4px gap)
    const count = Math.ceil(size.height / 60);
    return Math.max(count, 10); // 至少加载10条
  };

  // 加载数据
  const loadData = async (isRefresh = false) => {
    if (loading || (!hasMore && !isRefresh)) return;
    setLoading(true);

    const pageSize = calculatePageSize();
    const lastId = isRefresh
      ? null
      : list.length > 0
      ? list[list.length - 1].id
      : null;

    try {
      const res = await apiAgentConversationList({
        agentId,
        includeArchived: true,
        lastId,
        limit: isRefresh ? pageSize : 20,
        topic: keyword || undefined,
      });

      // 回包落地前重放本地标记覆盖：列表读接口可能滞后于标记接口，
      // 整体替换会短暂复活刚归档/置顶的会话（TTL 内本地写优先）
      const data = applyConversationFlagOverrides(
        res.data || [],
        flagOverridesRef.current,
      );
      if (isRefresh) {
        setList(data);
      } else {
        setList((prev) => [...prev, ...data]);
      }
      setHasMore(data.length >= (isRefresh ? pageSize : 20));
    } catch (error) {
      console.error('Fetch conversation list failed:', error);
    } finally {
      setLoading(false);
    }
  };
  // 暴露给父组件的方法
  React.useImperativeHandle(ref, () => ({
    updateItemTopic: (id: number, newTopic: string) => {
      setList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, topic: newTopic } : item,
        ),
      );
    },
    removeItem: (id: number) => {
      setList((prev) => prev.filter((item) => item.id !== id));
    },
    refresh: () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      setList([]);
      loadData(true);
    },
  }));

  // 监听关键词变化刷新
  useEffect(() => {
    setHasMore(true);
    loadData(true);
  }, [keyword, agentId]);

  // 滚动监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        loadData();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, list]);

  // 视图分类 tab：全部 / 已收藏（本地）/ 已归档（服务端）
  const viewTabs: Array<{ key: ListViewMode; label: string }> = [
    { key: 'all', label: t('PC.Common.Global.all') },
    { key: 'collected', label: t('PC.Components.HistoryConversationList.collectedTab') },
    { key: 'archived', label: t('PC.Components.HistoryConversationList.archivedTab') },
  ];

  return (
    <>
      <div className={styles.tabs}>
        {viewTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={
              viewMode === tab.key
                ? `${styles['tab']} ${styles['tab-active']}`
                : styles.tab
            }
            onClick={() => setViewMode(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        className={cx(styles.container, 'scroll-container')}
      >
        <div className={styles['list-content']}>
        {visibleList.map((item) => (
          <ConversationContextMenu
            key={item.id}
            conversationId={item.id}
            currentTopic={item.topic}
            pinned={item.pinned === true}
            archived={item.archived === true}
            collected={favoriteIds.has(Number(item.id))}
            onFlagChanged={(kind, enabled) => {
              recordConversationFlagOverride(
                flagOverridesRef.current,
                item.id,
                kind,
                enabled,
              );
              setList((prev) =>
                prev.map((conversation) =>
                  conversation.id === item.id
                    ? { ...conversation, [kind]: enabled }
                    : conversation,
                ),
              );
            }}
            onRename={onEdit ? () => onEdit(item.id, item.topic) : undefined}
            onDelete={onDelete ? () => onDelete(item.id) : undefined}
          >
            <div
              className={styles['list-item']}
              onClick={() => onItemClick?.(item.id, item.agentId)}
            >
              <div className={styles['item-header']}>
                <div className={styles['topic-wrapper']}>
                  <span className={styles.topic}>{item.topic}</span>
                  <Tooltip
                    title={t(
                      'PC.Components.HistoryConversationList.editTitleTooltip',
                    )}
                    mouseEnterDelay={0.5}
                  >
                    <EditOutlined
                      className={styles['edit-icon']}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(item.id, item.topic);
                      }}
                    />
                  </Tooltip>
                </div>
                <div className={styles['right-area']}>
                  <span className={styles.date}>
                    {dayjs(item.modified).format(
                      t('PC.Components.HistoryConversationList.dateTimeFormat'),
                    )}
                  </span>
                  <Space className={styles.actions} size={12}>
                    <Tooltip
                      title={t(
                        'PC.Components.HistoryConversationList.deleteTooltip',
                      )}
                      mouseEnterDelay={0.5}
                    >
                      <DeleteOutlined
                        className={cx(styles['action-icon'], styles.delete)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(item.id);
                        }}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </div>
              <div className={styles['summary-wrapper']}>
                <div className={styles.summary}>
                  {item.summary ||
                    t('PC.Components.HistoryConversationList.summaryEmpty')}
                </div>
                <div className={styles['tag-wrapper']}>
                  <div className={styles['agent-tag-bottom']}>
                    {item.agent?.name ||
                      t('PC.Components.HistoryConversationList.agentFallback')}
                  </div>
                </div>
              </div>
            </div>
          </ConversationContextMenu>
        ))}
        {loading && (
          <div className={styles.loading}>
            <Spin size="small" />
          </div>
        )}
        {/* 收藏/归档视图空态提示（收藏走本地存储，归档由 includeArchived=true 回读服务端状态） */}
        {!loading &&
          viewMode !== 'all' &&
          visibleList.length === 0 &&
          list.length > 0 && (
            <div className={styles.nomore}>
              {t(
                viewMode === 'collected'
                  ? 'PC.Components.HistoryConversationList.collectedEmpty'
                  : 'PC.Components.HistoryConversationList.archivedEmpty',
              )}
            </div>
          )}
        {!hasMore && list?.length > 8 && (
          <div className={styles.nomore}>
            {t('PC.Components.HistoryConversationList.noMoreData')}
          </div>
        )}
        </div>
      </div>
    </>
  );
});

export default ConversationList;
