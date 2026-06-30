import TipsBox from '@/components/TipsBox';
import FileTreeToolbar from '@/components/business-component/FileTreeGitSourcePanel/FileTreeToolbar';
import { dict } from '@/services/i18nRuntime';
import type { FileNode } from '@/types/interfaces/appDev';
import { findFileNode } from '@/utils/appDevUtils';
import classNames from 'classnames';
import React, { useRef } from 'react';
import type { FileTreeContainerProps } from '../types/file-tree-git-source';
import FileContextMenu from './FileContextMenu';
import FileTree from './FileTree';
import type { FileTreeRef } from './FileTree/types';
import SearchView from './SearchView';
import styles from './index.less';

export interface FileTreePanelProps {
  /** 文件树状态与交互处理器 */
  tree: FileTreeContainerProps;
  className?: string;
  headerClassName?: string;
  /** 文件列表为空（且非加载中）时的自定义空态内容，不传则使用 FileTree 默认空态 */
  emptyState?: React.ReactNode;
}

/**
 * 任务智能体文件树组件
 * 负责文件树渲染、搜索、右键菜单、选中与重命名等交互
 */
const FileTreePanel: React.FC<FileTreePanelProps> = ({
  tree,
  className,
  headerClassName,
  emptyState,
}) => {
  const {
    readOnly = false,
    files,
    selectedFileId,
    selectedFolderId = '',
    renamingNode,
    contextMenuTarget,
    contextMenuPosition,
    contextMenuVisible,
    isFileTreeVisible,
    fileTreeContainerRef,
    fileTreeDataLoading,
    taskAgentSelectedFileId,
    isCanDeleteSkillFile,
    isRefreshingFileTree,
    isUploadingFiles,
    isDownloadingFile,
    hideFileTree,
    showRefreshButton,
    handleFileSelect,
    handleContextMenu,
    closeContextMenu,
    handleRenameFile,
    handleCancelRename,
    handleRefreshFileList,
    handleDelete,
    handleRenameFromMenu,
    handleUploadMultipleFiles,
    handleCreateFile,
    handleCreateFolder,
    handleDownloadFileByUrl,
    handleImportProject,
    importProjectLabel,
    handleExportProject,
    isExportingProject = false,
    isImportingProject = false,
    toolbarDisabled = false,
  } = tree;

  const fileTreeRef = useRef<FileTreeRef>(null);

  /**
   * 计算工具栏新建文件/文件夹的目标父级节点
   * - 选中文件夹：在该文件夹下创建
   * - 选中文件：在该文件所在层级（其父文件夹）下创建
   * - 未选中或找不到节点：在根目录创建
   */
  const resolveCreateParentNode = (): FileNode | null => {
    if (selectedFolderId) {
      const folderNode = findFileNode(selectedFolderId, files);
      if (folderNode?.type === 'folder') {
        return folderNode;
      }
    }
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
  };

  if (hideFileTree) {
    return null;
  }

  return (
    <div
      ref={fileTreeContainerRef}
      className={classNames(
        styles['file-tree-view'],
        styles['tree-panel'],
        isFileTreeVisible
          ? styles['file-tree-view-visible']
          : styles['file-tree-view-hidden'],
        'h-full',
        'flex',
        'flex-col',
        'overflow-hide',
        className,
      )}
    >
      {/* 右键菜单 */}
      <FileContextMenu
        visible={contextMenuVisible}
        position={contextMenuPosition}
        targetNode={contextMenuTarget}
        disabledDelete={
          !isCanDeleteSkillFile &&
          contextMenuTarget?.name?.toLowerCase() === 'skill.md'
        }
        onClose={closeContextMenu}
        onDelete={handleDelete}
        onRename={handleRenameFromMenu}
        onUploadFiles={handleUploadMultipleFiles}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onImportProject={handleImportProject}
        importProjectLabel={importProjectLabel}
        onDownloadFileByUrl={handleDownloadFileByUrl}
        useRelativePosition={true}
      />

      {/* 提示框 */}
      <TipsBox
        visible={isDownloadingFile}
        text={dict('PC.Components.FileTreeView.downloading')}
      />
      <TipsBox
        visible={isUploadingFiles}
        text={dict('PC.Components.FileTreeView.uploading')}
      />
      <TipsBox
        visible={isExportingProject}
        text={dict('PC.Components.FileTreeView.exporting')}
      />
      <TipsBox
        visible={isImportingProject}
        text={dict('PC.Components.FileTreeView.importing')}
      />

      {/* 搜索框 */}
      <SearchView
        className={headerClassName}
        files={files}
        onFileSelect={handleFileSelect}
      />

      {/* 文件树工具栏 */}
      <FileTreeToolbar
        disabled={toolbarDisabled}
        exportLoading={isExportingProject}
        onExportProject={
          handleExportProject ? () => void handleExportProject() : undefined
        }
        onCreateFile={
          readOnly
            ? undefined
            : () => handleCreateFile(resolveCreateParentNode())
        }
        onCreateFolder={
          readOnly
            ? undefined
            : () => handleCreateFolder(resolveCreateParentNode())
        }
        onUpload={
          readOnly
            ? undefined
            : () => void handleUploadMultipleFiles(resolveCreateParentNode())
        }
        onCollapseAll={() => fileTreeRef.current?.collapseAll()}
        onRefresh={
          showRefreshButton ? () => void handleRefreshFileList() : undefined
        }
        refreshLoading={isRefreshingFileTree}
      />

      {/* 文件树；列表为空且非加载中时优先展示自定义空态 */}
      {!fileTreeDataLoading && files.length === 0 && emptyState ? (
        emptyState
      ) : (
        <FileTree
          ref={fileTreeRef}
          fileTreeDataLoading={fileTreeDataLoading}
          files={files}
          taskAgentSelectedFileId={taskAgentSelectedFileId}
          selectedFileId={selectedFileId}
          selectedFolderId={selectedFolderId}
          renamingNode={renamingNode}
          onCancelRename={handleCancelRename}
          onContextMenu={handleContextMenu}
          onFileSelect={handleFileSelect}
          onConfirmRenameFile={handleRenameFile}
        />
      )}
    </div>
  );
};

export default FileTreePanel;
