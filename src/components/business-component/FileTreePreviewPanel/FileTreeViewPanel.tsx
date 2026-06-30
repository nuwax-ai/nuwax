import { isAgentVersionControlEnabled } from '@/constants/agent.constants';
import debounce from 'lodash/debounce';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useSourceControl,
  type SelectedChangeFile,
} from '../FileTreeGitSourcePanel';
import { useFileTreePreviewView } from './hooks/useFileTreePreviewView';
import FileTreePreviewPanel from './index';
import type { FileTreeViewProps, FileTreeViewRef } from './types/file-tree';

/**
 * FileTreeView 替代组件
 * 基于 FileTreePreviewPanel + useFileTreePreviewView，兼容 FileTreeViewProps / ref
 * 文件修改通过 onSaveFileContent 防抖实时保存（与 Chat 页一致），Header 无保存/取消按钮
 */
const FileTreeViewPanel = forwardRef<FileTreeViewRef, FileTreeViewProps>(
  (props, ref) => {
    const {
      className,
      headerClassName,
      viewMode = 'preview',
      agentSandboxId,
      agentSandboxName,
      onRestartServer,
      onRestartAgent,
      onExportProject,
      onImportProject,
      isImportingProject,
      onUploadFiles,
      onRenameFile,
      onCreateFileNode,
      onDeleteFile,
      idleDetection,
      hideDesktop,
      isFullscreenPreview,
      onFullscreenPreview,
      onSaveFiles,
      readOnly = false,
      gitSourceControl,
      enableVersionControl,
      bottomContent,
      ...fileViewProps
    } = props;

    const onSaveFilesRef = useRef(onSaveFiles);
    onSaveFilesRef.current = onSaveFiles;
    const refreshGitListRef = useRef<(() => Promise<void>) | null>(null);

    /** 文件树写操作成功后刷新 Git status */
    const refreshGitStatusAfterSuccess = useCallback(
      async (success?: boolean) => {
        if (success) {
          await refreshGitListRef.current?.();
        }
      },
      [],
    );

    const handleUploadFiles = useCallback(
      async (files: File[], filePaths: string[]) => {
        if (!onUploadFiles) {
          return;
        }
        await onUploadFiles(files, filePaths);
        await refreshGitListRef.current?.();
      },
      [onUploadFiles],
    );

    const handleRenameFile = useCallback(
      async (
        ...args: Parameters<NonNullable<FileTreeViewProps['onRenameFile']>>
      ) => {
        const result = await onRenameFile?.(...args);
        await refreshGitStatusAfterSuccess(result);
        return result ?? false;
      },
      [onRenameFile, refreshGitStatusAfterSuccess],
    );

    const handleCreateFileNode = useCallback(
      async (
        ...args: Parameters<NonNullable<FileTreeViewProps['onCreateFileNode']>>
      ) => {
        const result = await onCreateFileNode?.(...args);
        await refreshGitStatusAfterSuccess(result);
        return result ?? false;
      },
      [onCreateFileNode, refreshGitStatusAfterSuccess],
    );

    const handleDeleteFile = useCallback(
      async (
        ...args: Parameters<NonNullable<FileTreeViewProps['onDeleteFile']>>
      ) => {
        const result = await onDeleteFile?.(...args);
        await refreshGitStatusAfterSuccess(result);
        return result ?? false;
      },
      [onDeleteFile, refreshGitStatusAfterSuccess],
    );

    const handleSaveFiles = useCallback(
      async (
        ...args: Parameters<NonNullable<FileTreeViewProps['onSaveFiles']>>
      ) => {
        const result = await onSaveFiles?.(...args);
        await refreshGitStatusAfterSuccess(result);
        return result ?? false;
      },
      [onSaveFiles, refreshGitStatusAfterSuccess],
    );

    /** 编辑器内容变更：防抖实时保存单个文件（与 Chat 页 useChatFiles 一致） */
    const debouncedSaveFileContent = useMemo(
      () =>
        debounce(
          async (
            fileId: string,
            content: string,
            originalFileContent: string,
          ): Promise<boolean> => {
            if (!onSaveFilesRef.current) {
              return false;
            }
            const result = await onSaveFilesRef.current([
              { fileId, fileContent: content, originalFileContent },
            ]);
            if (result) {
              await refreshGitListRef.current?.();
            }
            return result ?? false;
          },
          500,
        ),
      [],
    );

    useEffect(
      () => () => {
        debouncedSaveFileContent.cancel();
      },
      [debouncedSaveFileContent],
    );

    const fileView = useFileTreePreviewView({
      ...fileViewProps,
      className,
      headerClassName,
      viewMode,
      agentSandboxId,
      agentSandboxName,
      onRestartServer,
      onRestartAgent,
      onExportProject,
      onImportProject,
      isImportingProject,
      onUploadFiles: handleUploadFiles,
      onRenameFile: handleRenameFile,
      onCreateFileNode: handleCreateFileNode,
      onDeleteFile: handleDeleteFile,
      hideDesktop,
      idleDetection,
      isFullscreenPreview,
      onFullscreenPreview,
      readOnly,
      enableGitStatus:
        Boolean(gitSourceControl) &&
        (enableVersionControl === undefined ||
          isAgentVersionControlEnabled(enableVersionControl)),
      onSaveFiles: handleSaveFiles,
      onSaveFileContent: readOnly
        ? undefined
        : async (fileId, content, originalFileContent) => {
            const result = await debouncedSaveFileContent(
              fileId,
              content,
              originalFileContent,
            );
            return result ?? false;
          },
    });

    refreshGitListRef.current = gitSourceControl
      ? fileView.refreshGitList
      : null;

    const [selectedChangeFile, setSelectedChangeFile] =
      useState<SelectedChangeFile | null>(null);

    const sourceControl = useSourceControl({
      workspace: gitSourceControl?.workspace ?? {
        workspaceType: 'taskAgent',
        cid: null,
      },
      changeFiles: fileView.changeFiles,
      selectedChangeFile,
      setSelectedChangeFile,
      callbacks: {
        openChangeFile: (fileId: string) => {
          setSelectedChangeFile(null);
          void fileView.tree.handleFileSelect(fileId);
        },
        addFileToGitignore: gitSourceControl?.callbacks?.addFileToGitignore,
        onAfterDiscardChanges: async () => {
          await fileView.tree.handleRefreshFileList();
        },
        onCommitSuccess: async () => {
          await fileView.preview.saveFiles();
          await fileView.refreshGitList();
          await gitSourceControl?.callbacks?.onCommitSuccess?.();
        },
        onRefreshGitList: async () => {
          await fileView.refreshGitList();
          await gitSourceControl?.callbacks?.onRefreshGitList?.();
        },
      },
    });

    const showSourceControl =
      Boolean(gitSourceControl) &&
      (enableVersionControl === undefined ||
        isAgentVersionControlEnabled(enableVersionControl));
    const [gitVersionPanelOpen, setGitVersionPanelOpen] =
      useState<boolean>(false);

    /** 切换 Git 版本记录面板；如果正在查看 diff，先退出 diff 视图 */
    const handleToggleGitVersionPanel = () => {
      if (sourceControl.selectedDiffFile) {
        sourceControl.clearSelectedDiff();
        setGitVersionPanelOpen(true);
        return;
      }
      setGitVersionPanelOpen((prev) => !prev);
    };

    useImperativeHandle(
      ref,
      () => ({
        changeFiles: fileView.changeFiles,
        selectedFileId: fileView.tree.selectedFileId,
      }),
      [fileView.changeFiles, fileView.tree.selectedFileId],
    );

    return (
      <FileTreePreviewPanel
        className={className}
        tree={{
          ...fileView.tree,
          handleFileSelect: async (fileId, options) => {
            if (!options?.selectFolder) {
              setGitVersionPanelOpen(false);
              sourceControl.clearSelectedDiff();
            }
            await fileView.tree.handleFileSelect(fileId, options);
          },
        }}
        preview={fileView.preview}
        sourceControl={
          showSourceControl
            ? {
                changeFiles: fileView.changeFiles,
                selectedChangeFile: sourceControl.selectedChangeFile,
                isCommitting: sourceControl.isCommitting,
                isRefreshingGitList: fileView.isRefreshingGitList,
                onRefreshGitList: fileView.refreshGitList,
                onDiffFileSelect: sourceControl.handleDiffFileSelect,
                onOpenChangeFile: sourceControl.handleOpenChangeFile,
                onDiscardChanges: sourceControl.handleDiscardChange,
                onStageChanges: sourceControl.handleStageChanges,
                onUnstageChanges: sourceControl.handleUnstageChanges,
                onAddToGitignore: (fileId) => {
                  void sourceControl.handleAddToGitignore(fileId);
                },
                onCommit: sourceControl.handleCommit,
              }
            : undefined
        }
        showSourceControl={showSourceControl}
        enableVersionControl={enableVersionControl}
        viewMode={viewMode}
        hideDesktop={hideDesktop}
        diffFile={showSourceControl ? sourceControl.selectedDiffFile : null}
        gitVersionPanelOpen={gitVersionPanelOpen}
        onToggleGitVersionPanel={handleToggleGitVersionPanel}
        gitVersionControl={
          showSourceControl && gitSourceControl
            ? {
                workspace: gitSourceControl.workspace,
                branch: fileView.gitBranch,
                onRollbackSuccess: async () => {
                  await fileView.tree.handleRefreshFileList();
                  await fileView.refreshGitList();
                  setGitVersionPanelOpen(false);
                },
              }
            : undefined
        }
        treeHeaderClassName={headerClassName}
        bottomContent={bottomContent}
        previewPanelProps={{
          agentSandboxId,
          agentSandboxName,
          onRestartServer,
          onRestartAgent,
          onExportProject,
          idleDetection,
          hideDesktop,
        }}
      />
    );
  },
);

export default FileTreeViewPanel;
