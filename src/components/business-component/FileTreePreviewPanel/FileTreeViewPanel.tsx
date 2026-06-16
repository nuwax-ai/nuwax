import type {
  ChangeFileInfo,
  FileTreeViewProps,
  FileTreeViewRef,
} from '@/components/FileTreeView/type';
import { useFileTreePreviewView } from '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView';
import debounce from 'lodash/debounce';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import FileTreePreviewPanel from './index';

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
      idleDetection,
      hideDesktop,
      isFullscreenPreview,
      onFullscreenPreview,
      onSaveFiles,
      readOnly = false,
      ...fileViewProps
    } = props;

    const onSaveFilesRef = useRef(onSaveFiles);
    onSaveFilesRef.current = onSaveFiles;

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
      hideDesktop,
      idleDetection,
      isFullscreenPreview,
      onFullscreenPreview,
      readOnly,
      onSaveFiles,
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

    useImperativeHandle(
      ref,
      () => ({
        changeFiles: fileView.changeFiles,
      }),
      [fileView.changeFiles],
    );

    return (
      <FileTreePreviewPanel
        className={className}
        tree={fileView.tree}
        preview={fileView.preview}
        showSourceControl={false}
        viewMode={viewMode}
        hideDesktop={hideDesktop}
        treeHeaderClassName={headerClassName}
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
export type { ChangeFileInfo, FileTreeViewProps, FileTreeViewRef };
