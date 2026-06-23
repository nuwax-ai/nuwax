import ChangeFileGitDiffView from '@/components/business-component/ChangeFileGitDiffView';
import VncPreview from '@/components/business-component/VncPreview';
import type { VncPreviewRef } from '@/components/business-component/VncPreview/type';
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
import FilePathHeader from '../FilePathHeader';
import styles from '../index.less';
import type { UseFileTreePreviewPanelParams } from '../types';

const cx = classNames.bind(styles);

/** useFileTreePreviewPanel 返回值 */
export interface UseFileTreePreviewPanelReturn {
  isFullscreen: boolean;
  header: React.ReactNode;
  content: React.ReactNode;
  restartOverlay: React.ReactNode;
}

/**
 * 文件树预览区逻辑 Hook
 * 提供顶部 Header 与右侧预览内容，供 FileTreePreviewPanel 组合布局
 */
export function useFileTreePreviewPanel(
  params: UseFileTreePreviewPanelParams,
): UseFileTreePreviewPanelReturn {
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
    onToggleGitVersionPanel,
    afterGitVersionActions,
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
        className="flex-1 h-full"
      />
    ) : (
      renderPreviewContent()
    );

  const header = (
    <FilePathHeader
      {...filePathHeaderProps}
      conversationId={targetId?.toString() || ''}
      viewMode={viewMode}
      agentSandboxName={agentSandboxName}
      onRestartServer={
        onRestartServer ? () => void handleRestartServer() : undefined
      }
      onRestartAgent={onRestartAgent}
      isCloudComputer={agentSandboxId === '-1'}
      onExportProject={onExportProject ? handleDownloadProject : undefined}
      isExportingProjecting={isExportingProjecting}
      onFullscreen={handleFullscreen}
      isFullscreen={isFullscreen}
      onClose={filePathHeaderProps.onClose}
      vncConnectStatus={renderVncPreviewStatus()}
      showGitVersionButton={showGitVersionButton}
      onToggleGitVersionPanel={onToggleGitVersionPanel}
      afterGitVersionActions={afterGitVersionActions}
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
