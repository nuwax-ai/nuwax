import FileTypeIcon from '@/components/base/FileTypeIcon';
import type { ChatUploadFileProps } from '@/types/interfaces/agentConfig';
import { UploadFileInfo } from '@/types/interfaces/common';
import { formatBytes } from '@/utils/byteConverter';
import { getProgressStatus } from '@/utils/upload';
import { CloseCircleOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
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

  return (
    <div className={cx(styles['files-container'])}>
      {files?.map((file) => (
        <div
          key={file.uid}
          className={cx(styles['file-box'], 'flex', 'items-center')}
        >
          {/* 使用 FileTypeIcon 组件显示文件图标 */}
          <FileTypeIcon
            fileType={file?.type}
            fileName={file?.name}
            fileUrl={file?.url}
            size={50}
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
      ))}
    </div>
  );
};

export default ChatUploadFile;
