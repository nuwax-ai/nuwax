import { dict } from '@/services/i18nRuntime';
import type { FileNode } from '@/types/interfaces/appDev';
import { isPreviewableFile } from '@/utils/appDevUtils';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { getFilePreviewPathSegments } from './getFilePreviewPathSegments';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface FilePreviewPathBarProps {
  /** 当前预览的文件节点；文件夹或未选中时不展示 */
  fileNode?: FileNode | null;
  /** 重新拉取当前文件内容；不支持预览的文件不展示刷新按钮 */
  onRefresh?: () => void | Promise<void>;
  className?: string;
}

/** 软链接、压缩包等无法预览的文件不提供刷新 */
function canRefreshFile(fileNode?: FileNode | null): boolean {
  if (!fileNode || fileNode.type === 'folder' || fileNode.isLink) {
    return false;
  }
  if (!fileNode.fileProxyUrl) {
    return false;
  }
  return isPreviewableFile(fileNode.name || '', true);
}

/**
 * 文件预览路径条
 * 选中文件后在预览区顶部展示「目录 > 文件名」
 */
const FilePreviewPathBar: React.FC<FilePreviewPathBarProps> = ({
  fileNode,
  onRefresh,
  className,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const segments = useMemo(
    () => getFilePreviewPathSegments(fileNode),
    [fileNode],
  );
  const showRefresh = Boolean(onRefresh) && canRefreshFile(fileNode);

  if (segments.length === 0) {
    return null;
  }
  const label = segments.join(' > ');

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) {
      return;
    }
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('刷新文件内容失败', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={cx(styles.pathBar, className)}>
      <span className={cx(styles.pathLabel)} title={label}>
        {label}
      </span>
      {showRefresh && (
        <Tooltip title={dict('PC.Components.FilePreview.tooltipRefresh')}>
          <Button
            type="text"
            size="small"
            className={cx(styles.refreshButton)}
            icon={<ReloadOutlined spin={refreshing} />}
            disabled={refreshing}
            aria-label={dict('PC.Components.FilePreview.tooltipRefresh')}
            onClick={() => {
              void handleRefresh();
            }}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default FilePreviewPathBar;
