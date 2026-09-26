import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { findFileNode } from '@/utils/appDevUtils';
import { getFileIcon } from '@/utils/fileTree';
import type { InputRef } from 'antd';
import { Input } from 'antd';
import classNames from 'classnames';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from './index.less';
import type { FileTreeProps, FileTreeRef } from './types';
import { collectUnloadedExpandedFolders } from './utils';

const cx = classNames.bind(styles);

/**
 * 文件树组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 */
const FileTree = forwardRef<FileTreeRef, FileTreeProps>(
  (
    {
      files,
      fileTreeDataLoading,
      loadedFolderIds,
      loadingFolderIds,
      onLoadDirectory,
      taskAgentSelectedFileId,
      selectedFileId,
      selectedFolderId = '',
      // 正在重命名的节点
      renamingNode,
      // 取消重命名回调
      onCancelRename,
      // 文件选择回调
      onFileSelect,
      // 重命名文件回调
      onConfirmRenameFile,
      // 右键菜单回调
      onContextMenu,
    },
    ref,
  ) => {
    // 重命名值
    const [renameValue, setRenameValue] = useState<string>('');
    const renameInputRef = useRef<InputRef>(null);
    const restoredDirectoryRequestsRef = useRef(new Set<string>());
    // 已展开的文件夹 ID。初始全部收起，避免一进页面就展开第一层；
    // 之后只随点击、新建或定位文件更新，文件列表刷新不重置，避免已展开的节点被折叠。
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
      () => new Set(),
    );

    useImperativeHandle(
      ref,
      () => ({
        collapseAll: () => setExpandedFolders(new Set()),
      }),
      [],
    );

    useEffect(() => {
      if (!loadedFolderIds || !onLoadDirectory) {
        return;
      }

      loadedFolderIds.forEach((folderId) => {
        restoredDirectoryRequestsRef.current.delete(folderId);
      });
      [...restoredDirectoryRequestsRef.current].forEach((folderId) => {
        if (!expandedFolders.has(folderId)) {
          restoredDirectoryRequestsRef.current.delete(folderId);
        }
      });

      collectUnloadedExpandedFolders(
        files || [],
        expandedFolders,
        loadedFolderIds,
      ).forEach(({ id, path }) => {
        if (restoredDirectoryRequestsRef.current.has(id)) {
          return;
        }
        restoredDirectoryRequestsRef.current.add(id);
        void onLoadDirectory(path);
      });
    }, [expandedFolders, files, loadedFolderIds, onLoadDirectory]);

    /**
     * 切换文件夹展开状态。
     * 选中文件夹由点击时的 onFileSelect 负责，这里不再改选中文件。
     */
    const onToggleFolder = useCallback(
      (folderId: string) => {
        setExpandedFolders((prev) => {
          const newExpanded = new Set(prev);
          const wasExpanded = newExpanded.has(folderId);
          // 如果已展开则删除，否则添加，实现切换效果
          if (wasExpanded) {
            newExpanded.delete(folderId);
          } else {
            newExpanded.add(folderId);
            if (loadedFolderIds && onLoadDirectory) {
              // 点击展开会由 onFileSelect 发起加载，避免恢复 effect 重复请求同一目录。
              restoredDirectoryRequestsRef.current.add(folderId);
            }
          }
          return newExpanded;
        });
      },
      [loadedFolderIds, onLoadDirectory],
    );

    /**
     * 取消重命名
     */
    const cancelRename = () => {
      const trimmedValue = renameValue.trim();
      const shouldRemove = renamingNode?.status === 'create' && !trimmedValue;

      onCancelRename({
        removeIfNew: shouldRemove,
        node: renamingNode || null,
      });
      setRenameValue('');
    };

    /**
     * 确认重命名
     */
    const confirmRename = () => {
      if (!renamingNode) return;

      const trimmedValue = renameValue.trim();
      if (!trimmedValue || trimmedValue === renamingNode.name) {
        cancelRename();
        return;
      }

      // 验证文件名
      const invalidChars = /[/\\:*?"<>|]/;
      if (invalidChars.test(trimmedValue)) {
        // 这里可以显示错误提示
        return;
      }

      // 恢复数据状态
      cancelRename();

      // 异步执行重命名操作
      try {
        onConfirmRenameFile(renamingNode, trimmedValue);
      } catch (error) {
        // 如果重命名失败，可以考虑恢复原名字或显示错误提示
        console.error('Rename failed:', error);
      }
    };

    /**
     * 处理重命名输入框键盘事件
     */
    const handleRenameKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          confirmRename();
        } else if (e.key === 'Escape') {
          cancelRename();
        }
      },
      [confirmRename, cancelRename],
    );

    /**
     * 处理重命名输入框失焦
     */
    const handleRenameBlur = useCallback(() => {
      // 延迟执行，避免与点击事件冲突
      setTimeout(() => {
        if (renamingNode) {
          const input = renameInputRef.current?.input;
          // 目录列表刷新会卸掉再挂上输入框，焦点回到输入框时不要当成用户取消
          if (input && document.activeElement === input) {
            return;
          }
          // 对于新建节点（status === 'create'），根据输入值决定是创建还是取消
          if (renamingNode.status === 'create') {
            const trimmedValue = renameValue.trim();
            // 如果输入了有效名称，则确认创建；否则取消并移除临时节点
            if (trimmedValue) {
              confirmRename();
            } else {
              cancelRename();
            }
          } else {
            // 其它场景（普通重命名）失焦仍然走确认逻辑
            confirmRename();
          }
        }
      }, 100);
    }, [renamingNode, renameValue, confirmRename, cancelRename]);

    // 重命名输入框自动聚焦
    useEffect(() => {
      if (renamingNode) {
        setRenameValue(renamingNode.name);
      }
    }, [renamingNode]);

    useEffect(() => {
      // 目录刷新后输入框可能重新挂载，未聚焦时再补一次焦点
      if (!renamingNode || !renameInputRef.current) {
        return;
      }
      const input = renameInputRef.current.input;
      if (input && document.activeElement === input) {
        return;
      }
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }, [renamingNode, expandedFolders, files]);

    /**
     * 新建文件/文件夹时展开父级及祖先。
     * 必须用树上的节点 id：工作区文件夹 id 带 workspace: 前缀，
     * 只用 parentPath 拼出来的路径对不上，折叠的文件夹不会打开。
     */
    useEffect(() => {
      if (!renamingNode || renamingNode.status !== 'create') {
        return;
      }

      const ancestorIds: string[] = [];
      const findAncestors = (nodes: FileNode[], trail: string[]): boolean => {
        for (const node of nodes) {
          if (node.id === renamingNode.id) {
            ancestorIds.push(...trail);
            return true;
          }
          if (
            node.children?.length &&
            findAncestors(node.children, [...trail, node.id])
          ) {
            return true;
          }
        }
        return false;
      };

      if (!findAncestors(files || [], []) && renamingNode.parentPath) {
        let currentPath = '';
        renamingNode.parentPath
          .split('/')
          .filter(Boolean)
          .forEach((part) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            ancestorIds.push(currentPath);
          });
      }

      if (ancestorIds.length === 0) {
        return;
      }

      setExpandedFolders((prev) => {
        if (ancestorIds.every((id) => prev.has(id))) {
          return prev;
        }
        const next = new Set(prev);
        ancestorIds.forEach((id) => next.add(id));
        return next;
      });
    }, [renamingNode, files]);

    /**
     * 根据 taskAgentSelectedFileId 自动展开包含该文件的文件夹路径
     * 当 taskAgentSelectedFileId 和 files 都不为空时，展开所有父级文件夹
     */
    useEffect(() => {
      // 如果 taskAgentSelectedFileId 或 files 为空，则不处理
      if (!taskAgentSelectedFileId || !files || files.length === 0) {
        return;
      }

      // 查找选中的文件节点
      const selectedFileNode = findFileNode(taskAgentSelectedFileId, files);
      if (!selectedFileNode) {
        return;
      }

      // 如果选中的文件节点是文件夹
      if (selectedFileNode.type === 'folder') {
        // 如果文件夹有子节点，则展开文件夹，并选中第一个子节点
        if (selectedFileNode?.children?.length) {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            next.add(selectedFileNode?.id);
            return next;
          });
        }
        return;
      }

      // 获取所有父级文件夹ID
      // 通过路径分割直接获取所有父级路径，避免重复查找节点
      const getParentFolderIds = (filePath: string): string[] => {
        const parentIds: string[] = [];
        const pathParts = filePath.split('/').filter(Boolean);

        // 如果是根目录文件，则没有父级文件夹
        if (pathParts.length <= 1) {
          return parentIds;
        }

        // 从根目录开始，逐步构建所有父级路径
        // 例如：folder1/folder2/file.txt -> ['folder1', 'folder1/folder2']
        let currentPath = '';
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentPath = currentPath
            ? `${currentPath}/${pathParts[i]}`
            : pathParts[i];
          parentIds.push(currentPath);
        }

        return parentIds;
      };

      // 获取所有需要展开的文件夹ID
      // 必须用节点 id 而非 path：外部数据源（懒加载工作区等）的文件夹节点 id
      // 带 dataSource 前缀（如 workspace:src），path 无前缀会永不匹配
      const parentFolderIds = getParentFolderIds(selectedFileNode.id);

      // 如果有父级文件夹，则展开它们
      if (parentFolderIds.length > 0) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          parentFolderIds.forEach((folderId) => {
            next.add(folderId);
          });
          return next;
        });
      }
    }, [taskAgentSelectedFileId, files]);

    /**
     * 渲染文件树节点
     */
    const renderFileTreeNode = useCallback(
      (node: FileNode, level: number = 0) => {
        const isExpanded = expandedFolders.has(node.id);
        const isFolderLoading = Boolean(loadingFolderIds?.has(node.id));
        // 文件夹与文件选中互斥：选中文件夹时仅高亮文件夹，预览仍由 selectedFileId 驱动
        const isSelected =
          node.type === 'folder'
            ? selectedFolderId === node.id
            : selectedFileId === node.id && !selectedFolderId;
        const isRenaming = renamingNode?.id === node.id;

        const nodeKey = node.id;
        // 子节点已经嵌在父节点里，每层只再缩进固定一步。
        // 若按 level * 8 叠加上去，深层会越偏越快，展开箭头连成弧线。
        const indent = level > 0 ? 16 : 0;

        // 文件夹节点
        if (node.type === 'folder') {
          return (
            <div
              key={nodeKey}
              className={styles.folderItem}
              style={{ marginLeft: indent }}
            >
              <div
                className={cx(styles.folderHeader, {
                  [styles.activeFolder]: isSelected,
                })}
                onClick={() => {
                  if (isRenaming) {
                    return;
                  }
                  onToggleFolder(node.id);
                  onFileSelect(node.id, { selectFolder: true });
                }}
                onContextMenu={(e) => onContextMenu(e, node)}
              >
                <SvgIcon
                  name="icons-common-caret_right"
                  style={{ fontSize: '16px' }}
                  className={`${styles.folderIcon} ${
                    isExpanded ? styles.expanded : ''
                  }`}
                />

                {isRenaming ? (
                  <Input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleRenameBlur}
                    className={styles.inlineRenameInput}
                    size="small"
                  />
                ) : (
                  <span className={cx(styles.folderName, 'text-ellipsis')}>
                    {node.name}
                  </span>
                )}
              </div>
              {isExpanded && (isFolderLoading || node.children) && (
                <div className={styles.fileList}>
                  {isFolderLoading && (
                    <div className={styles.folderLoading}>
                      <Loading className={styles.folderLoadingIndicator} />
                    </div>
                  )}
                  {node.children?.map((child: FileNode) =>
                    renderFileTreeNode(child, level + 1),
                  )}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div
              key={nodeKey}
              className={`${styles.fileItem} ${
                isSelected ? styles.activeFile : ''
              }`}
              onClick={() => {
                // 跳过以"."为前缀的隐藏文件和重命名模式
                // if (node.name.startsWith('.') || isRenaming) {
                //   return;
                // }
                // 重命名模式下，不进行文件选择
                if (isRenaming) {
                  return;
                }
                onFileSelect(node.id);
              }}
              onContextMenu={(e) => onContextMenu(e, node)}
              style={{ marginLeft: indent }}
            >
              {/* 文件图标 */}
              {getFileIcon(node.name)}

              {/* 重命名输入框 */}
              {isRenaming ? (
                <Input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={handleRenameBlur}
                  className={styles.inlineRenameInput}
                  size="small"
                />
              ) : (
                // 文件名
                <span
                  className={`${styles.fileName} ${
                    node.name.startsWith('.') ? styles.hiddenFile : ''
                  }`}
                >
                  {node.name}
                </span>
              )}
            </div>
          );
        }
      },
      [
        expandedFolders,
        loadingFolderIds,
        selectedFileId,
        selectedFolderId,
        renamingNode,
        renameValue,
        onToggleFolder,
        onFileSelect,
        onContextMenu,
        handleRenameKeyDown,
        handleRenameBlur,
      ],
    );

    return (
      <div
        className={styles.fileTree}
        onContextMenu={(e) => onContextMenu(e, null)}
      >
        {/* 文件树数据加载状态 */}
        {fileTreeDataLoading && !files?.length ? (
          <div
            className={cx('flex', 'content-center', 'items-center', 'h-full')}
          >
            <Loading />
          </div>
        ) : files?.length > 0 ? (
          files?.map((node: FileNode) => renderFileTreeNode(node))
        ) : (
          <div
            className={cx(
              styles['no-files'],
              'flex',
              'content-center',
              'items-center',
              'h-full',
            )}
          >
            {dict('PC.Components.FileTree.noFiles')}
          </div>
        )}
      </div>
    );
  },
);

FileTree.displayName = 'FileTree';

export default FileTree;
