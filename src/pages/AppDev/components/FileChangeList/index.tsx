import type { FileChangeInfo } from '@/types/interfaces/appDev';
import {
  EditOutlined,
  FileOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Spin, Typography } from 'antd';
import React from 'react';
import styles from './index.less';

const { Text } = Typography;

interface FileChangeListProps {
  /** 变更文件列表 */
  changedFiles: FileChangeInfo[];
  /** 当前选中的文件 */
  selectedFile: string | null;
  /** 文件选择回调 */
  onFileSelect: (filePath: string) => void;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 文件变更列表组件
 * 显示版本对比中的文件变更情况
 */
const FileChangeList: React.FC<FileChangeListProps> = ({
  changedFiles,
  selectedFile,
  onFileSelect,
  loading = false,
}) => {
  /**
   * 获取变更类型图标
   */
  const getChangeIcon = (changeType: FileChangeInfo['changeType']) => {
    switch (changeType) {
      case 'added':
        return <PlusOutlined className={styles.addedIcon} />;
      case 'modified':
        return <EditOutlined className={styles.modifiedIcon} />;
      case 'deleted':
        return <MinusOutlined className={styles.deletedIcon} />;
      default:
        return <FileOutlined className={styles.defaultIcon} />;
    }
  };

  /**
   * 获取变更类型文本
   */
  const getChangeText = (changeType: FileChangeInfo['changeType']) => {
    switch (changeType) {
      case 'added':
        return '新增';
      case 'modified':
        return '修改';
      case 'deleted':
        return '删除';
      default:
        return '未知';
    }
  };

  /**
   * 渲染文件项
   */
  const renderFileItem = (file: FileChangeInfo) => {
    const isSelected = selectedFile === file.path;

    return (
      <div
        key={file.path}
        className={`${styles.fileItem} ${isSelected ? styles.selected : ''}`}
        onClick={() => onFileSelect(file.path)}
      >
        <div className={styles.fileItemContent}>
          <div className={styles.fileIcon}>
            {getChangeIcon(file.changeType)}
          </div>
          <div className={styles.fileInfo}>
            <div className={styles.fileName}>
              <Text ellipsis={{ tooltip: file.name }}>{file.name}</Text>
            </div>
            <div className={styles.filePath}>
              <Text type="secondary" ellipsis={{ tooltip: file.path }}>
                {file.path}
              </Text>
            </div>
          </div>
          <div className={styles.changeType}>
            <Text
              type="secondary"
              className={`${styles.changeTypeText} ${styles[file.changeType]}`}
            >
              {getChangeText(file.changeType)}
            </Text>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <div className={styles.loadingText}>正在加载文件变更...</div>
      </div>
    );
  }

  if (changedFiles.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyText}>没有文件变更</div>
      </div>
    );
  }

  return (
    <div className={styles.fileChangeList}>
      <div className={styles.header}>
        <Text strong>文件变更 ({changedFiles.length})</Text>
      </div>
      <div className={styles.fileList}>{changedFiles.map(renderFileItem)}</div>
    </div>
  );
};

export default FileChangeList;
