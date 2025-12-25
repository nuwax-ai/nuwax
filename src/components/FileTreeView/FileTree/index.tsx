import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import { FileNode } from '@/types/interfaces/appDev';
import { findFileNode } from '@/utils/appDevUtils';
import { getFileIcon } from '@/utils/fileTree';
import type { InputRef } from 'antd';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';
import type { FileTreeProps } from './types';

const cx = classNames.bind(styles);

/**
 * 文件树组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 */
const FileTree: React.FC<FileTreeProps> = ({
  files,
  fileTreeDataLoading,
  taskAgentSelectedFileId,
  selectedFileId,
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
}) => {
  // 重命名值
  const [renameValue, setRenameValue] = useState<string>('');
  const renameInputRef = useRef<InputRef>(null);
  // 已展开的文件夹ID集合
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () =>
      // 初次渲染时自动展开第一层文件夹，后续文件列表变更时不重置，避免已展开的节点被折叠
      new Set(
        (files || [])
          .filter((node) => node.type === 'folder')
          .map((node) => node.id),
      ),
  );

  /**
   * 根据层级计算节点的最大宽度
   * @param level 当前层级（0 为根级）
   * @returns 最大宽度（px）
   */
  const calculateMaxWidth = useCallback((level: number): number => {
    // 文件树容器宽度 260px，减去左右 padding 16px（各 8px），再减去当前层级的缩进
    const containerWidth = 260;
    const padding = 16; // 左右各 8px
    const indentPerLevel = 8;
    return containerWidth - padding - level * indentPerLevel;
  }, []);

  /**
   * 切换文件夹展开状态，用于展开/折叠回调
   */
  const onToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const newExpanded = new Set(prev);
      // 如果已展开则删除，否则添加，实现切换效果
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return newExpanded;
    });
  }, []);

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
      console.error('重命名失败:', error);
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
    // 当进入重命名 / 新建状态，且输入框已经渲染到 DOM 中时，自动聚焦并选中
    if (renamingNode && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }

    if (renamingNode) {
      setRenameValue(renamingNode.name);
    }
  }, [renamingNode, expandedFolders]);

  /**
   * 当进入新建状态时，自动展开其父级及祖先文件夹
   * 确保在折叠状态下新建文件/文件夹也能立刻可见
   */
  useEffect(() => {
    if (!renamingNode || renamingNode.status !== 'create') {
      return;
    }

    const parentPath = renamingNode.parentPath;
    if (!parentPath) return;

    const parts = parentPath.split('/').filter(Boolean);

    setExpandedFolders((prev) => {
      const next = new Set(prev);
      let currentPath = '';
      parts.forEach((part) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        next.add(currentPath);
      });
      return next;
    });
  }, [renamingNode]);

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
    const parentFolderIds = getParentFolderIds(
      selectedFileNode.path || selectedFileNode.id,
    );

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
      const isSelected = selectedFileId === node.id;
      const isRenaming = renamingNode?.id === node.id;

      // 为版本模式添加特殊的前缀，避免 key 冲突
      const nodeKey = node.id;

      // 计算当前层级的最大宽度
      const maxWidth = calculateMaxWidth(level);

      // 文件夹节点
      if (node.type === 'folder') {
        return (
          <div
            key={nodeKey}
            className={styles.folderItem}
            style={{ marginLeft: level * 8, maxWidth: `${maxWidth}px` }}
          >
            <div
              className={styles.folderHeader}
              onClick={() => !isRenaming && onToggleFolder(node.id)}
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
            {isExpanded && node.children && (
              <div className={styles.fileList}>
                {node.children.map((child: any) =>
                  renderFileTreeNode(child, level + 1),
                )}
              </div>
            )}
          </div>
        );
      } else {
        // 计算当前层级的最大宽度
        const maxWidth = calculateMaxWidth(level);

        return (
          <div
            key={nodeKey}
            className={`${styles.fileItem} ${
              isSelected ? styles.activeFile : ''
            }`}
            onClick={() => {
              // 跳过以"."为前缀的隐藏文件和重命名模式
              if (node.name.startsWith('.') || isRenaming) {
                return;
              }
              onFileSelect(node.id);
            }}
            onContextMenu={(e) => onContextMenu(e, node)}
            style={{ marginLeft: level * 8, maxWidth: `${maxWidth}px` }}
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
      selectedFileId,
      renamingNode,
      renameValue,
      onToggleFolder,
      onFileSelect,
      onContextMenu,
      handleRenameKeyDown,
      handleRenameBlur,
      calculateMaxWidth,
    ],
  );

  return (
    <div
      className={styles.fileTree}
      onContextMenu={(e) => onContextMenu(e, null)}
    >
      {/* 文件树数据加载状态 */}
      {fileTreeDataLoading && !files?.length ? (
        <div className={cx('flex', 'content-center', 'items-center', 'h-full')}>
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
          暂无文件
        </div>
      )}
    </div>
  );
};

export default FileTree;
