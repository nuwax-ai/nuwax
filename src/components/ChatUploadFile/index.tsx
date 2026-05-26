import FileTypeIcon from '@/components/base/FileTypeIcon';
import { IMAGE_FALLBACK } from '@/constants/images.constants';
import { UploadFileStatus } from '@/types/enums/common';
import type { ChatUploadFileProps } from '@/types/interfaces/agentConfig';
import { UploadFileInfo } from '@/types/interfaces/common';
import { formatBytes } from '@/utils/byteConverter';
import { getProgressStatus } from '@/utils/upload';
import {
  CloseCircleOutlined,
  CloseOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Image } from 'antd';
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
   * 渲染图片文件项
   * 上传过程中仅展示 loading，上传完成后使用服务端 URL 渲染图片
   */
  const renderImageFile = (file: UploadFileInfo) => {
    const status = getStatus(file);
    const isUploading =
      file.status === UploadFileStatus.uploading || status === 'active';

    return (
      <div
        key={file.uid}
        className={cx(
          styles['file-box'],
          styles['image-box'],
          'flex',
          'items-center',
        )}
      >
        {/* 图片容器 */}
        <div className={cx(styles['image-container'], 'relative')}>
          <Image
            src={file?.url}
            fallback={IMAGE_FALLBACK}
            preview={false}
            className={styles['file-image']}
          />
          {status === 'exception' && (
            <CloseOutlined
              className={cx(styles['status-icon'], styles['status-error'])}
            />
          )}
          {isUploading && (
            <div
              className={cx(styles['status-icon'], styles['status-loading'])}
            >
              <LoadingOutlined spin />
            </div>
          )}
        </div>

        {/* 图片不显示name和size信息 */}

        <CloseCircleOutlined
          className={cx(styles.del)}
          onClick={() => onDel(file.uid)}
        />
      </div>
    );
  };

  /**
   * 渲染非图片文件项
   */
  const renderDocumentFile = (file: UploadFileInfo) => {
    const status = getStatus(file);
    const isUploading =
      file.status === UploadFileStatus.uploading || status === 'active';

    return (
      <div
        key={file.uid}
        className={cx(styles['file-box'], 'flex', 'items-center')}
      >
        {/* 使用 FileTypeIcon 组件显示文件图标 */}
        <div className={cx(styles['icon-container'], 'relative')}>
          <FileTypeIcon
            fileType={file?.type}
            fileName={file?.name}
            size={50}
            preview={false}
          />
          {status === 'exception' && (
            <CloseOutlined
              className={cx(styles['status-icon'], styles['status-error'])}
            />
          )}
          {isUploading && (
            <div
              className={cx(styles['status-icon'], styles['status-loading'])}
            >
              <LoadingOutlined spin />
            </div>
          )}
        </div>

        {/* 显示文件名和大小信息 */}
        <div className={cx('flex-1', 'overflow-hide', styles.info)}>
          <h4 className={cx('text-ellipsis')}>{file?.name}</h4>
          <span className={styles.size}>{formatBytes(file?.size)}</span>
        </div>

        <CloseCircleOutlined
          className={cx(styles.del)}
          onClick={() => onDel(file.uid)}
        />
      </div>
    );
  };

  return (
    <div className={cx(styles['files-container'])}>
      {files?.map((file) => {
        // 根据文件类型选择不同的渲染方式
        if (file?.type?.includes('image/')) {
          return renderImageFile(file as UploadFileInfo);
        }
        return renderDocumentFile(file as UploadFileInfo);
      })}
    </div>
  );
};

export default ChatUploadFile;
