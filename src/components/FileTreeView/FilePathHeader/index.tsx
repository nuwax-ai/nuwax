import SvgIcon from '@/components/base/SvgIcon';
import { formatFileSize } from '@/utils/appDevUtils';
import { DesktopOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import styles from './index.less';

interface FilePathHeaderProps {
  /** 文件路径 */
  filePath: string;
  /** 文件名 */
  fileName?: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 最后修改时间（时间戳） */
  lastModified?: number;
  /** 当前视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 视图模式切换回调 */
  onViewModeChange?: (mode: 'preview' | 'desktop') => void;
  /** 下载回调 */
  onDownload?: () => void;
  /** 全屏回调 */
  onFullscreen?: () => void;
}

/**
 * 格式化日期时间
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化后的日期时间字符串
 */
const formatDateTime = (timestamp?: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 文件路径头部组件
 * 显示文件信息、视图模式切换按钮和操作按钮
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  filePath,
  fileName,
  fileSize,
  lastModified,
  viewMode = 'preview',
  onViewModeChange,
  onDownload,
  onFullscreen,
}) => {
  // 显示的文件名
  const displayFileName = useMemo(() => {
    return fileName || filePath.split('/').pop() || '未知文件';
  }, [fileName, filePath]);

  // 格式化的文件大小
  const formattedSize = useMemo(() => {
    if (!fileSize) return '';
    return formatFileSize(fileSize);
  }, [fileSize]);

  // 格式化的日期时间
  const formattedDate = useMemo(() => {
    return formatDateTime(lastModified);
  }, [lastModified]);

  // 文件信息文本
  const fileInfoText = useMemo(() => {
    const parts: string[] = [];
    if (formattedSize) parts.push(formattedSize);
    if (formattedDate) parts.push(formattedDate);
    return parts.join(' • ');
  }, [formattedSize, formattedDate]);

  return (
    <div className={styles.filePathHeader}>
      {/* 左侧：文件信息 */}
      <div className={styles.fileInfo}>
        <div className={styles.fileIcon}>
          <SvgIcon name="icons-common-preview" style={{ fontSize: 20 }} />
        </div>
        <div className={styles.fileDetails}>
          <div className={styles.fileName}>{displayFileName}</div>
          {fileInfoText && (
            <div className={styles.fileMeta}>{fileInfoText}</div>
          )}
        </div>
      </div>

      {/* 中间：视图模式切换按钮 */}
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

      {/* 右侧：操作按钮 */}
      <div className={styles.actionButtons}>
        <Tooltip title="下载">
          <Button
            type="text"
            size="small"
            icon={
              <SvgIcon name="icons-common-download" style={{ fontSize: 16 }} />
            }
            onClick={onDownload}
            className={styles.actionButton}
          />
        </Tooltip>
        <Tooltip title="全屏">
          <Button
            type="text"
            size="small"
            icon={
              <SvgIcon
                name="icons-common-fullscreen"
                style={{ fontSize: 16 }}
              />
            }
            onClick={onFullscreen}
            className={styles.actionButton}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default FilePathHeader;
