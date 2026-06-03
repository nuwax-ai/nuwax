import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { ConversationAgentFileViewPreview } from '../hooks/types';
import ChangeFileGitDiffView from './ChangeFileGitDiffView';
import {
  WORKSPACE_PREVIEW_TOOL_IDS,
  type PreviewTab,
  type PreviewToolId,
} from './hooks/usePreviewTabs';
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
  /** 「预览」页签：调试对话面板 */
  debugPanel?: React.ReactNode;
  /** 「编排」页签：智能体配置编辑区 */
  arrangeConfigPanel?: React.ReactNode;
  /** 「版本控制」页签：Git 提交记录 */
  versionPanel?: React.ReactNode;
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
  debugPanel,
  arrangeConfigPanel,
  versionPanel,
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
  const showPicker = activeTab?.type === 'picker' && !!onSelectTool;
  const activeWorkspaceToolId =
    activeTab?.type === 'tool' &&
    activeTab.toolId &&
    WORKSPACE_PREVIEW_TOOL_IDS.includes(activeTab.toolId)
      ? activeTab.toolId
      : null;
  const showOtherToolContent =
    activeTab?.type === 'tool' && !!activeTab.toolId && !activeWorkspaceToolId;

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
      <div
        className={fileTreeCx('content-container', 'flex', 'flex-1', 'h-full')}
      >
        <div className={cx('flex-1', 'overflow-hide', styles['preview-body'])}>
          {/* 显示修改文件diff */}
          {showDiff && diffFile ? (
            <ChangeFileGitDiffView
              fileId={diffFile.fileId}
              fileName={diffFileName}
              originalContent={diffFile.originalFileContent}
              modifiedContent={diffFile.fileContent}
              className={styles['diff-view']}
            />
          ) : showFilePreview ? (
            // 显示文件预览内容
            renderPreviewContent()
          ) : activeWorkspaceToolId === 'preview' && debugPanel ? (
            <div className={cx(styles['workspace-panel'])}>{debugPanel}</div>
          ) : activeWorkspaceToolId === 'arrange' && arrangeConfigPanel ? (
            <div className={cx(styles['workspace-panel'])}>
              {arrangeConfigPanel}
            </div>
          ) : activeWorkspaceToolId === 'version-control' && versionPanel ? (
            <div className={cx(styles['workspace-panel'])}>{versionPanel}</div>
          ) : showOtherToolContent && activeTab?.toolId ? (
            <ToolTabContent toolId={activeTab.toolId} />
          ) : showPicker ? (
            // 显示「新建页签」面板
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
