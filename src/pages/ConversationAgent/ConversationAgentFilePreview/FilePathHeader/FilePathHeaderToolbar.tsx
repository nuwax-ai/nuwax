import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { copyTextToClipboard } from '@/utils/clipboard';
import {
  CloseOutlined,
  FilePdfOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';
import MoreActionsMenu from './MoreActionsMenu/index';
import ShareDesktopModal from './ShareDesktopModal';
import type { FilePathHeaderProps } from './type';

const cx = classNames.bind(styles);

export interface FilePathHeaderToolbarProps extends FilePathHeaderProps {
  /** 为 true 时不展示关闭按钮（PreviewTabBar 使用） */
  hideClose?: boolean;
  /** 工具栏容器额外类名 */
  toolbarClassName?: string;
}

/**
 * 文件路径头部右侧操作区（导出 / 下载 / 复制 / 分享 / 全屏 / 更多）
 * 与 FileTreeView/FilePathHeader 操作区一致，可嵌入 PreviewTabBar
 */
const FilePathHeaderToolbar: React.FC<FilePathHeaderToolbarProps> = ({
  hideClose = false,
  toolbarClassName,
  conversationId = '',
  targetNode,
  onRestartServer,
  onRestartAgent,
  onImportProject,
  onExportProject,
  onFullscreen,
  isFullscreen = false,
  isDownloadingFile = false,
  onDownloadFileByUrl,
  onExportPdf,
  isExportingPdf = false,
  onClose,
  isCloudComputer = true,
}) => {
  const [shareDesktopModalVisible, setShareDesktopModalVisible] =
    useState<boolean>(false);
  const [shareType, setShareType] = useState<'CONVERSATION' | 'DESKTOP'>(
    'CONVERSATION',
  );

  const onShareAction = () => {
    if (!conversationId) {
      return;
    }
    setShareType('CONVERSATION');
    setShareDesktopModalVisible(true);
  };

  return (
    <>
      <div
        className={cx(
          'flex',
          'items-center',
          'gap-16',
          'ml-auto',
          toolbarClassName,
        )}
      >
        <div className={styles.actionButtons}>
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
              onClick={() =>
                targetNode && onExportPdf?.(targetNode as FileNode)
              }
              className={styles.actionButton}
              loading={isExportingPdf}
              disabled={isExportingPdf}
            />
          </Tooltip>

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
              onClick={() =>
                targetNode && onDownloadFileByUrl?.(targetNode as FileNode)
              }
              className={styles.actionButton}
              loading={isDownloadingFile}
              disabled={isDownloadingFile}
            />
          </Tooltip>

          <Tooltip title={dict('PC.Components.FilePathHeader.copy')}>
            <Button
              type="text"
              size="small"
              icon={<SvgIcon name="icons-chat-copy" style={{ fontSize: 16 }} />}
              onClick={() => {
                copyTextToClipboard(targetNode?.content || '', () => {
                  message.success(dict('PC.Toast.Global.copiedSuccessfully'));
                });
              }}
              className={styles.actionButton}
            />
          </Tooltip>
        </div>

        <div className={cx(styles.actionButtons)}>
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

          <MoreActionsMenu
            onImportProject={onImportProject}
            onRestartServer={onRestartServer}
            onRestartAgent={onRestartAgent}
            onExportProject={onExportProject}
            isCloudComputer={isCloudComputer}
          />

          {!hideClose && (
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
      </div>

      <ShareDesktopModal
        fileProxyUrl={targetNode?.fileProxyUrl || null}
        shareType={shareType}
        visible={shareDesktopModalVisible}
        onClose={() => setShareDesktopModalVisible(false)}
        conversationId={conversationId}
      />
    </>
  );
};

export default FilePathHeaderToolbar;
