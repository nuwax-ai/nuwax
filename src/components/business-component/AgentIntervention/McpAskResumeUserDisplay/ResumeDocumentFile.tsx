import FileTypeIcon from '@/components/base/FileTypeIcon';
import type { AttachmentFile } from '@/types/interfaces/conversationInfo';
import { openRemoteFileUrl } from '@/utils/authProtectedFileUrl';
import { message } from 'antd';
import React, { memo, useCallback } from 'react';
import styles from './index.less';

export interface ResumeDocumentFileProps {
  file: AttachmentFile;
}

/**
 * MCP Ask resume 内联文档：参考 ChatView AttachFile 卡片样式，点击打开/下载。
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
        <FileTypeIcon
          fileType={file.mimeType}
          fileName={file.fileName}
          size={50}
          preview={false}
        />
        <span className={styles.documentFileName}>{file.fileName}</span>
      </button>
    );
  },
);

ResumeDocumentFile.displayName = 'ResumeDocumentFile';

export default ResumeDocumentFile;
