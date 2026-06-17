import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { copyTextToClipboard } from '@/utils/clipboard';
import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { FilePathHeaderProps } from './type';

const cx = classNames.bind(styles);

export interface FilePathHeaderToolbarProps extends FilePathHeaderProps {
  /** 工具栏容器额外类名 */
  toolbarClassName?: string;
}

/**
 * 文件路径头部右侧操作区（下载 / 复制）
 */
const FilePathHeaderToolbar: React.FC<FilePathHeaderToolbarProps> = ({
  toolbarClassName,
  targetNode,
  isDownloadingFile = false,
  onDownloadFileByUrl,
}) => {
  return (
    <div className={cx('flex', 'items-center', 'ml-auto', toolbarClassName)}>
      <div className={styles.actionButtons}>
        <Tooltip
          placement="bottom"
          title={
            isDownloadingFile
              ? dict('PC.Components.FilePathHeader.downloading')
              : dict('PC.Components.FilePathHeader.download')
          }
        >
          <Button
            type="text"
            size="small"
            icon={
              <SvgIcon name="icons-common-download" style={{ fontSize: 16 }} />
            }
            onClick={() =>
              targetNode && onDownloadFileByUrl?.(targetNode as FileNode)
            }
            className={styles.actionButton}
            loading={isDownloadingFile}
            disabled={isDownloadingFile}
          />
        </Tooltip>

        <Tooltip title={dict('PC.Components.FilePathHeader.copy')}>
          <Button
            type="text"
            size="small"
            icon={<SvgIcon name="icons-chat-copy" style={{ fontSize: 16 }} />}
            onClick={() => {
              copyTextToClipboard(targetNode?.content || '', () => {
                message.success(dict('PC.Toast.Global.copiedSuccessfully'));
              });
            }}
            className={styles.actionButton}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default FilePathHeaderToolbar;
