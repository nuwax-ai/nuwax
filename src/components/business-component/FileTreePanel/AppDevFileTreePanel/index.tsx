import SearchView from '@/components/FileTreeView/SearchView';
import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import FileTreeToolbar from '@/components/business-component/FileTreePanel/FileTreeToolbar';
import { t } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { findFileNode } from '@/utils/appDevUtils';
import { ImportOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import FileTreePanel from '../PanelCore';
import AppDevFileTree from './AppDevFileTree';
import FileContextMenu from './FileContextMenu';
import styles from './index.less';
import type { AppDevFileTreePanelProps } from './types';

const cx = classNames.bind(styles);

/**
 * FileTreePanel 组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 * 基于公共 FileTreePanel 注入 AppDev 文件树、右键菜单与空状态
 */
const AppDevFileTreePanel: React.FC<AppDevFileTreePanelProps> = ({
  files,
  selectedFileId,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
  onDeleteFile,
  onRenameFile,
  onUploadProject,
  onUploadSingleFile,
  onExportProject,
  onCreateFile,
  onCreateFolder,
  onCollapseAll,
  onRefresh,
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

  // 文件树刷新 loading 状态
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  /** 刷新文件树：内部维护 loading 状态，避免重复触发 */
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

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

      // 如果正在聊天加载，禁用右键菜单
      if (isChatLoading) {
        return;
      }

      setContextMenuTarget(node);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuVisible(true);
    },
    [isChatLoading],
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
   * 取消重命名；新建节点未输入名称时移除临时占位
   */
  const cancelRename = useCallback(
    (options?: { removeIfNew?: boolean; node?: FileNode | null }) => {
      if (
        options?.removeIfNew &&
        options.node &&
        fileManagement.removeTempNode
      ) {
        fileManagement.removeTempNode(options.node.id);
      }
      // 仅当取消的是当前重命名节点时才清空状态，
      // 避免上一个输入框的延迟 blur 误清掉新一轮新建的重命名状态
      setRenamingNode((prev) =>
        options?.node && prev && prev.id !== options.node.id ? prev : null,
      );
    },
    [fileManagement],
  );

  /** 新建文件（可在指定文件夹下创建） */
  const handleCreateFile = useCallback(
    (parentNode: FileNode | null = null) => {
      if (!fileManagement.insertTempNodeForCreate) {
        return;
      }
      // 连续点击新建时，先移除上一个尚未命名的临时节点，避免残留空占位
      if (renamingNode?.status === 'create') {
        fileManagement.removeTempNode?.(renamingNode.id);
      }
      const newNode = fileManagement.insertTempNodeForCreate(
        parentNode,
        'file',
      );
      setRenamingNode(newNode);
    },
    [fileManagement, renamingNode],
  );

  /** 新建文件夹（可在指定文件夹下创建） */
  const handleCreateFolder = useCallback(
    (parentNode: FileNode | null = null) => {
      if (!fileManagement.insertTempNodeForCreate) {
        return;
      }
      // 连续点击新建时，先移除上一个尚未命名的临时节点，避免残留空占位
      if (renamingNode?.status === 'create') {
        fileManagement.removeTempNode?.(renamingNode.id);
      }
      const newNode = fileManagement.insertTempNodeForCreate(
        parentNode,
        'folder',
      );
      setRenamingNode(newNode);
    },
    [fileManagement, renamingNode],
  );

  /**
   * 计算工具栏新建文件/文件夹的目标父级节点
   * - 选中文件夹：在该文件夹下创建
   * - 选中文件：在该文件所在层级（其父文件夹）下创建
   * - 未选中或找不到节点：在根目录创建
   */
  const resolveCreateParentNode = useCallback((): FileNode | null => {
    if (!selectedFileId) {
      return null;
    }
    const selectedNode = findFileNode(selectedFileId, files);
    if (!selectedNode) {
      return null;
    }
    if (selectedNode.type === 'folder') {
      return selectedNode;
    }
    // 文件节点：在其父文件夹下创建（与选中文件同级）；无父级则为根目录
    return selectedNode.parentPath
      ? findFileNode(selectedNode.parentPath, files)
      : null;
  }, [selectedFileId, files]);

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
        onClose={closeContextMenu}
        onDelete={onDeleteFile}
        onRename={onRenameFile ? handleRenameFromMenu : undefined}
        onUploadSingleFile={handleUploadFromMenu}
        onUploadProject={onUploadProject}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
      />

      <FileTreePanel
        layout="sidebar"
        collapsible
        showSourceControl={Boolean(sourceControl.onCommit)}
        sourceControl={sourceControl}
      >
        <div className={cx(styles['file-tree-panel'])}>
          <SearchView files={files} onFileSelect={onFileSelect} />

          <FileTreeToolbar
            disabled={isChatLoading}
            onExportProject={
              onExportProject ? () => void onExportProject() : undefined
            }
            onCreateFile={
              onCreateFile ??
              (() => handleCreateFile(resolveCreateParentNode()))
            }
            onCreateFolder={
              onCreateFolder ??
              (() => handleCreateFolder(resolveCreateParentNode()))
            }
            onUpload={() => handleUploadFromMenu(null)}
            onCollapseAll={onCollapseAll}
            onRefresh={onRefresh ? () => void handleRefresh() : undefined}
            refreshLoading={isRefreshing}
          />

          {/* 文件树容器 */}
          <div
            ref={fileTreeScrollRef}
            onScroll={saveScrollPosition}
            // 处理空白区域右键菜单显示
            onContextMenu={(e) => handleContextMenu(e, null)}
            className={cx(styles['file-tree-scroll'])}
          >
            {/* 文件树结构 */}
            {isFileTreeInitializing ? (
              <AppDevEmptyState
                type="loading"
                title={t('PC.Pages.AppDevFileTreePanel.loadingTitle')}
                description={t(
                  'PC.Pages.AppDevFileTreePanel.loadingDescription',
                )}
              />
            ) : files.length === 0 ? (
              <AppDevEmptyState
                type="no-file" // 使用新的无文件状态
                buttons={[
                  {
                    text: t('PC.Pages.AppDevFileTreePanel.importProject'),
                    icon: <ImportOutlined />,
                    onClick: onUploadProject,
                    disabled: isChatLoading,
                  },
                ]}
              />
            ) : (
              // 文件树组件
              <AppDevFileTree
                files={files}
                selectedFileId={selectedFileId}
                expandedFolders={expandedFolders}
                renamingNode={renamingNode}
                onCancelRename={cancelRename}
                onContextMenu={handleContextMenu}
                onFileSelect={onFileSelect}
                onToggleFolder={onToggleFolder}
                onRenameFile={onRenameFile}
                fileManagement={fileManagement}
              />
            )}
          </div>
        </div>
      </FileTreePanel>
    </>
  );
};

export default AppDevFileTreePanel;
