import ChangeFileGitDiffView from '@/components/business-component/ChangeFileGitDiffView';
import VncPreview from '@/components/business-component/VncPreview';
import type { VncPreviewRef } from '@/components/business-component/VncPreview/type';
import fileTreeViewStyles from '@/components/FileTreeView/index.less';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type { ConversationAgentFileViewPreview } from '@/pages/ConversationAgent/hooks/types';
import { dict } from '@/services/i18nRuntime';
import { HideDesktopEnum } from '@/types/enums/agent';
import { Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ChatFilePathHeader from '../FilePathHeader';

const cx = classNames.bind(fileTreeViewStyles);

export interface UseChatFilePreviewPanelParams {
  /** 文件预览状态与渲染函数（来自 useConversationAgentFileView） */
  preview: ConversationAgentFileViewPreview;
  /** 当前视图模式：文件预览 / 智能体电脑 */
  viewMode: 'preview' | 'desktop';
  /** 用户选择的智能体电脑 ID */
  agentSandboxId?: string;
  agentSandboxName?: string;
  /** 重启容器 */
  onRestartServer?: () => Promise<void>;
  /** 重启智能体 */
  onRestartAgent?: () => void;
  /** 导出项目 */
  onExportProject?: () => Promise<void>;
  /** VNC 空闲检测 */
  idleDetection?: {
    enabled?: boolean;
    onIdleTimeout?: () => void;
  };
  hideDesktop?: HideDesktopEnum;
  /** Git 源代码管理选中的 diff 文件（优先于普通预览） */
  diffFile?: ChangeFileInfo | null;
  /** 是否显示 Git 版本记录按钮 */
  showGitVersionButton?: boolean;
  /** Git 版本记录面板是否已打开 */
  isGitVersionPanelOpen?: boolean;
  /** 切换 Git 版本记录面板 */
  onToggleGitVersionPanel?: () => void;
}

/** useChatFilePreviewPanel 返回值 */
export interface UseChatFilePreviewPanelReturn {
  isFullscreen: boolean;
  header: React.ReactNode;
  content: React.ReactNode;
  restartOverlay: React.ReactNode;
}

/**
 * Chat 页文件预览逻辑 Hook
 * 提供顶部 Header 与右侧预览内容，供 ChatFileTreeSidebar 组合布局
 */
export function useChatFilePreviewPanel(
  params: UseChatFilePreviewPanelParams,
): UseChatFilePreviewPanelReturn {
  const {
    preview,
    viewMode,
    agentSandboxId,
    agentSandboxName = '',
    onRestartServer,
    onRestartAgent,
    onExportProject,
    idleDetection,
    hideDesktop = HideDesktopEnum.No,
    diffFile,
    showGitVersionButton = false,
    isGitVersionPanelOpen = false,
    onToggleGitVersionPanel,
  } = params;

  const {
    targetId,
    readOnly,
    isFullscreen,
    renderPreviewContent,
    filePathHeaderProps,
    handleFullscreen,
  } = preview;

  const vncPreviewRef = useRef<VncPreviewRef>(null);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [isExportingProjecting, setIsExportingProjecting] =
    useState<boolean>(false);

  // 获取 VNC 连接状态
  const renderVncPreviewStatus = useCallback(() => {
    return vncPreviewRef.current?.getStatus() ?? null;
  }, []);

  // 导出项目
  const handleDownloadProject = useCallback(async () => {
    if (!onExportProject) {
      return;
    }
    setIsExportingProjecting(true);
    try {
      await onExportProject();
    } finally {
      setTimeout(() => setIsExportingProjecting(false), 1000);
    }
  }, [onExportProject]);

  // 重启容器
  const handleRestartServer = useCallback(async () => {
    if (!onRestartServer) {
      return;
    }
    setIsRestarting(true);
    try {
      await onRestartServer();
      if (viewMode === 'desktop' && vncPreviewRef.current) {
        vncPreviewRef.current.disconnect();
        setTimeout(() => vncPreviewRef.current?.connect(), 0);
      }
    } catch (error) {
      console.error('Restart server failed:', error);
    } finally {
      setIsRestarting(false);
    }
  }, [onRestartServer, viewMode]);

  /** 切换至 desktop 时自动连接 VNC */
  useEffect(() => {
    if (viewMode === 'desktop') {
      vncPreviewRef.current?.connect();
    }
  }, [viewMode]);

  // VNC 空闲检测
  const wrappedIdleDetection = idleDetection
    ? {
        ...idleDetection,
        onIdleTimeout: () => {
          idleDetection.onIdleTimeout?.();
        },
      }
    : undefined;

  // 差异文件名称
  const diffFileName = useMemo(() => {
    if (!diffFile) {
      return '';
    }
    const segments = diffFile.fileId.split('/');
    return segments[segments.length - 1] || diffFile.fileId;
  }, [diffFile]);

  // 文件预览内容区
  const content =
    viewMode === 'desktop' ? (
      <VncPreview
        ref={vncPreviewRef}
        serviceUrl={process.env.BASE_URL || ''}
        cId={targetId?.toString() || ''}
        readOnly={readOnly}
        autoConnect
        className={cx('vnc-preview')}
        idleDetection={wrappedIdleDetection}
      />
    ) : diffFile ? (
      <ChangeFileGitDiffView
        fileId={diffFile.fileId}
        fileName={diffFileName}
        originalContent={diffFile.originalFileContent}
        modifiedContent={diffFile.fileContent}
        className={cx('flex-1', 'h-full')}
      />
    ) : (
      renderPreviewContent()
    );

  // 文件预览 Header 组件
  const header = (
    <ChatFilePathHeader
      {...filePathHeaderProps}
      conversationId={targetId?.toString() || ''}
      viewMode={viewMode}
      agentSandboxName={agentSandboxName}
      onRestartServer={handleRestartServer}
      onRestartAgent={onRestartAgent}
      isCloudComputer={agentSandboxId === '-1'}
      onExportProject={onExportProject ? handleDownloadProject : undefined}
      isExportingProjecting={isExportingProjecting}
      onFullscreen={handleFullscreen}
      isFullscreen={isFullscreen}
      onClose={filePathHeaderProps.onClose}
      vncConnectStatus={renderVncPreviewStatus()}
      showGitVersionButton={showGitVersionButton}
      isGitVersionPanelOpen={isGitVersionPanelOpen}
      onToggleGitVersionPanel={onToggleGitVersionPanel}
    />
  );

  // 重启容器遮罩
  const restartOverlay =
    isRestarting && hideDesktop !== HideDesktopEnum.Yes ? (
      <div className={cx('restart-container')}>
        <div className={cx('background-placeholder')} />
        <div className={cx('loading-overlay')}>
          <Spin size="large" className={cx('loading-spin')} />
          <span className={cx('loading-text')}>
            {dict('PC.Components.FileTreeView.restarting')}
          </span>
        </div>
      </div>
    ) : null;

  return {
    isFullscreen,
    header,
    content,
    restartOverlay,
  };
}
