import copyImage from '@/assets/images/copy.png';
import SvgIcon from '@/components/base/SvgIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { USER_INFO } from '@/constants/home.constants';
import { apiAgentConversationShare } from '@/services/agentConfig';
import { AgentConversationShareParams } from '@/types/interfaces/agent';
import { FileNode } from '@/types/interfaces/appDev';
import { copyTextToClipboard } from '@/utils';
import { formatFileSize } from '@/utils/appDevUtils';
import { isMarkdownFile } from '@/utils/common';
import {
  CloseOutlined,
  DesktopOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { Button, message, Segmented, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { ReactComponent as CodeIconSvg } from './code.svg';
import styles from './index.less';
import MoreActionsMenu from './MoreActionsMenu/index';
import pcIcon from './pc.svg';
import ShareDesktopModal from './ShareDesktopModal';

const cx = classNames.bind(styles);

interface FilePathHeaderProps {
  /** 会话ID */
  conversationId: string;
  className?: string;
  /** 文件节点 */
  targetNode: FileNode | null;
  /** 当前视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 视图模式切换回调 */
  onViewModeChange?: (mode: 'preview' | 'desktop') => void;
  /** 重启服务器回调 */
  onRestartServer?: () => void;
  /** 导入项目回调 */
  onImportProject?: () => void;
  /** 导出项目回调 */
  onExportProject?: () => void;
  /** 全屏回调 */
  onFullscreen?: () => void;
  /** 是否处于全屏状态 */
  isFullscreen?: boolean;
  /** 是否显示全屏图标 */
  showFullscreenIcon?: boolean;
  /** 保存回调 */
  onSaveFiles?: () => void;
  /** 取消保存回调 */
  onCancelSaveFiles?: () => void;
  /** 是否存在修改过的文件 */
  hasModifiedFiles?: boolean;
  /** 是否正在保存文件 */
  isSavingFiles?: boolean;
  /** 是否正在导出项目 */
  isExportingProjecting?: boolean;
  /** 是否正在下载文件 */
  isDownloadingFile?: boolean;
  /** 是否显示更多操作菜单 */
  showMoreActions?: boolean;
  /** 文件类型 */
  viewFileType?: 'preview' | 'code';
  /** 针对html、md文件，切换预览和代码视图 */
  onViewFileTypeChange?: (type: 'preview' | 'code') => void;
  /** 通过URL下载文件回调 */
  onDownloadFileByUrl?: (node: FileNode) => void;
  /** 分享回调 */
  onShare?: () => void;
  // 是否显示分享按钮
  isShowShare?: boolean;
  /** 导出为 PDF 回调（仅 Markdown 文件） */
  onExportPdf?: (node: FileNode) => void;
  /** 是否正在导出 PDF */
  isExportingPdf?: boolean;
  // 关闭整个面板
  onClose?: () => void;
}

/**
 * 文件路径头部组件
 * 显示文件信息、视图模式切换按钮和操作按钮
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  className,
  conversationId,
  targetNode,
  viewMode = 'preview',
  onViewModeChange,
  onRestartServer,
  onImportProject,
  onExportProject,
  onFullscreen,
  isFullscreen = false,
  showFullscreenIcon = true,
  onSaveFiles,
  onCancelSaveFiles,
  hasModifiedFiles = false,
  isSavingFiles = false,
  isDownloadingFile = false,
  showMoreActions = true,
  viewFileType = 'preview',
  onViewFileTypeChange,
  onDownloadFileByUrl,
  isShowShare = true,
  onExportPdf,
  isExportingPdf = false,
  onClose,
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

  // 获取用户信息
  const _userInfo = localStorage.getItem(USER_INFO);
  const userInfo = _userInfo ? JSON.parse(_userInfo) : null;
  // 远程桌面分享弹窗显示状态
  const [shareDesktopModalVisible, setShareDesktopModalVisible] =
    useState(false);

  // 分享文件
  const onSharePreviewFile = async () => {
    const data: AgentConversationShareParams = {
      conversationId,
      type: 'CONVERSATION',
      content: targetNode?.fileProxyUrl || '',
    };

    const { data: shareData, code } = await apiAgentConversationShare(data);
    if (code === SUCCESS_CODE) {
      const baseUrl = window?.location?.origin || '';
      const path = '/static/file-preview.html';

      const query = new URLSearchParams();
      query.set('sk', shareData?.shareKey);
      query.set(
        'isDev',
        process.env.NODE_ENV === 'development' ? 'true' : 'false',
      );
      const previewUrl = baseUrl + path + '?' + query.toString();

      // 复制到剪切板
      copyTextToClipboard(previewUrl);
      message.success('分享成功，链接已复制到剪切板');
    }
  };

  // 分享桌面
  const onShareDesktop = () => {
    setShareDesktopModalVisible(true);
  };

  // 分享
  const onShareAction = (mode: 'preview' | 'desktop') => {
    if (!conversationId) {
      return;
    }

    // 分享文件
    if (mode === 'preview') {
      onSharePreviewFile();
    }

    // 分享桌面
    if (mode === 'desktop') {
      onShareDesktop();
    }
  };

  const handleCopy = () => {
    message.success('复制成功');
  };

  return (
    <div
      className={cx(
        styles.filePathHeader,
        { ['pl-16']: !isFullscreen },
        className,
      )}
    >
      {/* 左侧：文件信息 */}
      <div className={styles.fileInfo}>
        {viewMode === 'preview' ? (
          <>
            <div className={styles.fileDetails}>
              <div className={styles.fileName}>{fileName}</div>
              {formattedSize && (
                <div className={styles.fileMeta}>{formattedSize}</div>
              )}
            </div>
            {/* 只有存在 fileProxyUrl 时，才显示预览和代码视图切换按钮，可以通过 fileProxyUrl 预览和代码视图 */}
            {targetNode?.fileProxyUrl &&
              fileName &&
              (fileName?.includes('.htm') || isMarkdownFile(fileName)) && (
                <Segmented
                  value={viewFileType}
                  onChange={onViewFileTypeChange}
                  options={[
                    {
                      label: (
                        <Tooltip title="预览">
                          <EyeOutlined />
                        </Tooltip>
                      ),
                      value: 'preview',
                    },
                    {
                      label: (
                        <Tooltip title="源代码">
                          <span className={styles['svg-box']}>
                            <CodeIconSvg />
                          </span>
                        </Tooltip>
                      ),
                      value: 'code',
                    },
                  ]}
                />
              )}
          </>
        ) : (
          <div className={styles['pc-box']}>
            <img src={pcIcon} alt="" />
            <div className={styles.fileName}>
              {userInfo?.nickName || userInfo?.userName || '远程'}的智能体电脑
            </div>
          </div>
        )}
      </div>

      {/* 底部：保存和取消按钮 */}
      {hasModifiedFiles && (
        <div className="flex items-center content-end gap-4 ml-auto">
          <Button
            size="small"
            type="primary"
            onClick={onSaveFiles}
            loading={isSavingFiles}
          >
            保存
          </Button>
          <Button size="small" type="default" onClick={onCancelSaveFiles}>
            取消
          </Button>
        </div>
      )}

      {/* 中间：视图模式切换按钮 */}
      {onViewModeChange && (
        <div className={styles.viewModeButtons}>
          <Button
            type={viewMode === 'preview' ? 'primary' : 'default'}
            size="small"
            icon={
              <SvgIcon name="icons-common-preview" style={{ fontSize: 14 }} />
            }
            onClick={() => onViewModeChange?.('preview')}
            className={styles.viewModeButton}
          >
            文件预览
          </Button>
          <Button
            type={viewMode === 'desktop' ? 'primary' : 'default'}
            size="small"
            icon={<DesktopOutlined style={{ fontSize: 14 }} />}
            onClick={() => onViewModeChange?.('desktop')}
            className={styles.viewModeButton}
          >
            智能体电脑
          </Button>
        </div>
      )}

      {/* 右侧：操作按钮 */}
      <div className={styles.actionButtons}>
        {/* Markdown 文件显示导出 PDF 按钮 */}
        {targetNode &&
          fileName &&
          isMarkdownFile(fileName) &&
          viewMode === 'preview' && (
            <Tooltip title={isExportingPdf ? '导出中...' : '导出为 PDF'}>
              <Button
                type="text"
                size="small"
                icon={<FilePdfOutlined style={{ fontSize: 16 }} />}
                onClick={() => onExportPdf?.(targetNode as FileNode)}
                className={styles.actionButton}
                loading={isExportingPdf}
                disabled={isExportingPdf}
              />
            </Tooltip>
          )}

        {/* 分享 */}
        {isShowShare &&
          (viewMode === 'desktop' ||
            (targetNode?.fileProxyUrl && viewMode === 'preview')) && (
            <Tooltip title="分享">
              <Button
                type="text"
                size="small"
                icon={
                  <SvgIcon name="icons-chat-share" style={{ fontSize: 16 }} />
                }
                onClick={() => onShareAction(viewMode)}
                className={styles.actionButton}
              />
            </Tooltip>
          )}

        {/* 复制内容 */}
        {!!targetNode?.content && (
          <CopyToClipboard text={targetNode?.content || ''} onCopy={handleCopy}>
            <Tooltip title="复制">
              <Button
                type="text"
                icon={
                  <img
                    className={cx('cursor-pointer', styles.img)}
                    style={{ width: 22, height: 22 }}
                    src={copyImage}
                    alt=""
                  />
                }
              />
            </Tooltip>
          </CopyToClipboard>
        )}

        {/* 只有存在 fileProxyUrl 时，才显示下载文件按钮，可以通过 fileProxyUrl 下载文件 */}
        {targetNode?.fileProxyUrl && viewMode === 'preview' && (
          <Tooltip title={isDownloadingFile ? '下载中...' : '下载'}>
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

        {/* 是否显示全屏图标 */}
        {(showFullscreenIcon || isFullscreen) && (
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
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
            onExportProject={onExportProject}
          />
        )}

        {onClose && !isFullscreen && (
          <>
            <div className={styles.divider} />

            {/* 关闭 */}
            <Tooltip title="关闭">
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

      {/* 远程桌面分享弹窗 */}
      <ShareDesktopModal
        visible={shareDesktopModalVisible}
        onClose={() => setShareDesktopModalVisible(false)}
        conversationId={conversationId || ''}
      />
    </div>
  );
};

export default FilePathHeader;
