import emptyStateNoData from '@/assets/images/empty_state_no_data.svg';
import SvgIcon from '@/components/base/SvgIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import {
  useConversationChanged,
  useProjectChanged,
} from '@/hooks/useDirectorySync';
import useExclusiveDropdown from '@/hooks/useExclusiveDropdown';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import {
  apiAgentConversationDelete,
  apiAgentConversationList,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import {
  apiNormalProjectDelete,
  apiNormalProjectUpdate,
  apiUserAppDelete,
  apiUserAppUpdate,
  apiUserProjectArchive,
  apiUserProjectCollect,
  apiUserProjectConversations,
  apiUserProjectPageQuery,
  apiUserProjectPin,
  apiUserProjectUnCollect,
} from '@/services/userProjectApp';
import type {
  ConversationChangedEvent,
  DirectoryProjectRef,
  ProjectChangedEvent,
} from '@/types/directorySync';
import { AgentComponentTypeEnum, TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import {
  emitConversationListTaskStatus,
  fetchConversationTaskStatus,
  isTerminalTaskStatus,
} from '@/utils/conversationTaskStatusSync';
import {
  applyConversationChangedToList,
  applyProjectChangedToList,
  emitProjectChanged,
  matchesProjectRef,
} from '@/utils/directorySyncEvents';
import eventBus from '@/utils/eventBus';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  InboxOutlined,
  LoadingOutlined,
  ProfileOutlined,
  PushpinFilled,
  PushpinOutlined,
  StarFilled,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, message, Modal, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import type { KeyboardEvent, MouseEvent } from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history } from 'umi';
import { formatRelativeTime } from '../../utils';
import ConversationStatusMark from '../ConversationStatusMark';
import { CHILDREN_PROBE_LIMIT, diffChildrenProbe } from './childrenProbe';
import styles from './index.less';
import {
  appendProjectsPage,
  findProjectKeyByConversation,
  hasMoreProjects,
  mergeFlagIds,
  PROJECT_PAGE_SIZE,
  projectKeyOf,
  remainingProjects,
  toProjectChildren,
  toProjectItem,
} from './projectPagination';

const cx = classNames.bind(styles);

/**
 * created 项目有界重拉的间隔与轮数（bug 2407 / 2413）。
 * 首轮立即重拉 + 3 次补偿，总窗 ≈ 2.5s，覆盖后端列表接口的秒级可见性延迟
 * （docs/project-conversation-sync.md）。窗口内后端始终不回该行则有界结束，
 * 由后续任一重拉 / 路由回流收敛，不做无限轮询。
 */
const CREATED_SETTLE_DELAYS_MS = [300, 700, 1500];

/** 项目子项(项目下的会话,来自 tab 接口 conversations) */
export interface ProjectChildItem {
  id: number;
  name: string;
  modified?: string;
  taskStatus?: TaskStatus;
  /** 原始会话数据(点击跳转用) */
  conversation?: ConversationInfo;
}

/** 标记集合按事件补丁增删（bug 2475）：enabled 真增假删，幂等可重放 */
const toggleFlagSet = (
  previous: Set<string>,
  key: string,
  enabled: boolean,
): Set<string> => {
  const next = new Set(previous);
  if (enabled) {
    next.add(key);
  } else {
    next.delete(key);
  }
  return next;
};

/** 项目列表项 */
export interface ProjectItem {
  id: number;
  name: string;
  /** 项目类型（重命名/删除按类型路由到 user-project / userapp 接口） */
  projectType?: AgentComponentTypeEnum;
  /** 项目所属空间 ID（「+ 新建会话」上框跳全栈 IDE 用） */
  spaceId?: number;
  /** 项目图标（上框展示） */
  icon?: string | null;
  /** 项目沙箱 ID（上框会话创建携带） */
  sandboxId?: number;
  /** 项目绑定的调试智能体 ID（全栈默认命中用；契约先行，接口暂不返回） */
  devAgentId?: number;
  /** 当前用户是否项目创建者（上框透传，=== false 判参与者自选沙箱用） */
  owner?: boolean;
  children?: ProjectChildItem[];
}

/**
 * 项目详情页路径：与 SpaceProjectManage 卡片点击同映射，仅三类有详情页的
 * 类型可构造；spaceId 缺失或类型未覆盖（PageApp 等）返回 null，菜单项隐藏。
 */
const projectDetailPath = (project: ProjectItem): string | null => {
  if (project.spaceId === undefined) return null;
  switch (project.projectType) {
    case AgentComponentTypeEnum.NormalProject:
      return `/space/${project.spaceId}/normal-project-detail/${project.id}`;
    case AgentComponentTypeEnum.UserApp:
      return `/space/${project.spaceId}/app-project-detail/${project.id}`;
    case AgentComponentTypeEnum.ThirdApp:
      return `/space/${project.spaceId}/third-app-detail/${project.id}`;
    default:
      return null;
  }
};

const applyProjectChildEvent = (
  children: ProjectChildItem[],
  event: ConversationChangedEvent,
): ProjectChildItem[] => {
  const patched = applyConversationChangedToList(children, event, {
    topicField: 'name',
  });
  if (event.operation !== 'updated' || !event.patch) return patched;
  const target = patched.find(
    (child) => String(child.id) === event.conversationId,
  );
  if (!target?.conversation) return patched;
  const source = target.conversation;
  if (
    source.topic ===
      (event.patch.topic !== undefined ? event.patch.topic : source.topic) &&
    source.icon ===
      (event.patch.icon !== undefined ? event.patch.icon : source.icon) &&
    source.taskStatus ===
      (event.patch.taskStatus !== undefined
        ? event.patch.taskStatus
        : source.taskStatus)
  ) {
    return patched;
  }
  return patched.map((child) => {
    if (String(child.id) !== event.conversationId || !child.conversation) {
      return child;
    }
    const conversation = child.conversation;
    return {
      ...child,
      conversation: {
        ...conversation,
        ...(event.patch?.topic !== undefined
          ? { topic: event.patch.topic }
          : {}),
        ...(event.patch?.icon !== undefined ? { icon: event.patch.icon } : {}),
        ...(event.patch?.taskStatus !== undefined
          ? { taskStatus: event.patch.taskStatus }
          : {}),
      },
    };
  });
};

/**
 * 「项目」Tab 面板。
 *
 * **项目行:全功能**(2026-09-08 定调)——右键菜单 置顶/归档/重命名/删除,
 * 置顶排前、归档默认隐藏+「已归档」入口,对齐任务列表会话的交互形态。
 * **项目子项(项目下的会话):不做置顶**(同日定调),仅 重命名/删除 + 状态徽标。
 *
 * 数据走 apiUserProjectPageQuery（2026-09-14 统一接口：回包含归档项目、
 * 不附带子会话，子会话挂载/翻页后经 apiUserProjectConversations 补拉）；
 * 项目层分页（2026-09-12）：首屏 20 条 +「查看更多」按页追加、按 projectId 去重合并；
 * 重命名/删除已接真实接口（项目→normal-project/userapp、子项会话→agent conversation，
 * wiki 2026-09-11 v2 契约）；置顶/归档/收藏走 user-project pin/archive/collect
 * （同契约，回读字段就位后自动恢复），PageApp 契约未覆盖改名删除/置顶归档暂维持本地。
 */
export interface ProjectPanelHandle {
  toggleAll: () => void;
  revalidateVisible: () => void;
  /** 任一已加载子会话仍在执行中（页签切回「活动门控」的前置判定用） */
  hasExecutingChildren: () => boolean;
}

const ProjectPanel = forwardRef<
  ProjectPanelHandle,
  {
    compact?: boolean;
    /** 可见项目数变化上报(分组头计数用,对齐任务计数=过滤归档后的可见数) */
    onVisibleCountChange?: (count: number) => void;
    /** 子项会话点击跳转(与任务列表同一路由逻辑) */
    onConversationClick?: (item: ConversationInfo) => void;
    /** 当前路由会话 id(/home/chat/:id,字符串)。命中子会话时高亮该行并确保所属项目展开 */
    activeConversationId?: string;
    /** 反查结果上报:命中传会话 id、未命中传 null(任务列表据此互斥,选中只落一处) */
    onActiveChildResolved?: (conversationId: string | null) => void;
    /**
     * 子会话行行首状态标记(单栏 style3 启用):执行中转圈替换「执行中」文字胶囊、
     * 结束未读亮蓝点。经典布局不传维持现状(2026-09-17 定调:style1/2 待定)。
     */
    leadingMark?: boolean;
    /** 会话结束未读 id 快照(leadingMark 开启时消费) */
    unreadConversationIds?: ReadonlySet<string>;
  }
>(
  (
    {
      onVisibleCountChange,
      onConversationClick,
      compact = false,
      activeConversationId,
      onActiveChildResolved,
      leadingMark = false,
      unreadConversationIds,
    },
    ref,
  ) => {
    const { pin } = useHomePinnedProjectHandoff();

    const { getDropdownProps, close: closeProjectMenu } =
      useExclusiveDropdown();
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    // 空态仅在接口返回后展示：加载中先渲染 Spin，避免一进来就闪「暂无项目」
    const [loading, setLoading] = useState(true);
    // 标记集合一律存复合键（projectKeyOf）：projectId 跨项目类型撞车，裸 id 会串标记
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
      () => new Set(),
    );
    // 项目级标记：置顶/归档/收藏回读自后端字段（字段未返回时不标记）
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => new Set());
    const [archivedIds, setArchivedIds] = useState<Set<string>>(
      () => new Set(),
    );
    const [collectedIds, setCollectedIds] = useState<Set<string>>(
      () => new Set(),
    );
    // 子项重命名弹窗状态(projectId + childId 定位目标子项)
    const [renameTarget, setRenameTarget] = useState<{
      projectKey: string;
      childId: number;
    }>();
    const [renameName, setRenameName] = useState('');
    // 重命名提交中（Modal confirmLoading，防慢接口下重复提交）
    const [renaming, setRenaming] = useState(false);
    // 项目重命名弹窗状态
    const [renameProjectId, setRenameProjectId] = useState<string>();
    const [projectRenameName, setProjectRenameName] = useState('');
    const [projectRenaming, setProjectRenaming] = useState(false);
    // 项目行内归档二次确认（2026-09-20 定调，同任务行口径）：行尾归档图标与
    // ⋯菜单「归档」都汇入 armed 态，红色「确认」二次点击才执行
    const [archiveArmingKey, setArchiveArmingKey] = useState<string>();
    const [projectArchiving, setProjectArchiving] = useState(false);
    // 项目子会话删除与归档同口径：首次点击进入行内确认，二次点击才请求删除。
    const [childDeleteArmingKey, setChildDeleteArmingKey] = useState<string>();
    const [childDeleting, setChildDeleting] = useState(false);
    // 行内二次确认（项目归档/子会话删除）点击外部取消（2026-09-20 定调）：
    // armed 时点击对应「确认」按钮作用域以外的任意位置回退常规态。capture 阶段
    // 监听（先于行内 stopPropagation 生效）；data-* scope 标记豁免本行触发/
    // 确认钮，函数式更新避免并行 armed 相互清位；Esc 逐行取消保留
    useEffect(() => {
      if (!archiveArmingKey && !childDeleteArmingKey) return;
      const onDocClick = (event: Event) => {
        const target = event.target as Element | null;
        const archiveScope = target
          ?.closest('[data-archive-arming]')
          ?.getAttribute('data-archive-arming');
        const deleteScope = target
          ?.closest('[data-delete-arming]')
          ?.getAttribute('data-delete-arming');
        setArchiveArmingKey((prev) =>
          prev && archiveScope !== prev ? undefined : prev,
        );
        setChildDeleteArmingKey((prev) =>
          prev && deleteScope !== prev ? undefined : prev,
        );
      };
      document.addEventListener('click', onDocClick, true);
      return () => document.removeEventListener('click', onDocClick, true);
    }, [archiveArmingKey, childDeleteArmingKey]);
    // 分页：首屏 PROJECT_PAGE_SIZE 条，「查看更多」按页追加（tab 接口 current/pageSize/total 契约）
    const [total, setTotal] = useState(0);
    // 分页游标按原始回包推进，不能用去重/事件过滤后的列表长度判断末页。
    const [consumedCount, setConsumedCount] = useState(0);
    const [lastPageIsShort, setLastPageIsShort] = useState(false);
    const [serverPages, setServerPages] = useState<number>();
    const [loadedPage, setLoadedPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const pageRef = useRef(1);
    const projectsRef = useRef(projects);
    projectsRef.current = projects;
    const pageRequestVersionRef = useRef(0);
    const recentProjectEventsRef = useRef<
      Array<{ event: ProjectChangedEvent; at: number }>
    >([]);
    /** 卸载标记：created 有界重试跨多个异步 tick，卸载后不再写状态 */
    const unmountedRef = useRef(false);
    /** 正在重试收敛的 created 项目复合键（按复合键去重，防双事件触发两条并行链） */
    const settlingCreatedKeysRef = useRef<Set<string>>(new Set());

    // 拉取指定页项目列表(page=1 整体替换,后续页追加合并;失败保持现状由空态兜底)。
    // 不传 spaceId:拉该用户全部空间的项目(跨空间口径,所有布局风格共用本面板)
    // 返回「本轮回包是否已包含 awaitKey 指定的项目」(传了 awaitKey 才有意义)，
    // 供 created 事件的有界重试判断是否收敛。
    const fetchPage = useCallback(
      async (
        page: number,
        options: { append: boolean; awaitKey?: string },
      ): Promise<boolean> => {
        const requestVersion = ++pageRequestVersionRef.current;
        // 接口是标准 current/pageSize 页码分页。静默刷新已加载范围时也必须
        // 逐页回读，不能把 pageSize 放大成 N * 20，否则排序漂移后会跳页，且
        // 后端 pages/current 语义被破坏，末页「查看更多」无法可靠收口。
        const pagesToFetch = options.append
          ? [page]
          : Array.from(
              { length: Math.max(1, pageRef.current) },
              (_, index) => index + 1,
            );
        if (options.append) setLoadingMore(true);
        try {
          const records: UserProjectTabItem[] = [];
          let responseTotal = 0;
          let responsePages: number | undefined;
          let lastFetchedPage = 1;
          let lastPageRecordCount = 0;

          for (const current of pagesToFetch) {
            const res = await apiUserProjectPageQuery({
              queryFilter: {
                projectTypes: [
                  AgentComponentTypeEnum.NormalProject,
                  AgentComponentTypeEnum.UserApp,
                ],
              },
              current,
              pageSize: PROJECT_PAGE_SIZE,
              orders: [],
              filters: [],
              columns: [],
            });
            // 已有更新的分页请求在途:丢弃过期响应(是否收敛交由重试下一轮判断)
            if (requestVersion !== pageRequestVersionRef.current) return false;
            if (
              res?.code !== SUCCESS_CODE ||
              !Array.isArray(res.data?.records)
            ) {
              return options.awaitKey === undefined;
            }
            records.push(...res.data.records);
            responseTotal = res.data.total ?? responseTotal;
            responsePages =
              typeof res.data.pages === 'number'
                ? res.data.pages
                : responsePages;
            lastFetchedPage =
              typeof res.data.current === 'number' ? res.data.current : current;
            lastPageRecordCount = res.data.records.length;

            // 静默回读时，若服务端页数已缩短，不再请求已不存在的旧页码。
            if (
              !options.append &&
              ((responsePages !== undefined &&
                lastFetchedPage >= responsePages) ||
                lastPageRecordCount < PROJECT_PAGE_SIZE)
            ) {
              break;
            }
          }

          const fallback = dict('PC.Constants.Menus.newChat');
          const now = Date.now();
          recentProjectEventsRef.current =
            recentProjectEventsRef.current.filter(
              ({ at }) => now - at < 60_000,
            );
          const mapped = recentProjectEventsRef.current.reduce(
            (list, { event }) => applyProjectChangedToList(list, event),
            records.map((item) => toProjectItem(item, fallback)),
          );
          setProjects((previous) => {
            if (options.append) return appendProjectsPage(previous, mapped);
            return mapped.map((item) => {
              const cached = previous.find(
                (old) =>
                  old.id === item.id && old.projectType === item.projectType,
              );
              return cached ? { ...item, children: cached.children } : item;
            });
          });
          // 置顶/归档/收藏回读恢复(wiki 2026-09-11 行6 契约先行:字段未返回时不标记;
          // 追加页只并入新标记,不回退已加载页)。键=复合键,防 projectId 跨类型撞车串标记
          const pageFlagIds = (flag: 'pinned' | 'archived' | 'collected') =>
            new Set(
              records
                .filter((item) => item[flag] === true)
                .map((item) =>
                  projectKeyOf({
                    id: item.projectId,
                    projectType: item.projectType,
                  }),
                ),
            );
          setPinnedIds((previous) =>
            options.append
              ? mergeFlagIds(previous, pageFlagIds('pinned'))
              : pageFlagIds('pinned'),
          );
          setArchivedIds((previous) =>
            options.append
              ? mergeFlagIds(previous, pageFlagIds('archived'))
              : pageFlagIds('archived'),
          );
          setCollectedIds((previous) =>
            options.append
              ? mergeFlagIds(previous, pageFlagIds('collected'))
              : pageFlagIds('collected'),
          );
          pageRef.current = lastFetchedPage;
          setLoadedPage(lastFetchedPage);
          setServerPages(responsePages);
          setTotal(responseTotal);
          setConsumedCount(
            options.append
              ? (lastFetchedPage - 1) * PROJECT_PAGE_SIZE + lastPageRecordCount
              : records.length,
          );
          setLastPageIsShort(lastPageRecordCount < PROJECT_PAGE_SIZE);
          if (options.awaitKey !== undefined) {
            return records.some(
              (item) =>
                projectKeyOf({
                  id: item.projectId,
                  projectType: item.projectType,
                }) === options.awaitKey,
            );
          }
          return true;
        } catch {
          // 忽略:保持现有列表
          return false;
        } finally {
          if (options.append) setLoadingMore(false);
        }
      },
      [],
    );

    useEffect(() => {
      unmountedRef.current = false;
      pageRequestVersionRef.current += 1;
      pageRef.current = 1;
      void fetchPage(1, { append: false }).finally(() => setLoading(false));
      return () => {
        unmountedRef.current = true;
      };
    }, [fetchPage]);

    /**
     * created 项目有界重拉（bug 2407 / 2413，2026-09-20）。
     *
     * 后端列表接口对新项目有秒级可见性延迟（docs/project-conversation-sync.md），
     * 单轮重拉在延迟窗口内会用「还没有新项目」的旧回包整表替换列表；而 60s 事件重放
     * 走 applyProjectChangedToList，created 事件不带 patch 且行不在列表里时直接返回
     * ——**插不进新行**。行自此永久缺失，只有重挂载（F5）才恢复。
     * 这里重试到行出现为止，窗口 ≈ 2.5s；双事件（ProjectChanged + ConversationChanged）
     * 都会触发，按复合键去重避免两条并行重试链。
     */
    const settleCreatedProject = useCallback(
      async (project: DirectoryProjectRef) => {
        const key = projectKeyOf({
          id: project.projectId,
          projectType: project.projectType,
        });
        if (settlingCreatedKeysRef.current.has(key)) return;
        if (projectsRef.current.some((item) => projectKeyOf(item) === key)) {
          return;
        }
        settlingCreatedKeysRef.current.add(key);
        try {
          for (
            let attempt = 0;
            attempt <= CREATED_SETTLE_DELAYS_MS.length;
            attempt += 1
          ) {
            if (unmountedRef.current) return;
            const settled = await fetchPage(1, {
              append: false,
              awaitKey: key,
            });
            if (settled) return;
            if (
              projectsRef.current.some((item) => projectKeyOf(item) === key)
            ) {
              return;
            }
            const delay = CREATED_SETTLE_DELAYS_MS[attempt];
            if (delay === undefined) return;
            await new Promise((resolve) => {
              setTimeout(resolve, delay);
            });
          }
        } finally {
          settlingCreatedKeysRef.current.delete(key);
        }
      },
      [fetchPage],
    );

    // 子会话按项目加载。刷新时保留旧行；在途事件通过 revision 和补拉收敛。
    const loadingChildrenRef = useRef<Set<string>>(new Set());
    const pendingChildrenRefreshRef = useRef<Set<string>>(new Set());
    const childrenRevisionRef = useRef<Map<string, number>>(new Map());
    const recentChildEventsRef = useRef<
      Array<{ event: ConversationChangedEvent; at: number }>
    >([]);
    // 项目身份统一走复合键 projectKeyOf（模块级单源，见 projectPagination.ts）；
    // 子会话加载/刷新的键口径与其一致

    const requestChildrenRef = useRef<(project: ProjectItem) => Promise<void>>(
      async () => {},
    );
    const requestChildren = useCallback(
      async (project: ProjectItem): Promise<void> => {
        const key = projectKeyOf(project);
        if (loadingChildrenRef.current.has(key)) {
          pendingChildrenRefreshRef.current.add(key);
          return;
        }
        const requestRevision = childrenRevisionRef.current.get(key) ?? 0;
        loadingChildrenRef.current.add(key);
        try {
          const res = await apiUserProjectConversations(
            project.id,
            project.projectType ?? AgentComponentTypeEnum.NormalProject,
          );
          const fallback = dict('PC.Constants.Menus.newChat');
          const now = Date.now();
          recentChildEventsRef.current = recentChildEventsRef.current.filter(
            ({ at }) => now - at < 60_000,
          );
          if (res?.code !== SUCCESS_CODE || !Array.isArray(res.data)) return;
          const children = recentChildEventsRef.current.reduce(
            (list, { event }) => applyProjectChildEvent(list, event),
            toProjectChildren(res.data, fallback) ?? [],
          );
          if ((childrenRevisionRef.current.get(key) ?? 0) !== requestRevision) {
            pendingChildrenRefreshRef.current.add(key);
            return;
          }
          setProjects((previous) =>
            previous.map((item) =>
              projectKeyOf(item) === key ? { ...item, children } : item,
            ),
          );
        } catch {
          // 首次失败结束加载态；下次可见性核对或事件会重试。
          setProjects((previous) =>
            previous.map((item) =>
              projectKeyOf(item) === key && item.children === undefined
                ? { ...item, children: [] }
                : item,
            ),
          );
        } finally {
          loadingChildrenRef.current.delete(key);
          if (pendingChildrenRefreshRef.current.delete(key)) {
            const current = projectsRef.current.find(
              (item) => projectKeyOf(item) === key,
            );
            if (current) void requestChildrenRef.current(current);
          }
        }
      },
      [],
    );
    requestChildrenRef.current = requestChildren;

    const invalidateProjectChildren = useCallback(
      (target: {
        projectId: string;
        projectType: AgentComponentTypeEnum;
        spaceId?: string;
      }) => {
        const matched = projectsRef.current.filter((project) =>
          matchesProjectRef(project, target),
        );
        matched.forEach((project) => {
          const key = projectKeyOf(project);
          childrenRevisionRef.current.set(
            key,
            (childrenRevisionRef.current.get(key) ?? 0) + 1,
          );
          void requestChildrenRef.current(project);
        });
        return matched.length > 0;
      },
      [],
    );

    useEffect(() => {
      projects.forEach((project) => {
        const key = projectKeyOf(project);
        if (
          project.children !== undefined ||
          archivedIds.has(projectKeyOf(project)) ||
          loadingChildrenRef.current.has(key)
        ) {
          return;
        }
        void requestChildren(project);
      });
    }, [projects, archivedIds, requestChildren]);

    useConversationChanged((event) => {
      const now = Date.now();
      recentChildEventsRef.current = recentChildEventsRef.current
        .filter(({ at }) => now - at < 60_000)
        .slice(-199);
      recentChildEventsRef.current.push({ event, at: now });
      setProjects((previous) =>
        previous.map((project) => {
          if (!project.children) return project;
          const children = applyProjectChildEvent(project.children, event);
          return children === project.children
            ? project
            : { ...project, children };
        }),
      );
      if (
        event.project &&
        (event.operation === 'created' || event.operation === 'deleted')
      ) {
        const found = invalidateProjectChildren(event.project);
        // 行还不在本地列表（后端可见性延迟）：落到 created 有界重拉补行
        if (!found && event.operation === 'created') {
          void settleCreatedProject(event.project);
        }
      }
    });

    useProjectChanged((event) => {
      const now = Date.now();
      recentProjectEventsRef.current = recentProjectEventsRef.current
        .filter(({ at }) => now - at < 60_000)
        .slice(-199);
      recentProjectEventsRef.current.push({ event, at: now });
      if (event.operation === 'created') {
        void settleCreatedProject(event.project);
        return;
      }
      setProjects((previous) => applyProjectChangedToList(previous, event));
      // 置顶/归档标记补丁（bug 2475）：历史会话页等入口操作成功后广播，标记集合
      // 按补丁即时增删（行在已加载页内即可见排序/隐藏变化，无需手动刷新）。
      // 仅行已加载时改集合，防行外键泄漏；后续 fetchPage 以服务端真值整体覆盖
      const patchPinned = event.patch?.pinned;
      const patchArchived = event.patch?.archived;
      if (patchPinned !== undefined || patchArchived !== undefined) {
        const matched = projectsRef.current.find((project) =>
          matchesProjectRef(project, event.project),
        );
        if (matched) {
          const flagKey = projectKeyOf(matched);
          if (patchPinned !== undefined) {
            setPinnedIds((previous) =>
              toggleFlagSet(previous, flagKey, patchPinned),
            );
          }
          if (patchArchived !== undefined) {
            setArchivedIds((previous) =>
              toggleFlagSet(previous, flagKey, patchArchived),
            );
          }
        }
      }
      if (event.operation === 'deleted') {
        const deletedKey = projectKeyOf({
          id: event.project.projectId,
          projectType: event.project.projectType,
        });
        setPinnedIds((previous) => {
          if (!previous.has(deletedKey)) return previous;
          const next = new Set(previous);
          next.delete(deletedKey);
          return next;
        });
        setArchivedIds((previous) => {
          if (!previous.has(deletedKey)) return previous;
          const next = new Set(previous);
          next.delete(deletedKey);
          return next;
        });
        setCollectedIds((previous) => {
          if (!previous.has(deletedKey)) return previous;
          const next = new Set(previous);
          next.delete(deletedKey);
          return next;
        });
      }
    });

    const hasMore =
      serverPages !== undefined
        ? loadedPage < serverPages
        : !lastPageIsShort && hasMoreProjects(consumedCount, total);
    const remainingCount = remainingProjects(consumedCount, total);
    const handleLoadMore = () => {
      if (loadingMore || !hasMore) return;
      void fetchPage(pageRef.current + 1, { append: true });
    };

    const executingText = dict(
      'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
    );

    const handleProjectClick = (project: ProjectItem) => {
      const key = projectKeyOf(project);
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    };

    // 项目可见列表:隐藏归档项（侧栏不设归档查看入口）、置顶排前(稳定排序保持原相对顺序)
    const visibleProjects = useMemo(() => {
      const filtered = projects.filter(
        (item) => !archivedIds.has(projectKeyOf(item)),
      );
      return [...filtered].sort(
        (a, b) =>
          Number(pinnedIds.has(projectKeyOf(b))) -
          Number(pinnedIds.has(projectKeyOf(a))),
      );
    }, [projects, archivedIds, pinnedIds]);

    const findProjectByConversation = useCallback(
      (conversationId: number | string) =>
        projectsRef.current.find((project) =>
          project.children?.some(
            (child) => String(child.id) === String(conversationId),
          ),
        ),
      [],
    );

    useEffect(() => {
      const refreshConversation = (payload?: {
        conversationId?: number | string;
      }) => {
        if (payload?.conversationId === undefined) return;
        const project = findProjectByConversation(payload.conversationId);
        if (project) void requestChildren(project);
      };
      const onChatFinished = (payload: { conversationId: string }) => {
        const project = findProjectByConversation(payload.conversationId);
        if (!project) return;
        void fetchConversationTaskStatus(payload.conversationId).then(
          (status) => {
            if (isTerminalTaskStatus(status)) {
              emitConversationListTaskStatus(payload.conversationId, status);
            }
            void requestChildren(project);
          },
        );
      };
      eventBus.on(EVENT_TYPE.RefreshConversationList, refreshConversation);
      eventBus.on(EVENT_TYPE.ChatFinished, onChatFinished);
      return () => {
        eventBus.off(EVENT_TYPE.RefreshConversationList, refreshConversation);
        eventBus.off(EVENT_TYPE.ChatFinished, onChatFinished);
      };
    }, [findProjectByConversation, requestChildren]);

    // 当前路由会话反查所属项目（会话条目无项目归属字段，只能扫已加载的子会话）；
    // 命中结果为复合键，与 collapsedIds 键口径一致
    const activeChildProjectKey = useMemo(
      () => findProjectKeyByConversation(visibleProjects, activeConversationId),
      [visibleProjects, activeConversationId],
    );

    // 命中项目会话时确保所属项目展开（只随路由会话/数据变化触发一次，
    // 用户随后手动折叠不会被强制弹回）
    useEffect(() => {
      if (activeChildProjectKey === null) return;
      setCollapsedIds((prev) => {
        if (!prev.has(activeChildProjectKey)) return prev;
        const next = new Set(prev);
        next.delete(activeChildProjectKey);
        return next;
      });
    }, [activeChildProjectKey]);

    // 反查结果上报父级（命中=当前会话 id / 未命中=null）：任务列表据此对同一
    // 会话互斥去高亮，选中只落项目分组一处
    useEffect(() => {
      onActiveChildResolved?.(
        activeChildProjectKey !== null && activeConversationId !== undefined
          ? activeConversationId
          : null,
      );
    }, [activeChildProjectKey, activeConversationId, onActiveChildResolved]);

    // 子会话按 4 个一批并发重拉（探针命中差异/全量兜底共用）
    const requestChildrenBatched = useCallback(
      async (candidates: ProjectItem[]) => {
        for (let index = 0; index < candidates.length; index += 4) {
          await Promise.all(
            candidates
              .slice(index, index + 4)
              .map((project) => requestChildren(project)),
          );
        }
      },
      [requestChildren],
    );

    useImperativeHandle(
      ref,
      () => ({
        toggleAll: () =>
          setCollapsedIds((previous) => {
            const allExpanded = visibleProjects.every(
              (project) => !previous.has(projectKeyOf(project)),
            );
            const next = new Set(previous);
            visibleProjects.forEach((project) => {
              const key = projectKeyOf(project);
              if (allExpanded) next.add(key);
              else next.delete(key);
            });
            return next;
          }),
        hasExecutingChildren: () =>
          projectsRef.current.some((project) =>
            (project.children ?? []).some(
              (child) => child.taskStatus === TaskStatus.EXECUTING,
            ),
          ),
        revalidateVisible: () => {
          void (async () => {
            await fetchPage(1, { append: false });
            const revalidateAll = () => {
              const candidates = projectsRef.current.filter(
                (project) =>
                  !archivedIds.has(projectKeyOf(project)) &&
                  !collapsedIds.has(projectKeyOf(project)),
              );
              return requestChildrenBatched(candidates);
            };
            // 探针：一次拉回全部项目会话与已加载子会话指纹比对（见
            // childrenProbe.ts）。无差异零子会话请求；探针异常/不可靠全量兜底
            let rows: ConversationInfo[] | undefined;
            try {
              const res = await apiAgentConversationList({
                agentId: null,
                projectFilter: 'only',
                archivedFilter: 'all',
                limit: CHILDREN_PROBE_LIMIT,
              });
              if (res?.code === SUCCESS_CODE && Array.isArray(res.data)) {
                rows = res.data;
              }
            } catch {
              // 忽略：走全量兜底
            }
            if (!rows) {
              void revalidateAll();
              return;
            }
            const result = diffChildrenProbe(projectsRef.current, rows);
            // EXECUTING→终态先经统一入口 emit：本地补丁翻新 + 未读蓝点标记
            result.finishedTransitions.forEach(
              ({ conversationId, taskStatus }) =>
                emitConversationListTaskStatus(conversationId, taskStatus),
            );
            if (result.truncated || result.hasUnknownConversation) {
              void revalidateAll();
              return;
            }
            if (result.changedProjectKeys.size === 0) return;
            void requestChildrenBatched(
              projectsRef.current.filter((project) =>
                result.changedProjectKeys.has(projectKeyOf(project)),
              ),
            );
          })();
        },
      }),
      [
        visibleProjects,
        archivedIds,
        collapsedIds,
        fetchPage,
        requestChildrenBatched,
      ],
    );

    useEffect(() => {
      onVisibleCountChange?.(visibleProjects.length);
    }, [visibleProjects.length, onVisibleCountChange]);

    // 项目行内归档确认执行（红「确认」二次点击）：常规/全栈走真实接口置归档，
    // PageApp 契约未覆盖维持本地；成败都向服务端真值收敛一次（同 toggleProjectFlag）
    const handleProjectArchiveConfirm = async (project: ProjectItem) => {
      if (projectArchiving) return;
      setProjectArchiving(true);
      try {
        const key = projectKeyOf(project);
        const usesRealApi =
          project.projectType === AgentComponentTypeEnum.NormalProject ||
          project.projectType === AgentComponentTypeEnum.UserApp;
        let ok = true;
        if (usesRealApi) {
          const res = await apiUserProjectArchive(
            project.id,
            true,
            project.projectType as string,
          ).catch(() => null);
          ok = res?.code === SUCCESS_CODE;
        }
        if (!ok) {
          message.error(dict('PC.Common.Global.operationFailed'));
          return;
        }
        setArchivedIds((prev) => new Set(prev).add(key));
        message.success(
          dict('PC.Components.ConversationContextMenu.archivedToast'),
        );
        setArchiveArmingKey(undefined);
        void fetchPage(1, { append: false });
      } finally {
        setProjectArchiving(false);
      }
    };

    // 项目标记 toggle：置顶/归档走项目级后端接口（常规/全栈项目；
    // PageApp 契约未覆盖暂本地）。后端成功才更新标记，
    // 失败 toast 不动状态;toast 文案与任务会话菜单同款
    const toggleProjectFlag = (
      kind: 'pinned' | 'archived',
      project: ProjectItem,
    ) => {
      const setter = kind === 'pinned' ? setPinnedIds : setArchivedIds;
      const key = projectKeyOf(project);
      const applyFlag = () => {
        setter((prev) => {
          const next = new Set(prev);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return next;
        });
      };
      const enabled = !(kind === 'pinned' ? pinnedIds : archivedIds).has(key);
      const toastKeyMap = {
        pinned: enabled
          ? 'PC.Components.ConversationContextMenu.pinnedToast'
          : 'PC.Components.ConversationContextMenu.unpinnedToast',
        archived: enabled
          ? 'PC.Components.ConversationContextMenu.archivedToast'
          : 'PC.Components.ConversationContextMenu.unarchivedToast',
      } as const;

      const usesRealApi =
        project.projectType === AgentComponentTypeEnum.NormalProject ||
        project.projectType === AgentComponentTypeEnum.UserApp;
      if (!usesRealApi) {
        applyFlag();
        message.success(dict(toastKeyMap[kind]));
        return;
      }
      void (async () => {
        const request =
          kind === 'pinned' ? apiUserProjectPin : apiUserProjectArchive;
        // pinned/archived + projectType query 均为后端必传（归属校验），
        // usesRealApi 分支已保证 projectType 为 NormalProject/UserApp
        const res = await request(
          project.id,
          enabled,
          project.projectType as string,
        ).catch(() => null);
        if (res?.code !== SUCCESS_CODE) {
          message.error(dict('PC.Common.Global.operationFailed'));
        } else {
          applyFlag();
          message.success(dict(toastKeyMap[kind]));
        }
        // 成败都向服务端真值收敛一次：置顶回包丢失/报错但后端已提交时，本地若
        // 不重拉会一直停在未聚拢的顺序、直到手动刷新才恢复（2026-09-17 用户实测）
        void fetchPage(1, { append: false });
      })();
    };

    // 项目收藏 toggle：与 pin/archive 不同，collect/unCollect 为双路径接口，
    // 按当前状态选择（2026-09-13 上线）。PageApp 同 pin/archive 口径暂本地。
    // 后端成功才更新标记，失败 toast 不动状态;toast 文案与任务会话菜单同款
    const toggleProjectCollected = (project: ProjectItem) => {
      const key = projectKeyOf(project);
      const enabled = !collectedIds.has(key);
      const applyCollected = () => {
        setCollectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return next;
        });
      };

      const usesRealApi =
        project.projectType === AgentComponentTypeEnum.NormalProject ||
        project.projectType === AgentComponentTypeEnum.UserApp;
      if (!usesRealApi) {
        applyCollected();
        message.success(
          dict(
            enabled
              ? 'PC.Components.ConversationContextMenu.collectedToast'
              : 'PC.Components.ConversationContextMenu.uncollectedToast',
          ),
        );
        return;
      }
      void (async () => {
        // projectType 为后端必传 query 参数（项目归属校验，同 conversation/create 口径）
        const res = await (enabled
          ? apiUserProjectCollect(project.id, project.projectType as string)
          : apiUserProjectUnCollect(project.id, project.projectType as string)
        ).catch(() => null);
        if (res?.code !== SUCCESS_CODE) {
          message.error(dict('PC.Common.Global.operationFailed'));
        } else {
          applyCollected();
          message.success(
            dict(
              enabled
                ? 'PC.Components.ConversationContextMenu.collectedToast'
                : 'PC.Components.ConversationContextMenu.uncollectedToast',
            ),
          );
        }
        // 同 toggleProjectFlag：成败都向服务端真值收敛一次（回包丢失场景自愈）
        void fetchPage(1, { append: false });
      })();
    };

    // 项目重命名:常规项目/全栈应用走真实接口,PageApp 契约未覆盖暂维持本地改名
    const handleProjectRenameSubmit = async () => {
      if (projectRenaming) return;
      const trimmed = projectRenameName.trim();
      if (!trimmed || !renameProjectId) return;
      const target = projects.find(
        (project) => projectKeyOf(project) === renameProjectId,
      );
      if (!target) return;
      setProjectRenaming(true);
      try {
        // 常规/全栈走真实接口持久化；PageApp 契约未覆盖仅本地改名，不广播
        let persisted = false;
        if (
          target.projectType === AgentComponentTypeEnum.NormalProject ||
          target.projectType === AgentComponentTypeEnum.UserApp
        ) {
          const res =
            target.projectType === AgentComponentTypeEnum.UserApp
              ? await apiUserAppUpdate({ id: target.id, name: trimmed })
              : await apiNormalProjectUpdate({ id: target.id, name: trimmed });
          if (res?.code !== SUCCESS_CODE) return;
          persisted = true;
        }
        setProjects((prev) =>
          prev.map((project) =>
            projectKeyOf(project) !== renameProjectId
              ? project
              : { ...project, name: trimmed },
          ),
        );
        if (persisted) {
          emitProjectChanged({
            operation: 'updated',
            project: {
              projectId: String(target.id),
              projectType:
                target.projectType ?? AgentComponentTypeEnum.NormalProject,
              ...(target.spaceId !== undefined
                ? { spaceId: String(target.spaceId) }
                : {}),
            },
            patch: { name: trimmed },
            origin: 'project-panel',
            reason: 'rename',
          });
        }
        setRenameProjectId(undefined);
      } finally {
        setProjectRenaming(false);
      }
    };

    // 项目删除:常规项目/全栈应用走真实接口,PageApp 契约未覆盖暂维持本地移除
    const openProjectDelete = (project: ProjectItem) => {
      const usesRealApi =
        project.projectType === AgentComponentTypeEnum.NormalProject ||
        project.projectType === AgentComponentTypeEnum.UserApp;
      Modal.confirm({
        title: dict('PC.Common.Global.deleteConfirmTitle'),
        content: dict('PC.Common.Global.deleteConfirmContent'),
        okButtonProps: { danger: true },
        okText: dict('PC.Common.Global.delete'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: async () => {
          if (usesRealApi) {
            const res =
              project.projectType === AgentComponentTypeEnum.UserApp
                ? await apiUserAppDelete(project.id)
                : await apiNormalProjectDelete(project.id);
            if (res?.code !== SUCCESS_CODE) return;
          }
          // 本地移除按复合键定位：裸 id 会把同号异类项目一并误删
          const deletedKey = projectKeyOf(project);
          setProjects((prev) =>
            prev.filter((item) => projectKeyOf(item) !== deletedKey),
          );
          setPinnedIds((prev) => {
            const next = new Set(prev);
            next.delete(deletedKey);
            return next;
          });
          setArchivedIds((prev) => {
            const next = new Set(prev);
            next.delete(deletedKey);
            return next;
          });
          setCollectedIds((prev) => {
            const next = new Set(prev);
            next.delete(deletedKey);
            return next;
          });
          emitProjectChanged({
            operation: 'deleted',
            project: {
              projectId: String(project.id),
              projectType:
                project.projectType ?? AgentComponentTypeEnum.NormalProject,
              ...(project.spaceId !== undefined
                ? { spaceId: String(project.spaceId) }
                : {}),
            },
            origin: 'project-panel',
            reason: 'delete',
          });
        },
      });
    };

    // 项目行右键菜单:置顶/归档/收藏/项目详情/重命名/删除（标记判断走复合键；
    // flagKey 避免与 onClick 解参 key 遮蔽）。置顶文案全站统一「置顶/取消置顶」
    // （2026-09-21 定调），与会话行共用 ConversationContextMenu 词条
    const buildProjectMenu = (project: ProjectItem) => {
      const flagKey = projectKeyOf(project);
      const detailPath = projectDetailPath(project);
      return {
        items: [
          {
            key: 'pin',
            icon: <PushpinOutlined />,
            label: dict(
              pinnedIds.has(flagKey)
                ? 'PC.Components.ConversationContextMenu.unpin'
                : 'PC.Components.ConversationContextMenu.pin',
            ),
          },
          {
            key: 'archive',
            icon: <InboxOutlined />,
            label: dict(
              archivedIds.has(flagKey)
                ? 'PC.Components.ConversationContextMenu.unarchive'
                : 'PC.Components.ConversationContextMenu.archive',
            ),
          },
          {
            key: 'collect',
            icon: collectedIds.has(flagKey) ? <StarFilled /> : <StarOutlined />,
            label: dict(
              collectedIds.has(flagKey)
                ? 'PC.Components.ConversationContextMenu.unfavorite'
                : 'PC.Components.ConversationContextMenu.favorite',
            ),
          },
          ...(detailPath
            ? [
                {
                  key: 'detail',
                  icon: <ProfileOutlined />,
                  label: dict(
                    'PC.Layouts.DynamicMenusLayout.NewHomeSection.projectDetail',
                  ),
                },
              ]
            : []),
          { type: 'divider' as const },
          {
            key: 'rename',
            icon: <EditOutlined />,
            label: dict('PC.Components.ConversationContextMenu.rename'),
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
            label: dict('PC.Common.Global.delete'),
          },
        ],
        onClick: ({
          key,
          domEvent,
        }: {
          key: string;
          domEvent?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;
        }) => {
          domEvent?.stopPropagation();
          closeProjectMenu();
          if (key === 'pin') {
            toggleProjectFlag('pinned', project);
          } else if (key === 'archive') {
            // 归档走行内二次确认（2026-09-20 定调，同任务行）；取消归档仍直接切换
            if (archivedIds.has(flagKey)) {
              toggleProjectFlag('archived', project);
            } else {
              setArchiveArmingKey(flagKey);
            }
          } else if (key === 'collect') {
            toggleProjectCollected(project);
          } else if (key === 'detail') {
            if (detailPath) history.push(detailPath);
          } else if (key === 'rename') {
            setRenameProjectId(flagKey);
            setProjectRenameName(project.name);
          } else if (key === 'delete') {
            openProjectDelete(project);
          }
        },
      };
    };

    // 子项重命名:走会话改名真实接口,成功后派发 conversation-updated 供任务列表同步
    const handleChildRenameSubmit = async () => {
      if (renaming) return;
      const trimmed = renameName.trim();
      if (!trimmed || !renameTarget) return;
      setRenaming(true);
      try {
        const res = await apiAgentConversationUpdate({
          id: renameTarget.childId,
          topic: trimmed,
        });
        if (res?.success) {
          window.dispatchEvent(
            new CustomEvent('conversation-updated', {
              detail: { id: renameTarget.childId, topic: trimmed },
            }),
          );
          setProjects((prev) =>
            prev.map((project) =>
              projectKeyOf(project) !== renameTarget.projectKey
                ? project
                : {
                    ...project,
                    children: project.children?.map((child) =>
                      child.id === renameTarget.childId
                        ? { ...child, name: trimmed }
                        : child,
                    ),
                  },
            ),
          );
          setRenameTarget(undefined);
        }
      } finally {
        setRenaming(false);
      }
    };

    const handleChildDeleteConfirm = async (
      projectKey: string,
      child: ProjectChildItem,
    ) => {
      if (childDeleting) return;
      setChildDeleting(true);
      try {
        const res = await apiAgentConversationDelete(child.id).catch(
          () => null,
        );
        if (!res?.success) {
          message.error(dict('PC.Common.Global.operationFailed'));
          return;
        }
        window.dispatchEvent(
          new CustomEvent('conversation-deleted', {
            detail: { id: child.id },
          }),
        );
        setProjects((prev) =>
          prev.map((project) =>
            projectKeyOf(project) !== projectKey
              ? project
              : {
                  ...project,
                  children: project.children?.filter(
                    (item) => item.id !== child.id,
                  ),
                },
          ),
        );
        setChildDeleteArmingKey(undefined);
      } finally {
        setChildDeleting(false);
      }
    };

    // 「+ 新建会话」/ 空态「新建会话」共用：常规/全栈项目 → 跳 /home 首页项目
    // 上框（同类型智能体约束 + 建会话绑定项目）；PageApp 契约未覆盖维持提示；
    // 无类型按常规项目兜底
    const handleAddConversation = (project: ProjectItem) => {
      if (project.projectType === AgentComponentTypeEnum.PageApp) {
        message.info(
          dict(
            'PC.Layouts.DynamicMenusLayout.NewHomeSection.addConversationUnavailable',
          ),
        );
        return;
      }
      pin({
        projectId: project.id,
        spaceId: project.spaceId,
        projectType:
          project.projectType ?? AgentComponentTypeEnum.NormalProject,
        name: project.name,
        icon: project.icon,
        sandboxId: project.sandboxId,
        devAgentId: project.devAgentId,
        owner: project.owner,
      });
    };

    // 「+ 新建会话」（项目行）：常规/全栈项目 → 跳 /home 首页项目上框（同类型智能体
    // 约束 + 建会话绑定项目）；PageApp 契约未覆盖维持提示；无类型按常规项目兜底
    const renderAddConversationButton = (project: ProjectItem) => (
      <Tooltip
        title={dict(
          'PC.Layouts.DynamicMenusLayout.NewHomeSection.addConversation',
        )}
      >
        <button
          type="button"
          className={styles['add-conversation']}
          aria-label={dict(
            'PC.Layouts.DynamicMenusLayout.NewHomeSection.addConversation',
          )}
          onClick={(event) => {
            event.stopPropagation();
            handleAddConversation(project);
          }}
        >
          {/* 2026-09-20 定调：新建会话图标回归 + 号（与行图标族 icons-common-* 统一） */}
          <SvgIcon name="icons-common-plus" style={{ fontSize: 15 }} />
        </button>
      </Tooltip>
    );

    if (loading) {
      return (
        <div
          className={cx(styles['project-panel'], { [styles.compact]: compact })}
        >
          <div className={cx(styles['project-loading'])}>
            <Spin size="small" />
          </div>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div
          className={cx(styles['project-panel'], { [styles.compact]: compact })}
        >
          <div className={cx(styles['project-empty'])}>
            <img
              className={cx(styles['project-empty-img'])}
              src={emptyStateNoData}
              alt=""
            />
            <div className={cx(styles['project-empty-text'])}>
              {dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.noProjects')}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cx(styles['project-panel'], { [styles.compact]: compact })}
      >
        {visibleProjects.map((project) => {
          const expanded = !collapsedIds.has(projectKeyOf(project));
          return (
            <div key={projectKeyOf(project)} className={cx(styles.project)}>
              <Dropdown
                {...getDropdownProps(`${projectKeyOf(project)}:context`)}
                menu={buildProjectMenu(project)}
                trigger={['contextMenu']}
              >
                <div
                  className={cx(styles.row, {
                    [styles.expanded]: expanded,
                    [styles['project-archive-arming']]:
                      archiveArmingKey === projectKeyOf(project),
                  })}
                  onClick={() => handleProjectClick(project)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded}
                  onKeyDown={(event) => {
                    if (
                      archiveArmingKey === projectKeyOf(project) &&
                      event.key === 'Escape'
                    ) {
                      event.stopPropagation();
                      setArchiveArmingKey(undefined);
                      return;
                    }
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleProjectClick(project);
                    }
                  }}
                >
                  {/* 固定行首状态槽：默认显示文件夹开合与置顶徽标；hover 在同一
                      槽位切换为置顶/取消置顶操作，项目名不发生横向位移。 */}
                  <span className={cx(styles['project-leading-slot'])}>
                    <span className={cx(styles['folder-badge'])}>
                      {expanded ? (
                        <FolderOpenOutlined
                          className={styles['project-icon']}
                        />
                      ) : (
                        <FolderOutlined className={styles['project-icon']} />
                      )}
                      {pinnedIds.has(projectKeyOf(project)) && (
                        <PushpinFilled
                          className={cx(styles['folder-badge-pin'])}
                        />
                      )}
                    </span>
                    <Tooltip
                      title={dict(
                        pinnedIds.has(projectKeyOf(project))
                          ? 'PC.Components.ConversationContextMenu.unpin'
                          : 'PC.Components.ConversationContextMenu.pin',
                      )}
                      mouseEnterDelay={0.3}
                    >
                      <button
                        type="button"
                        className={cx(styles['project-pin-toggle'])}
                        aria-label={dict(
                          pinnedIds.has(projectKeyOf(project))
                            ? 'PC.Components.ConversationContextMenu.unpin'
                            : 'PC.Components.ConversationContextMenu.pin',
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          void toggleProjectFlag('pinned', project);
                        }}
                      >
                        {pinnedIds.has(projectKeyOf(project)) ? (
                          <span
                            className={cx(styles['unpin-icon'])}
                            aria-hidden
                          >
                            <PushpinFilled />
                            <span className={cx(styles['unpin-slash'])} />
                          </span>
                        ) : (
                          <PushpinOutlined />
                        )}
                      </button>
                    </Tooltip>
                  </span>
                  <span className={cx(styles.name)}>
                    {/* 非创建者项目标题前「团队」图标（2026-09-20 定调，
                        两轮迭代：文字 tag → TeamOutlined 图标；颜色随标题）：
                        owner===false 严格等于判定（接口未回不标） */}
                    {project.owner === false && (
                      <TeamOutlined
                        className={cx(styles['project-team-tag'])}
                      />
                    )}
                    {project.name}
                  </span>
                  <div className={styles['project-actions']}>
                    {archiveArmingKey === projectKeyOf(project) ? (
                      <button
                        type="button"
                        className={cx(styles['archive-confirm'])}
                        data-archive-arming={projectKeyOf(project)}
                        disabled={projectArchiving}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleProjectArchiveConfirm(project);
                        }}
                      >
                        {dict('PC.Common.Global.confirm')}
                      </button>
                    ) : (
                      <>
                        {renderAddConversationButton(project)}
                        <Dropdown
                          {...getDropdownProps(`${projectKeyOf(project)}:more`)}
                          menu={buildProjectMenu(project)}
                          trigger={['click']}
                        >
                          <button
                            type="button"
                            className={styles['project-more']}
                            aria-label={dict('PC.Components.ActionMenu.more')}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <SvgIcon name="icons-common-more" />
                          </button>
                        </Dropdown>
                        {/* 行尾归档入口：点击后操作区收敛为单独的红色确认按钮。 */}
                        <Tooltip
                          title={dict(
                            'PC.Components.ConversationContextMenu.archive',
                          )}
                          mouseEnterDelay={0.3}
                        >
                          <button
                            type="button"
                            className={cx(styles['project-archive'])}
                            data-archive-arming={projectKeyOf(project)}
                            aria-label={dict(
                              'PC.Components.ConversationContextMenu.archive',
                            )}
                            onClick={(event) => {
                              event.stopPropagation();
                              setArchiveArmingKey(projectKeyOf(project));
                            }}
                          >
                            <InboxOutlined />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>
              </Dropdown>
              <div className={styles.children} hidden={!expanded}>
                {/* 子会话懒加载中（统一接口不随列表回包，挂载/翻页后补拉） */}
                {project.children === undefined && (
                  <div className={cx(styles.child)}>
                    <Spin size="small" />
                  </div>
                )}
                {/* 项目下暂无会话（2026-09-20 定调，参考原型）：子行位灰字提示，
                    挂 .child 继承经典/单栏缩进与圆角；带同款空行首槽位使文字与
                    兄弟子行标题同线，无插图/按钮/悬停皮 */}
                {project.children !== undefined &&
                  project.children.length === 0 && (
                    <div
                      className={cx(styles.child, styles['child-empty-row'])}
                    >
                      <span
                        className={cx(styles['child-leading-slot'])}
                        aria-hidden
                      />
                      {dict(
                        'PC.Layouts.DynamicMenusLayout.NewHomeSection.noChats',
                      )}
                    </div>
                  )}
                {(project.children ?? []).map((child) => {
                  const isChildActive =
                    activeConversationId !== undefined &&
                    String(child.id) === activeConversationId;
                  const childActionKey = `${projectKeyOf(project)}:${child.id}`;
                  const childDeleteArmed =
                    childDeleteArmingKey === childActionKey;
                  return (
                    <div
                      key={child.id}
                      className={cx(styles.child, {
                        [styles['child-active']]: isChildActive,
                        [styles['child-delete-arming']]: childDeleteArmed,
                      })}
                      onClick={() => {
                        if (child.conversation) {
                          onConversationClick?.(child.conversation);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-current={isChildActive ? 'page' : undefined}
                      onKeyDown={(event) => {
                        if (childDeleteArmed && event.key === 'Escape') {
                          event.stopPropagation();
                          setChildDeleteArmingKey(undefined);
                          return;
                        }
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (child.conversation) {
                            onConversationClick?.(child.conversation);
                          }
                        }
                      }}
                    >
                      {/* 固定行首状态槽：默认展示运行/失败/未读，hover 在同一位置
                          切换为重命名入口；能力不同但三类行的标题起点保持稳定。 */}
                      <span className={cx(styles['child-leading-slot'])}>
                        <span className={cx(styles['child-leading-status'])}>
                          <ConversationStatusMark
                            taskStatus={
                              leadingMark ||
                              child.taskStatus === TaskStatus.FAILED
                                ? child.taskStatus
                                : undefined
                            }
                            unread={
                              leadingMark &&
                              unreadConversationIds?.has(String(child.id))
                            }
                          />
                        </span>
                        <Tooltip
                          title={dict(
                            'PC.Components.ConversationContextMenu.rename',
                          )}
                          mouseEnterDelay={0.3}
                        >
                          <button
                            type="button"
                            className={styles['child-rename']}
                            aria-label={dict(
                              'PC.Components.ConversationContextMenu.rename',
                            )}
                            onClick={(event) => {
                              event.stopPropagation();
                              setRenameTarget({
                                projectKey: projectKeyOf(project),
                                childId: child.id,
                              });
                              setRenameName(child.name);
                            }}
                          >
                            <EditOutlined />
                          </button>
                        </Tooltip>
                      </span>
                      <span className={cx(styles['child-name'])}>
                        {child.name}
                      </span>
                      {/* leadingMark 开启时「执行中」由行首转圈表达（文字胶囊仅经典布局保留） */}
                      {!leadingMark &&
                        child.taskStatus === TaskStatus.EXECUTING && (
                          <span className={cx(styles['status-tag'])}>
                            {executingText}
                          </span>
                        )}
                      {child.modified && (
                        <span className={cx(styles['child-time'])}>
                          {formatRelativeTime(child.modified)}
                        </span>
                      )}
                      <div className={styles['child-actions']}>
                        {childDeleteArmed ? (
                          <button
                            type="button"
                            className={cx(styles['delete-confirm'])}
                            data-delete-arming={childActionKey}
                            disabled={childDeleting}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleChildDeleteConfirm(
                                projectKeyOf(project),
                                child,
                              );
                            }}
                          >
                            {dict('PC.Common.Global.confirm')}
                          </button>
                        ) : (
                          <Tooltip
                            title={dict('PC.Common.Global.delete')}
                            mouseEnterDelay={0.3}
                          >
                            <button
                              type="button"
                              className={cx(styles['child-delete'])}
                              data-delete-arming={childActionKey}
                              aria-label={dict('PC.Common.Global.delete')}
                              onClick={(event) => {
                                event.stopPropagation();
                                setChildDeleteArmingKey(childActionKey);
                              }}
                            >
                              <DeleteOutlined />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* 查看更多:项目层分页追加 */}
        {hasMore && (
          <button
            type="button"
            className={cx(styles['load-more-entry'])}
            disabled={loadingMore}
            aria-busy={loadingMore}
            onClick={handleLoadMore}
          >
            {loadingMore ? (
              <LoadingOutlined />
            ) : (
              `${dict(
                'PC.Components.AgentConversation.viewMore',
              )} (${remainingCount})`
            )}
          </button>
        )}
        <Modal
          title={dict('PC.Components.HistoryConversationList.renameModalTitle')}
          open={renameTarget !== undefined}
          onOk={handleChildRenameSubmit}
          onCancel={() => setRenameTarget(undefined)}
          confirmLoading={renaming}
          okButtonProps={{ disabled: !renameName.trim() }}
          okText={dict('PC.Common.Global.confirm')}
          cancelText={dict('PC.Common.Global.cancel')}
          destroyOnHidden
        >
          <Input
            value={renameName}
            onChange={(event) => setRenameName(event.target.value)}
            onPressEnter={handleChildRenameSubmit}
            maxLength={50}
          />
        </Modal>
        <Modal
          title={dict('PC.Components.HistoryConversationList.renameModalTitle')}
          open={renameProjectId !== undefined}
          onOk={handleProjectRenameSubmit}
          onCancel={() => setRenameProjectId(undefined)}
          confirmLoading={projectRenaming}
          okButtonProps={{ disabled: !projectRenameName.trim() }}
          okText={dict('PC.Common.Global.confirm')}
          cancelText={dict('PC.Common.Global.cancel')}
          destroyOnHidden
        >
          <Input
            value={projectRenameName}
            onChange={(event) => setProjectRenameName(event.target.value)}
            onPressEnter={handleProjectRenameSubmit}
            maxLength={50}
          />
        </Modal>
      </div>
    );
  },
);

export default ProjectPanel;
