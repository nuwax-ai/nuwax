import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import TooltipIcon from '@/components/custom/TooltipIcon';
import ConversationAgentSourceControl from '@/pages/ConversationAgent/ConversationAgentSourceControl';
import { dict, t } from '@/services/i18nRuntime';
import { FileNode } from '@/types/interfaces/appDev';
import {
  BranchesOutlined,
  FolderOutlined,
  ImportOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Card, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AppDevFileTree from './AppDevFileTree';
import FileContextMenu from './FileContextMenu';
import styles from './index.less';
import type { FileTreePanelProps } from './types';

const cx = classNames.bind(styles);

/** 侧边栏视图类型 */
type PanelView = 'files' | 'sourceControl';

/**
 * FileTreePanel 组件
 * 提供文件树展示、数据资源管理和折叠/展开功能
 */
const FileTreePanel: React.FC<FileTreePanelProps> = ({
  files,
  isComparing,
  selectedFileId,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
  onDeleteFile,
  onRenameFile,
  onUploadProject,
  onUploadSingleFile,
  workspace,
  fileManagement,
  isChatLoading = false,
  // 新增：文件树初始化 loading 状态
  isFileTreeInitializing = false,
  changeFiles = [],
  stagedFileIds = new Set<string>(),
  selectedDiffFileId = null,
  isCommitting = false,
  onDiffFileSelect,
  onOpenChangeFile,
  onDiscardChange,
  onStageChange,
  onUnstageChange,
  onAddToGitignore,
  onCommit,
}) => {
  const [activeView, setActiveView] = useState<PanelView>('files');
  const modifiedCount = changeFiles.length;
  const showSourceControl = !isComparing && Boolean(onCommit);

  /** 点击修改文件：仅触发 diff 预览，不走文件树选中逻辑 */
  const handleModifiedFileClick = useCallback(
    (fileId: string) => {
      onDiffFileSelect?.(fileId);
    },
    [onDiffFileSelect],
  );
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
      <Tooltip
        title={
          isFileTreeCollapsed
            ? t('PC.Pages.AppDevFileTreePanel.expand')
            : t('PC.Pages.AppDevFileTreePanel.collapse')
        }
      >
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
              {showSourceControl && (
                <div className={cx(styles.iconBar)}>
                  <div className={cx(styles.iconBarItem)}>
                    <TooltipIcon
                      title={dict(
                        'PC.Pages.ConversationAgentMiddlePanel.files',
                      )}
                      ariaLabel={dict(
                        'PC.Pages.ConversationAgentMiddlePanel.files',
                      )}
                      placement="bottom"
                      className={cx(styles.iconBtn, {
                        [styles.active]: activeView === 'files',
                      })}
                      icon={<FolderOutlined style={{ fontSize: 16 }} />}
                      onClick={() => setActiveView('files')}
                    />
                  </div>
                  <div className={cx(styles.iconBarItem)}>
                    <TooltipIcon
                      title={dict(
                        'PC.Pages.ConversationAgentMiddlePanel.sourceControl',
                      )}
                      ariaLabel={dict(
                        'PC.Pages.ConversationAgentMiddlePanel.sourceControl',
                      )}
                      placement="bottom"
                      className={cx(styles.iconBtn, {
                        [styles.active]: activeView === 'sourceControl',
                      })}
                      icon={
                        <>
                          <BranchesOutlined style={{ fontSize: 16 }} />
                          {modifiedCount > 0 && (
                            <span className={cx(styles.iconBadge)}>
                              {modifiedCount > 99 ? '99+' : modifiedCount}
                            </span>
                          )}
                        </>
                      }
                      onClick={() => setActiveView('sourceControl')}
                    />
                  </div>
                </div>
              )}

              <div className={cx(styles.panelContent)}>
                {activeView === 'sourceControl' && showSourceControl ? (
                  <div className={cx(styles.sourceControlContainer)}>
                    <ConversationAgentSourceControl
                      changeFiles={changeFiles}
                      stagedFileIds={stagedFileIds}
                      isCommitting={isCommitting}
                      selectedDiffFileId={selectedDiffFileId}
                      onCommit={onCommit}
                      onFileClick={handleModifiedFileClick}
                      onOpenChanges={onDiffFileSelect}
                      onOpenFile={onOpenChangeFile}
                      onDiscardChange={onDiscardChange}
                      onStageChange={onStageChange}
                      onUnstageChange={onUnstageChange}
                      onAddToGitignore={onAddToGitignore}
                    />
                  </div>
                ) : (
                  // 文件树容器
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
                        title={t('PC.Pages.AppDevFileTreePanel.loadingTitle')}
                        description={t(
                          'PC.Pages.AppDevFileTreePanel.loadingDescription',
                        )}
                      />
                    ) : files.length === 0 ? (
                      <AppDevEmptyState
                        type="no-file" // 使用新的无文件状态
                        buttons={
                          !isComparing
                            ? [
                                {
                                  text: t(
                                    'PC.Pages.AppDevFileTreePanel.importProject',
                                  ),
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
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
};

export default FileTreePanel;
