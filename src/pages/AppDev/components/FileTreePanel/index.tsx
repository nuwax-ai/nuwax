import {
  DeleteOutlined,
  FileOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Tooltip } from 'antd';
import React, { useCallback, useState } from 'react';
import DataResourceList from '../DataResourceList';
import styles from './index.less';
import type { FileTreePanelProps } from './types';

/**
 * FileTreePanel 组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 */
const FileTreePanel: React.FC<FileTreePanelProps> = ({
  files,
  isComparing,
  selectedFileId,
  expandedFolders,
  dataResources,
  dataResourcesLoading,
  onFileSelect,
  onToggleFolder,
  onDeleteFile,
  onUploadProject,
  onAddDataResource,
  onDeleteDataResource,
  workspace,
  fileManagement,
}) => {
  // 文件树折叠状态
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);

  /**
   * 切换文件树折叠状态
   */
  const toggleFileTreeCollapse = useCallback(() => {
    setIsFileTreeCollapsed((prev) => {
      console.log(
        '🔄 [FileTreePanel] 切换文件树状态:',
        !prev ? '折叠' : '展开',
      );
      return !prev;
    });
  }, []);

  /**
   * 渲染文件树节点
   */
  const renderFileTreeNode = useCallback(
    (node: any, level: number = 0) => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = isComparing
        ? workspace?.activeFile === node.id
        : selectedFileId === node.id;

      if (node.type === 'folder') {
        return (
          <div
            key={node.id}
            className={styles.folderItem}
            style={{ marginLeft: level * 16 }}
          >
            <div
              className={styles.folderHeader}
              onClick={() => onToggleFolder(node.id)}
            >
              <RightOutlined
                className={`${styles.folderIcon} ${
                  isExpanded ? styles.expanded : ''
                }`}
              />
              <span className={styles.folderName}>{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div className={styles.fileList}>
                {node.children.map((child: any) =>
                  renderFileTreeNode(child, level + 1),
                )}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div
            key={node.id}
            className={`${styles.fileItem} ${
              isSelected ? styles.activeFile : ''
            }`}
            onClick={() => {
              if (isComparing) {
                // 版本模式下，直接设置选中的文件到 workspace.activeFile
                console.log(
                  '🔄 [FileTreePanel] 版本模式下选择文件:',
                  node.id,
                  node.name,
                );
                onFileSelect(node.id);
              } else {
                // 正常模式下，使用文件管理逻辑并自动切换到代码查看模式
                console.log(
                  '🔄 [FileTreePanel] 正常模式下选择文件:',
                  node.id,
                  node.name,
                );
                fileManagement.switchToFile(node.id);
                onFileSelect(node.id);
              }
            }}
            style={{ marginLeft: level * 16 }}
          >
            <FileOutlined className={styles.fileIcon} />
            <span className={styles.fileName}>{node.name}</span>

            {/* 正常模式：显示文件状态和删除按钮 */}
            {!isComparing && (
              <>
                {node.status && (
                  <span className={styles.fileStatus}>{node.status}</span>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  className={styles.deleteButton}
                  onClick={(e) => onDeleteFile(node, e)}
                  title="删除文件"
                />
              </>
            )}
          </div>
        );
      }
    },
    [
      expandedFolders,
      isComparing,
      workspace?.activeFile,
      selectedFileId,
      onToggleFolder,
      onFileSelect,
      fileManagement,
      onDeleteFile,
    ],
  );

  return (
    <>
      {/* 悬浮折叠/展开按钮 - 放在预览区域左下角 */}
      <Tooltip title={isFileTreeCollapsed ? '展开文件树' : '收起文件树'}>
        <Button
          type="text"
          icon={isFileTreeCollapsed ? <RightOutlined /> : <LeftOutlined />}
          onClick={toggleFileTreeCollapse}
          className={`${styles.collapseButton} ${
            isFileTreeCollapsed ? styles.collapsed : styles.expanded
          }`}
        />
      </Tooltip>

      {/* 文件树侧边栏 / 版本对比文件列表 */}
      <div
        className={`${styles.fileTreeCol} ${
          isFileTreeCollapsed ? styles.collapsed : ''
        }`}
        style={{ transition: 'all 0.3s ease' }}
      >
        <Card className={styles.fileTreeCard} bordered={false}>
          {!isFileTreeCollapsed && (
            <>
              {/* 文件树头部按钮 - 仅在非版本对比模式显示 */}
              {!isComparing && (
                <div className={styles.fileTreeHeader}>
                  <Button
                    type="text"
                    className={styles.addButton}
                    onClick={onUploadProject}
                  >
                    导入项目
                  </Button>
                </div>
              )}

              {/* 文件树容器 */}
              <div className={styles.fileTreeContainer}>
                {/* 文件树结构 */}
                <div className={styles.fileTree}>
                  {files.map((node: any) => renderFileTreeNode(node))}
                </div>
              </div>

              {/* 数据资源管理 - 固定在底部，仅在非版本对比模式显示 */}
              {!isComparing && (
                <div className={styles.dataSourceContainer}>
                  <div className={styles.dataSourceHeader}>
                    <h3>数据资源</h3>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={onAddDataResource}
                    >
                      添加
                    </Button>
                  </div>
                  <div className={styles.dataSourceContent}>
                    <DataResourceList
                      resources={dataResources}
                      loading={dataResourcesLoading}
                      onDelete={onDeleteDataResource}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default FileTreePanel;
