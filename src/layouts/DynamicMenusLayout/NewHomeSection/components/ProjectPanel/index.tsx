import emptyStateNoData from '@/assets/images/empty_state_no_data.svg';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiUserProjectPageQuery } from '@/pages/AppDevPro/services/appDevPro';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  InboxOutlined,
  MoreOutlined,
  PushpinFilled,
  PushpinOutlined,
  RightOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 项目子项(项目下的会话等内容) */
export interface ProjectChildItem {
  id: string;
  name: string;
  modified?: string;
  taskStatus?: TaskStatus;
}

/** 项目列表项 */
export interface ProjectItem {
  id: number;
  name: string;
  children?: ProjectChildItem[];
}

/**
 * 「项目」Tab 面板。
 *
 * **项目行:全功能**(2026-09-08 定调)——右键菜单 置顶/归档/收藏/重命名/删除,
 * 置顶排前、归档默认隐藏+「已归档」入口,对齐任务列表会话的交互形态。
 * **项目子项(项目下的会话):不做置顶**(同日定调),仅 重命名/删除 + 状态徽标。
 *
 * 数据走 apiUserProjectPageQuery 真实接口（当前空间全量项目）；
 * 项目下会话列表后端暂无端点，children 先空（TODO(后端):会话列表接口就绪后接入）。
 * 置顶/归档/收藏/重命名/删除仍为本地标记(后端置顶/归档接口开发中)；
 * 后端就绪后项目操作迁到服务端、子项删除/重命名切到会话真实接口
 * (apiAgentConversationDelete/Update)。
 */
const ProjectPanel: React.FC<{
  /** 可见项目数变化上报(分组头计数用,对齐任务计数=过滤归档后的可见数) */
  onVisibleCountChange?: (count: number) => void;
}> = ({ onVisibleCountChange }) => {
  const { spaceId: spaceIdParam } = useParams() as { spaceId?: string };
  const spaceId = Number(spaceIdParam) || undefined;

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
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
    childId: string;
  }>();
  const [renameName, setRenameName] = useState('');
  // 项目重命名弹窗状态
  const [renameProjectId, setRenameProjectId] = useState<number>();
  const [projectRenameName, setProjectRenameName] = useState('');

  // 拉取当前空间的项目列表(真实接口,失败保持空列表由空态兜底)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiUserProjectPageQuery({
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
              id: item.id,
              name: item.name,
            })),
          );
        }
      } catch {
        // 忽略:保持空列表
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
    setExpandedIds((prev) => {
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

  const handleProjectRenameSubmit = () => {
    const trimmed = projectRenameName.trim();
    if (!trimmed || !renameProjectId) return;
    setProjects((prev) =>
      prev.map((project) =>
        project.id !== renameProjectId
          ? project
          : { ...project, name: trimmed },
      ),
    );
    setRenameProjectId(undefined);
  };

  const openProjectDelete = (project: ProjectItem) => {
    Modal.confirm({
      title: dict('PC.Common.Global.deleteConfirmTitle'),
      content: dict('PC.Common.Global.deleteConfirmContent'),
      okButtonProps: { danger: true },
      okText: dict('PC.Common.Global.delete'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: () => {
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

  const handleChildRenameSubmit = () => {
    const trimmed = renameName.trim();
    if (!trimmed || !renameTarget) return;
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
  };

  const openChildDelete = (projectId: number, child: ProjectChildItem) => {
    Modal.confirm({
      title: dict('PC.Common.Global.deleteConfirmTitle'),
      content: dict('PC.Common.Global.deleteConfirmContent'),
      okButtonProps: { danger: true },
      okText: dict('PC.Common.Global.delete'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: () => {
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

  if (projects.length === 0) {
    return (
      <div className={cx(styles['project-panel'])}>
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
    <div className={cx(styles['project-panel'])}>
      {visibleProjects.map((project) => {
        const expanded = expandedIds.has(project.id);
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
                tabIndex={-1}
              >
                {pinnedIds.has(project.id) && (
                  <PushpinFilled className={cx(styles['pin-icon'])} />
                )}
                {collectedIds.has(project.id) && (
                  <StarFilled className={cx(styles['star-icon'])} />
                )}
                <span className={cx(styles.name)} title={project.name}>
                  {project.name}
                </span>
                {/* 新建会话入口:mock 阶段不触发动作,仅阻断行展开 */}
                <span
                  className={cx(styles.add)}
                  onClick={(event) => event.stopPropagation()}
                  title={dict('PC.Constants.Menus.newChat')}
                >
                  +
                </span>
                <RightOutlined
                  className={cx(styles.arrow, {
                    [styles.arrowExpanded]: expanded,
                  })}
                />
              </div>
            </Dropdown>
            {expanded &&
              (project.children ?? []).map((child) => (
                <div key={child.id} className={cx(styles.child)}>
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
                      {child.modified}
                    </span>
                  )}
                  {/* 「⋯」操作菜单:mock 阶段操作仅改本地数据 */}
                  <Dropdown
                    menu={buildChildMenu(project.id, child)}
                    trigger={['click']}
                  >
                    <span
                      className={cx(styles['child-more'])}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreOutlined />
                    </span>
                  </Dropdown>
                </div>
              ))}
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
};

export default ProjectPanel;
