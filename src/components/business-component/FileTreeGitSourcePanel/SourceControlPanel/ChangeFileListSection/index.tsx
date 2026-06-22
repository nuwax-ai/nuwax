import SvgIcon from '@/components/base/SvgIcon';
import fileTreeStyles from '@/components/business-component/FileTreeGitSourcePanel/FileTreePanel/FileTree/index.less';
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { getFileIcon } from '@/utils/fileTree';
import {
  FileTextOutlined,
  MinusOutlined,
  PlusOutlined,
  RightOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeListItem } from '../../utils/buildChangeFileTree';
import {
  buildChangeFileTree,
  type ChangeTreeNode,
} from '../../utils/buildChangeFileTree';
import {
  type ChangeListSection,
  isChangeFileSelected,
  type SelectedChangeFile,
} from '../../utils/changeFileStatus';
import styles from './index.less';

const cx = classNames.bind(styles);
const fileTreeCx = classNames.bind(fileTreeStyles);

export type ChangeListViewMode = 'list' | 'tree';

export interface ChangeFileListSectionProps {
  /** 区块标题 */
  title: string;
  /** 变更项列表 */
  items: ChangeListItem[];
  /** 展示模式：平铺列表 / 目录树 */
  viewMode: ChangeListViewMode;
  /** 当前列表所属区块 */
  section: ChangeListSection;
  /** 当前选中的变更文件（含区块，避免跨区块重复高亮） */
  selectedChangeFile?: SelectedChangeFile | null;
  /** 空状态文案 */
  emptyText?: string;
  /** 点击文件项 */
  onFileClick?: (fileId: string, section: ChangeListSection) => void;
  /** 文件右键菜单 */
  onContextMenu?: (e: React.MouseEvent, fileId: string) => void;
  /** 树形视图文件夹右键菜单 */
  onFolderContextMenu?: (e: React.MouseEvent, folderId: string) => void;
  /** 打开文件 */
  onOpenFile?: (fileId: string) => void;
  /** 放弃更改 */
  onDiscardChange?: (fileId: string, fileName: string) => void;
  /** 暂存更改 */
  onStageChange?: (fileId: string) => void;
  /** 取消暂存 */
  onUnstageChange?: (fileId: string) => void;
  /** 放弃区块内所有更改 */
  onDiscardAllChanges?: () => void;
  /** 暂存区块内所有更改 */
  onStageAllChanges?: () => void;
  /** 取消区块内所有暂存 */
  onUnstageAllChanges?: () => void;
}

/**
 * 源代码管理变更列表区块（支持列表 / 树形两种视图）
 * 树形视图对齐 FileTree 组件的图标与展示方式
 */
const ChangeFileListSection: React.FC<ChangeFileListSectionProps> = ({
  title,
  items,
  viewMode,
  section,
  selectedChangeFile,
  emptyText,
  onFileClick,
  onContextMenu,
  onFolderContextMenu,
  onOpenFile,
  onDiscardChange,
  onStageChange,
  onUnstageChange,
  onDiscardAllChanges,
  onStageAllChanges,
  onUnstageAllChanges,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const treeNodes = useMemo(
    () => (viewMode === 'tree' ? buildChangeFileTree(items) : []),
    [items, viewMode],
  );

  /** 树形视图下默认展开所有文件夹 */
  useEffect(() => {
    if (viewMode !== 'tree' || !treeNodes.length) {
      return;
    }

    const collectFolderIds = (
      nodes: ChangeTreeNode[],
      ids: Set<string>,
    ): void => {
      nodes.forEach((node) => {
        if (node.type === 'folder') {
          ids.add(node.id);
          if (node.children?.length) {
            collectFolderIds(node.children, ids);
          }
        }
      });
    };

    const ids = new Set<string>();
    collectFolderIds(treeNodes, ids);
    setExpandedFolders(ids);
  }, [treeNodes, viewMode]);

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  /** 是否为已删除文件（展示删除横线） */
  const isDeletedFile = (item: ChangeListItem) =>
    item.statusMeta.kind === 'deleted';

  /** 是否为合并冲突文件（大红加粗展示） */
  const isConflictFile = (item: ChangeListItem) =>
    item.statusMeta.kind === 'conflict';

  const renderStatusBadge = (item: ChangeListItem) => (
    <span
      className={cx(
        styles['status-badge'],
        styles[`status-badge--${item.statusMeta.kind}`],
        {
          [styles['status-badge--staged']]: item.statusMeta.isStaged,
        },
      )}
    >
      {item.statusMeta.label}
    </span>
  );

  /** 列表视图：悬停时展示快捷操作（与右键菜单对应能力一致） */
  const renderListRowActions = (item: ChangeListItem) => {
    const stopRowClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    const openFileLabel = dict(
      'PC.Pages.ConversationAgentSourceControl.openFile',
    );

    const actions = (
      section === 'staged'
        ? [
            {
              key: 'openFile',
              title: openFileLabel,
              icon: <FileTextOutlined />,
              enabled: Boolean(onOpenFile),
              onClick: () => onOpenFile?.(item.fileId),
            },
            {
              key: 'unstage',
              title: dict(
                'PC.Pages.ConversationAgentSourceControl.unstageChanges',
              ),
              icon: <MinusOutlined />,
              enabled: Boolean(onUnstageChange),
              onClick: () => onUnstageChange?.(item.fileId),
            },
          ]
        : [
            {
              key: 'openFile',
              title: openFileLabel,
              icon: <FileTextOutlined />,
              enabled: Boolean(onOpenFile),
              onClick: () => onOpenFile?.(item.fileId),
            },
            {
              key: 'discard',
              title: dict(
                'PC.Pages.ConversationAgentSourceControl.discardChanges',
              ),
              icon: <UndoOutlined />,
              enabled: Boolean(onDiscardChange),
              onClick: () => onDiscardChange?.(item.fileId, item.fileName),
            },
            {
              key: 'stage',
              title: dict(
                'PC.Pages.ConversationAgentSourceControl.stageChanges',
              ),
              icon: <PlusOutlined />,
              enabled: Boolean(onStageChange),
              onClick: () => onStageChange?.(item.fileId),
            },
          ]
    ).filter((action) => action.enabled);

    if (!actions.length) {
      return null;
    }

    return (
      <div className={cx(styles['row-actions'])} onClick={stopRowClick}>
        {actions.map((action) => (
          <TooltipIcon
            key={action.key}
            title={action.title}
            ariaLabel={action.title}
            placement="top"
            className={cx(styles['row-action-btn'])}
            icon={action.icon}
            onClick={action.onClick}
          />
        ))}
      </div>
    );
  };

  /** 区块标题悬停：批量操作（放弃/暂存/取消暂存全部） */
  const renderSectionHeaderActions = () => {
    const stopHeaderClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    const actions = (
      section === 'staged'
        ? [
            {
              key: 'unstageAll',
              title: dict(
                'PC.Pages.ConversationAgentSourceControl.unstageAllChanges',
              ),
              icon: <MinusOutlined />,
              enabled: Boolean(onUnstageAllChanges),
              onClick: () => onUnstageAllChanges?.(),
            },
          ]
        : [
            {
              key: 'discardAll',
              title: dict(
                'PC.Pages.ConversationAgentSourceControl.discardAllChanges',
              ),
              icon: <UndoOutlined />,
              enabled: Boolean(onDiscardAllChanges),
              onClick: () => onDiscardAllChanges?.(),
            },
            {
              key: 'stageAll',
              title: dict(
                'PC.Pages.ConversationAgentSourceControl.stageAllChanges',
              ),
              icon: <PlusOutlined />,
              enabled: Boolean(onStageAllChanges),
              onClick: () => onStageAllChanges?.(),
            },
          ]
    ).filter((action) => action.enabled);

    if (!actions.length) {
      return null;
    }

    return (
      <div
        className={cx(styles['changes-header-actions'])}
        onClick={stopHeaderClick}
      >
        {actions.map((action) => (
          <TooltipIcon
            key={action.key}
            title={action.title}
            ariaLabel={action.title}
            placement="top"
            className={cx(styles['row-action-btn'])}
            icon={action.icon}
            onClick={action.onClick}
          />
        ))}
      </div>
    );
  };

  const sectionHeaderActions = renderSectionHeaderActions();

  /** 列表视图：平铺展示文件名与路径 */
  const renderListFileRow = (item: ChangeListItem) => {
    const listRowActions = renderListRowActions(item);

    return (
      <div
        key={`${section}-${item.fileId}`}
        className={cx(styles['change-item'], {
          [styles['change-item-active']]: isChangeFileSelected(
            item.fileId,
            section,
            selectedChangeFile,
          ),
          [styles['change-item-deleted']]: isDeletedFile(item),
          [styles['change-item-conflict']]: isConflictFile(item),
          [styles['change-item-has-actions']]: Boolean(listRowActions),
        })}
        onClick={() => onFileClick?.(item.fileId, section)}
        onContextMenu={(e) => onContextMenu?.(e, item.fileId)}
        title={item.fileId}
      >
        <span className={cx(styles['file-icon'])}>
          {getFileIcon(item.fileName)}
        </span>

        {/* 文件信息 */}
        <div className={cx(styles['file-info'])}>
          {/* 文件名 */}
          <span className={cx(styles['file-name'], 'text-ellipsis')}>
            {item.fileName}
          </span>

          {/* 文件路径 */}
          {item.parentPath && (
            <div className={cx(styles['file-path-wrap'])}>
              <EllipsisTooltip
                className={cx(styles['file-path'])}
                text={item.parentPath}
              />
            </div>
          )}
        </div>

        {/* 文件状态与操作按钮 */}
        <div className={cx(styles['change-item-trailing'])}>
          {renderStatusBadge(item)}
          {listRowActions}
        </div>
      </div>
    );
  };

  /**
   * 树形视图：对齐 FileTree 的文件夹/文件行样式与 caret 展开交互
   */
  const renderTreeFileRow = (item: ChangeListItem, level: number) => {
    const isSelected = isChangeFileSelected(
      item.fileId,
      section,
      selectedChangeFile,
    );

    return (
      <div
        key={`${section}-${item.fileId}`}
        className={fileTreeCx(
          fileTreeStyles.fileItem,
          styles['tree-file-item'],
          {
            [fileTreeStyles.activeFile]: isSelected,
          },
        )}
        style={{ paddingLeft: 4 + level * 8 }}
        onClick={() => onFileClick?.(item.fileId, section)}
        onContextMenu={(e) => onContextMenu?.(e, item.fileId)}
      >
        {getFileIcon(item.fileName)}
        <div className={cx(styles['tree-file-name-wrap'])}>
          <EllipsisTooltip
            className={fileTreeCx(
              fileTreeStyles.fileName,
              styles['tree-file-name'],
              {
                [styles['file-name-deleted']]: isDeletedFile(item),
                [styles['file-name-conflict']]: isConflictFile(item),
              },
            )}
            text={item.fileName}
          />
        </div>
        <span className={cx(styles['tree-file-trailing'])}>
          {renderStatusBadge(item)}
        </span>
      </div>
    );
  };

  /** 树形视图：渲染文件夹与文件 */
  const renderTreeNodes = (nodes: ChangeTreeNode[], level = 0) =>
    nodes.map((node) => {
      if (node.type === 'file' && node.fileItem) {
        return renderTreeFileRow(node.fileItem, level);
      }

      const isFolderExpanded = expandedFolders.has(node.id);
      return (
        <div
          key={node.id}
          className={fileTreeCx(
            fileTreeStyles.folderItem,
            styles['tree-folder-item'],
          )}
          style={{ paddingLeft: level * 8 }}
        >
          <div
            className={fileTreeCx(fileTreeStyles.folderHeader)}
            onClick={() => toggleFolder(node.id)}
            onContextMenu={(e) => {
              if (viewMode !== 'tree') {
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              onFolderContextMenu?.(e, node.id);
            }}
          >
            <SvgIcon
              name="icons-common-caret_right"
              style={{ fontSize: '16px' }}
              className={fileTreeCx(fileTreeStyles.folderIcon, {
                [fileTreeStyles.expanded]: isFolderExpanded,
              })}
            />
            <span
              className={fileTreeCx(fileTreeStyles.folderName, 'text-ellipsis')}
            >
              {node.name}
            </span>
          </div>
          {isFolderExpanded && node.children?.length ? (
            <div className={fileTreeCx(fileTreeStyles.fileList)}>
              {renderTreeNodes(node.children, level + 1)}
            </div>
          ) : null}
        </div>
      );
    });

  return (
    <div
      className={cx(
        styles['changes-section'],
        styles['changes-section-nested'],
      )}
    >
      {/* 区块标题 */}
      <div
        className={cx(styles['changes-header'], {
          [styles['changes-header-has-actions']]:
            Boolean(sectionHeaderActions) && items.length > 0,
        })}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className={cx(styles['changes-title'])}>
          <span
            className={cx(styles['changes-expand-icon'], {
              [styles['changes-expand-icon-expanded']]: expanded,
            })}
            aria-hidden
          >
            <RightOutlined />
          </span>
          <span>{title}</span>
        </div>
        <div className={cx(styles['changes-header-trailing'])}>
          <span className={cx(styles['changes-count'])}>{items.length}</span>
          {items.length > 0 && sectionHeaderActions}
        </div>
      </div>

      {expanded && (
        <div
          className={cx(styles['changes-list'], styles['changes-list-nested'])}
        >
          {items.length ? (
            // 树形视图
            viewMode === 'tree' ? (
              <div
                className={fileTreeCx(
                  fileTreeStyles.fileTree,
                  styles['change-file-tree'],
                )}
              >
                {renderTreeNodes(treeNodes)}
              </div>
            ) : (
              // 列表视图
              items.map((item) => renderListFileRow(item))
            )
          ) : (
            emptyText && (
              <div className={cx(styles['empty-state'])}>{emptyText}</div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ChangeFileListSection;
