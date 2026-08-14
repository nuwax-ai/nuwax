import { jumpTo } from '@/utils/router';
import { useDebounceFn } from 'ahooks';
import { Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel, useParams } from 'umi';

import ConversationItem from './components/ConversationItem';
import EmptyState from './components/EmptyState';
import RecentAgentItem from './components/RecentAgentItem';
import SearchHeader from './components/SearchHeader';
import { getAgentIdFromHomePathname } from './utils';

import { EVENT_TYPE } from '@/constants/event.constants';
import { useChatFinishedWhenListExecuting } from '@/hooks/useChatFinishedWhenListExecuting';
import { apiAgentConversationList } from '@/services/agentConfig';
import { apiUserUsedAgentList } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { AgentInfo } from '@/types/interfaces/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import styles from './index.less';

const cx = classNames.bind(styles);

const ITEM_HEIGHT = 58; // 列表项重构后高度增加
const RECENT_PAGE_SIZE = 30;
const ACTIVE_TAB_STORAGE_KEY = 'PC_HOME_SECTION_ACTIVE_TAB';

type HomeTab = 'conversation' | 'recent';
type LoadRecentList = (
  isRefresh?: boolean,
  options?: { silent?: boolean; keyword?: string },
) => Promise<void>;

const getInitialActiveTab = (): HomeTab => {
  if (typeof window === 'undefined') return 'recent';
  const storedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  return storedTab === 'conversation' || storedTab === 'recent'
    ? storedTab
    : 'recent';
};

const componentCache = {
  activeTab: 'recent' as HomeTab,
  list: null as ConversationInfo[] | null,
  hasMore: true,
  keyword: '',
  searchKeyword: '',
  recentList: null as AgentInfo[] | null,
  recentHasMore: true,
  recentKeyword: '',
  recentSearchKeyword: '',
  recentPage: 1,
  scrollTop: 0,
};

const NewHomeSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const { id: chatIdParam } = useParams();
  const location = useLocation();
  const chatId =
    chatIdParam || location.pathname.match(/\/home\/chat\/([^/]+)/)?.[1];
  const currentAgentId = getAgentIdFromHomePathname(location.pathname);
  const currentAgentIdRef = useRef(currentAgentId);
  currentAgentIdRef.current = currentAgentId;

  const { handleCloseMobileMenu } = useModel('layout');
  const { firstLevelMenus } = useModel('menuModel');

  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    const initialTab = getInitialActiveTab();
    componentCache.activeTab = initialTab;
    return initialTab;
  });
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
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
  const [recentList, setRecentList] = useState<AgentInfo[]>(
    componentCache.recentList || [],
  );
  const [recentHasMore, setRecentHasMore] = useState(
    componentCache.recentList ? componentCache.recentHasMore : true,
  );
  const [recentKeyword, setRecentKeyword] = useState(
    componentCache.recentKeyword,
  );
  const [recentSearchKeyword, setRecentSearchKeyword] = useState(
    componentCache.recentSearchKeyword,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const pageSizeRef = useRef(30);
  const loadingRef = useRef(false);
  const recentLoadingRef = useRef(false);
  const recentPageRef = useRef(componentCache.recentPage);
  const recentAutoLoadFrameRef = useRef<number | null>(null);
  const loadRecentListRef = useRef<LoadRecentList>(async () => undefined);

  const calcPageSize = useCallback(() => {
    const height = scrollContainerRef.current?.clientHeight ?? 0;
    if (!height) return 30;
    const count = Math.ceil(height / ITEM_HEIGHT);
    return Math.max(count, 10);
  }, []);

  const loadList = useCallback(
    async (
      isRefresh = false,
      options?: { silent?: boolean; topic?: string },
    ) => {
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
      const topic = options?.topic ?? searchKeyword;

      try {
        const res = await apiAgentConversationList({
          agentId: null,
          lastId,
          limit: pageSize,
          topic: topic || undefined,
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

  const handleConversationChatFinished = useCallback(() => {
    loadListRef.current(true, { silent: true });
  }, []);

  useChatFinishedWhenListExecuting({
    conversationList: localList,
    onChatFinished: handleConversationChatFinished,
  });

  const scheduleRecentAutoLoad = useCallback((hasNextPage: boolean) => {
    if (!hasNextPage) return;

    if (recentAutoLoadFrameRef.current !== null) {
      window.cancelAnimationFrame(recentAutoLoadFrameRef.current);
    }

    recentAutoLoadFrameRef.current = window.requestAnimationFrame(() => {
      recentAutoLoadFrameRef.current = null;
      const container = scrollContainerRef.current;
      if (
        activeTabRef.current === 'recent' &&
        container &&
        container.clientHeight > 0 &&
        container.scrollHeight <= container.clientHeight
      ) {
        loadRecentListRef.current();
      }
    });
  }, []);

  const loadRecentList = useCallback(
    async (
      isRefresh = false,
      options?: { silent?: boolean; keyword?: string },
    ) => {
      if (recentLoadingRef.current || (!recentHasMore && !isRefresh)) return;
      recentLoadingRef.current = true;
      if (!options?.silent) setLoading(true);

      const pageIndex = isRefresh ? 1 : recentPageRef.current + 1;
      const keyword = options?.keyword ?? recentSearchKeyword;
      let hasNextPage = false;
      try {
        const res = await apiUserUsedAgentList({
          size: RECENT_PAGE_SIZE,
          pageIndex,
          keyword: keyword || undefined,
        });
        const data = res.data ?? [];
        if (isRefresh) {
          setRecentList(data);
        } else {
          setRecentList((previous) => {
            const seen = new Set(previous.map((item) => item.agentId));
            return [
              ...previous,
              ...data.filter((item) => !seen.has(item.agentId)),
            ];
          });
        }
        recentPageRef.current = pageIndex;
        hasNextPage = data.length > 0;
        setRecentHasMore(hasNextPage);
      } finally {
        recentLoadingRef.current = false;
        if (!options?.silent) setLoading(false);
      }

      scheduleRecentAutoLoad(hasNextPage);
    },
    [recentHasMore, recentSearchKeyword, scheduleRecentAutoLoad],
  );

  useEffect(() => {
    loadRecentListRef.current = loadRecentList;
  }, [loadRecentList]);

  useEffect(
    () => () => {
      if (recentAutoLoadFrameRef.current !== null) {
        window.cancelAnimationFrame(recentAutoLoadFrameRef.current);
      }
    },
    [],
  );

  const recentConversationList = useMemo(
    () => recentList.flatMap((item) => item.conversationList ?? []),
    [recentList],
  );

  const handleRecentChatFinished = useCallback(() => {
    loadRecentListRef.current(true, { silent: true });
  }, []);

  useChatFinishedWhenListExecuting({
    conversationList: recentConversationList,
    onChatFinished: handleRecentChatFinished,
  });

  const stateRef = useRef({
    activeTab,
    localList,
    hasMore,
    keyword,
    searchKeyword,
    recentList,
    recentHasMore,
    recentKeyword,
    recentSearchKeyword,
  });
  stateRef.current = {
    activeTab,
    localList,
    hasMore,
    keyword,
    searchKeyword,
    recentList,
    recentHasMore,
    recentKeyword,
    recentSearchKeyword,
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (activeTab === 'recent') {
        loadRecentList(true, {
          silent: componentCache.recentList !== null,
        });
      } else {
        loadList(true, { silent: componentCache.list !== null });
      }
      if (componentCache.list || componentCache.recentList) {
        setTimeout(() => {
          if (scrollContainerRef.current && componentCache.scrollTop) {
            scrollContainerRef.current.scrollTop = componentCache.scrollTop;
          }
        }, 0);
      }
    }

    return () => {
      componentCache.list = stateRef.current.localList;
      componentCache.activeTab = stateRef.current.activeTab;
      componentCache.hasMore = stateRef.current.hasMore;
      componentCache.keyword = stateRef.current.keyword;
      componentCache.searchKeyword = stateRef.current.searchKeyword;
      componentCache.recentList = stateRef.current.recentList;
      componentCache.recentHasMore = stateRef.current.recentHasMore;
      componentCache.recentKeyword = stateRef.current.recentKeyword;
      componentCache.recentSearchKeyword = stateRef.current.recentSearchKeyword;
      componentCache.recentPage = recentPageRef.current;
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
    const isHomepageMenuClick =
      (location.state as { menuCode?: string } | null)?.menuCode === 'homepage';
    const refreshActiveTab = () => {
      if (stateRef.current.activeTab === 'recent') {
        loadRecentListRef.current(true, { silent: true });
      } else {
        loadListRef.current(true, { silent: true });
      }
    };

    if (isHomepageMenuClick || location.pathname === '/home') {
      // 点击主页菜单时，即使路径没有变化，也按当前 Tab 静默更新并回到顶部
      refreshActiveTab();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else if (isHomeRoute && !wasHomeRoute) {
      // 从其他页面（如 /space）切回到 /home/chat 页面，即使组件未销毁也应当静默更新一次
      refreshActiveTab();
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
      agentId,
      topic,
    }: {
      conversationId: number | string;
      taskStatus: TaskStatus;
      agentId?: number | string;
      topic?: string;
    }) => {
      setLocalList((prev) =>
        prev.map((item) =>
          item.id?.toString() === conversationId.toString()
            ? { ...item, taskStatus }
            : item,
        ),
      );

      const targetAgentId = agentId ?? currentAgentIdRef.current;
      setRecentList((prev) =>
        prev.map((item) => {
          const conversationList = item.conversationList ?? [];
          const hasConversation = conversationList.some(
            (conversation) =>
              conversation.id?.toString() === conversationId.toString(),
          );

          if (hasConversation) {
            return {
              ...item,
              conversationList: conversationList.map((conversation) =>
                conversation.id?.toString() === conversationId.toString()
                  ? {
                      ...conversation,
                      taskStatus,
                      ...(topic ? { topic } : {}),
                    }
                  : conversation,
              ),
            };
          }

          if (
            taskStatus === TaskStatus.EXECUTING &&
            targetAgentId !== undefined &&
            item.agentId.toString() === targetAgentId.toString()
          ) {
            return {
              ...item,
              conversationList: [
                ...conversationList,
                { id: conversationId, topic, taskStatus },
              ],
            };
          }

          return item;
        }),
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

  const isFirstRecentSearchKeywordEffect = useRef(true);
  useEffect(() => {
    if (isFirstRecentSearchKeywordEffect.current) {
      isFirstRecentSearchKeywordEffect.current = false;
      return;
    }
    setRecentHasMore(true);
    setRecentList([]);
    recentPageRef.current = 1;
    loadRecentList(true);
  }, [recentSearchKeyword]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentHasMore =
        activeTab === 'conversation' ? hasMore : recentHasMore;
      if (loading || !currentHasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        if (activeTab === 'conversation') {
          loadList();
        } else {
          loadRecentList();
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeTab, loading, hasMore, recentHasMore, loadList, loadRecentList]);

  const { run: debouncedSearch, cancel: cancelDebouncedSearch } = useDebounceFn(
    (val: string, tab: HomeTab) => {
      if (tab === 'conversation') {
        setSearchKeyword(val);
      } else {
        setRecentSearchKeyword(val);
      }
    },
    { wait: 500 },
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (activeTab === 'conversation') {
      setKeyword(val);
    } else {
      setRecentKeyword(val);
    }
    debouncedSearch(val, activeTab);
  };

  const handleSearchSubmit = () => {
    cancelDebouncedSearch();
    if (activeTab === 'conversation') {
      if (keyword === searchKeyword) {
        loadListRef.current(true);
      } else {
        setSearchKeyword(keyword);
      }
    } else if (recentKeyword === recentSearchKeyword) {
      loadRecentListRef.current(true);
    } else {
      setRecentSearchKeyword(recentKeyword);
    }
  };

  const handleTabChange = (tab: HomeTab) => {
    cancelDebouncedSearch();
    setActiveTab(tab);
    componentCache.activeTab = tab;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    if (tab === 'recent') {
      setRecentKeyword('');
      setRecentSearchKeyword('');
      componentCache.recentKeyword = '';
      componentCache.recentSearchKeyword = '';
      loadRecentListRef.current(true, { keyword: '' });
    } else {
      setKeyword('');
      setSearchKeyword('');
      componentCache.keyword = '';
      componentCache.searchKeyword = '';
      loadListRef.current(true, { topic: '' });
    }
  };

  const handleConversationClick = (item: ConversationInfo) => {
    handleCloseMobileMenu();
    const { id, agentId, devTargetType, devTargetId, devSpaceId } = item;

    if (devTargetType === 'Agent' && devSpaceId && id) {
      history.push(
        `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`,
      );
    } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
      jumpTo(`/space/${devSpaceId}/app-dev/${devTargetId}`);
    } else {
      history.push('/home/chat/' + id + '/' + agentId);
    }
  };

  const handleRecentAgentClick = (item: AgentInfo) => {
    handleCloseMobileMenu();
    if (item.lastConversationId) {
      history.push(`/home/chat/${item.lastConversationId}/${item.agentId}`);
      return;
    }
    jumpTo(`/agent/${item.agentId}`);
  };

  const handleNewConversation = () => {
    handleCloseMobileMenu();
    history.push('/home');
  };

  const showNewChatButton = firstLevelMenus?.some(
    (menu: any) => menu?.code === 'new_conversation',
  );

  // const noMoreText = dict('PC.Components.HistoryConversationList.noMore');

  return (
    <div style={style} className={cx(styles['new-home-section'])}>
      <SearchHeader
        keyword={activeTab === 'conversation' ? keyword : recentKeyword}
        placeholder={dict(
          'PC.Layouts.DynamicMenusLayout.NewHomeSection.searchPlaceholder',
        )}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onNewChat={handleNewConversation}
        showNewChatButton={showNewChatButton}
      />

      <div className={cx(styles.tabs)}>
        <button
          type="button"
          className={cx(styles.tab, {
            [styles.active]: activeTab === 'recent',
          })}
          onClick={() => handleTabChange('recent')}
        >
          {dict('PC.Layouts.DynamicMenusLayout.HomeSection.recentlyUsed')}
        </button>
        <button
          type="button"
          className={cx(styles.tab, {
            [styles.active]: activeTab === 'conversation',
          })}
          onClick={() => handleTabChange('conversation')}
        >
          {dict(
            'PC.Layouts.DynamicMenusLayout.HomeSection.conversationHistory',
          )}
        </button>
      </div>

      {/* 会话记录列表 */}
      <div
        ref={scrollContainerRef}
        className={cx(styles['conversation-list-wrapper'])}
      >
        {!loading &&
          (activeTab === 'conversation' ? localList : recentList).length ===
            0 && (
            <EmptyState
              keyword={activeTab === 'conversation' ? keyword : recentKeyword}
              type={activeTab}
            />
          )}

        <div ref={listInnerRef} className={cx(styles['conversation-list'])}>
          {activeTab === 'conversation'
            ? localList.map((item) => (
                <ConversationItem
                  key={item.id}
                  item={item}
                  isActive={chatId === item.id?.toString()}
                  onClick={() => handleConversationClick(item)}
                />
              ))
            : recentList.map((item) => (
                <RecentAgentItem
                  key={item.id}
                  item={item}
                  isActive={currentAgentId === item.agentId?.toString()}
                  onClick={() => handleRecentAgentClick(item)}
                  onConversationClick={(conversationId) => {
                    handleCloseMobileMenu();
                    history.push(
                      `/home/chat/${conversationId}/${item.agentId}`,
                    );
                  }}
                />
              ))}

          {loading && (
            <div className={cx(styles['load-more'])}>
              <Spin size="small" />
            </div>
          )}
          {/* {!loading && !hasMore && localList.length > 0 && (
            <div className={cx(styles['no-more'])}>
              <Typography.Text type="secondary">{noMoreText}</Typography.Text>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default NewHomeSection;
