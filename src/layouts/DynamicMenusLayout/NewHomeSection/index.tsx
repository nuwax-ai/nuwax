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
import ProjectPanel, { ProjectPanelHandle } from './components/ProjectPanel';
import SearchHeader from './components/SearchHeader';

import {
  CONVERSATION_FLAGS_EVENT,
  loadConversationFlags,
} from '@/components/business-component/ConversationContextMenu/conversationLocalFlags';
import { EVENT_TYPE } from '@/constants/event.constants';
import { useChatFinishedWhenListExecuting } from '@/hooks/useChatFinishedWhenListExecuting';
import useScrollbarScrollShow from '@/hooks/useScrollbarScrollShow';
import { apiAgentConversationList } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import styles from './index.less';

const cx = classNames.bind(styles);

const ITEM_HEIGHT = 58; // 列表项重构后高度增加
const ACTIVE_TAB_STORAGE_KEY = 'PC_HOME_SECTION_ACTIVE_TAB';

type HomeTab = 'conversation' | 'project';

const getInitialActiveTab = (): HomeTab => {
  if (typeof window === 'undefined') return 'conversation';
  const storedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  return storedTab === 'conversation' || storedTab === 'project'
    ? storedTab
    : 'conversation';
};

const componentCache = {
  activeTab: 'conversation' as HomeTab,
  list: null as ConversationInfo[] | null,
  hasMore: true,
  keyword: '',
  searchKeyword: '',
  scrollTop: 0,
};

/** 经典布局 tab 指示条位次：CSS 侧以 data-active 驱动滑动（原型同款动效的 CSS-only 等价实现） */
const HOME_TAB_INDEX: Record<HomeTab, number> = {
  conversation: 0,
  project: 1,
};

const NewHomeSection: React.FC<{
  style?: React.CSSProperties;
  /** 经典布局（style1/2）：渲染顶部搜索框 + 新建会话入口 + 任务/项目 tab 切换；
   * 单栏（style3）不传：SidebarNavHeader 提供头部，列表区为「项目/任务」双分组折叠形态（原型同款） */
  showSearchHeader?: boolean;
}> = ({ style, showSearchHeader = false }) => {
  const isSidebarNavMode = !showSearchHeader;
  const projectPanelRef = useRef<ProjectPanelHandle>(null);

  const { id: chatIdParam } = useParams();
  const location = useLocation();
  const chatId =
    chatIdParam || location.pathname.match(/\/home\/chat\/([^/]+)/)?.[1];

  const { handleCloseMobileMenu } = useModel('layout');
  const { firstLevelMenus } = useModel('menuModel');

  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    const initialTab = getInitialActiveTab();
    componentCache.activeTab = initialTab;
    return initialTab;
  });
  const [localList, setLocalList] = useState<ConversationInfo[]>(
    componentCache.list || [],
  );
  // 空态仅在接口返回后展示：无缓存数据时初始即为加载中，避免首帧闪「暂无会话」
  const [loading, setLoading] = useState(
    () => !(componentCache.list && componentCache.list.length > 0),
  );
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
  const [hasMore, setHasMore] = useState(
    componentCache.list ? componentCache.hasMore : true,
  );
  const [keyword, setKeyword] = useState(componentCache.keyword);
  const [searchKeyword, setSearchKeyword] = useState(
    componentCache.searchKeyword,
  );
  // 单栏分组折叠态（原型：点击分组头折叠/展开对应列表，不做持久化）
  const [projectCollapsed, setProjectCollapsed] = useState(false);
  const [taskCollapsed, setTaskCollapsed] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 滚动条仅滚动时显示：data-is-scrolling 属性由该 hook 维护，mirrorRef 同步既有触底加载逻辑
  const scrollShowRef = useScrollbarScrollShow(1000, scrollContainerRef);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const pageSizeRef = useRef(30);
  const loadingRef = useRef(false);

  const calcPageSize = useCallback(() => {
    const height = scrollContainerRef.current?.clientHeight ?? 0;
    if (!height) return 30;
    const count = Math.ceil(height / (isSidebarNavMode ? 36 : ITEM_HEIGHT));
    return Math.max(count, 10);
  }, [isSidebarNavMode]);

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

  // 任务列表：默认隐藏归档项、置顶项排前（稳定排序保持原相对顺序）；
  // 「已归档」视图只看归档项
  const visibleConversationList = useMemo(() => {
    const archivedSet = new Set(conversationFlags.archived);
    const filtered = showArchived
      ? localList.filter((item) => archivedSet.has(Number(item.id)))
      : localList.filter((item) => !archivedSet.has(Number(item.id)));
    if (showArchived) return filtered;
    const pinnedSet = new Set(conversationFlags.pinned);
    return [...filtered].sort(
      (a, b) =>
        Number(pinnedSet.has(Number(b.id))) -
        Number(pinnedSet.has(Number(a.id))),
    );
  }, [localList, conversationFlags, showArchived]);

  const archivedCount = useMemo(
    () =>
      localList.filter((item) =>
        conversationFlags.archived.includes(Number(item.id)),
      ).length,
    [localList, conversationFlags],
  );

  const stateRef = useRef({
    activeTab,
    localList,
    hasMore,
    keyword,
    searchKeyword,
  });
  stateRef.current = {
    activeTab,
    localList,
    hasMore,
    keyword,
    searchKeyword,
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // 单栏双分组常驻任务列表；经典布局停留在项目 tab 时延后到切换加载
      // silent 与初始 loading 严格互补：有缓存数据才静默刷新，否则走非静默让 loading 正常收敛
      if (isSidebarNavMode || activeTab === 'conversation') {
        loadList(true, { silent: !!componentCache.list?.length });
      }
      if (componentCache.list) {
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

    if (isHomepageMenuClick || location.pathname === '/home') {
      // 点击主页菜单时，即使路径没有变化，也按当前视图静默更新并回到顶部
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
        id: number | string;
        topic?: string;
        icon?: string;
      }>;
      if (!customEvent.detail) return;
      const { id, topic, icon } = customEvent.detail;
      const targetId = String(id);

      // 同步「任务」列表中的名称/图标（本地补丁是最快路径）
      setLocalList((prev) =>
        prev.map((item) => {
          if (String(item.id) === targetId) {
            return {
              ...item,
              ...(topic !== undefined ? { topic } : {}),
              ...(icon !== undefined ? { icon } : {}),
            };
          }
          return item;
        }),
      );

      // 补一次静默重新查询与后端对齐：本地补丁是最快路径，但列表未加载、
      // id 未命中或组件刚挂载等场景下补丁会落空，重新查询可确保接口
      // 返回的最新 topic/icon 真正应用到列表
      loadListRef.current(true, { silent: true });
    };

    const handleConversationDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: number }>;
      if (!customEvent.detail) return;
      const { id } = customEvent.detail;
      setLocalList((prev) => prev.filter((item) => item.id !== id));
    };

    const handleRefreshConversationList = () => {
      // 会话结束（SSE 关闭）/主题更新时：静默刷新任务列表
      loadListRef.current(true, { silent: true });
    };

    const handleUpdateConversationListTaskStatus = ({
      conversationId,
      taskStatus,
    }: {
      conversationId: number | string;
      taskStatus: TaskStatus;
    }) => {
      const targetConversationId = String(conversationId);

      // 「任务」列表本地补丁。轮询补偿会周期性补发终态事件，命中条目无实际变化时
      // 返回原引用，避免列表每 5s 无谓重渲染。
      setLocalList((prev) => {
        const targetIndex = prev.findIndex(
          (item) => item.id?.toString() === targetConversationId,
        );
        if (targetIndex < 0 || prev[targetIndex].taskStatus === taskStatus) {
          return prev;
        }
        const next = [...prev];
        next[targetIndex] = { ...next[targetIndex], taskStatus };
        return next;
      });
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

  // 任务列表是否在滚动视口内（触底加载分页仅在其可见时生效）
  const taskListVisible = isSidebarNavMode
    ? !taskCollapsed
    : activeTab === 'conversation';

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loading || !hasMore || !taskListVisible) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        loadList();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [taskListVisible, loading, hasMore, loadList]);

  const { run: debouncedSearch, cancel: cancelDebouncedSearch } = useDebounceFn(
    (val: string) => {
      setSearchKeyword(val);
    },
    { wait: 500 },
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 项目 tab 数据接口未就绪，搜索不生效（维持改版前行为）
    if (activeTab === 'project') return;
    const val = e.target.value;
    setKeyword(val);
    debouncedSearch(val);
  };

  const handleSearchSubmit = () => {
    if (activeTab === 'project') return;
    cancelDebouncedSearch();
    if (keyword === searchKeyword) {
      loadListRef.current(true);
    } else {
      setSearchKeyword(keyword);
    }
  };

  const handleTabChange = (tab: HomeTab) => {
    cancelDebouncedSearch();
    setActiveTab(tab);
    componentCache.activeTab = tab;
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    if (tab === 'project') {
      // 项目数据接口后端尚未提供,暂无数据加载
      return;
    }
    setKeyword('');
    setSearchKeyword('');
    componentCache.keyword = '';
    componentCache.searchKeyword = '';
    loadListRef.current(true, { topic: '' });
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
    } else if (devTargetType === 'UserApp' && devSpaceId && devTargetId) {
      // 全栈应用会话：跳全栈应用开发详情页，conversationId 用于恢复该会话
      jumpTo(
        `/space/${devSpaceId}/app-pro?appId=${devTargetId}&conversationId=${id}`,
      );
    } else {
      history.push('/home/chat/' + id + '/' + agentId);
    }
  };

  const handleNewConversation = () => {
    handleCloseMobileMenu();
    history.push('/home');
  };

  // 经典布局：新建会话入口在搜索栏右侧（单栏在侧栏顶部操作区 SidebarNavHeader）
  const showNewChatButton = firstLevelMenus?.some(
    (menu: any) => menu?.code === 'new_conversation',
  );

  // 分组头计数：任务 = 当前展示列表数（含归档过滤）；项目 = 可见项目数（ProjectPanel 上报，
  // 过滤归档后的可见数，与任务计数口径一致；真实接口数据到达前先计 0）
  const taskCount = visibleConversationList.length;
  const [projectCount, setProjectCount] = useState(0);
  const handleProjectCountChange = useCallback(
    (count: number) => setProjectCount(count),
    [],
  );

  // 单栏分组头（原型 .tabs/.tab）：12.5px 文案 + 12px chevron，折叠时箭头转 -90°
  const renderSectionHeader = (options: {
    label: string;
    count: number;
    collapsed: boolean;
    task?: boolean;
    onToggle: () => void;
  }) => (
    <div
      className={cx(styles['section-tabs'], {
        [styles['task-section-tabs']]: options.task,
        [styles['section-tabs-collapsed']]: options.collapsed,
      })}
      onClick={options.onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          options.onToggle();
        }
      }}
      aria-expanded={!options.collapsed}
    >
      <span className={cx(styles['section-tab-text'])}>
        {`${options.label} (${options.count})`}
      </span>
      <span className={cx(styles['section-tab-chev'])} aria-hidden>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
      {!options.task && (
        <button
          type="button"
          className={styles['section-tool']}
          title={dict(
            'PC.Layouts.DynamicMenusLayout.NewHomeSection.toggleAllProjects',
          )}
          aria-label={dict(
            'PC.Layouts.DynamicMenusLayout.NewHomeSection.toggleAllProjects',
          )}
          disabled={projectCount === 0}
          onClick={(event) => {
            event.stopPropagation();
            setProjectCollapsed(false);
            projectPanelRef.current?.toggleAll();
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </button>
      )}
    </div>
  );

  // 任务列表块：经典 tab 与单栏分组共用（空态 + 会话项 + 加载更多 + 已归档入口）
  const renderTaskList = (
    <>
      {!loading && visibleConversationList.length === 0 && (
        <EmptyState keyword={keyword} />
      )}

      <div ref={listInnerRef} className={cx(styles['conversation-list'])}>
        {visibleConversationList.map((item) => (
          <ConversationItem
            key={item.id}
            compact={isSidebarNavMode}
            item={item}
            isActive={chatId === item.id?.toString()}
            onClick={() => handleConversationClick(item)}
            pinned={conversationFlags.pinned.includes(Number(item.id))}
            collected={conversationFlags.collected.includes(Number(item.id))}
            archived={conversationFlags.archived.includes(Number(item.id))}
          />
        ))}

        {loading && (
          <div className={cx(styles['load-more'])}>
            <Spin size="small" />
          </div>
        )}

        {/* 已归档入口:存在归档项或处于已归档视图时显示(本地标记过渡方案) */}
        {!loading && (archivedCount > 0 || showArchived) && (
          <div
            className={cx(styles['archived-entry'])}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived
              ? dict(
                  'PC.Layouts.DynamicMenusLayout.NewHomeSection.backToConversations',
                )
              : `${dict(
                  'PC.Layouts.DynamicMenusLayout.NewHomeSection.archivedConversations',
                )} (${archivedCount})`}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={style} className={cx(styles['new-home-section'])}>
      {showSearchHeader && (
        <SearchHeader
          keyword={keyword}
          placeholder={dict(
            'PC.Layouts.DynamicMenusLayout.NewHomeSection.searchPlaceholder',
          )}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onNewChat={handleNewConversation}
          showNewChatButton={showNewChatButton}
        />
      )}

      {isSidebarNavMode ? (
        <>
          {/* 项目分组头：固定于滚动区上方（原型 panel-header 内 .tabs 位） */}
          {renderSectionHeader({
            label: dict('PC.Layouts.DynamicMenusLayout.HomeSection.projectTab'),
            count: projectCount,
            collapsed: projectCollapsed,
            onToggle: () => setProjectCollapsed((prev) => !prev),
          })}

          {/* 滚动区：项目列表 + 任务分组头 + 任务列表（原型 scroll-area 同构） */}
          <div
            ref={scrollShowRef}
            className={cx(styles['conversation-list-wrapper'])}
          >
            <div
              className={cx(styles['project-list-section'])}
              hidden={projectCollapsed}
            >
              <ProjectPanel
                ref={projectPanelRef}
                compact
                onVisibleCountChange={handleProjectCountChange}
                onConversationClick={handleConversationClick}
              />
            </div>

            {renderSectionHeader({
              label: dict(
                'PC.Layouts.DynamicMenusLayout.NewHomeSection.tabTask',
              ),
              count: taskCount,
              collapsed: taskCollapsed,
              task: true,
              onToggle: () => setTaskCollapsed((prev) => !prev),
            })}

            {!taskCollapsed && renderTaskList}
          </div>
        </>
      ) : (
        <>
          {/* 经典布局：任务/项目 tab 切换（维持改版前形态，指示条随位次滑动） */}
          <div
            className={cx(styles.tabs, styles['tabs-under-search'])}
            data-active={HOME_TAB_INDEX[activeTab] ?? 0}
          >
            <button
              type="button"
              className={cx(styles.tab, {
                [styles.active]: activeTab === 'conversation',
              })}
              onClick={() => handleTabChange('conversation')}
            >
              {dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.tabTask')}
            </button>
            <button
              type="button"
              className={cx(styles.tab, {
                [styles.active]: activeTab === 'project',
              })}
              onClick={() => handleTabChange('project')}
            >
              {dict('PC.Layouts.DynamicMenusLayout.HomeSection.projectTab')}
            </button>
            {/* 滑动指示条：位次由容器 data-active 控制（原型 tab-indicator 的 CSS-only 等价） */}
            <span className={cx(styles['tab-indicator'])} aria-hidden />
          </div>

          <div
            ref={scrollShowRef}
            className={cx(styles['conversation-list-wrapper'])}
          >
            {activeTab === 'project' ? (
              <ProjectPanel
                onVisibleCountChange={handleProjectCountChange}
                onConversationClick={handleConversationClick}
              />
            ) : (
              renderTaskList
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NewHomeSection;
