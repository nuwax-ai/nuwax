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
import { useConversationChanged } from '@/hooks/useDirectorySync';
import useScrollbarScrollShow from '@/hooks/useScrollbarScrollShow';
import { apiAgentConversationList } from '@/services/agentConfig';
import type { ConversationChangedEvent } from '@/types/directorySync';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  buildAppProRoute,
  removeAppProConversationFromLocation,
} from '@/utils/appProRoute';
import {
  applyConversationFlagOverrides,
  ConversationFlagOverride,
  recordConversationFlagOverride,
} from '@/utils/conversationFlagOverrides';
import {
  emitConversationListTaskStatus,
  fetchConversationTaskStatus,
  hasExecutingTaskInList,
  isTerminalTaskStatus,
} from '@/utils/conversationTaskStatusSync';
import { applyConversationChangedToList } from '@/utils/directorySyncEvents';
import eventBus from '@/utils/eventBus';
import { jumpTo } from '@/utils/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useParams } from 'umi';
import { extractConversationIdFromPath } from '../sidebarSelectionPolicy';
import {
  markConversationFinished,
  markConversationVisited,
  setActiveConversation,
} from './finishedConversationUnread';

/** 经典形态列表项高度（单栏紧凑行 36px），calcPageSize 估算首页条数用 */
const ITEM_HEIGHT = 58;
const COMPACT_ITEM_HEIGHT = 36;
const RECENT_EVENT_TTL_MS = 60_000;

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
  /**
   * 任务列表中是否存在执行中会话（页签切回「活动门控」前置判定用）。
   * 全量 localList 口径，不受关键词过滤影响。
   */
  hasExecutingTask: boolean;
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
  /** 收藏标记成功后同步本地列表（collect/unCollect 双路径接口，2026-09-13） */
  handleConversationCollectedChanged: (
    conversationId: number,
    collected: boolean,
  ) => void;
  /** 项目分组可见数（分组头计数用） */
  projectCount: number;
  handleProjectCountChange: (count: number) => void;
  /** 当前会话命中项目子会话 id（未命中 null）：任务列表选中互斥用 */
  activeProjectChildId: string | null;
  setActiveProjectChildId: React.Dispatch<React.SetStateAction<string | null>>;
  /** 当前路由会话在项目/任务列表命中行（单栏导航菜单高亮据此让位） */
  conversationRowActive: boolean;
}

export function useHomeSectionData(options: {
  isSidebarNavMode: boolean;
}): HomeSectionDataShell {
  const { isSidebarNavMode } = options;

  const { id: chatIdParam } = useParams();
  const location = useLocation();
  // 当前路由会话 id：会话详情路径识别与提取收敛在侧栏选中策略单源
  // （含 /space/:spaceId/app-pro/:appId/:conversationId 全栈 IDE 会话面板，项目子会话点击即跳该路由）
  const chatId =
    chatIdParam ??
    extractConversationIdFromPath(location.pathname, location.search) ??
    undefined;

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
  const pendingRefreshRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryEpochRef = useRef(0);
  const recentEventsRef = useRef<
    Array<{ event: ConversationChangedEvent; at: number }>
  >([]);
  const searchKeywordRef = useRef(searchKeyword);
  searchKeywordRef.current = searchKeyword;
  // 标记（置顶/归档）本地覆盖：防止静默刷新的滞后回包把刚归档的会话复活回列表
  const flagOverridesRef = useRef(new Map<string, ConversationFlagOverride>());

  const calcPageSize = useCallback(() => {
    const height = scrollContainerRef.current?.clientHeight ?? 0;
    if (!height) return 30;
    const itemHeight = isSidebarNavMode ? COMPACT_ITEM_HEIGHT : ITEM_HEIGHT;
    const count = Math.ceil(height / itemHeight);
    return Math.max(count, 10);
  }, [isSidebarNavMode]);

  // 先声明后赋值：loadList 的 finally 会经排队补发引用自身
  const loadListRef = useRef<
    (
      isRefresh?: boolean,
      options?: { silent?: boolean; topic?: string },
    ) => Promise<void>
  >(async () => {});

  const loadList = useCallback(
    async (
      isRefresh = false,
      options?: { silent?: boolean; topic?: string },
    ) => {
      if (loadingRef.current) {
        if (isRefresh) pendingRefreshRef.current = true;
        return;
      }
      if (!hasMore && !isRefresh) return;
      loadingRef.current = true;
      const requestEpoch = queryEpochRef.current;
      if (!options?.silent) {
        setLoading(true);
      }

      // 静默核对保留已翻到的任务窗口，避免回到侧栏时只剩首屏。
      const pageSize = isRefresh
        ? Math.max(
            calcPageSize(),
            options?.topic !== undefined && options.topic !== searchKeyword
              ? 0
              : localList.length,
          )
        : pageSizeRef.current;
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
          // 项目会话由侧栏「项目」分组承接（projectFilter 2026-09-14 后端上线，
          // 与历史会话页任务 tab 同口径）：任务列表排除防双显。搜索弹窗/Chat
          // devTarget 反查仍走各自全量口径，不受影响
          projectFilter: 'exclude',
        });

        // 回包落地前重放本地标记覆盖：列表读接口可能滞后于标记接口，
        // 整体替换会短暂复活刚归档/置顶的会话（TTL 内本地写优先）。
        // 边界防御：错误信封/网关异常页会让 data 呈非数组（对象、字符串等），
        // 直通 setLocalList 会致 localList.filter 崩溃并经 componentCache
        // 毒化后续挂载；此处按空列表降级
        const data = applyConversationFlagOverrides(
          Array.isArray(res?.data) ? res.data : [],
          flagOverridesRef.current,
        );
        if (requestEpoch !== queryEpochRef.current) return;
        const now = Date.now();
        recentEventsRef.current = recentEventsRef.current.filter(
          ({ at }) => now - at < RECENT_EVENT_TTL_MS,
        );
        const reconciled = recentEventsRef.current.reduce(
          (list, { event }) => applyConversationChangedToList(list, event),
          data,
        );
        if (isRefresh) {
          setLocalList(reconciled);
        } else {
          setLocalList((prev) => {
            const merged = [...prev, ...reconciled];
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
        if (pendingRefreshRef.current && refreshTimerRef.current === null) {
          pendingRefreshRef.current = false;
          refreshTimerRef.current = setTimeout(() => {
            refreshTimerRef.current = null;
            loadListRef.current(true, {
              silent: true,
              topic: searchKeywordRef.current,
            });
          }, 0);
        }
      }
    },
    [hasMore, localList, calcPageSize, searchKeyword],
  );

  useEffect(() => {
    loadListRef.current = loadList;
  }, [loadList]);

  // 会话更新（原 conversation-updated window 事件，经 directorySync 桥接进入订阅）
  // 的静默重拉做 3s 合并节流（首发立即、突发合并为末次）：智能体执行期间 SSE
  // 会高频补发该事件，且本地补丁已先行同步 topic/icon，重拉只为兜底与后端对齐；
  // 每次事件都全量重拉会让侧栏整列表重渲染，长列表下代价极高
  // （曾致滚动时 10s+ 级主线程阻塞）
  const conversationReloadAtRef = useRef(0);
  const conversationReloadTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const throttledConversationReload = useCallback(() => {
    const interval = 3000;
    const now = Date.now();
    if (now - conversationReloadAtRef.current >= interval) {
      conversationReloadAtRef.current = now;
      loadListRef.current(true, { silent: true });
      return;
    }
    if (conversationReloadTimerRef.current) return;
    conversationReloadTimerRef.current = setTimeout(() => {
      conversationReloadTimerRef.current = null;
      conversationReloadAtRef.current = Date.now();
      loadListRef.current(true, { silent: true });
    }, interval - (now - conversationReloadAtRef.current));
  }, []);

  useConversationChanged((event) => {
    const now = Date.now();
    recentEventsRef.current = recentEventsRef.current
      .filter(({ at }) => now - at < RECENT_EVENT_TTL_MS)
      .slice(-199);
    recentEventsRef.current.push({ event, at: now });
    if (event.operation === 'created') {
      if (!event.project) {
        loadListRef.current(true, { silent: true });
      }
      return;
    }

    if (event.operation === 'deleted') {
      const routeConversationId = extractConversationIdFromPath(
        location.pathname,
        location.search,
      );
      if (routeConversationId === event.conversationId) {
        if (location.pathname.startsWith('/home/chat')) {
          history.replace('/home');
        } else if (
          location.pathname === '/space' ||
          location.pathname.startsWith('/space/')
        ) {
          const withoutConversation = removeAppProConversationFromLocation(
            location.pathname,
            location.search,
          );
          if (withoutConversation.pathname !== location.pathname) {
            history.replace(
              `${withoutConversation.pathname}${withoutConversation.search}`,
            );
          } else {
            const searchParams = new URLSearchParams(location.search);
            searchParams.delete('conversationId');
            const search = searchParams.toString();
            history.replace(
              `${location.pathname}${search ? `?${search}` : ''}`,
            );
          }
        }
      }
    }
    setLocalList((previous) => applyConversationChangedToList(previous, event));
    if (
      event.operation === 'updated' &&
      (event.patch?.topic !== undefined || event.patch?.icon !== undefined)
    ) {
      // 本地补丁已先行同步，重拉仅兜底对齐后端，高频突发走节流合并
      throttledConversationReload();
    }
  });

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
    queryEpochRef.current += 1;
    setKeyword('');
    setSearchKeyword('');
    componentCache.keyword = '';
    componentCache.searchKeyword = '';
    loadListRef.current(true, { topic: '' });
  }, []);

  const localListRef = useRef(localList);
  localListRef.current = localList;
  const handleConversationChatFinished = useCallback(
    (payload: { conversationId: string }) => {
      if (
        localListRef.current.some(
          (item) => String(item.id) === payload.conversationId,
        )
      ) {
        void fetchConversationTaskStatus(payload.conversationId).then(
          (status) => {
            if (isTerminalTaskStatus(status)) {
              emitConversationListTaskStatus(payload.conversationId, status);
            }
          },
        );
      }
      loadListRef.current(true, { silent: true });
    },
    [],
  );

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

  // 收藏标记同步：不影响任务列表可见性/排序，无回包复活问题，不进 TTL 覆盖体系
  const handleConversationCollectedChanged = useCallback(
    (conversationId: number, collected: boolean) => {
      setLocalList((prev) =>
        prev.map((item) =>
          item.id === conversationId ? { ...item, collected } : item,
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
  const classicPrefetchedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) return;

    const isHomeRoute = location.pathname.startsWith('/home');
    const wasHomeRoute = prevPathnameRef.current.startsWith('/home');
    const routeChanged = prevPathnameRef.current !== location.pathname;
    const shouldPrefetchClassic =
      !isSidebarNavMode &&
      !classicPrefetchedRef.current &&
      location.pathname === '/home';
    if (shouldPrefetchClassic) classicPrefetchedRef.current = true;
    const isHomepageMenuClick =
      (location.state as { menuCode?: string } | null)?.menuCode === 'homepage';

    if (
      isHomepageMenuClick ||
      shouldPrefetchClassic ||
      (routeChanged && location.pathname === '/home')
    ) {
      // 点击主页菜单时，即使路径没有变化，也按当前视图静默更新并回到顶部
      loadListRef.current(true, { silent: true });
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else if (routeChanged && isHomeRoute && !wasHomeRoute) {
      // 从其他页面（如 /space）切回到 /home/chat 页面，即使组件未销毁也应当静默更新一次
      loadListRef.current(true, { silent: true });
    }

    prevPathnameRef.current = location.pathname;
  }, [location.pathname, location.state, isSidebarNavMode]);

  useEffect(() => {
    const handleRefreshConversationList = () => {
      // 会话结束（SSE 关闭）/主题更新时：静默刷新任务列表
      loadListRef.current(true, { silent: true });
    };

    eventBus.on(
      EVENT_TYPE.RefreshConversationList,
      handleRefreshConversationList,
    );
    return () => {
      // 卸载时清掉可能在途的节流重拉定时器（见 throttledConversationReload）
      if (conversationReloadTimerRef.current) {
        clearTimeout(conversationReloadTimerRef.current);
        conversationReloadTimerRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      eventBus.off(
        EVENT_TYPE.RefreshConversationList,
        handleRefreshConversationList,
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
    queryEpochRef.current += 1;
    setHasMore(true);
    setLocalList([]);
    loadList(true);
  }, [searchKeyword]);

  const handleConversationClick = useCallback((item: ConversationInfo) => {
    // 移动端菜单关闭改经事件总线下发（SidebarShell 消费并调 layout model）：
    // 此处曾直接 useModel('layout') 订阅，收起/展开等 layout 全量广播会把
    // NewHomeSection 整个会话列表子树卷进重渲染、击穿 React.memo（2026-09 收展卡顿）
    eventBus.emit(EVENT_TYPE.CloseMobileMenu);
    const { id, agentId, devTargetType, devTargetId, devSpaceId } = item;
    // 点击即视为已进入：立即清未读蓝点（跨应用路由 chatId 派生可能滞后，先清兜底）
    if (id !== null && id !== undefined) markConversationVisited(id);

    if (devTargetType === 'Agent' && devSpaceId && id) {
      history.push(
        `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`,
      );
    } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
      jumpTo(`/space/${devSpaceId}/app-dev/${devTargetId}`);
    } else if (devTargetType === 'UserApp' && devSpaceId && devTargetId) {
      // 全栈应用会话：跳全栈应用开发详情页，conversationId 用于恢复该会话
      jumpTo(buildAppProRoute(devSpaceId, devTargetId, id));
    } else {
      history.push('/home/chat/' + id + '/' + agentId);
    }
  }, []);

  // 会话结束未读蓝点：当前会话 id 变化 = 已进入（面板点击/搜索弹窗/快捷导航等
  // 一切路径统一在此清除），同时同步「结束时是否在场」的判定基准
  useEffect(() => {
    setActiveConversation(chatId);
    if (chatId) markConversationVisited(chatId);
  }, [chatId]);

  // 会话结束未读蓝点·本地兜底信号：列表内 EXECUTING→终态 跃迁即「结束」
  // （chat_finished 通知不覆盖普通聊天——2026-09-17 testagent 实测不下发；
  // 静默刷新回包里观察到「之前执行中、现在已结束」且此刻不在该会话里，
  // 即记蓝点。首见终态不算——页面没见证过「执行中」就不算「结束后未看」）
  const listTaskStatusRef = useRef(new Map<string, TaskStatus>());
  useEffect(() => {
    const prev = listTaskStatusRef.current;
    const next = new Map<string, TaskStatus>();
    for (const item of localList) {
      if (item.taskStatus === undefined) continue;
      const id = String(item.id);
      next.set(id, item.taskStatus);
      if (
        prev.get(id) === TaskStatus.EXECUTING &&
        isTerminalTaskStatus(item.taskStatus) &&
        id !== chatId
      ) {
        markConversationFinished(id);
      }
    }
    listTaskStatusRef.current = next;
  }, [localList, chatId]);

  // 页签切回「活动门控」：列表里是否还有执行中会话（全量口径）
  const hasExecutingTask = useMemo(
    () => hasExecutingTaskInList(localList),
    [localList],
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

  // 会话行命中判定（项目子行或任务行任一）：侧栏导航菜单高亮据此让位——
  // 2026-09-15 用户定调优先级「先命中项目/任务中会话，然后才是导航菜单」
  // （/space/app-pro 项目会话不再误亮「工作空间」；未命中时导航菜单照常兜底）
  const conversationRowActive =
    chatId !== undefined &&
    (activeProjectChildId === chatId ||
      visibleConversationList.some((item) => String(item.id) === chatId));

  return {
    scrollContainerRef,
    scrollShowRef,
    chatId,
    visibleConversationList,
    hasExecutingTask,
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
    handleConversationCollectedChanged,
    projectCount,
    handleProjectCountChange,
    activeProjectChildId,
    setActiveProjectChildId,
    conversationRowActive,
  };
}
