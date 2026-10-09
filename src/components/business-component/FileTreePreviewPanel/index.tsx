import FileTreeGitSourcePanel from '@/components/business-component/FileTreeGitSourcePanel';
import FilePreviewPathBar from '@/components/business-component/FileTreePreviewPanel/FilePreviewPathBar';
import GitVersionRecordPanel, {
  type GitVersionRecordPanelHandle,
} from '@/components/business-component/GitVersionRecordPanel';
import { isAgentVersionControlEnabled } from '@/constants/agent.constants';
import classNames from 'classnames';
import React, { useMemo, useRef } from 'react';
import { useFileTreePreviewPanel } from './hooks/useFileTreePreviewPanel';
import styles from './index.less';
import type { FileTreePreviewPanelProps } from './types';

const cx = classNames.bind(styles);

export { default as FileTreeViewPanel } from './FileTreeViewPanel';
export { useFileTreePreviewView } from './hooks/useFileTreePreviewView';
export type {
  ChangeFileGitStatusKind,
  ChangeFileInfo,
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
  enableVersionControl,
  viewMode,
  hideDesktop,
  diffFile,
  gitVersionPanelOpen = false,
  onToggleGitVersionPanel,
  afterGitVersionActions,
  bottomContent,
  gitVersionControl,
  previewPanelProps,
  treeHeaderClassName,
}) => {
  const resolvedShowSourceControl = useMemo(() => {
    const base = showSourceControl ?? Boolean(sourceControl?.onCommit);
    if (enableVersionControl === undefined) {
      return base;
    }
    return base && isAgentVersionControlEnabled(enableVersionControl);
  }, [showSourceControl, sourceControl?.onCommit, enableVersionControl]);

  const showFileTree = viewMode !== 'desktop' && tree.isFileTreeVisible;
  const showGitVersionButton =
    Boolean(gitVersionControl) && resolvedShowSourceControl;
  const showGitVersionPanel =
    gitVersionPanelOpen &&
    showGitVersionButton &&
    !diffFile &&
    viewMode !== 'desktop';

  // 文件树预览面板
  const { header, content, restartOverlay } = useFileTreePreviewPanel({
    preview,
    viewMode,
    hideDesktop,
    diffFile,
    showGitVersionButton,
    onToggleGitVersionPanel,
    afterGitVersionActions,
    ...previewPanelProps,
  });

  // 全屏模式
  const isFullscreen = preview.isFullscreen;
  /** 版本记录面板已挂载时才有 ref；提交成功后用它重拉 git log */
  const gitLogPanelRef = useRef<GitVersionRecordPanelHandle>(null);

  const sourceControlForTree = useMemo(() => {
    if (!sourceControl?.onCommit) {
      return sourceControl ?? { changeFiles: preview.changeFiles };
    }
    const commit = sourceControl.onCommit;
    return {
      ...sourceControl,
      onCommit: async (message: string) => {
        const committed = await commit(message);
        // 版本记录面板未打开时组件未挂载，ref 为空，不会请求 git log
        if (committed === true) {
          gitLogPanelRef.current?.refresh();
        }
      },
    };
  }, [sourceControl, preview.changeFiles]);

  // 布局与 FileTreeView/index.tsx 1742-1769 保持一致
  return (
    <div
      className={cx(
        'flex',
        'flex-1',
        'overflow-hide',
        {
          [styles['fullscreen-mode']]: isFullscreen,
          'immersive-shell-fullscreen': isFullscreen,
        },
        styles['file-tree-preview-panel'],
        className,
      )}
    >
      <div
        className={cx(
          'relative',
          'h-full',
          'flex',
          'flex-col',
          'flex-1',
          'overflow-hide',
          {
            [styles['fullscreen-content-wrapper']]: isFullscreen,
          },
        )}
      >
        <div className={cx('preview-header-shell')}>{header}</div>

        <div className={cx(styles['content-container'], 'flex')}>
          {/* 文件树 */}
          {showFileTree && (
            <FileTreeGitSourcePanel
              showSourceControl={resolvedShowSourceControl}
              enableVersionControl={enableVersionControl}
              className={cx('file-tree-panel', 'h-full')}
              tree={tree}
              treeClassName="w-full h-full"
              treeHeaderClassName={treeHeaderClassName}
              sourceControl={sourceControlForTree}
            />
          )}

          <div
            className={cx(
              'preview-panel',
              'flex',
              'flex-col',
              'flex-1',
              'h-full',
              'relative',
            )}
          >
            {/* 文件路径栏 */}
            {viewMode !== 'desktop' && !showGitVersionPanel && !diffFile && (
              <FilePreviewPathBar
                fileNode={preview.selectedFileNode}
                onRefresh={() => preview.refreshSelectedFileContent()}
              />
            )}
            {/* 预览内容 */}
            <div className={cx(styles['preview-body'])}>
              {/* 版本控制 */}
              {showGitVersionPanel && gitVersionControl ? (
                <GitVersionRecordPanel
                  ref={gitLogPanelRef}
                  className={cx('git-version-panel', 'h-full')}
                  workspace={gitVersionControl.workspace}
                  branch={gitVersionControl.branch}
                  onRollbackSuccess={gitVersionControl.onRollbackSuccess}
                />
              ) : (
                content
              )}
              {/* 重启提示 */}
              {restartOverlay}
            </div>
          </div>
        </div>
        {/* 底部内容 */}
        {bottomContent && (
          <div className={cx(styles['bottom-content'])}>{bottomContent}</div>
        )}
      </div>
    </div>
  );
};

export default FileTreePreviewPanel;
