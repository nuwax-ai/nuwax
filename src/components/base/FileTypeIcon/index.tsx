import docIcon from '@/assets/icons/files/doc.png';
import excelIcon from '@/assets/icons/files/excel.png';
import mediaIcon from '@/assets/icons/files/media.png';
import pdfIcon from '@/assets/icons/files/pdf.png';
import pptIcon from '@/assets/icons/files/ppt.png';
import { IMAGE_FALLBACK } from '@/constants/images.constants';
import {
  FileOutlined,
  FileTextOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import { Image } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const ARCHIVE_EXTENSIONS = new Set([
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'bz2',
  'xz',
]);

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'log',
  'json',
  'xml',
]);

type AntdFileIcon = typeof FileOutlined;

interface PngFileIconResult {
  kind: 'png';
  src: string;
}

interface AntdFileIconResult {
  kind: 'antd';
  Icon: AntdFileIcon;
  color: string;
}

type FileIconResult = PngFileIconResult | AntdFileIconResult;

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
  const getFileIcon = useCallback(
    (mimeType: string, name: string): FileIconResult | null => {
      if (mimeType?.includes('image/')) {
        return null;
      }

      const fileName = name?.trim() ?? '';
      const extension = fileName.includes('.')
        ? fileName.split('.').pop()?.toLowerCase() ?? ''
        : '';
      const normalizedMime = mimeType?.toLowerCase() ?? '';
      const isGenericMime =
        !normalizedMime || normalizedMime === 'application/octet-stream';

      if (!extension && isGenericMime) {
        return { kind: 'antd', Icon: FileOutlined, color: '#bfbfbf' };
      }

      if (
        normalizedMime.includes('zip') ||
        normalizedMime.includes('rar') ||
        normalizedMime.includes('compressed') ||
        ARCHIVE_EXTENSIONS.has(extension)
      ) {
        return { kind: 'antd', Icon: FileZipOutlined, color: '#fa8c16' };
      }

      if (
        normalizedMime.startsWith('text/') ||
        TEXT_EXTENSIONS.has(extension)
      ) {
        return { kind: 'antd', Icon: FileTextOutlined, color: '#083fa1' };
      }

      if (
        normalizedMime.includes('msword') ||
        normalizedMime.includes('wordprocessingml') ||
        extension === 'doc' ||
        extension === 'docx'
      ) {
        return { kind: 'png', src: docIcon as string };
      }

      if (
        normalizedMime.includes('excel') ||
        normalizedMime.includes('spreadsheet') ||
        extension === 'xls' ||
        extension === 'xlsx' ||
        extension === 'csv'
      ) {
        return { kind: 'png', src: excelIcon as string };
      }

      if (
        normalizedMime.includes('powerpoint') ||
        normalizedMime.includes('presentation') ||
        extension === 'ppt' ||
        extension === 'pptx'
      ) {
        return { kind: 'png', src: pptIcon as string };
      }

      if (normalizedMime.includes('pdf') || extension === 'pdf') {
        return { kind: 'png', src: pdfIcon as string };
      }

      if (
        normalizedMime.includes('video/') ||
        normalizedMime.includes('audio/') ||
        extension === 'mp4' ||
        extension === 'avi' ||
        extension === 'mov' ||
        extension === 'mp3' ||
        extension === 'wav' ||
        extension === 'flac'
      ) {
        return { kind: 'png', src: mediaIcon as string };
      }

      return { kind: 'antd', Icon: FileOutlined, color: '#bfbfbf' };
    },
    [],
  );

  const iconResult = useMemo(
    () => getFileIcon(fileType || '', fileName || ''),
    [fileName, fileType, getFileIcon],
  );
  const isImage = fileType?.includes('image/');

  if (isImage) {
    return (
      <Image
        width={size}
        height={size}
        src={fileUrl}
        fallback={IMAGE_FALLBACK}
        preview={preview}
        className={cx(styles['file-type-icon'], className)}
        style={style}
      />
    );
  }

  if (iconResult?.kind === 'antd') {
    const { Icon, color } = iconResult;
    return (
      <span
        className={cx(
          styles['file-type-icon'],
          styles['antd-file-icon'],
          className,
        )}
        style={{ width: size, height: size, ...style }}
      >
        <Icon style={{ fontSize: Math.round(size * 0.56), color }} />
      </span>
    );
  }

  if (iconResult?.kind === 'png') {
    return (
      <Image
        width={size}
        height={size}
        src={iconResult.src}
        fallback={IMAGE_FALLBACK}
        preview={preview}
        className={cx(styles['file-type-icon'], className)}
        style={style}
      />
    );
  }

  return (
    <span
      className={cx(
        styles['file-type-icon'],
        styles['antd-file-icon'],
        className,
      )}
      style={{ width: size, height: size, ...style }}
    >
      <FileOutlined
        style={{ fontSize: Math.round(size * 0.56), color: '#bfbfbf' }}
      />
    </span>
  );
};

export default FileTypeIcon;
