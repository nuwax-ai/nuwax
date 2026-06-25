import { useDebounceFn } from 'ahooks';
import { Spin, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';

import ConversationItem from './components/ConversationItem';
import EmptyState from './components/EmptyState';
import SearchHeader from './components/SearchHeader';

import { apiAgentConversationList } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import styles from './index.less';

const cx = classNames.bind(styles);

const ITEM_HEIGHT = 58; // 列表项重构后高度增加

const NewHomeSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const { id: chatIdParam } = useParams();
  const location = useLocation();
  const chatId =
    chatIdParam || location.pathname.match(/\/home\/chat\/([^/]+)/)?.[1];

  const { handleCloseMobileMenu } = useModel('layout');

  const [localList, setLocalList] = useState<ConversationInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const pageSizeRef = useRef(20);

  const calcPageSize = useCallback(() => {
    const height = scrollContainerRef.current?.clientHeight ?? 0;
    if (!height) return 20;
    const count = Math.ceil(height / ITEM_HEIGHT);
    return Math.max(count, 10);
  }, []);

  const loadList = useCallback(
    async (isRefresh = false) => {
      if (loading || (!hasMore && !isRefresh)) return;
      setLoading(true);

      const pageSize = isRefresh ? calcPageSize() : pageSizeRef.current;
      if (isRefresh) pageSizeRef.current = pageSize;
      const lastId = isRefresh
        ? null
        : localList.length > 0
        ? localList[localList.length - 1].id
        : null;

      try {
        const res = await apiAgentConversationList({
          agentId: null,
          lastId,
          limit: pageSize,
          topic: searchKeyword || undefined,
        });

        const data = res.data ?? [];
        if (isRefresh) {
          setLocalList(data);
        } else {
          setLocalList((prev) => [...prev, ...data]);
        }
        setHasMore(data.length >= pageSize);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, localList, calcPageSize, searchKeyword],
  );

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadList(true);
    }
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    setHasMore(true);
    setLocalList([]);
    loadList(true);
  }, [searchKeyword]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        loadList();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, loadList]);

  const { run: debouncedSearch } = useDebounceFn(
    (val: string) => {
      setSearchKeyword(val);
    },
    { wait: 500 },
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    debouncedSearch(val);
  };

  const handleConversationClick = (id: number, agentId: number) => {
    handleCloseMobileMenu();
    history.push('/home/chat/' + id + '/' + agentId);
  };

  const handleNewConversation = () => {
    handleCloseMobileMenu();
    history.push('/home');
  };

  const noMoreText = dict('PC.Components.HistoryConversationList.noMore');

  return (
    <div style={style} className={cx(styles['new-home-section'])}>
      <SearchHeader
        keyword={keyword}
        onSearchChange={handleSearchChange}
        onNewChat={handleNewConversation}
      />

      {/* 会话记录列表 */}
      <div
        ref={scrollContainerRef}
        className={cx(styles['conversation-list-wrapper'])}
      >
        {!loading && localList.length === 0 && <EmptyState keyword={keyword} />}

        <div ref={listInnerRef} className={cx(styles['conversation-list'])}>
          {localList.map((item) => (
            <ConversationItem
              key={item.id}
              item={item}
              isActive={chatId === item.id?.toString()}
              onClick={() => handleConversationClick(item.id, item.agentId)}
            />
          ))}

          {loading && (
            <div className={cx(styles['load-more'])}>
              <Spin size="small" />
            </div>
          )}
          {!loading && !hasMore && localList.length > 0 && (
            <div className={cx(styles['no-more'])}>
              <Typography.Text type="secondary">{noMoreText}</Typography.Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewHomeSection;
