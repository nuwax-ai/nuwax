import docIcon from '@/assets/icons/files/doc.png';
import excelIcon from '@/assets/icons/files/excel.png';
import mediaIcon from '@/assets/icons/files/media.png';
import pdfIcon from '@/assets/icons/files/pdf.png';
import pptIcon from '@/assets/icons/files/ppt.png';
import { IMAGE_FALLBACK } from '@/constants/images.constants';
import type { ChatUploadFileProps } from '@/types/interfaces/agentConfig';
import { UploadFileInfo } from '@/types/interfaces/common';
import { formatBytes } from '@/utils/byteConverter';
import { getProgressStatus } from '@/utils/upload';
import { CloseCircleOutlined } from '@ant-design/icons';
import { Image, Progress } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 聊天上传文件列表组件
 */
const ChatUploadFile: React.FC<ChatUploadFileProps> = ({ files, onDel }) => {
  const getStatus = useCallback(
    (fileInfo: UploadFileInfo) => getProgressStatus(fileInfo),
    [],
  );

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

  return (
    <div className={cx(styles['files-container'])}>
      {files?.map((file) => {
        const fileIcon = getFileIcon(file?.type, file?.name);
        const isImage = file?.type?.includes('image/');

        return (
          <div
            key={file.uid}
            className={cx(styles['file-box'], 'flex', 'items-center')}
          >
            {/* 根据文件类型显示对应图标或图片 */}
            <Image
              width={50}
              height={50}
              src={isImage ? file?.url : fileIcon}
              fallback={IMAGE_FALLBACK}
              preview={false}
            />
            <div className={cx('flex-1', 'overflow-hide', styles.info)}>
              <h4 className={cx('text-ellipsis')}>{file?.name}</h4>
              <span className={styles.size}>{formatBytes(file?.size)}</span>
            </div>
            <CloseCircleOutlined
              className={cx(styles.del)}
              onClick={() => onDel(file.uid)}
            />
            <Progress
              type="circle"
              percent={Math.floor(file?.percent || 0)}
              status={getStatus(file)}
              size={30}
              className={styles['progress-upload-file']}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ChatUploadFile;
