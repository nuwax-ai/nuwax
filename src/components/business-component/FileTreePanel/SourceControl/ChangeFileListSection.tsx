import SvgIcon from '@/components/base/SvgIcon';
import fileTreeStyles from '@/components/FileTreeView/FileTree/index.less';
import { getFileIcon } from '@/utils/fileTree';
import { RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeListItem } from './buildChangeFileTree';
import {
  buildChangeFileTree,
  type ChangeTreeNode,
} from './buildChangeFileTree';
import {
  type ChangeListSection,
  isChangeFileSelected,
  type SelectedChangeFile,
} from './changeFileStatus';
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

  /** 列表视图：平铺展示文件名与路径 */
  const renderListFileRow = (item: ChangeListItem) => (
    <div
      key={`${section}-${item.fileId}`}
      className={cx(styles['change-item'], {
        [styles['change-item-active']]: isChangeFileSelected(
          item.fileId,
          section,
          selectedChangeFile,
        ),
        [styles['change-item-deleted']]: isDeletedFile(item),
      })}
      onClick={() => onFileClick?.(item.fileId, section)}
      onContextMenu={(e) => onContextMenu?.(e, item.fileId)}
      title={item.fileId}
    >
      <span className={cx(styles['file-icon'])}>
        {getFileIcon(item.fileName)}
      </span>
      <div className={cx(styles['file-info'])}>
        <span className={cx(styles['file-name'])}>{item.fileName}</span>
        {item.parentPath && (
          <span className={cx(styles['file-path'])}>{item.parentPath}</span>
        )}
      </div>
      {renderStatusBadge(item)}
    </div>
  );

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
        className={fileTreeCx(fileTreeStyles.fileItem, {
          [fileTreeStyles.activeFile]: isSelected,
        })}
        style={{ marginLeft: level * 8 }}
        onClick={() => onFileClick?.(item.fileId, section)}
        onContextMenu={(e) => onContextMenu?.(e, item.fileId)}
        title={item.fileId}
      >
        {getFileIcon(item.fileName)}
        <span
          className={fileTreeCx(fileTreeStyles.fileName, {
            [styles['file-name-deleted']]: isDeletedFile(item),
          })}
        >
          {item.fileName}
        </span>
        {renderStatusBadge(item)}
      </div>
    );
  };

  const renderTreeNodes = (nodes: ChangeTreeNode[], level = 0) =>
    nodes.map((node) => {
      if (node.type === 'file' && node.fileItem) {
        return renderTreeFileRow(node.fileItem, level);
      }

      const isFolderExpanded = expandedFolders.has(node.id);
      return (
        <div
          key={node.id}
          className={fileTreeCx(fileTreeStyles.folderItem)}
          style={{ marginLeft: level * 8 }}
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
      <div
        className={cx(styles['changes-header'])}
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
        <span className={cx(styles['changes-count'])}>{items.length}</span>
      </div>

      {expanded && (
        <div
          className={cx(styles['changes-list'], styles['changes-list-nested'])}
        >
          {items.length ? (
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
