import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  MoreOutlined,
  PushpinFilled,
  PushpinOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Dropdown, Input, message, Modal, Typography } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 项目子项(文档/会话等内容) */
export interface ProjectChildItem {
  id: string;
  name: string;
  modified?: string;
  taskStatus?: TaskStatus;
}

/** 项目列表项 */
export interface ProjectItem {
  id: string;
  name: string;
  children?: ProjectChildItem[];
}

/**
 * MOCK:项目列表数据(参照设计原型样例),仅用于交互/UI 确认。
 * TODO(后端):项目数据接口就绪后删除此 mock,数据改为接口下发。
 */
const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'p-1',
    name: '类飞书文档协作工具',
    children: [
      {
        id: 'c-1-1',
        name: '技术方案评审稿 v1.1',
        modified: '昨天',
        taskStatus: TaskStatus.EXECUTING,
      },
      {
        id: 'c-1-2',
        name: '租户隔离与需求裁剪',
        modified: '8月18日',
        taskStatus: TaskStatus.FAILED,
      },
      { id: 'c-1-3', name: 'Yjs 实时协作接入', modified: '8月17日' },
    ],
  },
  {
    id: 'p-2',
    name: '智能音箱音乐源接入',
    children: [
      { id: 'c-2-1', name: '音源协议调研', modified: '前天' },
      { id: 'c-2-2', name: 'Demo 工程搭建', modified: '8月20日' },
    ],
  },
  { id: 'p-3', name: '云南出行方案预览页' },
  { id: 'p-4', name: '湖光秋色志' },
  { id: 'p-5', name: '女娲智能体OS产品介绍PPT' },
];

/**
 * 「项目」Tab 面板。
 *
 * 项目行:名称 + 「+」新建 + 展开箭头;点击行切换展开,展开显示项目子项。
 * 子项:执行中绿点 / 失败红叹号状态徽标 + 悬停「⋯」菜单(置顶/重命名/删除)。
 *
 * 当前为 mock 数据阶段(后端接口未 ready):菜单操作仅改本地 mock 数据
 * 用于交互验证,子项点击与「+」均不触发跳转/创建。
 */
const ProjectPanel: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);
  // 默认展开第一个项目(与原型一致)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(MOCK_PROJECTS[0] ? [MOCK_PROJECTS[0].id] : []),
  );
  const [pinnedChildIds, setPinnedChildIds] = useState<Set<string>>(
    () => new Set(),
  );
  // 重命名弹窗状态(projectId + childId 定位目标子项)
  const [renameTarget, setRenameTarget] = useState<{
    projectId: string;
    childId: string;
  }>();
  const [renameName, setRenameName] = useState('');

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

  const sortChildren = (children: ProjectChildItem[]) =>
    [...children].sort(
      (a, b) =>
        Number(pinnedChildIds.has(b.id)) - Number(pinnedChildIds.has(a.id)),
    );

  const handleTogglePin = (projectId: string, child: ProjectChildItem) => {
    const nextPinned = !pinnedChildIds.has(child.id);
    setPinnedChildIds((prev) => {
      const next = new Set(prev);
      if (nextPinned) {
        next.add(child.id);
      } else {
        next.delete(child.id);
      }
      return next;
    });
    message.success(
      dict(
        nextPinned
          ? 'PC.Components.ConversationContextMenu.pinnedToast'
          : 'PC.Components.ConversationContextMenu.unpinnedToast',
      ),
    );
    void projectId;
  };

  const openRename = (projectId: string, child: ProjectChildItem) => {
    setRenameTarget({ projectId, childId: child.id });
    setRenameName(child.name);
  };

  const handleRenameSubmit = () => {
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

  const openDelete = (projectId: string, child: ProjectChildItem) => {
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
        setPinnedChildIds((prev) => {
          const next = new Set(prev);
          next.delete(child.id);
          return next;
        });
      },
    });
  };

  const buildChildMenu = (projectId: string, child: ProjectChildItem) => ({
    items: [
      {
        key: 'pin',
        icon: <PushpinOutlined />,
        label: dict(
          pinnedChildIds.has(child.id)
            ? 'PC.Components.ConversationContextMenu.unpin'
            : 'PC.Components.ConversationContextMenu.pin',
        ),
      },
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
        handleTogglePin(projectId, child);
      } else if (key === 'rename') {
        openRename(projectId, child);
      } else if (key === 'delete') {
        openDelete(projectId, child);
      }
    },
  });

  if (projects.length === 0) {
    return (
      <div className={cx(styles['project-panel'])}>
        <Typography.Text
          type="secondary"
          className={cx(styles['project-empty'])}
        >
          {dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.noProjects')}
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className={cx(styles['project-panel'])}>
      {projects.map((project) => {
        const expanded = expandedIds.has(project.id);
        return (
          <div key={project.id} className={cx(styles.project)}>
            <div
              className={cx(styles.row, { [styles.expanded]: expanded })}
              onClick={() => handleProjectClick(project)}
              role="button"
              tabIndex={-1}
            >
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
            {expanded &&
              sortChildren(project.children ?? []).map((child) => (
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
                  {pinnedChildIds.has(child.id) && (
                    <PushpinFilled className={cx(styles['pin-icon'])} />
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
      <Modal
        title={dict('PC.Components.HistoryConversationList.renameModalTitle')}
        open={renameTarget !== undefined}
        onOk={handleRenameSubmit}
        onCancel={() => setRenameTarget(undefined)}
        okButtonProps={{ disabled: !renameName.trim() }}
        okText={dict('PC.Common.Global.confirm')}
        cancelText={dict('PC.Common.Global.cancel')}
        destroyOnHidden
      >
        <Input
          value={renameName}
          onChange={(event) => setRenameName(event.target.value)}
          onPressEnter={handleRenameSubmit}
          maxLength={50}
        />
      </Modal>
    </div>
  );
};

export default ProjectPanel;
