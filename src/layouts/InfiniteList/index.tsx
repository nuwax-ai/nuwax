import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { DeleteOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface InfiniteListProps {
  pageSize?: number;
  loadData: (
    lastId: number | null,
    pageSize: number,
  ) => Promise<{
    list: ConversationInfo[];
    hasMore: boolean;
  }>;
  height?: number; // 容器高度，超出滚动
  conversationList?: ConversationInfo[];
  setConversationList?: React.Dispatch<
    React.SetStateAction<ConversationInfo[] | undefined>
  >;
  handleLink?: (id: number, agentId: number) => void;
  runDel?: (id: number) => void;
}

function InfiniteList({
  pageSize = 10,
  loadData,
  height = 400,
  conversationList = [],
  setConversationList,
  handleLink,
  runDel,
}: InfiniteListProps) {
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // 加载数据
  const fetchData = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const lastId = conversationList.length
      ? conversationList[conversationList.length - 1].id
      : null;

    try {
      const { list, hasMore: more } = await loadData(lastId, pageSize);
      setConversationList?.((prev) => [...(prev ?? []), ...list]);
      setHasMore(more);
    } finally {
      setLoading(false);
    }
  };

  // 首次加载
  useEffect(() => {
    // fetchData();
  }, []);

  // 滚动监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        fetchData();
      }
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [loading, hasMore, conversationList]);

  return (
    <div
      ref={containerRef}
      className={cx(styles.container, 'scroll-container')}
      style={{ height }}
    >
      {conversationList?.map((item: ConversationInfo) => (
        <div
          key={item.id}
          className={cx(
            'flex',
            'items-center',
            'radius-6',
            'hover-box',
            styles.row,
          )}
        >
          <p
            className={cx('flex-1', 'text-ellipsis', 'cursor-pointer')}
            onClick={() => handleLink?.(item.id, item.agentId)}
          >
            <span style={{ marginRight: 5, width: 75 }}>
              {dayjs(item.created).format('MM-DD HH:mm')}
            </span>
            {item.topic}
          </p>
          <div
            className={cx(styles.icon, 'cursor-pointer')}
            onClick={(e) => {
              e.stopPropagation();
              runDel?.(item.id);
            }}
          >
            <DeleteOutlined />
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin />
        </div>
      )}
      {conversationList && conversationList.length > 0 && !hasMore && (
        <div style={{ textAlign: 'center', padding: 5, color: '#999' }}>
          已加载全部数据
        </div>
      )}
    </div>
  );
}

export default InfiniteList;
