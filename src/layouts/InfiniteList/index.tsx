import { toChatKitConversation } from '@/adapters/chatKitAdapter';
import { dict } from '@/services/i18nRuntime';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { DeleteOutlined } from '@ant-design/icons';
import { ChatConversationList } from '@nuwax-ai/chat-kit/react';
import { Spin } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  height?: number | string; // 容器高度，超出滚动
  conversationList?: ConversationInfo[];
  setConversationList?: React.Dispatch<
    React.SetStateAction<ConversationInfo[] | undefined>
  >;
  handleLink?: (id: number, agentId: number) => void;
  runDel?: (id: number) => void;
}

function InfiniteList({
  pageSize = 20,
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

  // 初始加载
  useEffect(() => {
    if (conversationList?.length === 0 && hasMore) {
      fetchData();
    }
  }, []); // 仅挂载时检查

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

  const sharedConversations = useMemo(
    () => conversationList.map(toChatKitConversation),
    [conversationList],
  );

  const sourceById = useMemo(
    () => new Map(conversationList.map((item) => [String(item.id), item])),
    [conversationList],
  );

  return (
    <div
      ref={containerRef}
      className={cx(styles.container, 'scroll-container')}
      style={{ height }}
    >
      <ChatConversationList
        conversations={sharedConversations}
        onSelect={(conversation) => {
          const source = sourceById.get(conversation.id);
          if (source) handleLink?.(source.id, source.agentId);
        }}
        rowClassName={cx(
          'flex',
          'items-center',
          'radius-6',
          'hover-box',
          styles.row,
        )}
        buttonClassName={cx(
          'flex',
          'flex-1',
          'items-center',
          'text-ellipsis',
          'cursor-pointer',
        )}
        renderContent={(conversation) => {
          const source = sourceById.get(conversation.id);
          if (!source) return null;
          return (
            <>
              <span style={{ marginRight: 5, width: 75 }}>
                {dayjs(source.modified).format('MM-DD HH:mm')}
              </span>
              {source.topic}
            </>
          );
        }}
        renderActions={(conversation) => {
          const source = sourceById.get(conversation.id);
          if (!source) return null;
          return (
            <div
              className={cx(styles.icon, 'cursor-pointer')}
              onClick={(event) => {
                event.stopPropagation();
                runDel?.(source.id);
              }}
            >
              <DeleteOutlined />
            </div>
          );
        }}
      />
      {loading && (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin />
        </div>
      )}
      {conversationList && conversationList.length > 0 && !hasMore && (
        <div style={{ textAlign: 'center', padding: 5, color: '#999' }}>
          {dict('PC.Layouts.InfiniteList.allDataLoaded')}
        </div>
      )}
    </div>
  );
}

export default InfiniteList;
