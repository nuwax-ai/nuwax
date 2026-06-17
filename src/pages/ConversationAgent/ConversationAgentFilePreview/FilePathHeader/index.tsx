import SvgIcon from '@/components/base/SvgIcon';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import { formatFileSize } from '@/utils/appDevUtils';
import { copyTextToClipboard } from '@/utils/clipboard';
import { Button, ConfigProvider, message, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';
import { canShowPreviewCodeToggle } from './previewCodeToggle';
import type { FilePathHeaderProps } from './type';

const previewCodeSegmentedTheme = {
  components: {
    Segmented: {
      itemSelectedBg: '#fff',
      itemSelectedColor: '#5147FF',
      itemColor: 'rgba(0, 0, 0, 0.45)',
      itemHoverColor: 'rgba(0, 0, 0, 0.65)',
      trackBg: 'rgba(12, 20, 102, 0.04)',
      trackPadding: 2,
    },
  },
};

/** ConversationAgent 文件路径头部 Props */
export type { FilePathHeaderProps };

const cx = classNames.bind(styles);

/**
 * ConversationAgent 文件路径头部组件
 * 显示文件路径、预览/代码切换与下载、复制操作
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  className,
  targetNode,
  viewMode = 'preview',
  viewFileType = 'preview',
  onViewFileTypeChange,
  isDownloadingFile = false,
  onDownloadFileByUrl,
}) => {
  const fileName = targetNode?.name;
  /** 文件树中的完整路径（fileId） */
  const fileId = targetNode?.id;
  const fileSize = targetNode?.size;
  const formattedSize = useMemo(() => {
    if (!fileSize) return '';
    return formatFileSize(fileSize);
  }, [fileSize]);

  const displayFilePath = useMemo(() => {
    if (!fileId) return '';
    return fileId.replace(/\//g, ' > ');
  }, [fileId]);

  const showPreviewCodeToggle = canShowPreviewCodeToggle(targetNode, fileName);

  return (
    <div className={cx(styles.filePathHeader, className)}>
      {fileId && viewMode === 'preview' && (
        <div className={styles.fileInfo}>
          <div className={styles.fileDetails}>
            <div className={styles.fileName} title={fileId}>
              {displayFilePath}
            </div>
            {formattedSize && (
              <span className={styles.fileMeta}>({formattedSize})</span>
            )}
          </div>
          {showPreviewCodeToggle && onViewFileTypeChange && (
            <ConfigProvider theme={previewCodeSegmentedTheme}>
              <Segmented
                value={viewFileType}
                onChange={onViewFileTypeChange}
                options={[
                  {
                    label: dict('PC.Components.FilePathHeader.preview'),
                    value: 'preview',
                  },
                  {
                    label: dict('PC.Components.FilePathHeader.code'),
                    value: 'code',
                  },
                ]}
              />
            </ConfigProvider>
          )}
        </div>
      )}

      <div className={cx('flex', 'items-center', 'ml-auto')}>
        <div className={styles.actionButtons}>
          {/* 下载按钮 */}
          <TooltipIcon
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
                <SvgIcon
                  name="icons-common-download"
                  style={{ fontSize: 16 }}
                />
              }
              onClick={() =>
                targetNode && onDownloadFileByUrl?.(targetNode as FileNode)
              }
              className={styles.actionButton}
              loading={isDownloadingFile}
              disabled={isDownloadingFile}
            />
          </TooltipIcon>

          {/* 复制按钮 */}
          <TooltipIcon
            title={dict('PC.Components.FilePathHeader.copy')}
            placement="bottom"
            className={styles.actionButton}
            icon={<SvgIcon name="icons-chat-copy" style={{ fontSize: 16 }} />}
            onClick={() => {
              copyTextToClipboard(targetNode?.content || '', () => {
                message.success(dict('PC.Toast.Global.copiedSuccessfully'));
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FilePathHeader;
