import SvgIcon from '@/components/base/SvgIcon';
import { FileNode } from '@/types/interfaces/appDev';
import { getFileIcon } from '@/utils/fileTree';
import type { InputRef } from 'antd';
import { Input } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';
import type { AppDevFileTreeProps } from './types';

/**
 * 页面应用开发文件树组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 */
const AppDevFileTree: React.FC<AppDevFileTreeProps> = ({
  files,
  selectedFileId,
  expandedFolders,
  renamingNode,
  onCancelRename,
  onFileSelect,
  onToggleFolder,
  onRenameFile,
  onContextMenu,
  fileManagement,
  isChatLoading = false,
}) => {
  const [renameValue, setRenameValue] = useState<string>('');
  const renameInputRef = useRef<InputRef>(null);

  /**
   * 取消重命名
   */
  const cancelRename = useCallback(() => {
    const trimmedValue = renameValue.trim();
    const shouldRemove = renamingNode?.status === 'create' && !trimmedValue;

    onCancelRename({
      removeIfNew: shouldRemove,
      node: renamingNode || null,
    });
    setRenameValue('');
  }, [renameValue, renamingNode, onCancelRename]);

  /**
   * 确认重命名
   */
  const confirmRename = useCallback(async () => {
    if (!renamingNode || !onRenameFile) return;

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

    setRenameValue('');
    // 先立即更新UI显示新名字，提供即时反馈
    onCancelRename();

    // 异步执行重命名操作
    try {
      await onRenameFile(renamingNode, trimmedValue);
    } catch (error) {
      // 如果重命名失败，可以考虑恢复原名字或显示错误提示
      // console.error('Rename failed:', error);
    }
  }, [renamingNode, renameValue, onRenameFile, cancelRename]);

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
      if (!renamingNode) {
        return;
      }

      // 新建节点：有名称则创建，无名称则取消并移除占位
      if (renamingNode.status === 'create') {
        if (renameValue.trim()) {
          confirmRename();
        } else {
          cancelRename();
        }
        return;
      }

      confirmRename();
    }, 100);
  }, [renamingNode, renameValue, confirmRename, cancelRename]);

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

      const nodeKey = node.id;

      if (node.type === 'folder') {
        return (
          <div
            key={nodeKey}
            className={styles.folderItem}
            style={{ marginLeft: level * 8 }}
          >
            <div
              className={`${styles.folderHeader} ${
                isSelected ? styles.activeFolder : ''
              }`}
              onClick={() => {
                if (isRenaming) {
                  return;
                }
                onToggleFolder(node.id);
                onFileSelect(node.id);
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
              // 重命名模式
              if (isRenaming) {
                return;
              }

              fileManagement.switchToFile(node.id);
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
              <span className={styles.fileName}>{node.name}</span>
            )}

            {/* 文件状态 */}
            {!isChatLoading && !isRenaming && (
              <>
                {node.status && (
                  <span className={styles.fileStatus}>{node.status}</span>
                )}
              </>
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
      fileManagement,
      isChatLoading,
      onContextMenu,
      handleRenameKeyDown,
      handleRenameBlur,
    ],
  );

  return (
    <div className={styles.fileTree}>
      {files.map((node: FileNode) => renderFileTreeNode(node))}
    </div>
  );
};

export default AppDevFileTree;
