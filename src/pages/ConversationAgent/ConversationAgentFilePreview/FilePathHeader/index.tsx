import { dict } from '@/services/i18nRuntime';
import { formatFileSize } from '@/utils/appDevUtils';
import { ConfigProvider, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import FilePathHeaderToolbar from './FilePathHeaderToolbar';
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
 * ConversationAgent 文件路径头部组件（自 FileTreeView/FilePathHeader 复制，可独立演进）
 * 显示文件信息与操作按钮
 */
const FilePathHeader: React.FC<
  FilePathHeaderProps & { hideClose?: boolean }
> = ({
  className,
  targetNode,
  hideClose,
  viewMode = 'preview',
  viewFileType = 'preview',
  onViewFileTypeChange,
  ...toolbarProps
}) => {
  const fileName = targetNode?.name;
  const fileSize = targetNode?.size;
  const formattedSize = useMemo(() => {
    if (!fileSize) return '';
    return formatFileSize(fileSize);
  }, [fileSize]);

  const showPreviewCodeToggle = canShowPreviewCodeToggle(targetNode, fileName);

  return (
    <div className={cx(styles.filePathHeader, className)}>
      {fileName && viewMode === 'preview' && (
        <div className={styles.fileInfo}>
          <div className={styles.fileDetails}>
            <div className={styles.fileName}>{fileName}</div>
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

      <FilePathHeaderToolbar
        targetNode={targetNode}
        hideClose={hideClose}
        {...toolbarProps}
      />
    </div>
  );
};

export default FilePathHeader;
