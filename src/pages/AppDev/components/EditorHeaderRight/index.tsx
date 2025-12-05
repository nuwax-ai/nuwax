import SvgIcon from '@/components/base/SvgIcon';
import { VERSION_CONSTANTS } from '@/constants/appDevConstants';
import { SyncOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Dropdown, Tag, Tooltip } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

// 版本对比模式相关接口
interface VersionCompareProps {
  isSwitching: boolean;
  targetVersion?: number;
  onCancelCompare: () => void;
  onConfirmVersionSwitch: () => void;
  isChatLoading: boolean;
}

// 预览状态相关接口
interface PreviewStatusProps {
  devServerUrl?: string;
  isStarting: boolean;
  isRestarting: boolean;
  isProjectUploading: boolean;
  isLoading?: boolean;
  lastRefreshed?: Date | null;
}

// 版本选择相关接口
interface VersionSelectorProps {
  versionList: any[];
  currentVersion?: number;
  onVersionSelect: (version: number) => void;
  getActionColor: (action: string) => string;
  getActionText: (action: string) => string;
  isChatLoading: boolean;
}

// 控制台相关接口
interface ConsoleButtonProps {
  showDevLogConsole: boolean;
  hasErrorInLatestBlock: boolean;
  onToggleDevLogConsole: () => void;
}

// 更多操作相关接口
interface MoreActionsProps {
  onImportProject: () => void;
  onUploadSingleFile: () => void;
  onRefreshPreview: () => void;
  onRestartServer: () => void;
  onFullscreenPreview: () => void;
  onExportProject: () => void;
  isChatLoading: boolean;
  devServerUrl?: string;
}

// 主组件接口 - 简化后的接口
interface EditorHeaderRightProps {
  // 版本对比模式相关
  isComparing: boolean;
  versionCompareData: {
    isSwitching: boolean;
    targetVersion?: number;
    onCancelCompare: () => void;
    onConfirmVersionSwitch: () => void;
  };

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

  // 版本选择相关
  versionData: {
    versionList: any[];
    currentVersion?: number;
    onVersionSelect: (version: number) => void;
    getActionColor: (action: string) => string;
    getActionText: (action: string) => string;
  };

  // 控制台相关
  consoleData: {
    showDevLogConsole: boolean;
    hasErrorInLatestBlock: boolean;
    onToggleDevLogConsole: () => void;
  };

  // 更多操作相关
  actionsData: {
    onImportProject: () => void;
    onUploadSingleFile: () => void;
    onRefreshPreview: () => void;
    onRestartServer: () => void;
    onFullscreenPreview: () => void;
    onExportProject: () => void;
  };

  // 通用状态
  isChatLoading: boolean;
}

/**
 * 版本对比模式组件
 * 负责版本对比相关的所有交互逻辑和状态管理
 */
const VersionCompareMode: React.FC<VersionCompareProps> = ({
  isSwitching,
  targetVersion,
  onCancelCompare,
  onConfirmVersionSwitch,
  isChatLoading,
}) => {
  // 版本切换按钮的加载状态
  const switchButtonLoading = useMemo(() => isSwitching, [isSwitching]);

  // 按钮禁用状态
  const buttonsDisabled = useMemo(
    () => isSwitching || isChatLoading,
    [isSwitching, isChatLoading],
  );

  // 版本切换按钮文本
  const switchButtonText = useMemo(
    () => `切换 v${targetVersion} 版本`,
    [targetVersion],
  );

  return (
    <>
      <Alert
        message={VERSION_CONSTANTS.READ_ONLY_MESSAGE}
        showIcon
        className={styles.versionDropdownButton}
      />
      <Button onClick={onCancelCompare} disabled={buttonsDisabled}>
        取消
      </Button>
      <Button
        type="primary"
        onClick={onConfirmVersionSwitch}
        loading={switchButtonLoading}
        disabled={buttonsDisabled}
      >
        {switchButtonText}
      </Button>
    </>
  );
};

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
    [isStarting, isRestarting, isProjectUploading],
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
        <span className={styles.statusBadge}>开发服务器已连接</span>
      )}
      {isLoadingState && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          加载中...
        </span>
      )}
      {isStarting && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          启动中...
        </span>
      )}
      {isRestarting && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          重启中...
        </span>
      )}
      {isProjectUploading && (
        <span className={styles.loadingBadge}>
          <SyncOutlined spin style={{ fontSize: 12 }} />
          导入中...
        </span>
      )}
      {lastRefreshed && (
        <span className={styles.lastUpdated}>
          最后更新: {lastRefreshed.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

/**
 * 版本选择器组件
 * 负责版本选择相关的所有交互逻辑和状态管理
 */
const VersionSelector: React.FC<VersionSelectorProps> = ({
  versionList,
  currentVersion,
  onVersionSelect,
  getActionColor,
  getActionText,
  isChatLoading,
}) => {
  const [expanded, setExpanded] = useState(false);
  // 版本选择器是否禁用
  const isDisabled = useMemo(
    () => versionList.length === 0 || isChatLoading,
    [versionList.length, isChatLoading],
  );

  // 当前版本显示文本
  const currentVersionText = useMemo(
    () => `v${currentVersion || '-'}`,
    [currentVersion],
  );

  // 版本菜单项
  const menuItems = useMemo(
    () =>
      versionList.map((version: any) => ({
        key: version.version.toString(),
        label: (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>v{version.version}</span>
            <span style={{ fontSize: '10px', color: '#999', marginLeft: 8 }}>
              {version.time}
            </span>
            <Tag
              color={getActionColor(version.action)}
              style={{ marginLeft: 8, fontSize: '10px' }}
            >
              {getActionText(version.action)}
            </Tag>
          </div>
        ),
        onClick: () => onVersionSelect(parseInt(version.version)),
      })),
    [versionList, getActionColor, getActionText, onVersionSelect],
  );

  // 选中的版本
  const selectedKeys = useMemo(
    () => [currentVersion?.toString() || ''],
    [currentVersion],
  );

  return (
    <Dropdown
      menu={{
        items: menuItems,
        selectedKeys,
      }}
      disabled={isDisabled}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName={styles.versionSelectorDropdown}
      onOpenChange={(open) => {
        setExpanded(open);
      }}
    >
      <Button
        type="text"
        className={styles.versionSelectorButton}
        disabled={isDisabled}
      >
        {currentVersionText}
        <SvgIcon
          name="icons-common-caret_down"
          className={`${styles.caretDownIcon} ${
            expanded ? styles.expanded : ''
          }`}
          style={{ fontSize: 16 }}
        />
      </Button>
    </Dropdown>
  );
};

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
    if (showDevLogConsole) return '关闭日志';
    return '查看日志';
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
  onUploadSingleFile,
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
        label: '导入项目',
        onClick: onImportProject,
        disabled: isChatLoading,
      },
      // {
      //   key: 'upload',
      //   icon: <PlusOutlined />,
      //   label: '上传单个文件',
      //   onClick: onUploadSingleFile,
      //   disabled: isChatLoading,
      // },
      {
        type: 'divider' as const,
      },
      {
        key: 'restart',
        icon: <SvgIcon name="icons-common-restart" style={{ fontSize: 16 }} />,
        label: '重启服务器',
        onClick: onRestartServer,
        disabled: isChatLoading,
      },
      {
        key: 'fullscreen',
        icon: (
          <SvgIcon name="icons-common-fullscreen" style={{ fontSize: 16 }} />
        ),
        label: '全屏页面预览',
        onClick: onFullscreenPreview,
        disabled: isChatLoading,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'export',
        icon: <SvgIcon name="icons-common-download" style={{ fontSize: 16 }} />,
        label: '导出项目',
        onClick: onExportProject,
        disabled: isChatLoading,
      },
    ],
    [
      onImportProject,
      onUploadSingleFile,
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
  // 版本对比模式相关
  isComparing,
  versionCompareData,

  // 预览模式相关
  activeTab,
  previewData,

  // 版本选择相关
  versionData,

  // 控制台相关
  consoleData,

  // 更多操作相关
  actionsData,

  // 通用状态
  isChatLoading,
}) => {
  // 是否显示预览状态信息
  const shouldShowPreviewStatus = useMemo(
    () => activeTab === 'preview',
    [activeTab],
  );

  return (
    <div className={styles.editorHeaderRight}>
      {/* 版本对比模式下显示的按钮 */}
      {isComparing ? (
        <VersionCompareMode
          isSwitching={versionCompareData.isSwitching}
          targetVersion={versionCompareData.targetVersion}
          onCancelCompare={versionCompareData.onCancelCompare}
          onConfirmVersionSwitch={versionCompareData.onConfirmVersionSwitch}
          isChatLoading={isChatLoading}
        />
      ) : (
        <>
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

          {/* 版本选择器 - 紧凑按钮形式 */}
          <VersionSelector
            versionList={versionData.versionList}
            currentVersion={versionData.currentVersion}
            onVersionSelect={versionData.onVersionSelect}
            getActionColor={versionData.getActionColor}
            getActionText={versionData.getActionText}
            isChatLoading={isChatLoading}
          />

          {/* 控制台按钮 - 保持现有样式 */}
          <ConsoleButton
            showDevLogConsole={consoleData.showDevLogConsole}
            hasErrorInLatestBlock={consoleData.hasErrorInLatestBlock}
            onToggleDevLogConsole={consoleData.onToggleDevLogConsole}
          />
          {/* 刷新按钮 */}
          {shouldShowPreviewStatus && (
            <Tooltip title="刷新预览">
              <Button
                type="text"
                className={styles.refreshButton}
                icon={
                  <SvgIcon
                    name="icons-common-refresh"
                    style={{ fontSize: 16 }}
                  />
                }
                onClick={actionsData.onRefreshPreview}
              />
            </Tooltip>
          )}

          {/* 更多操作菜单 */}
          <MoreActionsMenu
            onImportProject={actionsData.onImportProject}
            onUploadSingleFile={actionsData.onUploadSingleFile}
            onRefreshPreview={actionsData.onRefreshPreview}
            onRestartServer={actionsData.onRestartServer}
            onFullscreenPreview={actionsData.onFullscreenPreview}
            onExportProject={actionsData.onExportProject}
            isChatLoading={isChatLoading}
            devServerUrl={previewData.devServerUrl}
          />
        </>
      )}
    </div>
  );
};

export default EditorHeaderRight;
