import docImage from '@/assets/images/doc_image.jpg';
import type { AttachFileProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 用户聊天上传文件列表组件
 */
const AttachFile: React.FC<AttachFileProps> = ({ files }) => {
  return (
    <div className={cx(styles['files-container'])}>
      {files?.map((file) => (
        <div
          key={file.fileKey}
          className={cx(styles['file-box'], 'flex', 'items-center')}
        >
          {/*如果文件是图片，则显示图片，否则显示文档默认图片*/}
          {/* 此处mimeType做容错处理，后端查询历史会话记录时，返回的mimeType可能为空 */}
          <img
            src={
              file.mimeType?.includes('image/')
                ? file.fileUrl
                : (docImage as string)
            }
            alt=""
          />
          <div className={cx('flex-1', 'overflow-hide')}>
            <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttachFile;
