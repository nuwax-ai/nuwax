import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { t } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { ImportOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import FileTreePanel from '../PanelCore';
import AppDevFileTree from './AppDevFileTree';
import FileContextMenu from './FileContextMenu';
import type { AppDevFileTreePanelProps } from './types';

/**
 * FileTreePanel 组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 * 基于公共 FileTreePanel 注入 AppDev 文件树、右键菜单与空状态
 */
const AppDevFileTreePanel: React.FC<AppDevFileTreePanelProps> = ({
  files,
  isComparing,
  selectedFileId,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
  onDeleteFile,
  onRenameFile,
  onUploadProject,
  onUploadSingleFile,
  workspace,
  fileManagement,
  isChatLoading = false,
  // 新增：文件树初始化 loading 状态
  isFileTreeInitializing = false,
  sourceControl,
}) => {
  // 滚动位置保持相关状态
  const fileTreeScrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // 右键菜单状态
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuTarget, setContextMenuTarget] = useState<FileNode | null>(
    null,
  );

  // 内联重命名状态
  const [renamingNode, setRenamingNode] = useState<FileNode | null>(null);

  /**
   * 保存滚动位置
   */
  const saveScrollPosition = useCallback(() => {
    if (fileTreeScrollRef.current) {
      setScrollPosition(fileTreeScrollRef.current.scrollTop);
    }
  }, []);

  /**
   * 恢复滚动位置
   */
  useEffect(() => {
    if (fileTreeScrollRef.current && scrollPosition > 0) {
      fileTreeScrollRef.current.scrollTop = scrollPosition;
    }
  }, [files, scrollPosition]);

  /**
   * 处理右键菜单显示
   * @param e - 鼠标事件
   * @param node - 目标节点, 可以为 null 表示点击空白区域，清空目标节点
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode | null) => {
      e.preventDefault();
      e.stopPropagation();

      // 如果正在聊天加载或版本对比模式，禁用右键菜单
      if (isChatLoading || isComparing) {
        return;
      }

      setContextMenuTarget(node);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuVisible(true);
    },
    [isChatLoading, isComparing],
  );

  /**
   * 关闭右键菜单
   */
  const closeContextMenu = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuTarget(null);
  }, []);

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    // if (contextMenuVisible) {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
    // }
  }, [closeContextMenu]);

  /**
   * 取消重命名
   */
  const cancelRename = useCallback(() => {
    setRenamingNode(null);
  }, []);

  /**
   * 处理重命名操作（从右键菜单触发）
   */
  const handleRenameFromMenu = useCallback((node: FileNode) => {
    setRenamingNode(node);
  }, []);

  /**
   * 处理上传操作（从右键菜单触发）
   */
  const handleUploadFromMenu = useCallback(
    (node: FileNode | null) => {
      // 直接调用现有的上传单个文件功能
      onUploadSingleFile(node);
    },
    [onUploadSingleFile],
  );

  return (
    <>
      {/* 右键菜单 */}
      <FileContextMenu
        visible={contextMenuVisible}
        position={contextMenuPosition}
        targetNode={contextMenuTarget}
        isChatLoading={isChatLoading}
        isComparing={isComparing}
        onClose={closeContextMenu}
        onDelete={onDeleteFile}
        onRename={onRenameFile ? handleRenameFromMenu : undefined}
        onUploadSingleFile={handleUploadFromMenu}
        onUploadProject={onUploadProject}
      />

      <FileTreePanel
        layout="sidebar"
        collapsible
        showSourceControl={!isComparing && Boolean(sourceControl.onCommit)}
        sourceControl={sourceControl}
      >
        {/* 文件树容器 */}
        <div
          ref={fileTreeScrollRef}
          onScroll={saveScrollPosition}
          // 处理空白区域右键菜单显示
          onContextMenu={(e) => handleContextMenu(e, null)}
          style={{ height: '100%' }}
        >
          {/* 文件树结构 */}
          {isFileTreeInitializing ? (
            <AppDevEmptyState
              type="loading"
              title={t('PC.Pages.AppDevFileTreePanel.loadingTitle')}
              description={t('PC.Pages.AppDevFileTreePanel.loadingDescription')}
            />
          ) : files.length === 0 ? (
            <AppDevEmptyState
              type="no-file" // 使用新的无文件状态
              buttons={
                !isComparing
                  ? [
                      {
                        text: t('PC.Pages.AppDevFileTreePanel.importProject'),
                        icon: <ImportOutlined />,
                        onClick: onUploadProject,
                        disabled: isChatLoading,
                      },
                    ]
                  : undefined
              }
            />
          ) : (
            // 文件树组件
            <AppDevFileTree
              files={files}
              isComparing={isComparing}
              selectedFileId={selectedFileId}
              expandedFolders={expandedFolders}
              renamingNode={renamingNode}
              onCancelRename={cancelRename}
              onContextMenu={handleContextMenu}
              onFileSelect={onFileSelect}
              onToggleFolder={onToggleFolder}
              onRenameFile={onRenameFile}
              workspace={workspace}
              fileManagement={fileManagement}
              isChatLoading={isChatLoading}
            />
          )}
        </div>
      </FileTreePanel>
    </>
  );
};

export default AppDevFileTreePanel;
