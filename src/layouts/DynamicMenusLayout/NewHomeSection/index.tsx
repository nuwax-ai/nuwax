import { useDebounceFn } from 'ahooks';
import { Spin, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';

import ConversationItem from './components/ConversationItem';
import EmptyState from './components/EmptyState';
import SearchHeader from './components/SearchHeader';

import { EVENT_TYPE } from '@/constants/event.constants';
import { apiAgentConversationList } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import styles from './index.less';

const cx = classNames.bind(styles);

const ITEM_HEIGHT = 58; // 列表项重构后高度增加

const componentCache = {
  list: null as ConversationInfo[] | null,
  hasMore: true,
  keyword: '',
  searchKeyword: '',
  scrollTop: 0,
};

const NewHomeSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const { id: chatIdParam } = useParams();
  const location = useLocation();
  const chatId =
    chatIdParam || location.pathname.match(/\/home\/chat\/([^/]+)/)?.[1];

  const { handleCloseMobileMenu } = useModel('layout');
  const { firstLevelMenus } = useModel('menuModel');

  const [localList, setLocalList] = useState<ConversationInfo[]>(
    componentCache.list || [],
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    componentCache.list ? componentCache.hasMore : true,
  );
  const [keyword, setKeyword] = useState(componentCache.keyword);
  const [searchKeyword, setSearchKeyword] = useState(
    componentCache.searchKeyword,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const pageSizeRef = useRef(20);
  const loadingRef = useRef(false);

  const calcPageSize = useCallback(() => {
    const height = scrollContainerRef.current?.clientHeight ?? 0;
    if (!height) return 20;
    const count = Math.ceil(height / ITEM_HEIGHT);
    return Math.max(count, 10);
  }, []);

  const loadList = useCallback(
    async (isRefresh = false, options?: { silent?: boolean }) => {
      if (loadingRef.current || (!hasMore && !isRefresh)) return;
      loadingRef.current = true;
      if (!options?.silent) {
        setLoading(true);
      }

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
          setLocalList((prev) => {
            const merged = [...prev, ...data];
            const unique: ConversationInfo[] = [];
            const seen = new Set();
            for (const item of merged) {
              if (item && item.id !== undefined && item.id !== null) {
                if (!seen.has(item.id)) {
                  seen.add(item.id);
                  unique.push(item);
                }
              } else {
                unique.push(item);
              }
            }
            return unique;
          });
        }
        setHasMore(data.length >= pageSize);
      } finally {
        loadingRef.current = false;
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [hasMore, localList, calcPageSize, searchKeyword],
  );

  const loadListRef = useRef(loadList);
  useEffect(() => {
    loadListRef.current = loadList;
  }, [loadList]);

  const stateRef = useRef({ localList, hasMore, keyword, searchKeyword });
  stateRef.current = { localList, hasMore, keyword, searchKeyword };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (componentCache.list) {
        loadList(true, { silent: true });
        setTimeout(() => {
          if (scrollContainerRef.current && componentCache.scrollTop) {
            scrollContainerRef.current.scrollTop = componentCache.scrollTop;
          }
        }, 0);
      } else {
        loadList(true);
      }
    }

    return () => {
      componentCache.list = stateRef.current.localList;
      componentCache.hasMore = stateRef.current.hasMore;
      componentCache.keyword = stateRef.current.keyword;
      componentCache.searchKeyword = stateRef.current.searchKeyword;
      if (scrollContainerRef.current) {
        componentCache.scrollTop = scrollContainerRef.current.scrollTop;
      }
    };
  }, []);

  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (!initializedRef.current) return;

    const isHomeRoute = location.pathname.startsWith('/home');
    const wasHomeRoute = prevPathnameRef.current.startsWith('/home');

    if (location.pathname === '/home') {
      // 点击菜单回到首页，静默更新并回到顶部
      loadListRef.current(true, { silent: true });
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else if (isHomeRoute && !wasHomeRoute) {
      // 从其他页面（如 /space）切回到 /home/chat 页面，即使组件未销毁也应当静默更新一次
      loadListRef.current(true, { silent: true });
    }

    prevPathnameRef.current = location.pathname;
  }, [location.pathname, location.state]);

  useEffect(() => {
    const handleConversationUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{
        id: number;
        topic: string;
        icon?: string;
      }>;
      if (!customEvent.detail) return;
      const { id, topic, icon } = customEvent.detail;
      setLocalList((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              topic,
              icon,
            };
          }
          return item;
        }),
      );
    };

    const handleConversationDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: number }>;
      if (!customEvent.detail) return;
      const { id } = customEvent.detail;
      setLocalList((prev) => prev.filter((item) => item.id !== id));
    };

    const handleRefreshConversationList = () => {
      loadListRef.current(true, { silent: true });
    };

    const handleUpdateConversationListTaskStatus = ({
      conversationId,
      taskStatus,
    }: {
      conversationId: number | string;
      taskStatus: TaskStatus;
    }) => {
      setLocalList((prev) =>
        prev.map((item) =>
          item.id?.toString() === conversationId.toString()
            ? { ...item, taskStatus }
            : item,
        ),
      );
    };

    window.addEventListener('conversation-updated', handleConversationUpdated);
    window.addEventListener('conversation-deleted', handleConversationDeleted);
    eventBus.on(
      EVENT_TYPE.RefreshConversationList,
      handleRefreshConversationList,
    );
    eventBus.on(
      EVENT_TYPE.UpdateConversationListTaskStatus,
      handleUpdateConversationListTaskStatus,
    );

    return () => {
      window.removeEventListener(
        'conversation-updated',
        handleConversationUpdated,
      );
      window.removeEventListener(
        'conversation-deleted',
        handleConversationDeleted,
      );
      eventBus.off(
        EVENT_TYPE.RefreshConversationList,
        handleRefreshConversationList,
      );
      eventBus.off(
        EVENT_TYPE.UpdateConversationListTaskStatus,
        handleUpdateConversationListTaskStatus,
      );
    };
  }, []);

  const isFirstSearchKeywordEffect = useRef(true);
  useEffect(() => {
    if (isFirstSearchKeywordEffect.current) {
      isFirstSearchKeywordEffect.current = false;
      return;
    }
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

  const handleConversationClick = (item: ConversationInfo) => {
    handleCloseMobileMenu();
    const { id, agentId, devTargetType, devTargetId, devSpaceId } = item;

    if (devTargetType === 'Agent' && devSpaceId && id) {
      history.push(
        `/space/${devSpaceId}/conversation-agent?agentId=${devTargetId}&conversationId=${id}`,
      );
    } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
      history.push(`/space/${devSpaceId}/app-dev/${devTargetId}`);
    } else {
      history.push('/home/chat/' + id + '/' + agentId);
    }
  };

  const handleNewConversation = () => {
    handleCloseMobileMenu();
    history.push('/home');
  };

  const showNewChatButton = firstLevelMenus?.some(
    (menu: any) => menu?.code === 'new_conversation',
  );

  const noMoreText = dict('PC.Components.HistoryConversationList.noMore');

  return (
    <div style={style} className={cx(styles['new-home-section'])}>
      <SearchHeader
        keyword={keyword}
        onSearchChange={handleSearchChange}
        onNewChat={handleNewConversation}
        showNewChatButton={showNewChatButton}
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
              onClick={() => handleConversationClick(item)}
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
