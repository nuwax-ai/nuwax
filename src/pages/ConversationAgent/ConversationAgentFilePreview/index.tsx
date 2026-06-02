import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { ConversationAgentFileViewPreview } from '../hooks/types';
import ChangeFileGitDiffView from './ChangeFileGitDiffView';
import type { PreviewTab, PreviewToolId } from './hooks/usePreviewTabs';
import styles from './index.less';
import PreviewTabBar from './PreviewTabBar';
import ToolTabContent from './ToolTabContent';

const cx = classNames.bind(styles);
const fileTreeCx = classNames.bind(fileTreeViewStyles);

export interface ConversationAgentFilePreviewProps {
  /** 文件预览状态与渲染函数 */
  preview: ConversationAgentFileViewPreview;
  /** 源代码管理选中的 diff 文件（优先于普通预览） */
  diffFile?: ChangeFileInfo;
  /** 已打开的标签页列表 */
  tabs: PreviewTab[];
  /** 当前激活的标签 ID */
  activeTabId: string | null;
  /** 当前激活的标签 */
  activeTab: PreviewTab | null;
  /** 标签选择面板是否展开 */
  tabPickerOpen: boolean;
  /** 切换标签 */
  onTabSelect: (tabId: string) => void;
  /** 关闭标签 */
  onTabClose: (tabId: string) => void;
  /** 标签选择面板显隐 */
  onTabPickerOpenChange: (open: boolean) => void;
  /** 从选择面板添加工具标签 */
  onSelectTool: (toolId: PreviewToolId) => void;
  /** 外层容器类名（来自 useConversationAgentFileView） */
  providerClassName?: string;
  className?: string;
}

/**
 * ConversationAgent 文件预览组件
 * 顶部标签栏 + 多种文件预览、代码编辑器与 diff 对比展示
 */
const ConversationAgentFilePreview: React.FC<
  ConversationAgentFilePreviewProps
> = ({
  preview,
  diffFile,
  tabs,
  activeTabId,
  activeTab,
  tabPickerOpen,
  onTabSelect,
  onTabClose,
  onTabPickerOpenChange,
  onSelectTool,
  providerClassName,
  className,
}) => {
  const { renderPreviewContent, filePathHeaderProps, isFullscreen } = preview;

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
      <PreviewTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        tabPickerOpen={tabPickerOpen}
        onTabSelect={onTabSelect}
        onTabClose={onTabClose}
        onTabPickerOpenChange={onTabPickerOpenChange}
        onSelectTool={onSelectTool}
        headerActions={filePathHeaderProps}
      />

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
          ) : (
            <div className={cx(styles['empty-preview'])} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationAgentFilePreview;
