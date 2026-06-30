import SvgIcon from '@/components/base/SvgIcon';
import { ConnectionStatus } from '@/components/business-component/VncPreview/type';
import { USER_INFO } from '@/constants/home.constants';
import { dict } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { formatFileSize } from '@/utils/appDevUtils';
import { copyTextToClipboard } from '@/utils/clipboard';
import { isMarkdownFile } from '@/utils/common';
import {
  BranchesOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FullscreenExitOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, message, Segmented, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';
import MoreActionsMenu from './MoreActionsMenu/index';
import ShareDesktopModal from './ShareDesktopModal';
import type { FilePathHeaderProps } from './type';

const cx = classNames.bind(styles);

/**
 * Chat 页文件预览 Header
 * 基于 FilePathHeader 复制，移除保存/取消按钮逻辑
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  className,
  conversationId,
  targetNode,
  viewMode = 'preview',
  agentSandboxName,
  onRestartServer,
  onRestartAgent,
  onImportProject,
  onExportProject,
  onFullscreen,
  isFullscreen = false,
  showFullscreenIcon = true,
  isDownloadingFile = false,
  showMoreActions = true,
  viewFileType = 'preview',
  onViewFileTypeChange,
  onDownloadFileByUrl,
  isShowShare = true,
  isShowDownloadButton = true,
  isShowExportPdfButton = true,
  onExportPdf,
  isExportingPdf = false,
  onClose,
  vncConnectStatus,
  isFileTreeVisible = false,
  isFileTreePinned = false,
  onFileTreeToggle,
  isCloudComputer = true,
  showGitVersionButton = false,
  onToggleGitVersionPanel,
  afterGitVersionActions,
}) => {
  const fileName = targetNode?.name;
  const fileSize = targetNode?.size;
  const formattedSize = useMemo(() => {
    if (!fileSize) return '';
    return formatFileSize(fileSize);
  }, [fileSize]);

  const _userInfo = localStorage.getItem(USER_INFO);
  const userInfo = _userInfo ? JSON.parse(_userInfo) : null;
  const [shareDesktopModalVisible, setShareDesktopModalVisible] =
    useState<boolean>(false);
  const [shareType, setShareType] = useState<'CONVERSATION' | 'DESKTOP'>(
    'CONVERSATION',
  );

  const onShareAction = (mode: 'preview' | 'desktop') => {
    if (!conversationId) {
      return;
    }
    if (mode === 'preview') {
      setShareType('CONVERSATION');
    }
    if (mode === 'desktop') {
      setShareType('DESKTOP');
    }
    setShareDesktopModalVisible(true);
  };

  const getVncConnectStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return '#3BB346';
      case 'connecting':
        return '#1890ff';
      case 'disconnected':
        return '#f50';
      case 'error':
        return '#ff4d4f';
      default:
        return 'transparent';
    }
  };

  const hasFileInfoContent = useMemo(() => {
    if (viewMode === 'preview') {
      const hasFileDetails = !isFileTreeVisible && fileName;
      const hasSegmented =
        (targetNode?.fileProxyUrl ||
          (targetNode?.content !== undefined &&
            targetNode?.content !== null)) &&
        fileName &&
        (fileName?.includes('.htm') || isMarkdownFile(fileName));
      return hasFileDetails || hasSegmented;
    }
    return true;
  }, [viewMode, isFileTreeVisible, fileName, targetNode?.fileProxyUrl]);

  const showRightActionButtons = useMemo(() => {
    const canShare =
      isShowShare &&
      (viewMode === 'desktop' ||
        (targetNode?.fileProxyUrl && viewMode === 'preview'));
    const canFullscreen = showFullscreenIcon || isFullscreen;
    const canMoreActions = showMoreActions;
    const canClose = !!onClose && !isFullscreen;
    const canGitVersion = showGitVersionButton && !!onToggleGitVersionPanel;
    const canAfterGitVersionActions = !!afterGitVersionActions;
    return (
      canShare ||
      canFullscreen ||
      canMoreActions ||
      canClose ||
      canGitVersion ||
      canAfterGitVersionActions
    );
  }, [
    isShowShare,
    viewMode,
    targetNode?.fileProxyUrl,
    showFullscreenIcon,
    isFullscreen,
    showMoreActions,
    onClose,
    showGitVersionButton,
    onToggleGitVersionPanel,
    afterGitVersionActions,
  ]);

  return (
    <div className={cx(styles.filePathHeader, className)}>
      {viewMode !== 'desktop' && (
        <div className={cx('flex', 'items-center', 'gap-4')}>
          <span>{dict('PC.Components.FilePathHeader.filePreview')}</span>

          {/* 文件树展开/折叠按钮 */}
          <Tooltip
            title={
              isFileTreeVisible
                ? dict('PC.Components.FilePathHeader.collapseFileTree')
                : dict('PC.Components.FilePathHeader.expandFileTree')
            }
          >
            <Button
              type="text"
              size="small"
              icon={
                isFileTreeVisible ? (
                  <MenuFoldOutlined style={{ fontSize: 16 }} />
                ) : (
                  <MenuUnfoldOutlined style={{ fontSize: 16 }} />
                )
              }
              onClick={onFileTreeToggle}
              className={cx(styles.fileTreeToggleButton, {
                [styles.fileTreeToggleButtonPinned]: isFileTreePinned,
              })}
            />
          </Tooltip>
        </div>
      )}

      {viewMode === 'preview' ? (
        <div className={styles.fileInfo}>
          {/* 根据文件树列表是否展示来控制显隐：文件树展开时隐藏，文件树隐藏时显示 */}
          {!isFileTreeVisible && fileName && (
            <div className={styles.fileDetails}>
              <div className={styles.fileName}>{fileName}</div>
              {formattedSize && (
                <span className={styles.fileMeta}>({formattedSize})</span>
              )}
            </div>
          )}

          {/* 只有存在 fileProxyUrl 或 content 时，才显示预览和代码视图切换按钮 */}
          {(targetNode?.fileProxyUrl ||
            (targetNode?.content !== undefined &&
              targetNode?.content !== null)) &&
            fileName &&
            (fileName?.includes('.htm') || isMarkdownFile(fileName)) && (
              <ConfigProvider
                theme={{
                  components: {
                    Segmented: {
                      itemSelectedBg: '#fff',
                      itemSelectedColor: '#5147FF',
                      itemColor: 'rgba(0, 0, 0, 0.45)',
                      itemHoverColor: 'rgba(0, 0, 0, 0.65)',
                      trackBg: 'rgba(12, 20, 102, 0.04)',
                      trackPadding: 2,
                    },
                  },
                }}
              >
                <Segmented
                  value={viewFileType}
                  onChange={onViewFileTypeChange}
                  options={[
                    {
                      label: dict('PC.Components.FilePathHeader.preview'),
                      value: 'preview',
                    },
                    {
                      label: dict('PC.Components.FilePathHeader.code'),
                      value: 'code',
                    },
                  ]}
                />
              </ConfigProvider>
            )}
        </div>
      ) : (
        hasFileInfoContent && (
          <div className={styles.fileInfo}>
            <div className={styles['pc-box']}>
              {vncConnectStatus && (
                <div
                  className={styles.vncConnectStatus}
                  style={{
                    backgroundColor: getVncConnectStatusColor(vncConnectStatus),
                  }}
                />
              )}
              <div className={styles.fileName}>
                {agentSandboxName ||
                  `${
                    userInfo?.nickName ||
                    userInfo?.userName ||
                    dict('PC.Components.FilePathHeader.remote')
                  }${dict('PC.Components.FilePathHeader.agentComputerSuffix')}`}
              </div>
            </div>
          </div>
        )
      )}

      <div className={cx('flex', 'items-center', 'gap-16', 'ml-auto')}>
        <div className={styles.actionButtons}>
          {targetNode &&
            fileName &&
            isShowExportPdfButton &&
            (isMarkdownFile(fileName) ||
              fileName.endsWith('.html') ||
              fileName.endsWith('.htm')) &&
            viewMode === 'preview' && (
              <Tooltip
                title={
                  isExportingPdf
                    ? dict('PC.Components.FilePathHeader.exporting')
                    : dict('PC.Components.FilePathHeader.exportPdf')
                }
              >
                <Button
                  type="text"
                  size="small"
                  icon={<FilePdfOutlined />}
                  onClick={() => onExportPdf?.(targetNode as FileNode)}
                  className={styles.actionButton}
                  loading={isExportingPdf}
                  disabled={isExportingPdf}
                />
              </Tooltip>
            )}

          {targetNode?.fileProxyUrl &&
            isShowDownloadButton &&
            viewMode === 'preview' && (
              <Tooltip
                placement="bottom"
                title={
                  isDownloadingFile
                    ? dict('PC.Components.FilePathHeader.downloading')
                    : dict('PC.Components.FilePathHeader.download')
                }
              >
                <Button
                  type="text"
                  size="small"
                  icon={
                    <SvgIcon
                      name="icons-common-download"
                      style={{ fontSize: 16 }}
                    />
                  }
                  onClick={() => onDownloadFileByUrl?.(targetNode as FileNode)}
                  className={styles.actionButton}
                  loading={isDownloadingFile}
                  disabled={isDownloadingFile}
                />
              </Tooltip>
            )}

          {!!targetNode?.content && viewMode === 'preview' && (
            <Tooltip title={dict('PC.Components.FilePathHeader.copy')}>
              <Button
                type="text"
                size="small"
                icon={
                  <SvgIcon name="icons-chat-copy" style={{ fontSize: 16 }} />
                }
                onClick={() => {
                  copyTextToClipboard(targetNode?.content || '', () => {
                    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
                  });
                }}
                className={styles.actionButton}
              />
            </Tooltip>
          )}
        </div>

        {showRightActionButtons && (
          <div className={cx(styles.actionButtons)}>
            {/* Git 版本记录按钮 */}
            {showGitVersionButton && onToggleGitVersionPanel && (
              <Tooltip
                title={dict(
                  'PC.Pages.AppDevEditorHeaderRight.gitVersionHistory',
                )}
                placement="bottom"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<BranchesOutlined style={{ fontSize: 16 }} />}
                  onClick={onToggleGitVersionPanel}
                  className={cx(styles.actionButton)}
                />
              </Tooltip>
            )}

            {afterGitVersionActions}

            {/* 分享按钮 */}
            {isShowShare &&
              (viewMode === 'desktop' ||
                (targetNode?.fileProxyUrl && viewMode === 'preview')) && (
                <Tooltip
                  title={dict('PC.Components.FilePathHeader.share')}
                  placement="bottom"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      <SvgIcon
                        name="icons-chat-share"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={() => onShareAction(viewMode)}
                    className={styles.actionButton}
                  />
                </Tooltip>
              )}

            {/* 全屏按钮 */}
            {(showFullscreenIcon || isFullscreen) && (
              <Tooltip
                title={
                  isFullscreen
                    ? dict('PC.Components.FilePathHeader.exitFullscreen')
                    : dict('PC.Components.FilePathHeader.fullscreen')
                }
                placement="bottom"
                key={isFullscreen ? 'exit' : 'enter'}
              >
                <Button
                  type="text"
                  size="small"
                  icon={
                    isFullscreen ? (
                      <FullscreenExitOutlined style={{ fontSize: 16 }} />
                    ) : (
                      <SvgIcon
                        name="icons-common-fullscreen"
                        style={{ fontSize: 16 }}
                      />
                    )
                  }
                  onClick={onFullscreen}
                  className={styles.actionButton}
                />
              </Tooltip>
            )}

            {showMoreActions && (
              <MoreActionsMenu
                onImportProject={onImportProject}
                onRestartServer={onRestartServer}
                onRestartAgent={onRestartAgent}
                onExportProject={onExportProject}
                isCloudComputer={isCloudComputer}
              />
            )}

            {onClose && !isFullscreen && (
              <>
                <div className={styles.divider} />
                <Tooltip title={dict('PC.Components.FilePathHeader.close')}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={onClose}
                    className={styles.actionButton}
                  />
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>

      <ShareDesktopModal
        fileProxyUrl={targetNode?.fileProxyUrl || null}
        shareType={shareType}
        visible={shareDesktopModalVisible}
        onClose={() => setShareDesktopModalVisible(false)}
        conversationId={conversationId || ''}
      />
    </div>
  );
};

export default FilePathHeader;
