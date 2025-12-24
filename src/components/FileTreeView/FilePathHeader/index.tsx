import SvgIcon from '@/components/base/SvgIcon';
import { formatFileSize } from '@/utils/appDevUtils';
import { DesktopOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';
import MoreActionsMenu from './MoreActionsMenu/index';

const cx = classNames.bind(styles);

interface FilePathHeaderProps {
  className?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件大小（字节） */
  fileSize?: number;
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
  /** 是否正在下载文件 */
  isDownloading?: boolean;
}

/**
 * 文件路径头部组件
 * 显示文件信息、视图模式切换按钮和操作按钮
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  className,
  fileName,
  fileSize,
  viewMode = 'preview',
  onViewModeChange,
  onRestartServer,
  onImportProject,
  onExportProject,
  onFullscreen,
  // isFullscreen = false,
  onSaveFiles,
  onCancelSaveFiles,
  hasModifiedFiles = false,
  isSavingFiles = false,
  // isDownloading = false,
}) => {
  // 格式化的文件大小
  const formattedSize = useMemo(() => {
    if (!fileSize) return '';
    return formatFileSize(fileSize);
  }, [fileSize]);

  return (
    <div className={cx(styles.filePathHeader, className)}>
      {/* 左侧：文件信息 */}
      <div className={styles.fileInfo}>
        {viewMode === 'preview' && (
          <div className={styles.fileDetails}>
            <div className={styles.fileName}>{fileName}</div>
            {formattedSize && (
              <div className={styles.fileMeta}>{formattedSize}</div>
            )}
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
            远程桌面
          </Button>
        </div>
      )}

      {/* 更多操作菜单 */}
      <MoreActionsMenu
        onImportProject={onImportProject}
        onRestartServer={onRestartServer}
        onFullscreenPreview={onFullscreen}
        onExportProject={onExportProject}
      />

      {/* 右侧：操作按钮 */}
      {/* <div className={styles.actionButtons}>
        {onDownload && (
          <Tooltip title={isDownloading ? '下载中...' : '下载'}>
            <Button
              type="text"
              size="small"
              icon={
                <SvgIcon
                  name="icons-common-download"
                  style={{ fontSize: 16 }}
                />
              }
              onClick={onDownload}
              className={styles.actionButton}
              loading={isDownloading}
              disabled={isDownloading}
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
      </div> */}
    </div>
  );
};

export default FilePathHeader;
