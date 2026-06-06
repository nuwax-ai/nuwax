import FileContextMenu from '@/components/FileTreeView/FileContextMenu';
import FileTree from '@/components/FileTreeView/FileTree';
import SearchView from '@/components/FileTreeView/SearchView';
import TipsBox from '@/components/TipsBox';
import type { TaskAgentFileViewTree } from '@/components/business-component/FileTreePanel/types/taskAgentFileTree';
import { dict } from '@/services/i18nRuntime';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
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
  } = tree;

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

      <div
        className={classNames(
          'flex',
          'content-between',
          'items-center',
          styles['file-tree-header'],
        )}
      >
        <span>{dict('PC.Components.FileTreeView.files')}</span>
        {showRefreshButton && (
          <Tooltip
            title={
              isRefreshingFileTree
                ? dict('PC.Components.FileTreeView.refreshing')
                : dict('PC.Components.FileTreeView.refreshFileTree')
            }
          >
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined style={{ fontSize: 14 }} />}
              onClick={handleRefreshFileList}
              className={styles['file-tree-header-action']}
              loading={isRefreshingFileTree}
            />
          </Tooltip>
        )}
      </div>

      <SearchView
        className={headerClassName}
        files={files}
        onFileSelect={handleFileSelect}
      />

      <FileTree
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
