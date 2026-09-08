import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import {
  CONVERSATION_FLAGS_EVENT,
  loadConversationFlags,
} from '@/components/business-component/ConversationContextMenu/conversationLocalFlags';
import { apiAgentConversationList } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useSize } from 'ahooks';
import { Space, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

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
  // 会话本地标记（置顶/归档/收藏过渡方案）：菜单 toggle 后经全局事件重读，驱动排序/过滤
  const [conversationFlags, setConversationFlags] = useState(() =>
    loadConversationFlags(),
  );
  const [showArchived, setShowArchived] = useState(false);
  useEffect(() => {
    const refreshFlags = () => setConversationFlags(loadConversationFlags());
    window.addEventListener(CONVERSATION_FLAGS_EVENT, refreshFlags);
    window.addEventListener('conversation-deleted', refreshFlags);
    return () => {
      window.removeEventListener(CONVERSATION_FLAGS_EVENT, refreshFlags);
      window.removeEventListener('conversation-deleted', refreshFlags);
    };
  }, []);

  // 展示列表：默认隐藏归档项、置顶项排前（稳定排序）；「已归档」视图只看归档项
  const visibleList = useMemo(() => {
    const archivedSet = new Set(conversationFlags.archived);
    const filtered = showArchived
      ? list.filter((item) => archivedSet.has(Number(item.id)))
      : list.filter((item) => !archivedSet.has(Number(item.id)));
    if (showArchived) return filtered;
    const pinnedSet = new Set(conversationFlags.pinned);
    return [...filtered].sort(
      (a, b) =>
        Number(pinnedSet.has(Number(b.id))) -
        Number(pinnedSet.has(Number(a.id))),
    );
  }, [list, conversationFlags, showArchived]);

  const archivedCount = useMemo(
    () =>
      list.filter((item) =>
        conversationFlags.archived.includes(Number(item.id)),
      ).length,
    [list, conversationFlags],
  );

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
        lastId,
        limit: isRefresh ? pageSize : 20,
        topic: keyword || undefined,
      });

      const data = res.data || [];
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

  return (
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
            pinned={conversationFlags.pinned.includes(Number(item.id))}
            archived={conversationFlags.archived.includes(Number(item.id))}
            collected={conversationFlags.collected.includes(Number(item.id))}
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
        {/* 已归档入口：存在归档项或处于已归档视图时显示（本地标记过渡方案） */}
        {!loading && (archivedCount > 0 || showArchived) && (
          <div
            className={styles['archived-entry']}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived
              ? t(
                  'PC.Layouts.DynamicMenusLayout.NewHomeSection.backToConversations',
                )
              : `${t(
                  'PC.Layouts.DynamicMenusLayout.NewHomeSection.archivedConversations',
                )} (${archivedCount})`}
          </div>
        )}
        {!hasMore && list?.length > 8 && (
          <div className={styles.nomore}>
            {t('PC.Components.HistoryConversationList.noMoreData')}
          </div>
        )}
      </div>
    </div>
  );
});

export default ConversationList;
