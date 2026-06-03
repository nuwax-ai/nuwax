import { formatFileSize } from '@/utils/appDevUtils';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import FilePathHeaderToolbar from './FilePathHeaderToolbar';
import styles from './index.less';
import type { FilePathHeaderProps } from './type';

/** ConversationAgent 文件路径头部 Props */
export type { FilePathHeaderProps };

const cx = classNames.bind(styles);

/**
 * ConversationAgent 文件路径头部组件（自 FileTreeView/FilePathHeader 复制，可独立演进）
 * 显示文件信息与操作按钮
 */
const FilePathHeader: React.FC<
  FilePathHeaderProps & { hideClose?: boolean }
> = ({ className, targetNode, hideClose, ...toolbarProps }) => {
  const fileName = targetNode?.name;
  const fileSize = targetNode?.size;
  const formattedSize = useMemo(() => {
    if (!fileSize) return '';
    return formatFileSize(fileSize);
  }, [fileSize]);

  return (
    <div className={cx(styles.filePathHeader, className)}>
      {fileName && (
        <div className={styles.fileInfo}>
          <div className={styles.fileDetails}>
            <div className={styles.fileName}>{fileName}</div>
            {formattedSize && (
              <span className={styles.fileMeta}>({formattedSize})</span>
            )}
          </div>
        </div>
      )}

      <FilePathHeaderToolbar
        targetNode={targetNode}
        hideClose={hideClose}
        {...toolbarProps}
      />
    </div>
  );
};

export default FilePathHeader;
