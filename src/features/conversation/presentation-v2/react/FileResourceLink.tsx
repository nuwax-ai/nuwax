import React from 'react';
import { getFileTypeInfo, splitFilePath } from '../toolFilePresentation';
import styles from './index.less';

export interface FileResourceLinkProps {
  target: string;
  /** 工具行内只显示文件名，完整路径见 title。 */
  inline?: boolean;
}

/** 工具行内的文件路径作为文本，点击交由外层工具行处理。 */
const FileResourceLink: React.FC<FileResourceLinkProps> = ({
  target,
  inline = false,
}) => {
  const { dir, name } = splitFilePath(target.replace(/\\/g, '/'));
  const typeInfo = getFileTypeInfo(name);
  return (
    <span className={styles['tool-file-link']} title={target}>
      <span className={styles['tool-file-badge']} aria-hidden="true">
        {typeInfo.label}
      </span>
      <span className={styles['tool-file-name']}>{name}</span>
      {!inline && dir && (
        <span className={styles['tool-file-dir']}>{dir}/</span>
      )}
    </span>
  );
};

export default FileResourceLink;
