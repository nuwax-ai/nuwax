import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import {
  FileAddOutlined,
  FolderAddOutlined,
  MenuFoldOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface FileTreeToolbarProps {
  /** 左侧标题 */
  title?: string;
  /** 是否禁用全部操作 */
  disabled?: boolean;
  /** 项目导出 loading */
  exportLoading?: boolean;
  /** 项目导出 */
  onExportProject?: () => void;
  /** 新建文件 */
  onCreateFile?: () => void;
  /** 新建文件夹 */
  onCreateFolder?: () => void;
  /** 上传文件 */
  onUpload?: () => void;
  /** 折叠全部文件夹 */
  onCollapseAll?: () => void;
  /** 刷新文件树 */
  onRefresh?: () => void;
  /** 刷新文件树 loading */
  refreshLoading?: boolean;
  className?: string;
}

/**
 * 文件树操作工具栏（搜索框下方）
 * 提供导出、新建、上传、折叠等快捷操作
 */
const FileTreeToolbar: React.FC<FileTreeToolbarProps> = ({
  title = dict('PC.Components.FileTreePanel.FileTreeToolbar.projects'),
  disabled = false,
  exportLoading = false,
  onExportProject,
  onCreateFile,
  onCreateFolder,
  onUpload,
  onCollapseAll,
  onRefresh,
  refreshLoading = false,
  className,
}) => {
  const actionDisabled = (handler?: () => void) => disabled || !handler;
  /** 新建文件/文件夹：仅在没有回调时禁用，不受全局 disabled 影响 */
  const createActionDisabled = (handler?: () => void) => !handler;

  return (
    <div className={cx(styles.toolbar, className)}>
      <span className={cx(styles.title)}>{title}</span>
      <div className={cx(styles.actions)}>
        <Tooltip
          title={dict(
            'PC.Components.FileTreePanel.FileTreeToolbar.exportProject',
          )}
        >
          <Button
            type="text"
            size="small"
            className={cx(styles['action-btn'])}
            icon={
              <SvgIcon name="icons-common-download" style={{ fontSize: 16 }} />
            }
            disabled={actionDisabled(onExportProject)}
            loading={exportLoading}
            onClick={onExportProject}
          />
        </Tooltip>
        <Tooltip
          title={dict('PC.Components.FileTreePanel.FileTreeToolbar.newFile')}
        >
          <Button
            type="text"
            size="small"
            className={cx(styles['action-btn'])}
            icon={<FileAddOutlined style={{ fontSize: 16 }} />}
            disabled={createActionDisabled(onCreateFile)}
            onClick={onCreateFile}
          />
        </Tooltip>
        <Tooltip
          title={dict('PC.Components.FileTreePanel.FileTreeToolbar.newFolder')}
        >
          <Button
            type="text"
            size="small"
            className={cx(styles['action-btn'])}
            icon={<FolderAddOutlined style={{ fontSize: 16 }} />}
            disabled={createActionDisabled(onCreateFolder)}
            onClick={onCreateFolder}
          />
        </Tooltip>
        <Tooltip
          title={dict('PC.Components.FileTreePanel.FileTreeToolbar.upload')}
        >
          <Button
            type="text"
            size="small"
            className={cx(styles['action-btn'])}
            icon={
              <SvgIcon name="icons-common-upload" style={{ fontSize: 16 }} />
            }
            disabled={actionDisabled(onUpload)}
            onClick={onUpload}
          />
        </Tooltip>

        {onRefresh && (
          <Tooltip
            title={
              refreshLoading
                ? dict('PC.Components.FileTreeView.refreshing')
                : dict('PC.Components.FileTreeView.refreshFileTree')
            }
          >
            <Button
              type="text"
              size="small"
              className={cx(styles['action-btn'])}
              icon={<ReloadOutlined style={{ fontSize: 16 }} />}
              disabled={disabled}
              loading={refreshLoading}
              onClick={onRefresh}
            />
          </Tooltip>
        )}

        <Tooltip
          title={dict(
            'PC.Components.FileTreePanel.FileTreeToolbar.collapseAll',
          )}
        >
          <Button
            type="text"
            size="small"
            className={cx(styles['action-btn'])}
            icon={<MenuFoldOutlined style={{ fontSize: 16 }} />}
            disabled={actionDisabled(onCollapseAll)}
            onClick={onCollapseAll}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default FileTreeToolbar;
