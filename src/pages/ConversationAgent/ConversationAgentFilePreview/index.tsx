import ChangeFileGitDiffView from '@/components/business-component/ChangeFileGitDiffView';
import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { ConversationAgentFileViewPreview } from '../hooks/types';
import FilePathHeader from './FilePathHeader';
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
  /** 「订阅设置」页签 */
  subscriptionSettingPanel?: React.ReactNode;
  /** 「订阅统计」页签 */
  subscriptionStatsPanel?: React.ReactNode;
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
  subscriptionSettingPanel,
  subscriptionStatsPanel,
  providerClassName,
  className,
}) => {
  const { renderPreviewContent, isFullscreen, filePathHeaderProps } = preview;

  /** 修改文件名称 */
  const diffFileName = useMemo(() => {
    if (!diffFile) {
      return '';
    }
    const segments = diffFile.fileId.split('/');
    return segments[segments.length - 1] || diffFile.fileId;
  }, [diffFile]);

  /** 是否显示修改文件diff */
  const showDiff =
    activeTab?.type === 'file' &&
    activeTab.isDiff &&
    !!diffFile &&
    diffFile.fileId === activeTab.fileId;

  /** 是否显示文件预览内容 */
  const showFilePreview = activeTab?.type === 'file' && !showDiff;
  /** 是否显示「新建页签」面板 */
  const showPicker = activeTab?.type === 'picker' && !!onSelectTool;
  /** 当前激活的工作区工具 ID */
  const activeWorkspaceToolId =
    activeTab?.type === 'tool' &&
    activeTab.toolId &&
    WORKSPACE_PREVIEW_TOOL_IDS.includes(activeTab.toolId)
      ? activeTab.toolId
      : null;
  /** 是否显示其他工具内容 */
  const showOtherToolContent =
    activeTab?.type === 'tool' && !!activeTab.toolId && !activeWorkspaceToolId;

  /** 工作区工具页签 → 面板内容映射 */
  const workspacePanelMap = useMemo(
    (): Partial<Record<PreviewToolId, React.ReactNode>> => ({
      preview: debugPanel,
      arrange: arrangeConfigPanel,
      'version-control': versionPanel,
      'subscription-setting': subscriptionSettingPanel,
      'subscription-stats': subscriptionStatsPanel,
    }),
    [
      debugPanel,
      arrangeConfigPanel,
      versionPanel,
      subscriptionSettingPanel,
      subscriptionStatsPanel,
    ],
  );

  /** 按优先级渲染预览区主体（diff > 文件 > 工作区页签 > 其他） */
  const previewBody = useMemo(() => {
    if (showDiff && diffFile) {
      return (
        <ChangeFileGitDiffView
          fileId={diffFile.fileId}
          fileName={diffFileName}
          originalContent={diffFile.originalFileContent}
          modifiedContent={diffFile.fileContent}
          className={styles['diff-view']}
        />
      );
    }

    /** 显示文件预览内容 */
    if (showFilePreview) {
      return (
        <div className={cx(styles['file-preview-layout'])}>
          <FilePathHeader {...filePathHeaderProps} hideClose />
          <div className={cx(styles['file-preview-scroll'])}>
            {renderPreviewContent()}
          </div>
        </div>
      );
    }

    /** 显示工作区工具页签内容 */
    if (activeWorkspaceToolId) {
      const panel = workspacePanelMap[activeWorkspaceToolId];
      if (panel) {
        return <div className={cx(styles['workspace-panel'])}>{panel}</div>;
      }
    }

    /** 显示其他工具内容 */
    if (showOtherToolContent && activeTab?.toolId) {
      return <ToolTabContent toolId={activeTab.toolId} />;
    }

    /** 显示「新建页签」面板 */
    if (showPicker && onSelectTool) {
      return <TabPickerPanel embedded onSelectTool={onSelectTool} />;
    }

    return <div className={cx(styles['empty-preview'])} />;
  }, [
    showDiff,
    diffFile,
    diffFileName,
    showFilePreview,
    filePathHeaderProps,
    renderPreviewContent,
    activeWorkspaceToolId,
    workspacePanelMap,
    showOtherToolContent,
    activeTab?.toolId,
    showPicker,
    onSelectTool,
  ]);

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
        {/* 预览内容区 */}
        <div className={cx('flex-1', 'overflow-hide', styles['preview-body'])}>
          {previewBody}
        </div>
      </div>
    </div>
  );
};

export default ConversationAgentFilePreview;
