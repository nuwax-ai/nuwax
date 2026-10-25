import { dict } from '@/services/i18nRuntime';
import type { FileNode } from '@/types/interfaces/appDev';
import { isPreviewableFile } from '@/utils/appDevUtils';
import { isMarkdownFile } from '@/utils/common';
import { isBareOpenUiFileName, isOpenUiFileName } from '@/utils/openUiArtifact';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Segmented, Tooltip } from 'antd';
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
  /** 当前是预览还是代码；html / md / .openui 才展示切换 */
  viewFileType?: 'preview' | 'code';
  /** 切换预览与代码 */
  onViewFileTypeChange?: (type: 'preview' | 'code') => void;
  className?: string;
}

/**
 * 是否支持「预览 / 代码」双模式切换。
 * html、markdown、`.openui.json` 以及内容可嗅探的裸 `.openui` 走同一套切换。
 */
function supportsPreviewCodeToggle(fileName?: string): boolean {
  if (!fileName) {
    return false;
  }
  return (
    fileName.includes('.htm') ||
    isMarkdownFile(fileName) ||
    isOpenUiFileName(fileName) ||
    isBareOpenUiFileName(fileName)
  );
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
  viewFileType = 'preview',
  onViewFileTypeChange,
  className,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const segments = useMemo(
    () => getFilePreviewPathSegments(fileNode),
    [fileNode],
  );
  const showRefresh = Boolean(onRefresh) && canRefreshFile(fileNode);
  // 打开可切换文件后，切换入口放在刷新按钮左侧，不再单独占 Header 一行
  const showViewToggle =
    Boolean(onViewFileTypeChange) &&
    Boolean(
      fileNode?.fileProxyUrl ||
        (fileNode?.content !== undefined && fileNode?.content !== null),
    ) &&
    supportsPreviewCodeToggle(fileNode?.name);

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
      {showViewToggle && (
        <ConfigProvider
          theme={{
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
          }}
        >
          <Segmented
            className={cx(styles.viewToggle)}
            value={viewFileType}
            onChange={(value) => {
              if (value === 'preview' || value === 'code') {
                onViewFileTypeChange?.(value);
              }
            }}
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
