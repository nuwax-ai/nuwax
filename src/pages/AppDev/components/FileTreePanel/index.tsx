import SvgIcon from '@/components/base/SvgIcon';
import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { FileNode } from '@/types/interfaces/appDev';
import {
  ImportOutlined,
  InboxOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AppDevFileTree from './AppDevFileTree';
import DataResourceList from './DataResourceList';
import FileContextMenu from './FileContextMenu';
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
  // 新增：文件树初始化 loading 状态
  isFileTreeInitializing = false,
}) => {
  // 文件树折叠状态
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] =
    useState<boolean>(false);

  // 滚动位置保持相关状态
  const fileTreeScrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // 右键菜单状态
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMenuTarget, setContextMenuTarget] = useState<FileNode | null>(
    null,
  );

  // 内联重命名状态
  const [renamingNode, setRenamingNode] = useState<FileNode | null>(null);

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
   * @param e - 鼠标事件
   * @param node - 目标节点, 可以为 null 表示点击空白区域，清空目标节点
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode | null) => {
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

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    // if (contextMenuVisible) {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
    // }
  }, [closeContextMenu]);

  /**
   * 取消重命名
   */
  const cancelRename = useCallback(() => {
    setRenamingNode(null);
  }, []);

  /**
   * 处理重命名操作（从右键菜单触发）
   */
  const handleRenameFromMenu = useCallback((node: any) => {
    setRenamingNode(node);
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
        onUploadProject={onUploadProject}
      />

      {/* 悬浮折叠/展开按钮 - 放在预览区域左下角 */}
      <Tooltip title={isFileTreeCollapsed ? '展开文件树' : '收起文件树'}>
        <Button
          shape="circle"
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
        <Card className={styles.fileTreeCard} variant="borderless">
          {!isFileTreeCollapsed && (
            <>
              {/* 文件树容器 */}
              <div
                className={styles.fileTreeContainer}
                ref={fileTreeScrollRef}
                onScroll={saveScrollPosition}
                // 处理空白区域右键菜单显示
                onContextMenu={(e) => handleContextMenu(e, null)}
              >
                {/* 文件树结构 */}
                {isFileTreeInitializing ? (
                  <AppDevEmptyState
                    type="loading"
                    title="正在加载..."
                    description="请稍候"
                  />
                ) : files.length === 0 ? (
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
                  // 文件树组件
                  <AppDevFileTree
                    files={files}
                    isComparing={isComparing}
                    selectedFileId={selectedFileId}
                    expandedFolders={expandedFolders}
                    renamingNode={renamingNode}
                    onCancelRename={cancelRename}
                    onContextMenu={handleContextMenu}
                    onFileSelect={onFileSelect}
                    onToggleFolder={onToggleFolder}
                    onRenameFile={onRenameFile}
                    workspace={workspace}
                    fileManagement={fileManagement}
                    isChatLoading={isChatLoading}
                  />
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
                        icon={
                          <SvgIcon
                            name="icons-common-plus"
                            style={{ fontSize: 16 }}
                          />
                        }
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
