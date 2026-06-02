import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { ConversationAgentFileViewPreview } from '../hooks/types';
import ChangeFileGitDiffView from './ChangeFileGitDiffView';
import type { PreviewTab, PreviewToolId } from './hooks/usePreviewTabs';
import styles from './index.less';
import TabPickerPanel from './TabPickerPanel';
import ToolTabContent from './ToolTabContent';

const cx = classNames.bind(styles);
const fileTreeCx = classNames.bind(fileTreeViewStyles);

export interface ConversationAgentFilePreviewProps {
  /** 文件预览状态与渲染函数 */
  preview: ConversationAgentFileViewPreview;
  /** 源代码管理选中的 diff 文件（优先于普通预览） */
  diffFile?: ChangeFileInfo;
  /** 当前激活的标签（由外层 PreviewTabBar 控制） */
  activeTab: PreviewTab | null;
  /** 在「新建页签」面板中选择工具 */
  onSelectTool?: (toolId: PreviewToolId) => void;
  /** 外层容器类名（来自 useConversationAgentFileView） */
  providerClassName?: string;
  className?: string;
}

/**
 * ConversationAgent 文件预览内容区
 * 顶部 PreviewTabBar 由右侧面板父级统一渲染；本组件负责 diff / 编辑器 / 工具页
 */
const ConversationAgentFilePreview: React.FC<
  ConversationAgentFilePreviewProps
> = ({
  preview,
  diffFile,
  activeTab,
  onSelectTool,
  providerClassName,
  className,
}) => {
  const { renderPreviewContent, isFullscreen } = preview;

  const diffFileName = useMemo(() => {
    if (!diffFile) {
      return '';
    }
    const segments = diffFile.fileId.split('/');
    return segments[segments.length - 1] || diffFile.fileId;
  }, [diffFile]);

  const showDiff =
    activeTab?.type === 'file' &&
    activeTab.isDiff &&
    !!diffFile &&
    diffFile.fileId === activeTab.fileId;

  const showFilePreview = activeTab?.type === 'file' && !showDiff;
  const showToolContent = activeTab?.type === 'tool' && !!activeTab.toolId;
  const showPicker = activeTab?.type === 'picker' && !!onSelectTool;

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
      <div className={fileTreeCx('content-container', 'flex', 'flex-1')}>
        <div className={cx('flex-1', 'overflow-hide', styles['preview-body'])}>
          {showDiff && diffFile ? (
            <ChangeFileGitDiffView
              fileId={diffFile.fileId}
              fileName={diffFileName}
              originalContent={diffFile.originalFileContent}
              modifiedContent={diffFile.fileContent}
              className={styles['diff-view']}
            />
          ) : showFilePreview ? (
            renderPreviewContent()
          ) : showToolContent && activeTab.toolId ? (
            <ToolTabContent toolId={activeTab.toolId} />
          ) : showPicker ? (
            <TabPickerPanel embedded onSelectTool={onSelectTool} />
          ) : (
            <div className={cx(styles['empty-preview'])} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationAgentFilePreview;
