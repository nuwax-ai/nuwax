import type { AttachmentFile } from '@/types/interfaces/conversationInfo';
import { openRemoteFileUrl } from '@/utils/authProtectedFileUrl';
import { FileOutlined } from '@ant-design/icons';
import { message } from 'antd';
import React, { memo, useCallback } from 'react';
import styles from './index.less';

export interface ResumeDocumentFileProps {
  file: AttachmentFile;
}

/**
 * MCP Ask resume 内联文档：统一灰色通用文件图标，不按类型展示 PDF 等专用图标。
 */
const ResumeDocumentFile: React.FC<ResumeDocumentFileProps> = memo(
  ({ file }) => {
    const handleOpen = useCallback(async () => {
      try {
        await openRemoteFileUrl(file.fileUrl, file.fileName);
      } catch (error) {
        console.error('[ResumeDocumentFile] open failed:', error);
        message.error('文件打开失败，请稍后重试');
      }
    }, [file.fileName, file.fileUrl]);

    return (
      <button
        type="button"
        className={styles.documentFile}
        onClick={() => {
          void handleOpen();
        }}
        title={file.fileName}
      >
        <span className={styles.documentFileIcon} aria-hidden="true">
          <FileOutlined />
        </span>
        <span className={styles.documentFileName}>{file.fileName}</span>
      </button>
    );
  },
);

ResumeDocumentFile.displayName = 'ResumeDocumentFile';

export default ResumeDocumentFile;
