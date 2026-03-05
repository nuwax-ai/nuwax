import SvgIcon from '@/components/base/SvgIcon';
import { ConnectionStatus } from '@/components/business-component/VncPreview/type';
import { USER_INFO } from '@/constants/home.constants';
import { FileNode } from '@/types/interfaces/appDev';
import { formatFileSize } from '@/utils/appDevUtils';
import { isMarkdownFile } from '@/utils/common';
import {
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
import { FilePathHeaderProps } from './type';

const cx = classNames.bind(styles);

/**
 * 文件路径头部组件
 * 显示文件信息、视图模式切换按钮和操作按钮
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  className,
  conversationId,
  targetNode,
  viewMode = 'preview',
  onRestartServer,
  onRestartAgent,
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
  vncConnectStatus,
  isFileTreeVisible = false,
  isFileTreePinned = false,
  onFileTreeToggle,
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
    useState<boolean>(false);

  // 分享类型
  const [shareType, setShareType] = useState<'CONVERSATION' | 'DESKTOP'>(
    'CONVERSATION',
  );

  // 分享
  const onShareAction = (mode: 'preview' | 'desktop') => {
    if (!conversationId) {
      return;
    }

    // 分享文件
    if (mode === 'preview') {
      setShareType('CONVERSATION');
    }

    // 分享桌面
    if (mode === 'desktop') {
      setShareType('DESKTOP');
    }
    setShareDesktopModalVisible(true);
  };

  // 获取 VNC 连接状态颜色
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

  return (
    <div className={cx(styles.filePathHeader, className)}>
      {/* 文件树展开/折叠图标 */}
      {viewMode !== 'desktop' && (
        <div className={cx('flex', 'items-center', 'gap-4')}>
          <span>文件预览</span>
          <Tooltip
            title={isFileTreeVisible ? '点击收起文件树' : '点击展开文件树'}
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
      {/* 左侧：文件信息 */}
      {/* 计算是否有子内容：preview 模式需要检查是否有 fileDetails 或 Segmented，desktop 模式总是有 pc-box */}
      {(() => {
        if (viewMode === 'preview') {
          // preview 模式：检查是否有 fileDetails 或 Segmented
          const hasFileDetails = !isFileTreeVisible && fileName;
          const hasSegmented =
            targetNode?.fileProxyUrl &&
            fileName &&
            (fileName?.includes('.htm') || isMarkdownFile(fileName));
          return hasFileDetails || hasSegmented;
        } else {
          // desktop 模式：pc-box 总是显示，所以总是有内容
          return true;
        }
      })() && (
        <div className={styles.fileInfo}>
          {viewMode === 'preview' ? (
            <>
              {/* 根据文件树列表是否展示来控制显隐：文件树展开时隐藏，文件树隐藏时显示 */}
              {!isFileTreeVisible && (
                <div className={styles.fileDetails}>
                  <div className={styles.fileName}>{fileName}</div>
                  {formattedSize && (
                    <span className={styles.fileMeta}>({formattedSize})</span>
                  )}
                </div>
              )}
              {/* 只有存在 fileProxyUrl 时，才显示预览和代码视图切换按钮，可以通过 fileProxyUrl 预览和代码视图 */}
              {targetNode?.fileProxyUrl &&
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
                          label: '预览',
                          value: 'preview',
                        },
                        {
                          label: '代码',
                          value: 'code',
                        },
                      ]}
                    />
                  </ConfigProvider>
                )}
            </>
          ) : (
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
                {userInfo?.nickName || userInfo?.userName || '远程'}
                的智能体电脑
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部：保存和取消按钮 */}
      {hasModifiedFiles && (
        <div className="flex items-center content-end gap-4">
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

      <div className={cx('flex', 'items-center', 'gap-16', 'ml-auto')}>
        {/* 动态图标区域，根据视图模式和文件类型动态显示图标 */}
        <div className={styles.actionButtons}>
          {/* Markdown 文件显示导出 PDF 按钮 */}
          {targetNode &&
            fileName &&
            (isMarkdownFile(fileName) ||
              fileName.endsWith('.html') ||
              fileName.endsWith('.htm')) &&
            viewMode === 'preview' && (
              <Tooltip title={isExportingPdf ? '导出中...' : '导出为 PDF'}>
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

          {/* 复制内容 */}
          {!!targetNode?.content && viewMode === 'preview' && (
            <Tooltip title="复制">
              <Button
                type="text"
                size="small"
                icon={
                  <SvgIcon name="icons-chat-copy" style={{ fontSize: 16 }} />
                }
                onClick={() => {
                  navigator.clipboard.writeText(targetNode?.content || '');
                  message.success('复制成功');
                }}
                className={styles.actionButton}
              />
            </Tooltip>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className={cx(styles.actionButtons)}>
          {/* 分享 */}
          {isShowShare &&
            (viewMode === 'desktop' ||
              (targetNode?.fileProxyUrl && viewMode === 'preview')) && (
              <Tooltip title="分享" placement="bottom">
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

          {/* 是否显示全屏图标 */}
          {(showFullscreenIcon || isFullscreen) && (
            <Tooltip
              title={isFullscreen ? '退出全屏' : '全屏'}
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
