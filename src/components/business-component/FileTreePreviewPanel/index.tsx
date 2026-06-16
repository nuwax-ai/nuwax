import FileTreeGitSourcePanel from '@/components/business-component/FileTreeGitSourcePanel';
import GitVersionRecordPanel from '@/components/business-component/GitVersionRecordPanel';
import classNames from 'classnames';
import React from 'react';
import { useFileTreePreviewPanel } from './hooks/useFileTreePreviewPanel';
import styles from './index.less';
import previewLayoutStyles from './preview-layout.less';
import type { FileTreePreviewPanelProps } from './types';

const cx = classNames.bind(styles);
const layoutCx = classNames.bind(previewLayoutStyles);

export { default as FileTreeViewPanel } from './FileTreeViewPanel';
export type { FileTreeViewProps, FileTreeViewRef } from './FileTreeViewPanel';
export { useFileTreePreviewView } from './hooks/useFileTreePreviewView';
export type {
  FileTreePreviewGitVersionControlProps,
  FileTreePreviewPanelProps,
  FileTreePreviewViewPreview,
  FileTreePreviewViewProps,
  FileTreePreviewViewValue,
  UseFileTreePreviewPanelParams,
} from './types';

/**
 * 文件树 + 预览区组合面板
 * 顶部 Header，下方左侧文件树、右侧预览内容
 */
const FileTreePreviewPanel: React.FC<FileTreePreviewPanelProps> = ({
  className,
  tree,
  preview,
  sourceControl,
  showSourceControl = Boolean(sourceControl?.onCommit),
  viewMode,
  hideDesktop,
  diffFile,
  gitVersionPanelOpen = false,
  onToggleGitVersionPanel,
  gitVersionControl,
  previewPanelProps,
  treeHeaderClassName,
}) => {
  const showFileTree = viewMode !== 'desktop' && tree.isFileTreeVisible;
  const showGitVersionButton = Boolean(gitVersionControl);
  const showGitVersionPanel =
    gitVersionPanelOpen &&
    showGitVersionButton &&
    !diffFile &&
    viewMode !== 'desktop';

  const { isFullscreen, header, content, restartOverlay } =
    useFileTreePreviewPanel({
      preview,
      viewMode,
      hideDesktop,
      diffFile,
      showGitVersionButton,
      isGitVersionPanelOpen: gitVersionPanelOpen,
      onToggleGitVersionPanel,
      ...previewPanelProps,
    });

  const emptySourceControl = {
    changeFiles: preview.changeFiles,
  };

  return (
    <div
      className={layoutCx(
        'flex',
        'flex-col',
        'flex-1',
        'overflow-hide',
        'h-full',
        {
          [layoutCx('fullscreen-mode')]: isFullscreen,
        },
        cx('file-tree-preview-panel', className),
      )}
    >
      <div
        className={layoutCx(
          'h-full',
          'flex',
          'flex-col',
          'flex-1',
          'overflow-hide',
          {
            [layoutCx('fullscreen-content-wrapper')]: isFullscreen,
          },
        )}
      >
        <div className={cx('preview-header-shell')}>{header}</div>

        <div
          className={layoutCx(
            'content-container',
            'flex',
            'flex-1',
            'overflow-hide',
          )}
        >
          {showFileTree && (
            <FileTreeGitSourcePanel
              showSourceControl={showSourceControl}
              className={cx('file-tree-panel', 'h-full')}
              tree={tree}
              treeClassName="w-full h-full"
              treeHeaderClassName={treeHeaderClassName}
              sourceControl={sourceControl ?? emptySourceControl}
            />
          )}

          <div className={cx('preview-panel', 'flex-1', 'h-full', 'relative')}>
            {showGitVersionPanel && gitVersionControl ? (
              <GitVersionRecordPanel
                className={cx('git-version-panel', 'h-full')}
                workspace={gitVersionControl.workspace}
                branch={gitVersionControl.branch}
                onRollbackSuccess={gitVersionControl.onRollbackSuccess}
              />
            ) : (
              content
            )}
            {restartOverlay}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileTreePreviewPanel;
