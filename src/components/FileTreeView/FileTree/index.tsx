import SvgIcon from '@/components/base/SvgIcon';
import { FileNode } from '@/types/interfaces/appDev';
import { getFileIcon } from '@/utils/fileTree';
import type { InputRef } from 'antd';
import { Input } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';
import type { FileTreeProps } from './types';

/**
 * 文件树组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 */
const FileTree: React.FC<FileTreeProps> = ({
  files,
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
    new Set(),
  );

  useEffect(() => {
    // 自动展开第一层文件夹
    const rootFolders =
      files?.filter((node) => node.type === 'folder')?.map((node) => node.id) ||
      [];
    if (rootFolders?.length > 0) {
      setExpandedFolders(new Set(rootFolders));
    }
  }, [files]);

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
      // console.error('重命名失败:', error);
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
        confirmRename();
      }
    }, 100);
  }, [renamingNode, confirmRename]);

  // 重命名输入框自动聚焦
  useEffect(() => {
    if (renamingNode && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }

    if (renamingNode) {
      setRenameValue(renamingNode.name);
    }
  }, [renamingNode]);

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

      // 文件夹节点
      if (node.type === 'folder') {
        return (
          <div
            key={nodeKey}
            className={styles.folderItem}
            style={{ marginLeft: level * 8 }}
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
                <span className={styles.folderName}>{node.name}</span>
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

              // if (!isComparing) {
              //   // 正常模式下，使用文件管理逻辑并自动切换到代码查看模式
              //   fileManagement.switchToFile(node.id);
              // }
              // 版本模式下，直接设置选中的文件到 workspace.activeFile
              onFileSelect(node.id);
            }}
            onContextMenu={(e) => onContextMenu(e, node)}
            style={{ marginLeft: level * 8 }}
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
    ],
  );

  return (
    <div
      className={styles.fileTree}
      onContextMenu={(e) => onContextMenu(e, null)}
    >
      {files.map((node: FileNode) => renderFileTreeNode(node))}
    </div>
  );
};

export default FileTree;
