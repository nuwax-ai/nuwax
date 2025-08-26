import docIcon from '@/assets/icons/files/doc.png';
import excelIcon from '@/assets/icons/files/excel.png';
import mediaIcon from '@/assets/icons/files/media.png';
import pdfIcon from '@/assets/icons/files/pdf.png';
import pptIcon from '@/assets/icons/files/ppt.png';
import { IMAGE_FALLBACK } from '@/constants/images.constants';
import { Image } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface FileTypeIconProps {
  /** 文件MIME类型 */
  fileType?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件URL（图片文件使用） */
  fileUrl?: string;
  /** 图标尺寸 */
  size?: number;
  /** 是否显示预览 */
  preview?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 文件类型图标组件
 * 根据文件类型智能显示对应的图标或图片
 */
const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  fileType,
  fileName,
  fileUrl,
  size = 50,
  preview = false,
  className,
  style,
}) => {
  /**
   * 根据文件类型获取对应的图标
   * @param fileType 文件MIME类型
   * @param fileName 文件名
   * @returns 图标路径
   */
  const getFileIcon = useCallback((fileType: string, fileName: string) => {
    // 图片类型直接显示图片
    if (fileType?.includes('image/')) {
      return null; // 返回null表示使用原始图片
    }

    // 根据文件类型和扩展名判断图标
    const extension = fileName?.toLowerCase().split('.').pop() || '';

    // 文档类型
    if (
      fileType?.includes('word') ||
      extension === 'doc' ||
      extension === 'docx'
    ) {
      return docIcon;
    }

    // 表格类型
    if (
      fileType?.includes('excel') ||
      fileType?.includes('spreadsheet') ||
      extension === 'xls' ||
      extension === 'xlsx' ||
      extension === 'csv'
    ) {
      return excelIcon;
    }

    // 演示文稿类型
    if (
      fileType?.includes('powerpoint') ||
      fileType?.includes('presentation') ||
      extension === 'ppt' ||
      extension === 'pptx'
    ) {
      return pptIcon;
    }

    // PDF类型
    if (fileType?.includes('pdf') || extension === 'pdf') {
      return pdfIcon;
    }

    // 媒体文件类型
    if (
      fileType?.includes('video/') ||
      fileType?.includes('audio/') ||
      extension === 'mp4' ||
      extension === 'avi' ||
      extension === 'mov' ||
      extension === 'mp3' ||
      extension === 'wav' ||
      extension === 'flac'
    ) {
      return mediaIcon;
    }

    // 默认文档图标
    return docIcon;
  }, []);

  const fileIcon = getFileIcon(fileType || '', fileName || '');
  const isImage = fileType?.includes('image/');

  return (
    <Image
      width={size}
      height={size}
      src={isImage ? fileUrl : fileIcon}
      fallback={IMAGE_FALLBACK}
      preview={preview}
      className={cx(styles['file-type-icon'], className)}
      style={style}
    />
  );
};

export default FileTypeIcon;
