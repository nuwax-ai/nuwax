import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';
import React from 'react';
import styles from './index.less';

interface FilePathHeaderProps {
  /** 文件路径 */
  filePath: string;
  /** 文件是否被修改 */
  isModified: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在保存 */
  isSaving: boolean;
  /** 是否只读模式 */
  readOnly: boolean;
  /** 保存回调 */
  onSave: () => void;
  /** 取消编辑回调 */
  onCancel: () => void;
  /** 刷新回调 */
  onRefresh: () => void;
}

/**
 * 文件路径头部组件
 * 显示文件路径信息和操作按钮（保存、取消、刷新）
 */
const FilePathHeader: React.FC<FilePathHeaderProps> = ({
  filePath,
  isModified,
  isLoading,
  isSaving,
  readOnly,
  onSave,
  onCancel,
  onRefresh,
}) => {
  return (
    <div className={styles.filePathHeader}>
      <div className={styles.filePathInfo}>
        {/* <FileOutlined className={styles.fileIcon} /> */}
        <span className={styles.filePath}>{filePath}</span>
        {/* <span className={styles.fileLanguage}>{language}</span> */}
        {isLoading && <Spin size="small" />}
        {isModified && !readOnly && (
          <span className={styles.modifiedIndicator}>已修改</span>
        )}
      </div>
      <div className={styles.fileActions}>
        {isModified && !readOnly && (
          <>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={onSave}
              loading={isSaving}
              disabled={!isModified || readOnly}
              style={{ marginRight: 8 }}
            >
              保存
            </Button>
            <Button
              size="small"
              onClick={onCancel}
              disabled={!isModified || readOnly}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
          </>
        )}

        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={isLoading}
        >
          刷新
        </Button>
      </div>
    </div>
  );
};

export default FilePathHeader;
