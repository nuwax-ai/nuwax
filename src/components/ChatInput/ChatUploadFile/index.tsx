import docImage from '@/assets/images/doc_image.jpg';
import type { ChatUploadFileProps } from '@/types/interfaces/agentConfig';
import { CloseCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 聊天上传文件列表组件
 */
const ChatUploadFile: React.FC<ChatUploadFileProps> = ({ files, onDel }) => {
  return (
    <div className={cx(styles['files-container'])}>
      {files?.map((file, index) => (
        <div
          key={file.key}
          className={cx(styles['file-box'], 'flex', 'items-center')}
        >
          {/*如果文件是图片，则显示图片，否则显示文档默认图片*/}
          <img
            src={
              file.mimeType.includes('image/') ? file.url : (docImage as string)
            }
            alt=""
          />
          <div className={cx('flex-1', 'overflow-hide')}>
            <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
            <span className={styles.size}>{`${file.size} Byte`}</span>
          </div>
          <CloseCircleOutlined
            className={cx(styles.del)}
            onClick={() => onDel(index)}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatUploadFile;
