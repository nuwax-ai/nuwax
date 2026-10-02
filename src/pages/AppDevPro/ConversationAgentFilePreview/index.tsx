import ChangeFileGitDiffView from '@/components/business-component/ChangeFileGitDiffView';
import fileTreePreviewStyles from '@/components/business-component/FileTreePreviewPanel/index.less';
import type { FileTreePreviewViewPreview } from '@/components/business-component/FileTreePreviewPanel/types';
import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel/types/file-tree';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import FilePathHeader from './FilePathHeader';
import type { PreviewTab } from './hooks/usePreviewTabs';
import styles from './index.less';
import {
  PREVIEW_TOOL_DEFINITIONS,
  type PreviewToolId,
} from './previewToolDefinitions';
import ToolTabContent from './ToolTabContent';

const cx = classNames.bind(styles);
const fileTreeCx = classNames.bind(fileTreePreviewStyles);

export interface ConversationAgentFilePreviewProps {
  /** 当前工作台是否可见；隐藏时关闭文件分享 portal。 */
  active?: boolean;
  /** 文件预览状态与渲染函数 */
  preview: FileTreePreviewViewPreview;
  /** 源代码管理选中的 diff 文件（优先于普通预览） */
  diffFile?: ChangeFileInfo;
  /** 当前激活的标签（由外层 PreviewTabBar 控制） */
  activeTab: PreviewTab | null;
  /** 「应用预览」页签内容；未传入时显示空白占位 */
  previewPanel?: React.ReactNode;
  /** 「版本控制」页签：Git 提交记录 */
  versionPanel?: React.ReactNode;
  /** 「数据库」页签内容 */
  databasePanel?: React.ReactNode;
  /** 「数据库配置」页签内容 */
  databaseConfigPanel?: React.ReactNode;
  /** 新增工具面板通过映射注入，不必增加渲染分支；已有独立 props 继续兼容。 */
  toolPanels?: Partial<Record<PreviewToolId, React.ReactNode>>;
  /** 外层容器类名（来自 useFileTreePreviewView） */
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
  active = true,
  preview,
  diffFile,
  activeTab,
  previewPanel,
  versionPanel,
  databasePanel,
  databaseConfigPanel,
  toolPanels,
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
  /** 工作区工具页签 → 面板内容映射 */
  const workspacePanelMap = useMemo(
    (): Partial<Record<PreviewToolId, React.ReactNode>> => ({
      preview: previewPanel ?? (
        <div className={cx(styles['app-preview-placeholder'])} />
      ),
      'version-control': versionPanel,
      database: databasePanel ?? <ToolTabContent toolId="database" />,
      'database-config': databaseConfigPanel ?? (
        <ToolTabContent toolId="database-config" />
      ),
      ...toolPanels,
    }),
    [
      previewPanel,
      versionPanel,
      databasePanel,
      databaseConfigPanel,
      toolPanels,
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
          <FilePathHeader {...filePathHeaderProps} active={active} />
          <div className={cx(styles['file-preview-scroll'])}>
            {renderPreviewContent()}
          </div>
        </div>
      );
    }

    if (activeTab?.type === 'tool' && activeTab.toolId) {
      const toolId = activeTab.toolId;
      const panel = workspacePanelMap[toolId];
      if (panel !== null && panel !== undefined) {
        return <div className={cx(styles['workspace-panel'])}>{panel}</div>;
      }
      if (PREVIEW_TOOL_DEFINITIONS[toolId].content === 'placeholder') {
        return <ToolTabContent toolId={toolId} />;
      }
    }

    return <div className={cx(styles['empty-preview'])} />;
  }, [
    showDiff,
    diffFile,
    diffFileName,
    showFilePreview,
    active,
    filePathHeaderProps,
    renderPreviewContent,
    workspacePanelMap,
    activeTab?.type,
    activeTab?.toolId,
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
          'immersive-shell-fullscreen': isFullscreen,
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
