import { apiAgentConversationList } from '@/services/agentConfig';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useSize } from 'ahooks';
import { Space, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
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
  }));

  // 计算每页条数
  const calculatePageSize = () => {
    if (!size?.height) return 20;
    // 每项高度约 60px (56px content + 4px gap)
    const count = Math.ceil(size.height / 60);
    return Math.max(count, 10); // 至少加载10条
  };

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
        {list.map((item) => (
          <div
            key={item.id}
            className={styles['list-item']}
            onClick={() => onItemClick?.(item.id, item.agentId)}
          >
            <div className={styles['item-header']}>
              <div className={styles['topic-wrapper']}>
                <span className={styles.topic}>{item.topic}</span>
                <Tooltip title="编辑标题" mouseEnterDelay={0.5}>
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
                  {dayjs(item.modified).format('YYYY年MM月DD日 HH:mm:ss')}
                </span>
                <Space className={styles.actions} size={12}>
                  <Tooltip title="删除" mouseEnterDelay={0.5}>
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
            <div className={styles.summary}>
              {item.summary || '暂无内容摘要'}
            </div>
          </div>
        ))}
        {loading && (
          <div className={styles.loading}>
            <Spin size="small" />
          </div>
        )}
        {!hasMore && list.length > 0 && (
          <div className={styles.nomore}>已加载全部数据</div>
        )}
      </div>
    </div>
  );
});

export default ConversationList;
