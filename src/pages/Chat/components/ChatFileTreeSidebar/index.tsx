import FileTreeGitSourcePanel from '@/components/business-component/FileTreeGitSourcePanel';
import type {
  FileTreeContainerProps,
  SourceControlProps,
} from '@/components/business-component/FileTreeGitSourcePanel/types/file-tree-git-source';
import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type { ConversationAgentFileViewPreview } from '@/pages/ConversationAgent/hooks/types';
import { HideDesktopEnum } from '@/types/enums/agent';
import classNames from 'classnames';
import React from 'react';
import {
  useChatFilePreviewPanel,
  type ChatFilePreviewPanelProps,
} from '../ChatFilePreviewPanel';
import styles from './index.less';

const cx = classNames.bind(styles);
const fileTreeCx = classNames.bind(fileTreeViewStyles);

export interface ChatFileTreeSidebarProps {
  className?: string;
  tree: FileTreeContainerProps;
  preview: ConversationAgentFileViewPreview;
  sourceControl: SourceControlProps;
  viewMode: 'preview' | 'desktop';
  hideDesktop?: HideDesktopEnum;
  /** Git diff 预览文件 */
  diffFile?: ChangeFileInfo | null;
  previewPanelProps: Omit<
    ChatFilePreviewPanelProps,
    'preview' | 'viewMode' | 'diffFile'
  >;
}

/**
 * Chat 页文件树 + 预览区组合
 * 顶部 Header，下方左侧文件树、右侧预览内容
 */
const ChatFileTreeSidebar: React.FC<ChatFileTreeSidebarProps> = ({
  className,
  tree,
  preview,
  sourceControl,
  viewMode,
  hideDesktop,
  diffFile,
  previewPanelProps,
}) => {
  /** preview 模式下由 Header 折叠按钮控制；desktop 模式下不展示文件树 */
  const showFileTree = viewMode !== 'desktop' && tree.isFileTreeVisible;
  const { isFullscreen, header, content, restartOverlay } =
    useChatFilePreviewPanel({
      preview,
      viewMode,
      hideDesktop,
      diffFile,
      ...previewPanelProps,
    });

  return (
    <div
      className={fileTreeCx(
        'flex',
        'flex-col',
        'flex-1',
        'overflow-hide',
        'h-full',
        {
          [fileTreeCx('fullscreen-mode')]: isFullscreen,
        },
        cx('chat-file-tree-sidebar', className),
      )}
    >
      <div
        className={fileTreeCx(
          'h-full',
          'flex',
          'flex-col',
          'flex-1',
          'overflow-hide',
          {
            [fileTreeCx('fullscreen-content-wrapper')]: isFullscreen,
          },
        )}
      >
        {/* 顶部 Header（固定高度，避免 flex 子项被内容撑开） */}
        <div className={cx('preview-header-shell')}>{header}</div>

        {/* 下方：左侧文件树 + 右侧预览内容 */}
        <div
          className={fileTreeCx(
            'content-container',
            'flex',
            'flex-1',
            'overflow-hide',
          )}
        >
          {showFileTree && (
            <FileTreeGitSourcePanel
              showSourceControl
              className={cx('file-tree-panel', 'h-full')}
              tree={tree}
              treeClassName="w-full h-full"
              sourceControl={sourceControl}
            />
          )}
          <div className={cx('preview-panel', 'flex-1', 'h-full', 'relative')}>
            {content}
            {restartOverlay}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatFileTreeSidebar;
