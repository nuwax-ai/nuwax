import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import {
  EyeInvisibleOutlined,
  FileOutlined,
  ImportOutlined,
  InboxOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { InputRef } from 'antd';
import { Button, Card, Input, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import DataResourceList from '../DataResourceList';
import FileContextMenu from '../FileContextMenu';
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
  onRenameFile,
  // onUploadToFolder, // 暂时注释掉，后续可能需要
  onUploadProject,
  onUploadSingleFile,
  onAddDataResource,
  onDeleteDataResource,
  // selectedDataResourceIds,
  // onDataResourceSelectionChange,
  workspace,
  fileManagement,
  isChatLoading = false,
  projectId,
}) => {
  // 文件树折叠状态
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);

  // 滚动位置保持相关状态
  const fileTreeScrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // 右键菜单状态
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuTarget, setContextMenuTarget] = useState<any>(null);

  // 内联重命名状态
  const [renamingNode, setRenamingNode] = useState<any>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<InputRef>(null);

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
   * 处理右键菜单显示
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: any) => {
      e.preventDefault();
      e.stopPropagation();

      // 如果正在聊天加载或版本对比模式，禁用右键菜单
      if (isChatLoading || isComparing) {
        return;
      }

      setContextMenuTarget(node);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuVisible(true);
    },
    [isChatLoading, isComparing],
  );

  /**
   * 关闭右键菜单
   */
  const closeContextMenu = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuTarget(null);
  }, []);

  /**
   * 取消重命名
   */
  const cancelRename = useCallback(() => {
    setRenamingNode(null);
    setRenameValue('');
  }, []);

  /**
   * 确认重命名
   */
  const confirmRename = useCallback(async () => {
    if (!renamingNode || !onRenameFile) return;

    const trimmedValue = renameValue.trim();
    if (!trimmedValue || trimmedValue === renamingNode.name) {
      cancelRename();
      return;
    }

    // 验证文件名
    const invalidChars = /[/\\:*?"<>|]/;
    if (invalidChars.test(trimmedValue)) {
      // 这里可以显示错误提示
      return;
    }

    // 先立即更新UI显示新名字，提供即时反馈
    setRenamingNode(null);
    setRenameValue('');

    // 异步执行重命名操作
    try {
      await onRenameFile(renamingNode, trimmedValue);
    } catch (error) {
      // 如果重命名失败，可以考虑恢复原名字或显示错误提示
      console.error('重命名失败:', error);
    }
  }, [renamingNode, renameValue, onRenameFile, cancelRename]);

  /**
   * 处理重命名输入框键盘事件
   */
  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        confirmRename();
      } else if (e.key === 'Escape') {
        cancelRename();
      }
    },
    [confirmRename, cancelRename],
  );

  /**
   * 处理重命名输入框失焦
   */
  const handleRenameBlur = useCallback(() => {
    // 延迟执行，避免与点击事件冲突
    setTimeout(() => {
      if (renamingNode) {
        confirmRename();
      }
    }, 100);
  }, [renamingNode, confirmRename]);

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    if (contextMenuVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuVisible, closeContextMenu]);

  // 重命名输入框自动聚焦
  useEffect(() => {
    if (renamingNode && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingNode]);

  /**
   * 处理重命名操作（从右键菜单触发）
   */
  const handleRenameFromMenu = useCallback((node: any) => {
    setRenamingNode(node);
    setRenameValue(node.name);
  }, []);

  /**
   * 处理上传操作（从右键菜单触发）
   */
  const handleUploadFromMenu = useCallback(
    (node: any) => {
      // 直接调用现有的上传单个文件功能
      onUploadSingleFile(node);
    },
    [onUploadSingleFile],
  );

  /**
   * 渲染文件树节点
   */
  const renderFileTreeNode = useCallback(
    (node: any, level: number = 0) => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = isComparing
        ? workspace?.activeFile === node.id
        : selectedFileId === node.id;
      const isRenaming = renamingNode?.id === node.id;

      if (node.type === 'folder') {
        return (
          <div
            key={node.id}
            className={styles.folderItem}
            style={{ marginLeft: level * 8 }}
          >
            <div
              className={`${styles.folderHeader} ${
                isRenaming ? styles.renameMode : ''
              }`}
              onClick={() => !isRenaming && onToggleFolder(node.id)}
              onContextMenu={(e) => handleContextMenu(e, node)}
            >
              <RightOutlined
                className={`${styles.folderIcon} ${
                  isExpanded ? styles.expanded : ''
                }`}
              />

              {isRenaming ? (
                <Input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={handleRenameKeyDown}
                  onBlur={handleRenameBlur}
                  className={styles.inlineRenameInput}
                  size="small"
                />
              ) : (
                <span className={styles.folderName}>{node.name}</span>
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
            } ${isRenaming ? styles.renameMode : ''}`}
            onClick={() => {
              // 跳过以"."为前缀的隐藏文件和重命名模式
              if (node.name.startsWith('.') || isRenaming) {
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
            onContextMenu={(e) => handleContextMenu(e, node)}
            style={{ marginLeft: level * 8 }}
          >
            {node.name.startsWith('.') ? (
              <EyeInvisibleOutlined className={styles.fileIcon} />
            ) : (
              <FileOutlined className={styles.fileIcon} />
            )}

            {isRenaming ? (
              <Input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleRenameBlur}
                className={styles.inlineRenameInput}
                size="small"
              />
            ) : (
              <span
                className={`${styles.fileName} ${
                  node.name.startsWith('.') ? styles.hiddenFile : ''
                }`}
              >
                {node.name}
              </span>
            )}

            {/* 正常模式：显示文件状态 */}
            {!isComparing && !isChatLoading && !isRenaming && (
              <>
                {node.status && (
                  <span className={styles.fileStatus}>{node.status}</span>
                )}
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
      renamingNode,
      renameValue,
      onToggleFolder,
      onFileSelect,
      fileManagement,
      onDeleteFile,
      isChatLoading,
      handleContextMenu,
      handleRenameKeyDown,
      handleRenameBlur,
    ],
  );

  return (
    <>
      {/* 右键菜单 */}
      <FileContextMenu
        visible={contextMenuVisible}
        position={contextMenuPosition}
        targetNode={contextMenuTarget}
        isChatLoading={isChatLoading}
        isComparing={isComparing}
        onClose={closeContextMenu}
        onDelete={onDeleteFile}
        onRename={onRenameFile ? handleRenameFromMenu : undefined}
        onUploadSingleFile={handleUploadFromMenu}
      />

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
                {files.length === 0 ? (
                  <AppDevEmptyState
                    type="empty"
                    icon={<InboxOutlined />}
                    title="暂无文件"
                    description="请导入项目或创建新文件开始开发"
                    buttons={
                      !isComparing
                        ? [
                            {
                              text: '导入项目',
                              icon: <ImportOutlined />,
                              onClick: onUploadProject,
                              disabled: isChatLoading,
                            },
                          ]
                        : undefined
                    }
                  />
                ) : (
                  <div className={styles.fileTree}>
                    {files.map((node: any) => renderFileTreeNode(node))}
                  </div>
                )}
              </div>

              {/* 数据资源管理 - 固定在底部，仅在非版本对比模式显示 */}
              {!isComparing && (
                <div className={styles.dataSourceContainer}>
                  <div className={styles.dataSourceHeader}>
                    <span className={styles.dataSourceTitle}>数据资源</span>
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
                      // selectedResourceIds={selectedDataResourceIds}
                      // onSelectionChange={onDataResourceSelectionChange}
                      // isChatLoading={isChatLoading || isComparing}
                      projectId={projectId}
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
