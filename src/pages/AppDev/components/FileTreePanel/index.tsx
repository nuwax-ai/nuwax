import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  FileOutlined,
  ImportOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  onUploadSingleFile,
  onAddDataResource,
  onDeleteDataResource,
  selectedDataResourceIds,
  onDataResourceSelectionChange,
  workspace,
  fileManagement,
  isChatLoading = false,
}) => {
  // 文件树折叠状态
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);

  // 滚动位置保持相关状态
  const fileTreeScrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  /**
   * 保存滚动位置
   */
  const saveScrollPosition = useCallback(() => {
    if (fileTreeScrollRef.current) {
      setScrollPosition(fileTreeScrollRef.current.scrollTop);
    }
  }, []);

  /**
   * 恢复滚动位置
   */
  useEffect(() => {
    if (fileTreeScrollRef.current && scrollPosition > 0) {
      fileTreeScrollRef.current.scrollTop = scrollPosition;
    }
  }, [files, scrollPosition]);

  /**
   * 切换文件树折叠状态
   */
  const toggleFileTreeCollapse = useCallback(() => {
    setIsFileTreeCollapsed((prev) => !prev);
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

              {/* 文件夹删除按钮 - 仅在非版本对比模式且非聊天加载状态时显示 */}
              {!isComparing && !isChatLoading && (
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止文件夹展开/折叠
                    onDeleteFile(node, e);
                  }}
                  title="删除文件夹"
                />
              )}
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
              // 跳过以"."为前缀的隐藏文件
              if (node.name.startsWith('.')) {
                return;
              }

              if (isComparing) {
                // 版本模式下，直接设置选中的文件到 workspace.activeFile
                onFileSelect(node.id);
              } else {
                // 正常模式下，使用文件管理逻辑并自动切换到代码查看模式
                fileManagement.switchToFile(node.id);
                onFileSelect(node.id);
              }
            }}
            style={{ marginLeft: level * 16 }}
          >
            {node.name.startsWith('.') ? (
              <EyeInvisibleOutlined className={styles.fileIcon} />
            ) : (
              <FileOutlined className={styles.fileIcon} />
            )}
            <span
              className={`${styles.fileName} ${
                node.name.startsWith('.') ? styles.hiddenFile : ''
              }`}
            >
              {node.name}
            </span>

            {/* 正常模式：显示文件状态和删除按钮 */}
            {!isComparing && !isChatLoading && (
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
      isChatLoading,
    ],
  );

  return (
    <>
      {/* 悬浮折叠/展开按钮 - 放在预览区域左下角 */}
      <Tooltip title={isFileTreeCollapsed ? '展开文件树' : '收起文件树'}>
        <Button
          type="text"
          size="small"
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
                  <Tooltip title="导入项目">
                    <Button
                      type="text"
                      className={styles.addButton}
                      icon={<ImportOutlined />}
                      onClick={onUploadProject}
                      disabled={isChatLoading}
                    />
                  </Tooltip>
                  <Tooltip title="上传单个文件">
                    <Button
                      type="text"
                      className={styles.addButton}
                      icon={<PlusOutlined />}
                      onClick={onUploadSingleFile}
                      disabled={isChatLoading}
                    />
                  </Tooltip>
                </div>
              )}

              {/* 文件树容器 */}
              <div
                className={styles.fileTreeContainer}
                ref={fileTreeScrollRef}
                onScroll={saveScrollPosition}
              >
                {/* 文件树结构 */}
                <div className={styles.fileTree}>
                  {files.map((node: any) => renderFileTreeNode(node))}
                </div>
              </div>

              {/* 数据资源管理 - 固定在底部，仅在非版本对比模式显示 */}
              {!isComparing && (
                <div className={styles.dataSourceContainer}>
                  <div className={styles.dataSourceHeader}>
                    <Typography.Title level={5} style={{ marginBottom: 0 }}>
                      数据资源
                    </Typography.Title>
                    <Tooltip title="添加数据资源">
                      <Button
                        type="text"
                        className={styles.addButton}
                        icon={<PlusOutlined />}
                        onClick={onAddDataResource}
                        disabled={isChatLoading || isComparing}
                      />
                    </Tooltip>
                  </div>
                  <div className={styles.dataSourceContent}>
                    <DataResourceList
                      resources={dataResources}
                      loading={dataResourcesLoading}
                      onDelete={onDeleteDataResource}
                      selectedResourceIds={selectedDataResourceIds}
                      onSelectionChange={onDataResourceSelectionChange}
                      isChatLoading={isChatLoading || isComparing}
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
