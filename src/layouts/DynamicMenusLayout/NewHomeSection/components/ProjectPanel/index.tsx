import emptyStateNoData from '@/assets/images/empty_state_no_data.svg';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import {
  apiAgentConversationDelete,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import {
  apiUserAppDelete,
  apiUserAppUpdate,
  apiUserProjectDelete,
  apiUserProjectTabPageQuery,
  apiUserProjectUpdate,
} from '@/services/userProjectApp';
import { AgentComponentTypeEnum, TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleFilled,
  FolderOutlined,
  InboxOutlined,
  PlusOutlined,
  PushpinFilled,
  PushpinOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, message, Modal, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'umi';
import { formatRelativeTime } from '../../utils';
import styles from './index.less';

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
 * **项目行:全功能**(2026-09-08 定调)——右键菜单 置顶/归档/收藏/重命名/删除,
 * 置顶排前、归档默认隐藏+「已归档」入口,对齐任务列表会话的交互形态。
 * **项目子项(项目下的会话):不做置顶**(同日定调),仅 重命名/删除 + 状态徽标。
 *
 * 数据走 apiUserProjectTabPageQuery（2026-09-08 新接口：项目列表附带各项目会话列表）；
 * 重命名/删除已接真实接口（项目→user-project/userapp、子项会话→agent conversation），
 * PageApp 契约未覆盖改名删除、置顶/归档/收藏后端接口开发中，仍维持本地标记。
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
  // 项目级标记(置顶/归档/收藏后端接口开发中,先本地 state)
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(() => new Set());
  const [archivedIds, setArchivedIds] = useState<Set<number>>(() => new Set());
  const [collectedIds, setCollectedIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [showArchived, setShowArchived] = useState(false);
  // 子项重命名弹窗状态(projectId + childId 定位目标子项)
  const [renameTarget, setRenameTarget] = useState<{
    projectId: number;
    childId: number;
  }>();
  const [renameName, setRenameName] = useState('');
  // 项目重命名弹窗状态
  const [renameProjectId, setRenameProjectId] = useState<number>();
  const [projectRenameName, setProjectRenameName] = useState('');

  // 拉取当前空间的项目列表(tab 接口附带各项目会话列表,失败保持空列表由空态兜底)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiUserProjectTabPageQuery({
          queryFilter: { spaceId },
          current: 1,
          pageSize: 100,
          orders: [],
          filters: [],
          columns: [],
        });
        if (cancelled) return;
        if (res?.code === SUCCESS_CODE && Array.isArray(res.data?.records)) {
          setProjects(
            res.data.records.map((item) => ({
              id: item.projectId,
              name: item.name,
              projectType: item.projectType,
              spaceId: item.spaceId,
              icon: item.icon,
              sandboxId: item.sandboxId,
              devAgentId: item.devAgentId,
              children: (item.conversations ?? []).map((conversation) => ({
                id: conversation.id,
                // 空主题回退与任务列表 ConversationItem 同口径
                name:
                  conversation.topic ||
                  conversation.agent?.name ||
                  dict('PC.Constants.Menus.newChat'),
                modified: conversation.modified,
                taskStatus: conversation.taskStatus,
                conversation,
              })),
            })),
          );
        }
      } catch {
        // 忽略:保持空列表
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

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

  // 项目可见列表:默认隐藏归档、置顶排前(稳定排序保持原相对顺序);已归档视图只看归档项
  const visibleProjects = useMemo(() => {
    const filtered = showArchived
      ? projects.filter((item) => archivedIds.has(item.id))
      : projects.filter((item) => !archivedIds.has(item.id));
    return [...filtered].sort(
      (a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)),
    );
  }, [projects, archivedIds, showArchived, pinnedIds]);

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

  const archivedProjectCount = useMemo(
    () => projects.filter((item) => archivedIds.has(item.id)).length,
    [projects, archivedIds],
  );

  useEffect(() => {
    onVisibleCountChange?.(visibleProjects.length);
  }, [visibleProjects.length, onVisibleCountChange]);

  // 项目标记 toggle:toast 反馈(与任务会话菜单同款文案)
  const toggleProjectFlag = (
    kind: 'pinned' | 'archived' | 'collected',
    project: ProjectItem,
  ) => {
    const setter =
      kind === 'pinned'
        ? setPinnedIds
        : kind === 'archived'
        ? setArchivedIds
        : setCollectedIds;
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(project.id)) {
        next.delete(project.id);
      } else {
        next.add(project.id);
      }
      return next;
    });
    const enabled = !(
      kind === 'pinned'
        ? pinnedIds
        : kind === 'archived'
        ? archivedIds
        : collectedIds
    ).has(project.id);
    const toastKeyMap = {
      pinned: enabled
        ? 'PC.Components.ConversationContextMenu.pinnedToast'
        : 'PC.Components.ConversationContextMenu.unpinnedToast',
      archived: enabled
        ? 'PC.Components.ConversationContextMenu.archivedToast'
        : 'PC.Components.ConversationContextMenu.unarchivedToast',
      collected: enabled
        ? 'PC.Components.ConversationContextMenu.collectedToast'
        : 'PC.Components.ConversationContextMenu.uncollectedToast',
    } as const;
    message.success(dict(toastKeyMap[kind]));
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
          : await apiUserProjectUpdate({ id: target.id, name: trimmed });
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
              : await apiUserProjectDelete(project.id);
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
        setCollectedIds((prev) => {
          const next = new Set(prev);
          next.delete(project.id);
          return next;
        });
      },
    });
  };

  // 项目行右键菜单:置顶/归档/收藏/重命名/删除(全功能,对齐任务会话菜单结构)
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
      {
        key: 'favorite',
        icon: collectedIds.has(project.id) ? <StarFilled /> : <StarOutlined />,
        label: dict(
          collectedIds.has(project.id)
            ? 'PC.Components.ConversationContextMenu.unfavorite'
            : 'PC.Components.ConversationContextMenu.favorite',
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
      } else if (key === 'favorite') {
        toggleProjectFlag('collected', project);
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

  // 「+ 新建会话」：常规/全栈项目 → 跳 /home 首页项目上框（同类型智能体约束 +
  // 直接建会话绑定项目）；PageApp 契约未覆盖维持提示；无类型按常规项目兜底
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
        <PlusOutlined />
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
                {collectedIds.has(project.id) && (
                  <StarFilled className={cx(styles['star-icon'])} />
                )}
                <span className={cx(styles.name)} title={project.name}>
                  {project.name}
                </span>
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
                      <EllipsisOutlined />
                    </button>
                  </Dropdown>
                </div>
                <DownOutlined
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
                  <span className={cx(styles['child-name'])} title={child.name}>
                    {child.name}
                  </span>
                  {child.modified && (
                    <span className={cx(styles['child-time'])}>
                      {formatRelativeTime(child.modified)}
                    </span>
                  )}
                  <div className={styles['child-actions']}>
                    {renderAddConversationButton(project)}
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
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {/* 已归档项目入口:存在归档项或处于已归档视图时显示(mock 阶段本地标记) */}
      {(archivedProjectCount > 0 || showArchived) && (
        <div
          className={cx(styles['archived-entry'])}
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived
            ? dict(
                'PC.Layouts.DynamicMenusLayout.NewHomeSection.backToProjects',
              )
            : `${dict(
                'PC.Layouts.DynamicMenusLayout.NewHomeSection.archivedProjects',
              )} (${archivedProjectCount})`}
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
