import { openLocalFile } from '@/features/client-shell/localFileService';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { getFileTypeInfo, splitFilePath } from '../toolFilePresentation';
import styles from './index.less';
import { useLocalToolFileReference } from './LocalToolFileContext';

const cx = classNames.bind(styles);

export interface FileResourceLinkProps {
  target: string;
  /**
   * 行内嵌套变体（ProcessNodeRow 折叠行内使用）：不展示目录段，保持行紧凑
   * （完整路径见 title）。
   * 本机授权上下文内可点，其他电脑继续纯展示。
   */
  inline?: boolean;
  onOpen?: () => void;
}

/** 文件路径展示；本机通过宿主预览回调或系统默认应用打开。 */
const FileResourceLink: React.FC<FileResourceLinkProps> = ({
  target,
  inline = false,
  onOpen,
}) => {
  const localFile = useLocalToolFileReference(target);
  const { dir, name } = splitFilePath(target.replace(/\\/g, '/'));
  const typeInfo = getFileTypeInfo(name);
  const Component = localFile ? 'button' : 'span';
  return (
    <Component
      className={cx(styles['tool-file-link'], {
        [styles['tool-file-clickable']]: localFile,
      })}
      title={target}
      {...(Component === 'button'
        ? {
            type: 'button',
            onClick: (event: React.MouseEvent) => {
              event.stopPropagation();
              if (onOpen) onOpen();
              else if (localFile)
                void openLocalFile(localFile).catch((error) =>
                  message.error(
                    error instanceof Error ? error.message : String(error),
                  ),
                );
            },
          }
        : {})}
    >
      <span className={cx(styles['tool-file-badge'])} aria-hidden="true">
        {typeInfo.label}
      </span>
      <span className={cx(styles['tool-file-name'])}>{name}</span>
      {!inline && dir && (
        <span className={cx(styles['tool-file-dir'])}>{dir}/</span>
      )}
    </Component>
  );
};

export default FileResourceLink;
