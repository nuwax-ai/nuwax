import emptyStateNoData from '@/assets/images/empty_state_no_data.svg';
import SvgIcon from '@/components/base/SvgIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import {
  apiNormalProjectDelete,
  apiNormalProjectUpdate,
  apiUserAppDelete,
  apiUserAppUpdate,
  apiUserProjectArchive,
  apiUserProjectPin,
  apiUserProjectTabPageQuery,
} from '@/services/userProjectApp';
import { AgentComponentTypeEnum, TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  FolderOutlined,
  InboxOutlined,
  LoadingOutlined,
  PushpinFilled,
  PushpinOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, message, Modal, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams } from 'umi';
import { formatRelativeTime } from '../../utils';
import styles from './index.less';
import {
  appendProjectsPage,
  hasMoreProjects,
  mergeFlagIds,
  PROJECT_PAGE_SIZE,
  remainingProjects,
  toProjectItem,
} from './projectPagination';

const cx = classNames.bind(styles);

/** 项目子项(项目下的会话,来自 tab 接口 conversations) */
export interface ProjectChildItem {
  id: number;
  name: string;
  modified?: string;
  taskStatus?: TaskStatus;
  /** 原始会话数据(点击跳转用) */
  conversation?: ConversationInfo;
}

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
  children?: ProjectChildItem[];
}

/**
 * 「项目」Tab 面板。
 *
 * **项目行:全功能**(2026-09-08 定调)——右键菜单 置顶/归档/重命名/删除,
 * 置顶排前、归档默认隐藏+「已归档」入口,对齐任务列表会话的交互形态。
 * **项目子项(项目下的会话):不做置顶**(同日定调),仅 重命名/删除 + 状态徽标。
 *
 * 数据走 apiUserProjectTabPageQuery（2026-09-08 新接口：项目列表附带各项目会话列表）；
 * 项目层分页（2026-09-12）：首屏 20 条 +「查看更多」按页追加、按 projectId 去重合并；
 * 重命名/删除已接真实接口（项目→normal-project/userapp、子项会话→agent conversation，
 * wiki 2026-09-11 v2 契约）；置顶/归档走 user-project pin/archive（同契约，回读字段
 * 就位后自动恢复），PageApp 契约未覆盖改名删除/置顶归档暂维持本地；
 * 收藏接口未 ready，按产品要求关闭入口。
 */
export interface ProjectPanelHandle {
  toggleAll: () => void;
}

const ProjectPanel = forwardRef<
  ProjectPanelHandle,
  {
    compact?: boolean;
    /** 可见项目数变化上报(分组头计数用,对齐任务计数=过滤归档后的可见数) */
    onVisibleCountChange?: (count: number) => void;
    /** 子项会话点击跳转(与任务列表同一路由逻辑) */
    onConversationClick?: (item: ConversationInfo) => void;
  }
>(({ onVisibleCountChange, onConversationClick, compact = false }, ref) => {
  const { spaceId: spaceIdParam } = useParams() as { spaceId?: string };
  const spaceId = Number(spaceIdParam) || undefined;
  const { pin } = useHomePinnedProjectHandoff();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  // 空态仅在接口返回后展示：加载中先渲染 Spin，避免一进来就闪「暂无项目」
  const [loading, setLoading] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(
    () => new Set(),
  );
  // 项目级标记：置顶/归档回读自后端字段（字段未返回时不标记）
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => new Set());
  const [archivedIds, setArchivedIds] = useState<Set<number>>(() => new Set());
  // 子项重命名弹窗状态(projectId + childId 定位目标子项)
  const [renameTarget, setRenameTarget] = useState<{
    projectId: number;
    childId: number;
  }>();
  const [renameName, setRenameName] = useState('');
  // 项目重命名弹窗状态
  const [renameProjectId, setRenameProjectId] = useState<number>();
  const [projectRenameName, setProjectRenameName] = useState('');
  // 分页：首屏 PROJECT_PAGE_SIZE 条，「查看更多」按页追加（tab 接口 current/pageSize/total 契约）
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const spaceIdRef = useRef(spaceId);

  // 拉取指定页项目列表(page=1 整体替换,后续页追加合并;失败保持现状由空态兜底)
  const fetchPage = useCallback(
    async (page: number, options: { append: boolean }) => {
      const requestSpaceId = spaceIdRef.current;
      if (options.append) setLoadingMore(true);
      try {
        const res = await apiUserProjectTabPageQuery({
          queryFilter: { spaceId: requestSpaceId },
          current: page,
          pageSize: PROJECT_PAGE_SIZE,
          orders: [],
          filters: [],
          columns: [],
        });
        // 空间已切换:丢弃过期响应
        if (requestSpaceId !== spaceIdRef.current) return;
        if (res?.code === SUCCESS_CODE && Array.isArray(res.data?.records)) {
          const records = res.data.records;
          const fallback = dict('PC.Constants.Menus.newChat');
          const mapped = records.map((item) => toProjectItem(item, fallback));
          setProjects((previous) =>
            options.append ? appendProjectsPage(previous, mapped) : mapped,
          );
          // 置顶/归档回读恢复(wiki 2026-09-11 行6 契约先行:字段未返回时不标记;
          // 追加页只并入新标记,不回退已加载页)
          const pageFlagIds = (flag: 'pinned' | 'archived') =>
            new Set(
              records
                .filter((item) => item[flag] === true)
                .map((item) => item.projectId),
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
          pageRef.current = page;
          setTotal(res.data.total ?? 0);
        }
      } catch {
        // 忽略:保持现有列表
      } finally {
        if (options.append) setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    spaceIdRef.current = spaceId;
    pageRef.current = 1;
    void fetchPage(1, { append: false }).finally(() => setLoading(false));
  }, [spaceId, fetchPage]);

  const hasMore = hasMoreProjects(projects.length, total);
  const remainingCount = remainingProjects(projects.length, total);
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    void fetchPage(pageRef.current + 1, { append: true });
  };

  const executingText = dict(
    'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
  );
  const failedText = dict(
    'PC.Layouts.DynamicMenusLayout.NewHomeSection.failedTask',
  );

  const handleProjectClick = (project: ProjectItem) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(project.id)) {
        next.delete(project.id);
      } else {
        next.add(project.id);
      }
      return next;
    });
  };

  // 项目可见列表:隐藏归档项（侧栏不设归档查看入口）、置顶排前(稳定排序保持原相对顺序)
  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((item) => !archivedIds.has(item.id));
    return [...filtered].sort(
      (a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)),
    );
  }, [projects, archivedIds, pinnedIds]);

  useImperativeHandle(
    ref,
    () => ({
      toggleAll: () =>
        setCollapsedIds((previous) => {
          const allExpanded = visibleProjects.every(
            (project) => !previous.has(project.id),
          );
          const next = new Set(previous);
          visibleProjects.forEach((project) => {
            if (allExpanded) next.add(project.id);
            else next.delete(project.id);
          });
          return next;
        }),
    }),
    [visibleProjects],
  );

  useEffect(() => {
    onVisibleCountChange?.(visibleProjects.length);
  }, [visibleProjects.length, onVisibleCountChange]);

  // 项目标记 toggle：置顶/归档走项目级后端接口（常规/全栈项目；
  // PageApp 契约未覆盖暂本地）。后端成功才更新标记，
  // 失败 toast 不动状态;toast 文案与任务会话菜单同款
  const toggleProjectFlag = (
    kind: 'pinned' | 'archived',
    project: ProjectItem,
  ) => {
    const setter = kind === 'pinned' ? setPinnedIds : setArchivedIds;
    const applyFlag = () => {
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(project.id)) {
          next.delete(project.id);
        } else {
          next.add(project.id);
        }
        return next;
      });
    };
    const enabled = !(kind === 'pinned' ? pinnedIds : archivedIds).has(
      project.id,
    );
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
      const res = await request(project.id).catch(() => null);
      if (res?.code !== SUCCESS_CODE) {
        message.error(dict('PC.Common.Global.operationFailed'));
        return;
      }
      applyFlag();
      message.success(dict(toastKeyMap[kind]));
    })();
  };

  // 项目重命名:常规项目/全栈应用走真实接口,PageApp 契约未覆盖暂维持本地改名
  const handleProjectRenameSubmit = async () => {
    const trimmed = projectRenameName.trim();
    if (!trimmed || !renameProjectId) return;
    const target = projects.find((project) => project.id === renameProjectId);
    if (!target) return;
    if (
      target.projectType === AgentComponentTypeEnum.NormalProject ||
      target.projectType === AgentComponentTypeEnum.UserApp
    ) {
      const res =
        target.projectType === AgentComponentTypeEnum.UserApp
          ? await apiUserAppUpdate({ id: target.id, name: trimmed })
          : await apiNormalProjectUpdate({ id: target.id, name: trimmed });
      if (res?.code !== SUCCESS_CODE) return;
    }
    setProjects((prev) =>
      prev.map((project) =>
        project.id !== renameProjectId
          ? project
          : { ...project, name: trimmed },
      ),
    );
    setRenameProjectId(undefined);
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
        setProjects((prev) => prev.filter((item) => item.id !== project.id));
        setPinnedIds((prev) => {
          const next = new Set(prev);
          next.delete(project.id);
          return next;
        });
        setArchivedIds((prev) => {
          const next = new Set(prev);
          next.delete(project.id);
          return next;
        });
      },
    });
  };

  // 项目行右键菜单:置顶/归档/重命名/删除；收藏接口未 ready，暂不展示
  const buildProjectMenu = (project: ProjectItem) => ({
    items: [
      {
        key: 'pin',
        icon: <PushpinOutlined />,
        label: dict(
          pinnedIds.has(project.id)
            ? 'PC.Components.ConversationContextMenu.unpin'
            : 'PC.Components.ConversationContextMenu.pin',
        ),
      },
      {
        key: 'archive',
        icon: <InboxOutlined />,
        label: dict(
          archivedIds.has(project.id)
            ? 'PC.Components.ConversationContextMenu.unarchive'
            : 'PC.Components.ConversationContextMenu.archive',
        ),
      },
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
    onClick: ({ key }: { key: string }) => {
      if (key === 'pin') {
        toggleProjectFlag('pinned', project);
      } else if (key === 'archive') {
        toggleProjectFlag('archived', project);
      } else if (key === 'rename') {
        setRenameProjectId(project.id);
        setProjectRenameName(project.name);
      } else if (key === 'delete') {
        openProjectDelete(project);
      }
    },
  });

  // 子项重命名:走会话改名真实接口,成功后派发 conversation-updated 供任务列表同步
  const handleChildRenameSubmit = async () => {
    const trimmed = renameName.trim();
    if (!trimmed || !renameTarget) return;
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
          project.id !== renameTarget.projectId
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
  };

  const openChildDelete = (projectId: number, child: ProjectChildItem) => {
    Modal.confirm({
      title: dict('PC.Common.Global.deleteConfirmTitle'),
      content: dict('PC.Common.Global.deleteConfirmContent'),
      okButtonProps: { danger: true },
      okText: dict('PC.Common.Global.delete'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        const res = await apiAgentConversationDelete(child.id);
        if (res?.success) {
          window.dispatchEvent(
            new CustomEvent('conversation-deleted', {
              detail: { id: child.id },
            }),
          );
          setProjects((prev) =>
            prev.map((project) =>
              project.id !== projectId
                ? project
                : {
                    ...project,
                    children: project.children?.filter(
                      (item) => item.id !== child.id,
                    ),
                  },
            ),
          );
        }
      },
    });
  };

  // 子项菜单:项目下的会话不做置顶(2026-09-08 定调),仅 重命名/删除
  const buildChildMenu = (projectId: number, child: ProjectChildItem) => ({
    items: [
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
    onClick: ({ key }: { key: string }) => {
      if (key === 'rename') {
        setRenameTarget({ projectId, childId: child.id });
        setRenameName(child.name);
      } else if (key === 'delete') {
        openChildDelete(projectId, child);
      }
    },
  });

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
          });
        }}
      >
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
    <div className={cx(styles['project-panel'], { [styles.compact]: compact })}>
      {visibleProjects.map((project) => {
        const expanded = !collapsedIds.has(project.id);
        return (
          <div key={project.id} className={cx(styles.project)}>
            <Dropdown
              menu={buildProjectMenu(project)}
              trigger={['contextMenu']}
            >
              <div
                className={cx(styles.row, { [styles.expanded]: expanded })}
                onClick={() => handleProjectClick(project)}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleProjectClick(project);
                  }
                }}
              >
                {compact && (
                  <FolderOutlined className={styles['project-icon']} />
                )}
                {pinnedIds.has(project.id) && (
                  <PushpinFilled className={cx(styles['pin-icon'])} />
                )}
                <span className={cx(styles.name)}>{project.name}</span>
                <div className={styles['project-actions']}>
                  {renderAddConversationButton(project)}
                  <Dropdown
                    menu={buildProjectMenu(project)}
                    trigger={['click']}
                  >
                    <button
                      type="button"
                      className={styles['project-more']}
                      aria-label={dict('PC.Components.ActionMenu.more')}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <SvgIcon
                        name="icons-common-more"
                        style={{ fontSize: 15 }}
                      />
                    </button>
                  </Dropdown>
                </div>
                <SvgIcon
                  name="icons-common-caret_down"
                  style={{ fontSize: 18 }}
                  className={cx(styles.arrow, {
                    [styles.arrowExpanded]: expanded,
                  })}
                />
              </div>
            </Dropdown>
            <div className={styles.children} hidden={!expanded}>
              {(project.children ?? []).map((child) => (
                <div
                  key={child.id}
                  className={cx(styles.child)}
                  onClick={() => {
                    if (child.conversation) {
                      onConversationClick?.(child.conversation);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (child.conversation) {
                        onConversationClick?.(child.conversation);
                      }
                    }
                  }}
                >
                  {child.taskStatus === TaskStatus.EXECUTING && (
                    <span
                      className={cx(styles['status-dot'])}
                      aria-label={executingText}
                    />
                  )}
                  {child.taskStatus === TaskStatus.FAILED && (
                    <ExclamationCircleFilled
                      className={cx(styles['status-failed'])}
                      aria-label={failedText}
                    />
                  )}
                  <span className={cx(styles['child-name'])}>{child.name}</span>
                  {child.modified && (
                    <span className={cx(styles['child-time'])}>
                      {formatRelativeTime(child.modified)}
                    </span>
                  )}
                  <div className={styles['child-actions']}>
                    {/* 子任务悬停操作浮层 */}
                    <Dropdown
                      menu={buildChildMenu(project.id, child)}
                      trigger={['click']}
                    >
                      <button
                        type="button"
                        aria-label={dict('PC.Components.ActionMenu.more')}
                        className={cx(styles['child-more'])}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <SvgIcon
                          name="icons-common-more"
                          style={{ fontSize: 15 }}
                        />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* 查看更多:项目层分页追加 */}
      {hasMore && (
        <div className={cx(styles['load-more-entry'])} onClick={handleLoadMore}>
          {loadingMore ? (
            <LoadingOutlined />
          ) : (
            `${dict(
              'PC.Components.AgentConversation.viewMore',
            )} (${remainingCount})`
          )}
        </div>
      )}
      <Modal
        title={dict('PC.Components.HistoryConversationList.renameModalTitle')}
        open={renameTarget !== undefined}
        onOk={handleChildRenameSubmit}
        onCancel={() => setRenameTarget(undefined)}
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
});

export default ProjectPanel;
