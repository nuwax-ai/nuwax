import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import classNames from 'classnames';
import React from 'react';
import type { ConversationAgentFileViewPreview } from '../hooks/types';
import FilePathHeader from './FilePathHeader';
import styles from './index.less';

const cx = classNames.bind(styles);
const fileTreeCx = classNames.bind(fileTreeViewStyles);

export interface ConversationAgentFilePreviewProps {
  /** 文件预览状态与渲染函数 */
  preview: ConversationAgentFileViewPreview;
  /** 外层容器类名（来自 useConversationAgentFileView） */
  providerClassName?: string;
  className?: string;
}

/**
 * ConversationAgent 文件预览组件
 * 负责文件路径头部、多种文件预览与代码编辑器展示
 */
const ConversationAgentFilePreview: React.FC<
  ConversationAgentFilePreviewProps
> = ({ preview, providerClassName, className }) => {
  const { renderPreviewContent, filePathHeaderProps, isFullscreen } = preview;

  return (
    <div
      className={cx(
        'flex',
        'flex-col',
        'flex-1',
        'overflow-hide',
        'h-full',
        {
          [fileTreeCx('fullscreen-mode')]: isFullscreen,
          [fileTreeCx('fullscreen-content-wrapper')]: isFullscreen,
        },
        providerClassName,
        className,
      )}
    >
      <FilePathHeader {...filePathHeaderProps} />

      <div className={fileTreeCx('content-container', 'flex', 'flex-1')}>
        <div className={cx('flex-1', 'overflow-hide')}>
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  );
};

export default ConversationAgentFilePreview;
