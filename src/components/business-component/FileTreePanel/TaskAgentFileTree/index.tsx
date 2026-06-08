import FileContextMenu from '@/components/FileTreeView/FileContextMenu';
import FileTree from '@/components/FileTreeView/FileTree';
import type { FileTreeRef } from '@/components/FileTreeView/FileTree/types';
import SearchView from '@/components/FileTreeView/SearchView';
import TipsBox from '@/components/TipsBox';
import FileTreeToolbar from '@/components/business-component/FileTreePanel/FileTreeToolbar';
import type { TaskAgentFileViewTree } from '@/components/business-component/FileTreePanel/types/taskAgentFileTree';
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useRef } from 'react';
import styles from './index.less';

export interface TaskAgentFileTreeProps {
  /** 文件树状态与交互处理器 */
  tree: TaskAgentFileViewTree;
  className?: string;
  headerClassName?: string;
}

/**
 * 任务智能体文件树组件
 * 负责文件树渲染、搜索、右键菜单、选中与重命名等交互
 */
const TaskAgentFileTree: React.FC<TaskAgentFileTreeProps> = ({
  tree,
  className,
  headerClassName,
}) => {
  const {
    files,
    selectedFileId,
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
    handleUploadFromMenu,
    handleCreateFile,
    handleCreateFolder,
    handleDownloadFileByUrl,
    handleExportProject,
    isExportingProject = false,
    toolbarDisabled = false,
  } = tree;

  const fileTreeRef = useRef<FileTreeRef>(null);

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
        onUploadFiles={handleUploadFromMenu}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onDownloadFileByUrl={handleDownloadFileByUrl}
        useRelativePosition={true}
      />

      <TipsBox
        visible={isDownloadingFile}
        text={dict('PC.Components.FileTreeView.downloading')}
      />
      <TipsBox
        visible={isUploadingFiles}
        text={dict('PC.Components.FileTreeView.uploading')}
      />

      <SearchView
        className={headerClassName}
        files={files}
        onFileSelect={handleFileSelect}
      />

      <FileTreeToolbar
        disabled={toolbarDisabled}
        exportLoading={isExportingProject}
        onExportProject={
          handleExportProject ? () => void handleExportProject() : undefined
        }
        onCreateFile={() => handleCreateFile(null)}
        onCreateFolder={() => handleCreateFolder(null)}
        onUpload={() => void handleUploadFromMenu(null)}
        onCollapseAll={() => fileTreeRef.current?.collapseAll()}
        onRefresh={
          showRefreshButton ? () => void handleRefreshFileList() : undefined
        }
        refreshLoading={isRefreshingFileTree}
      />

      <FileTree
        ref={fileTreeRef}
        fileTreeDataLoading={fileTreeDataLoading}
        files={files}
        taskAgentSelectedFileId={taskAgentSelectedFileId}
        selectedFileId={selectedFileId}
        renamingNode={renamingNode}
        onCancelRename={handleCancelRename}
        onContextMenu={handleContextMenu}
        onFileSelect={handleFileSelect}
        onConfirmRenameFile={handleRenameFile}
      />
    </div>
  );
};

export default TaskAgentFileTree;
