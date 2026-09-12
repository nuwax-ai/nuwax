/**
 * NewHomeSection 数据壳 hook（2026-09-12 单栏/经典双形态拆分）。
 *
 * 收敛「首页侧栏会话域」的全链路数据层：列表拉取分页/关键词搜索/标记本地覆盖/
 * 事件总线监听/路由回流静默刷新/选中关系接线（chatId 派生、项目分组反查上报、
 * 计数上报）。表现层（单栏双分组 SidebarNavHomeSection / 经典 tab
 * ClassicHomeSection）只消费本 hook 返回值，不再直接触数据。
 *
 * 两形态互斥挂载（DynamicMenusLayout 按导航风格单挂其一），componentCache 为
 * 模块级共享、跨挂载保留列表/关键词/滚动位置。初始加载契约：单栏由本 hook 挂载
 * 时自动发；经典形态按初始 tab 决定，由视图挂载时调 initialLoad()。
 */
import { EVENT_TYPE } from '@/constants/event.constants';
import { useChatFinishedWhenListExecuting } from '@/hooks/useChatFinishedWhenListExecuting';
import useScrollbarScrollShow from '@/hooks/useScrollbarScrollShow';
import { apiAgentConversationList } from '@/services/agentConfig';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  applyConversationFlagOverrides,
  ConversationFlagOverride,
  recordConversationFlagOverride,
} from '@/utils/conversationFlagOverrides';
import eventBus from '@/utils/eventBus';
import { jumpTo } from '@/utils/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import { extractConversationIdFromPath } from '../sidebarSelectionPolicy';

/** 经典形态列表项高度（单栏紧凑行 36px），calcPageSize 估算首页条数用 */
const ITEM_HEIGHT = 58;
const COMPACT_ITEM_HEIGHT = 36;

const componentCache = {
  list: null as ConversationInfo[] | null,
  hasMore: true,
  keyword: '',
  searchKeyword: '',
  scrollTop: 0,
};

/** 数据壳对外契约（两形态视图的完整数据面） */
export interface HomeSectionDataShell {
  /** 滚动容器 ref（scrollShowRef 的 mirror；calcPageSize/滚动恢复/触底判定用） */
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  /** 滚动条仅滚动时显示：挂到各形态滚动容器 DOM（data-is-scrolling 由 hook 维护） */
  scrollShowRef: (node: HTMLDivElement | null) => void;
  /** 当前路由会话 id（会话详情路径派生，选中关系接线） */
  chatId: string | undefined;
  /** 任务列表：隐藏归档、置顶排前 */
  visibleConversationList: ConversationInfo[];
  loading: boolean;
  hasMore: boolean;
  keyword: string;
  searchKeyword: string;
  setKeyword: (value: string) => void;
  setSearchKeyword: (value: string) => void;
  /** 稳定刷新入口（触底加载 append：refreshList()；整体替换：refreshList(true)） */
  refreshList: (
    isRefresh?: boolean,
    options?: { silent?: boolean; topic?: string },
  ) => void;
  /** 挂载期初始加载（silent 与初始 loading 严格互补：有缓存数据才静默） */
  initialLoad: () => void;
  /** 清空关键词并按空关键词刷新（经典视图切回任务 tab 用） */
  resetSearchAndRefresh: () => void;
  handleConversationClick: (item: ConversationInfo) => void;
  handleConversationFlagChanged: (
    conversationId: number,
    kind: 'pinned' | 'archived',
    enabled: boolean,
  ) => void;
  /** 项目分组可见数（分组头计数用） */
  projectCount: number;
  handleProjectCountChange: (count: number) => void;
  /** 当前会话命中项目子会话 id（未命中 null）：任务列表选中互斥用 */
  activeProjectChildId: string | null;
  setActiveProjectChildId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useHomeSectionData(options: {
  isSidebarNavMode: boolean;
}): HomeSectionDataShell {
  const { isSidebarNavMode } = options;

  const { id: chatIdParam } = useParams();
  const location = useLocation();
  // 当前路由会话 id：会话详情路径识别与提取收敛在侧栏选中策略单源
  const chatId =
    chatIdParam ??
    extractConversationIdFromPath(location.pathname) ??
    undefined;

  const { handleCloseMobileMenu } = useModel('layout');

  const [localList, setLocalList] = useState<ConversationInfo[]>(
    componentCache.list || [],
  );
  // 空态仅在接口返回后展示：无缓存数据时初始即为加载中，避免首帧闪「暂无会话」
  const [loading, setLoading] = useState(
    () => !(componentCache.list && componentCache.list.length > 0),
  );
  const [hasMore, setHasMore] = useState(
    componentCache.list ? componentCache.hasMore : true,
  );
  const [keyword, setKeyword] = useState(componentCache.keyword);
  const [searchKeyword, setSearchKeyword] = useState(
    componentCache.searchKeyword,
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollShowRef = useScrollbarScrollShow(1000, scrollContainerRef);
  const initializedRef = useRef(false);
  const pageSizeRef = useRef(30);
  const loadingRef = useRef(false);
  // 标记（置顶/归档）本地覆盖：防止静默刷新的滞后回包把刚归档的会话复活回列表
  const flagOverridesRef = useRef(new Map<string, ConversationFlagOverride>());

  const calcPageSize = useCallback(() => {
    const height = scrollContainerRef.current?.clientHeight ?? 0;
    if (!height) return 30;
    const itemHeight = isSidebarNavMode ? COMPACT_ITEM_HEIGHT : ITEM_HEIGHT;
    const count = Math.ceil(height / itemHeight);
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
          // 归档会话不在侧栏展示（查看入口在历史会话页）：走服务层缺省排除归档
          // （新旧两版服务层缺省语义一致；显式传归档参数会耦合未落地的参数类型）
          lastId,
          limit: pageSize,
          topic: topic || undefined,
        });

        // 回包落地前重放本地标记覆盖：列表读接口可能滞后于标记接口，
        // 整体替换会短暂复活刚归档/置顶的会话（TTL 内本地写优先）
        const data = applyConversationFlagOverrides(
          res.data ?? [],
          flagOverridesRef.current,
        );
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

  /** 稳定刷新入口：事件回调/跨层消费者不捕获闭包轮换的 loadList */
  const refreshList = useCallback<HomeSectionDataShell['refreshList']>(
    (isRefresh?, options?) => {
      loadListRef.current(isRefresh, options);
    },
    [],
  );

  const initialLoad = useCallback(() => {
    loadListRef.current(true, { silent: !!componentCache.list?.length });
  }, []);

  const resetSearchAndRefresh = useCallback(() => {
    setKeyword('');
    setSearchKeyword('');
    componentCache.keyword = '';
    componentCache.searchKeyword = '';
    loadListRef.current(true, { topic: '' });
  }, []);

  const handleConversationChatFinished = useCallback(() => {
    loadListRef.current(true, { silent: true });
  }, []);

  useChatFinishedWhenListExecuting({
    conversationList: localList,
    onChatFinished: handleConversationChatFinished,
  });

  // 任务列表：消费后端 pinned，隐藏归档项（侧栏不设归档查看入口）、置顶项排前
  const visibleConversationList = useMemo(() => {
    const nonArchived = localList.filter((item) => item.archived !== true);
    return [...nonArchived].sort(
      (a, b) => Number(b.pinned === true) - Number(a.pinned === true),
    );
  }, [localList]);

  const handleConversationFlagChanged = useCallback(
    (conversationId: number, kind: 'pinned' | 'archived', enabled: boolean) => {
      recordConversationFlagOverride(
        flagOverridesRef.current,
        conversationId,
        kind,
        enabled,
      );
      setLocalList((prev) =>
        prev.map((item) =>
          item.id === conversationId ? { ...item, [kind]: enabled } : item,
        ),
      );
    },
    [],
  );

  const stateRef = useRef({
    localList,
    hasMore,
    keyword,
    searchKeyword,
  });
  stateRef.current = {
    localList,
    hasMore,
    keyword,
    searchKeyword,
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // 单栏双分组常驻任务列表恒发初始加载；经典形态由视图按初始 tab 决定
      // silent 与初始 loading 严格互补：有缓存数据才静默刷新，否则走非静默让 loading 正常收敛
      if (isSidebarNavMode) {
        initialLoad();
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
      componentCache.hasMore = stateRef.current.hasMore;
      componentCache.keyword = stateRef.current.keyword;
      componentCache.searchKeyword = stateRef.current.searchKeyword;
      if (scrollContainerRef.current) {
        componentCache.scrollTop = scrollContainerRef.current.scrollTop;
      }
    };
  }, [isSidebarNavMode, initialLoad]);

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

  const handleConversationClick = useCallback(
    (item: ConversationInfo) => {
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
    },
    [handleCloseMobileMenu],
  );

  // 分组头计数：项目 = 可见项目数（ProjectPanel 上报，过滤归档后的可见数，
  // 与任务计数口径一致；真实接口数据到达前先计 0）
  const [projectCount, setProjectCount] = useState(0);
  const handleProjectCountChange = useCallback(
    (count: number) => setProjectCount(count),
    [],
  );

  // 当前会话命中项目子会话的 id（ProjectPanel 按路由反查后上报）：任务列表据此
  // 互斥去高亮——属于项目的会话选中只落项目分组一处，独立任务仍在任务列表高亮
  const [activeProjectChildId, setActiveProjectChildId] = useState<
    string | null
  >(null);

  return {
    scrollContainerRef,
    scrollShowRef,
    chatId,
    visibleConversationList,
    loading,
    hasMore,
    keyword,
    searchKeyword,
    setKeyword,
    setSearchKeyword,
    refreshList,
    initialLoad,
    resetSearchAndRefresh,
    handleConversationClick,
    handleConversationFlagChanged,
    projectCount,
    handleProjectCountChange,
    activeProjectChildId,
    setActiveProjectChildId,
  };
}
