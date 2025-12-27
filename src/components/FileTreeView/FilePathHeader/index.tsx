import SvgIcon from '@/components/base/SvgIcon';
import { USER_INFO } from '@/constants/home.constants';
import { FileNode } from '@/types/interfaces/appDev';
import { formatFileSize } from '@/utils/appDevUtils';
import { isMarkdownFile } from '@/utils/common';
import {
  DesktopOutlined,
  EyeOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { Button, Segmented, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { ReactComponent as CodeIconSvg } from './code.svg';
import styles from './index.less';
import MoreActionsMenu from './MoreActionsMenu/index';
import pcIcon from './pc.svg';

const cx = classNames.bind(styles);

interface FilePathHeaderProps {
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
}

/**
 * 文件路径头部组件
 * 显示文件信息、视图模式切换按钮和操作按钮
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  className,
  targetNode,
  viewMode = 'preview',
  onViewModeChange,
  onRestartServer,
  onImportProject,
  onExportProject,
  onFullscreen,
  isFullscreen = false,
  onSaveFiles,
  onCancelSaveFiles,
  hasModifiedFiles = false,
  isSavingFiles = false,
  isDownloadingFile = false,
  showMoreActions = true,
  viewFileType = 'preview',
  onViewFileTypeChange,
  onDownloadFileByUrl,
  onShare,
  isShowShare = true,
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

  return (
    <div className={cx(styles.filePathHeader, className)}>
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
        {isShowShare && (
          <Tooltip title="分享">
            <Button
              type="text"
              size="small"
              icon={
                <SvgIcon name="icons-chat-share" style={{ fontSize: 16 }} />
              }
              onClick={onShare}
              className={styles.actionButton}
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
        {/* 更多操作菜单 */}
        {showMoreActions && (
          <MoreActionsMenu
            onImportProject={onImportProject}
            onRestartServer={onRestartServer}
            onExportProject={onExportProject}
          />
        )}
      </div>
    </div>
  );
};

export default FilePathHeader;
