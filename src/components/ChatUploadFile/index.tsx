import docImage from '@/assets/images/doc_image.jpg';
import { UploadFileStatus } from '@/types/enums/common';
import type { ChatUploadFileProps } from '@/types/interfaces/agentConfig';
import { UploadFileInfo } from '@/types/interfaces/common';
import { formatBytes } from '@/utils/byteConverter';
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
  const getStatus = useCallback((fileInfo: UploadFileInfo) => {
    if (fileInfo?.status === UploadFileStatus.error) {
      return 'exception';
    }
    if (fileInfo?.status === UploadFileStatus.done) {
      return 'success';
    }
    return 'active';
  }, []);

  return (
    <div className={cx(styles['files-container'])}>
      {files?.map((file, index) => (
        <div
          key={file?.key || index}
          className={cx(styles['file-box'], 'flex', 'items-center')}
          style={{ position: 'relative' }}
        >
          {/*如果文件是图片，则显示图片，否则显示文档默认图片*/}
          <img
            src={
              file?.mimeType?.includes('image/')
                ? file?.url
                : (docImage as string)
            }
            alt=""
          />
          <div
            className={cx('flex-1', 'overflow-hide')}
            style={{ paddingRight: 20 }}
          >
            <h4 className={cx('text-ellipsis')}>{file?.fileName}</h4>
            <span className={styles.size}>{formatBytes(file?.size)}</span>
          </div>
          <CloseCircleOutlined
            className={cx(styles.del)}
            onClick={() => onDel(index)}
          />
          <Progress
            type="circle"
            percent={Math.round(file?.percent || 0)}
            status={getStatus(file)}
            size={30}
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatUploadFile;
