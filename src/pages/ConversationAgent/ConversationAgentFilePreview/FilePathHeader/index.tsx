import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { formatFileSize } from '@/utils/appDevUtils';
import { copyTextToClipboard } from '@/utils/clipboard';
import { isMarkdownFile } from '@/utils/common';
import {
  CloseOutlined,
  FilePdfOutlined,
  FullscreenExitOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';
import MoreActionsMenu from './MoreActionsMenu/index';
import ShareDesktopModal from './ShareDesktopModal';
import type { FilePathHeaderProps } from './type';

/** ConversationAgent 文件路径头部 Props */
export type { FilePathHeaderProps };

const cx = classNames.bind(styles);

/**
 * ConversationAgent 文件路径头部组件（自 FileTreeView/FilePathHeader 复制，可独立演进）
 * 显示文件信息与操作按钮
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  className,
  conversationId,
  targetNode,
  /** 重启容器回调 */
  onRestartServer,
  /** 重启智能体回调 */
  onRestartAgent,
  onImportProject,
  onExportProject,
  onFullscreen,
  isFullscreen = false,
  showFullscreenIcon = true,
  isDownloadingFile = false,
  showMoreActions = true,
  onDownloadFileByUrl,
  isShowShare = true,
  // 是否显示下载按钮, 默认显示
  isShowDownloadButton = true,
  // 是否显示导出 PDF 按钮, 默认显示
  isShowExportPdfButton = true,
  onExportPdf,
  isExportingPdf = false,
  onClose,
  isFileTreeVisible = false,
  isFileTreePinned = false,
  onFileTreeToggle,
  isCloudComputer = true,
}) => {
  // 文件名
  const fileName = targetNode?.name;
  // 文件大小
  const fileSize = targetNode?.size;
  // 格式化的文件大小
  const formattedSize = useMemo(() => {
    if (!fileSize) return '';
    return formatFileSize(fileSize);
  }, [fileSize]);

  // 文件分享弹窗显示状态
  const [shareDesktopModalVisible, setShareDesktopModalVisible] =
    useState<boolean>(false);

  // 分享类型
  const [shareType, setShareType] = useState<'CONVERSATION' | 'DESKTOP'>(
    'CONVERSATION',
  );

  /** 分享当前会话文件预览 */
  const onShareAction = () => {
    if (!conversationId) {
      return;
    }
    setShareType('CONVERSATION');
    setShareDesktopModalVisible(true);
  };

  // 是否有左侧文件信息内容需要显示
  const hasFileInfoContent = useMemo(
    () => !isFileTreeVisible && !!fileName,
    [isFileTreeVisible, fileName],
  );

  // 是否需要展示右侧整体 actionButtons（分享 / 全屏 / 更多 / 关闭）
  const showRightActionButtons = useMemo(() => {
    const canShare = isShowShare && !!targetNode?.fileProxyUrl;
    const canFullscreen = showFullscreenIcon || isFullscreen;
    const canMoreActions = showMoreActions;
    const canClose = !!onClose && !isFullscreen;

    return canShare || canFullscreen || canMoreActions || canClose;
  }, [
    isShowShare,
    targetNode?.fileProxyUrl,
    showFullscreenIcon,
    isFullscreen,
    showMoreActions,
    onClose,
  ]);

  return (
    <div className={cx(styles.filePathHeader, className)}>
      {/* 文件树展开/折叠图标 */}
      <div className={cx('flex', 'items-center', 'gap-4')}>
        <span>{dict('PC.Components.FilePathHeader.filePreview')}</span>
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
      {/* 左侧：文件信息 */}
      {hasFileInfoContent && (
        <div className={styles.fileInfo}>
          {/* 根据文件树列表是否展示来控制显隐：文件树展开时隐藏，文件树隐藏时显示 */}
          {!isFileTreeVisible && (
            <div className={styles.fileDetails}>
              <div className={styles.fileName}>{fileName}</div>
              {formattedSize && (
                <span className={styles.fileMeta}>({formattedSize})</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className={cx('flex', 'items-center', 'gap-16', 'ml-auto')}>
        {/* 动态图标区域，根据文件类型动态显示图标 */}
        <div className={styles.actionButtons}>
          {/* Markdown 文件显示导出 PDF 按钮 */}
          {targetNode &&
            fileName &&
            // 是否显示导出 PDF 按钮, 默认显示
            isShowExportPdfButton &&
            (isMarkdownFile(fileName) ||
              fileName.endsWith('.html') ||
              fileName.endsWith('.htm')) && (
              <Tooltip
                title={
                  isExportingPdf
                    ? dict('PC.Components.FilePathHeader.exporting')
                    : dict('PC.Components.FilePathHeader.exportPdf')
                }
              >
                {' '}
                <Button
                  type="text"
                  size="small"
                  // icon={<SvgIcon name="icons-common-transform_pdf_file" style={{ fontSize: 20 }} />}
                  icon={<FilePdfOutlined />}
                  onClick={() => onExportPdf?.(targetNode as FileNode)}
                  className={styles.actionButton}
                  loading={isExportingPdf}
                  disabled={isExportingPdf}
                />
              </Tooltip>
            )}

          {/* 只有存在 fileProxyUrl 且 isShowDownloadButton 为 true 时，才显示下载文件按钮 */}
          {targetNode?.fileProxyUrl && isShowDownloadButton && (
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

          {/* 复制内容 */}
          {!!targetNode?.content && (
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

        {/* 右侧：操作按钮（分享 / 全屏 / 更多 / 关闭） */}
        {showRightActionButtons && (
          <div className={cx(styles.actionButtons)}>
            {/* 分享 */}
            {isShowShare && targetNode?.fileProxyUrl && (
              <Tooltip
                title={dict('PC.Components.FilePathHeader.share')}
                placement="bottom"
              >
                <Button
                  type="text"
                  size="small"
                  icon={
                    <SvgIcon name="icons-chat-share" style={{ fontSize: 16 }} />
                  }
                  onClick={onShareAction}
                  className={styles.actionButton}
                />
              </Tooltip>
            )}

            {/* 是否显示全屏图标 */}
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

            {/* 更多操作菜单 */}
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
                {/* 关闭 */}
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

      {/* 远程桌面分享弹窗 */}
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
