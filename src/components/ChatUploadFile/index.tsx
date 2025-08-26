import FileTypeIcon from '@/components/base/FileTypeIcon';
import { IMAGE_FALLBACK } from '@/constants/images.constants';
import type { ChatUploadFileProps } from '@/types/interfaces/agentConfig';
import { UploadFileInfo } from '@/types/interfaces/common';
import { formatBytes } from '@/utils/byteConverter';
import { getProgressStatus } from '@/utils/upload';
import {
  CheckCircleOutlined,
  CloseCircleFilled,
  CloseCircleOutlined,
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
   */
  const renderImageFile = (file: UploadFileInfo) => {
    const status = getStatus(file);

    return (
      <div
        key={file.uid}
        className={cx(styles['file-box'], 'flex', 'items-center')}
      >
        {/* 图片文件使用原来的逻辑 */}
        <div className={cx(styles['image-container'], 'relative')}>
          <Image
            width={50}
            height={50}
            src={file?.url}
            fallback={IMAGE_FALLBACK}
            preview={false}
            className={styles['file-image']}
          />
          {/* 状态指示器 */}
          {status === 'success' && (
            <CheckCircleOutlined
              className={cx(styles['status-icon'], styles['status-success'])}
            />
          )}
          {status === 'exception' && (
            <CloseCircleFilled
              className={cx(styles['status-icon'], styles['status-error'])}
            />
          )}
          {status === 'active' && (
            <div
              className={cx(styles['status-icon'], styles['status-loading'])}
            >
              <div className={styles['loading-spinner']}></div>
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
          {/* 状态指示器 */}
          {status === 'success' && (
            <CheckCircleOutlined
              className={cx(styles['status-icon'], styles['status-success'])}
            />
          )}
          {status === 'exception' && (
            <CloseCircleFilled
              className={cx(styles['status-icon'], styles['status-error'])}
            />
          )}
          {status === 'active' && (
            <div
              className={cx(styles['status-icon'], styles['status-loading'])}
            >
              <div className={styles['loading-spinner']}></div>
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
          return renderImageFile(file);
        } else {
          return renderDocumentFile(file);
        }
      })}
    </div>
  );
};

export default ChatUploadFile;
