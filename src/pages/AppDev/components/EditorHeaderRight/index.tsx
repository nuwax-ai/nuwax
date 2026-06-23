import SvgIcon from '@/components/base/SvgIcon';
import { t } from '@/services/i18nRuntime';
import {
  BranchesOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Badge, Button, Dropdown, Tooltip } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

// 预览状态相关接口
interface PreviewStatusProps {
  devServerUrl?: string;
  isStarting: boolean;
  isRestarting: boolean;
  isProjectUploading: boolean;
  isLoading?: boolean;
  lastRefreshed?: Date | null;
}

// 控制台相关接口
interface ConsoleButtonProps {
  showDevLogConsole: boolean;
  hasErrorInLatestBlock: boolean;
  onToggleDevLogConsole: () => void;
}

// 终端相关接口
interface TerminalButtonProps {
  onOpenTerminal: () => void;
}

// Git 版本记录相关接口
interface GitVersionRecordButtonProps {
  onOpen: () => void;
  disabled?: boolean;
}

// 更多操作相关接口
interface MoreActionsProps {
  onImportProject: () => void;
  onRefreshPreview: () => void;
  onRestartServer: () => void;
  onFullscreenPreview: () => void;
  onExportProject: () => void;
  isChatLoading: boolean;
  devServerUrl?: string;
}

// 主组件接口 - 简化后的接口
interface EditorHeaderRightProps {
  // 预览模式相关
  activeTab: 'preview' | 'code';
  previewData: {
    devServerUrl?: string;
    isStarting: boolean;
    isRestarting: boolean;
    isProjectUploading: boolean;
    isLoading?: boolean;
    lastRefreshed?: Date | null;
  };

  // 控制台相关
  consoleData: {
    showDevLogConsole: boolean;
    hasErrorInLatestBlock: boolean;
    onToggleDevLogConsole: () => void;
  };

  // 终端相关（可选）
  terminalData?: {
    onOpenTerminal: () => void;
  };

  // 更多操作相关
  actionsData: {
    onImportProject: () => void;
    onRefreshPreview: () => void;
    onRestartServer: () => void;
    onFullscreenPreview: () => void;
    onExportProject: () => void;
  };

  // Git 版本记录（可选）
  gitVersionRecordData?: {
    onOpen: () => void;
    disabled?: boolean;
  };

  // 通用状态
  isChatLoading: boolean;
}

/**
 * 预览状态信息组件
 * 负责预览状态相关的所有显示逻辑和状态管理
 */
const PreviewStatusInfo: React.FC<PreviewStatusProps> = ({
  devServerUrl,
  isStarting,
  isRestarting,
  isProjectUploading,
  isLoading,
  lastRefreshed,
}) => {
  // 服务器连接状态
  const isServerConnected = useMemo(() => !!devServerUrl, [devServerUrl]);

  const isConnectedState = useMemo(
    () =>
      !isProjectUploading &&
      !isRestarting &&
      !isStarting &&
      !isLoading &&
      isServerConnected,
    [
      isProjectUploading,
      isRestarting,
      isStarting,
      isLoading,
      isServerConnected,
    ],
  );

  const isLoadingState = useMemo(
    () => !isStarting && !isRestarting && !isProjectUploading && isLoading,
    [isStarting, isRestarting, isProjectUploading, isLoading],
  );
  const { setIsIframeLoaded } = useModel('appDevDesign');
  useEffect(() => {
    if (isConnectedState) {
      setIsIframeLoaded(true);
    } else if (isLoadingState) {
      setIsIframeLoaded(false);
    } else if (isStarting) {
      setIsIframeLoaded(false);
    }
  }, [isConnectedState, isLoadingState, isStarting]);
  // 是否有加载状态
  // const hasLoadingState = useMemo(
  //   () => isStarting || isRestarting || isProjectUploading,
  //   [isStarting, isRestarting, isProjectUploading],
  // ); // 暂时注释掉，后续可能需要

  return (
    <div className={styles.previewStatusInfo}>
      {isConnectedState && (
        <span className={styles.statusBadge}>
          {t('PC.Pages.AppDevEditorHeaderRight.devServerConnected')}
        </span>
      )}
      {isLoadingState && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          {t('PC.Pages.AppDevEditorHeaderRight.loading')}
        </span>
      )}
      {isStarting && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          {t('PC.Pages.AppDevEditorHeaderRight.starting')}
        </span>
      )}
      {isRestarting && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          {t('PC.Pages.AppDevEditorHeaderRight.restarting')}
        </span>
      )}
      {isProjectUploading && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          {t('PC.Pages.AppDevEditorHeaderRight.importing')}
        </span>
      )}
      {lastRefreshed && (
        <span className={styles.lastUpdated}>
          {t(
            'PC.Pages.AppDevEditorHeaderRight.lastUpdated',
            lastRefreshed.toLocaleTimeString(),
          )}
        </span>
      )}
    </div>
  );
};

/**
 * Git 版本记录按钮
 * 打开 Git 提交历史面板
 */
const GitVersionRecordButton: React.FC<GitVersionRecordButtonProps> = ({
  onOpen,
  disabled = false,
}) => (
  <Tooltip title={t('PC.Pages.AppDevEditorHeaderRight.gitVersionHistory')}>
    <Button
      type="text"
      className={styles.consoleButton}
      icon={<BranchesOutlined style={{ fontSize: 16 }} />}
      onClick={onOpen}
      disabled={disabled}
    />
  </Tooltip>
);

/**
 * 终端按钮组件
 * 点击后打开底部控制台并切换到终端 Tab
 */
const TerminalButton: React.FC<TerminalButtonProps> = ({ onOpenTerminal }) => (
  <Tooltip title={t('PC.Pages.AppDevEditorHeaderRight.viewTerminal')}>
    <Button
      type="text"
      className={styles.consoleButton}
      icon={<ThunderboltOutlined style={{ fontSize: 16 }} />}
      onClick={onOpenTerminal}
    />
  </Tooltip>
);

/**
 * 控制台按钮组件
 * 负责控制台相关的所有交互逻辑和状态管理
 */
const ConsoleButton: React.FC<ConsoleButtonProps> = ({
  showDevLogConsole,
  hasErrorInLatestBlock,
  onToggleDevLogConsole,
}) => {
  // 工具提示文本
  const tooltipText = useMemo(() => {
    if (showDevLogConsole) {
      return t('PC.Pages.AppDevEditorHeaderRight.closeLog');
    }
    return t('PC.Pages.AppDevEditorHeaderRight.viewLog');
  }, [showDevLogConsole]);

  // 是否有错误
  const hasErrors = useMemo(
    () => hasErrorInLatestBlock,
    [hasErrorInLatestBlock],
  );

  return (
    <Tooltip title={tooltipText}>
      <Badge dot={hasErrors} offset={[-8, 8]}>
        <Button
          type="text"
          className={styles.consoleButton}
          icon={
            <SvgIcon name="icons-common-console" style={{ fontSize: 16 }} />
          }
          onClick={onToggleDevLogConsole}
        />
      </Badge>
    </Tooltip>
  );
};

/**
 * 更多操作菜单组件
 * 负责更多操作相关的所有交互逻辑和状态管理
 */
const MoreActionsMenu: React.FC<MoreActionsProps> = ({
  onImportProject,
  onRefreshPreview,
  onRestartServer,
  onFullscreenPreview,
  onExportProject,
  isChatLoading,
  devServerUrl,
}) => {
  // 刷新预览是否禁用
  const isRefreshDisabled = useMemo(
    () => isChatLoading || !devServerUrl,
    [isChatLoading, devServerUrl],
  );

  // 菜单项配置
  const menuItems = useMemo(
    () => [
      {
        key: 'import',
        icon: <SvgIcon name="icons-common-import" style={{ fontSize: 16 }} />,
        label: t('PC.Pages.AppDevEditorHeaderRight.menuImportProject'),
        onClick: onImportProject,
        disabled: isChatLoading,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'restart',
        icon: <SvgIcon name="icons-common-restart" style={{ fontSize: 16 }} />,
        label: t('PC.Pages.AppDevEditorHeaderRight.menuRestartServer'),
        onClick: onRestartServer,
        disabled: isChatLoading,
      },
      {
        key: 'fullscreen',
        icon: (
          <SvgIcon name="icons-common-fullscreen" style={{ fontSize: 16 }} />
        ),
        label: t('PC.Pages.AppDevEditorHeaderRight.menuFullscreenPreview'),
        onClick: onFullscreenPreview,
        disabled: isChatLoading,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'export',
        icon: <SvgIcon name="icons-common-download" style={{ fontSize: 16 }} />,
        label: t('PC.Pages.AppDevEditorHeaderRight.menuExportProject'),
        onClick: onExportProject,
        disabled: isChatLoading,
      },
    ],
    [
      onImportProject,
      onRefreshPreview,
      onRestartServer,
      onFullscreenPreview,
      onExportProject,
      isChatLoading,
      isRefreshDisabled,
    ],
  );

  return (
    <Dropdown
      trigger={['click']}
      menu={{ items: menuItems }}
      placement="bottomRight"
    >
      <Button
        type="text"
        className={styles.moreActionsButton}
        icon={<SvgIcon name="icons-common-more" style={{ fontSize: '16px' }} />}
      />
    </Dropdown>
  );
};

/**
 * 编辑器头部右侧功能区域组件
 * 负责整体布局和条件渲染逻辑，使用数据分组的方式传递 props
 */
const EditorHeaderRight: React.FC<EditorHeaderRightProps> = ({
  activeTab,
  previewData,
  consoleData,
  terminalData,
  actionsData,
  gitVersionRecordData,
  isChatLoading,
}) => {
  // 是否显示预览状态信息
  const shouldShowPreviewStatus = useMemo(
    () => activeTab === 'preview',
    [activeTab],
  );

  return (
    <div className={styles.editorHeaderRight}>
      {/* 预览状态信息 - 仅在预览模式下显示 */}
      {shouldShowPreviewStatus && (
        <PreviewStatusInfo
          devServerUrl={previewData.devServerUrl}
          isStarting={previewData.isStarting}
          isRestarting={previewData.isRestarting}
          isProjectUploading={previewData.isProjectUploading}
          isLoading={previewData.isLoading}
          lastRefreshed={previewData.lastRefreshed}
        />
      )}

      {/* Git 版本记录按钮 */}
      {gitVersionRecordData && (
        <GitVersionRecordButton
          onOpen={gitVersionRecordData.onOpen}
          disabled={gitVersionRecordData.disabled || isChatLoading}
        />
      )}

      {/* 终端按钮 - 打开底部控制台并切换到终端 Tab */}
      {terminalData && (
        <TerminalButton onOpenTerminal={terminalData.onOpenTerminal} />
      )}

      {/* 控制台按钮 - 保持现有样式 */}
      <ConsoleButton
        showDevLogConsole={consoleData.showDevLogConsole}
        hasErrorInLatestBlock={consoleData.hasErrorInLatestBlock}
        onToggleDevLogConsole={consoleData.onToggleDevLogConsole}
      />

      {/* 刷新按钮 */}
      {shouldShowPreviewStatus && (
        <Tooltip title={t('PC.Pages.AppDevEditorHeaderRight.refreshPreview')}>
          <Button
            type="text"
            className={styles.refreshButton}
            icon={
              <SvgIcon name="icons-common-refresh" style={{ fontSize: 16 }} />
            }
            onClick={actionsData.onRefreshPreview}
          />
        </Tooltip>
      )}

      {/* 更多操作菜单 */}
      <MoreActionsMenu
        onImportProject={actionsData.onImportProject}
        onRefreshPreview={actionsData.onRefreshPreview}
        onRestartServer={actionsData.onRestartServer}
        onFullscreenPreview={actionsData.onFullscreenPreview}
        onExportProject={actionsData.onExportProject}
        isChatLoading={isChatLoading}
        devServerUrl={previewData.devServerUrl}
      />
    </div>
  );
};

export default EditorHeaderRight;
