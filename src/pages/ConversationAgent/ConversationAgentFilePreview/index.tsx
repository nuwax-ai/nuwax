import MonacoDiffEditor from '@/components/CodeViewer/MonacoDiffEditor';
import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import { FileNode } from '@/types/interfaces/appDev';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { ConversationAgentFileViewPreview } from '../hooks/types';
import FilePathHeader from './FilePathHeader';
import styles from './index.less';

const cx = classNames.bind(styles);
const fileTreeCx = classNames.bind(fileTreeViewStyles);

export interface ConversationAgentFilePreviewProps {
  /** 文件预览状态与渲染函数 */
  preview: ConversationAgentFileViewPreview;
  /** 源代码管理选中的 diff 文件（优先于普通预览） */
  diffFile?: ChangeFileInfo;
  /** 外层容器类名（来自 useConversationAgentFileView） */
  providerClassName?: string;
  className?: string;
}

/**
 * ConversationAgent 文件预览组件
 * 负责文件路径头部、多种文件预览、代码编辑器与 diff 对比展示
 */
const ConversationAgentFilePreview: React.FC<
  ConversationAgentFilePreviewProps
> = ({ preview, diffFile, providerClassName, className }) => {
  const { renderPreviewContent, filePathHeaderProps, isFullscreen } = preview;

  const diffFileName = useMemo(() => {
    if (!diffFile) {
      return '';
    }
    const segments = diffFile.fileId.split('/');
    return segments[segments.length - 1] || diffFile.fileId;
  }, [diffFile]);

  /** diff 模式下同步头部展示的文件名 */
  const headerProps = useMemo(() => {
    if (!diffFile) {
      return filePathHeaderProps;
    }

    const diffTargetNode: FileNode = {
      ...(filePathHeaderProps.targetNode || {}),
      id: diffFile.fileId,
      name: diffFileName,
      type: 'file',
      path: diffFile.fileId,
    };

    return {
      ...filePathHeaderProps,
      targetNode: diffTargetNode,
    };
  }, [diffFile, diffFileName, filePathHeaderProps]);

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
      <FilePathHeader {...headerProps} />

      <div className={fileTreeCx('content-container', 'flex', 'flex-1')}>
        <div className={cx('flex-1', 'overflow-hide', styles['preview-body'])}>
          {diffFile ? (
            <MonacoDiffEditor
              fileId={diffFile.fileId}
              fileName={diffFileName}
              originalContent={diffFile.originalFileContent}
              modifiedContent={diffFile.fileContent}
              className={styles['diff-editor']}
            />
          ) : (
            renderPreviewContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationAgentFilePreview;
