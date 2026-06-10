import type { FileNode } from '@/types/interfaces/appDev';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TaskAgentFileViewTree } from '../types/taskAgentFileTree';

/** AppDev 文件树所需的 fileManagement 能力子集 */
export interface AppDevFileTreeFileManagement {
  /** 插入用于新建的临时节点，返回该节点 */
  insertTempNodeForCreate?: (
    parentNode: FileNode | null,
    type: 'file' | 'folder',
  ) => FileNode;
  /** 移除临时节点 */
  removeTempNode?: (nodeId: string) => void;
  /** 刷新文件树 */
  loadFileTree: (
    preserveState?: boolean,
    forceRefresh?: boolean,
  ) => Promise<void> | void;
}

/** useAppDevFileTree 入参 */
export interface UseAppDevFileTreeParams {
  /** 文件树数据 */
  files: FileNode[];
  /** 当前选中的文件 ID */
  selectedFileId: string;
  /** 文件管理能力（来自 useAppDevFileManagement） */
  fileManagement: AppDevFileTreeFileManagement;
  /** 聊天加载中：禁用右键菜单与工具栏 */
  isChatLoading?: boolean;
  /** 文件树初始化加载中 */
  isFileTreeInitializing?: boolean;
  /** 文件选择回调 */
  onFileSelect: (fileId: string) => void;
  /** 删除文件/文件夹回调 */
  onDeleteFile: (node: FileNode, event: React.MouseEvent) => void;
  /** 重命名/新建确认回调（新建节点 status === 'create'） */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 上传单个文件回调（node 为 null 表示根目录） */
  onUploadSingleFile: (node: FileNode | null) => void | Promise<void>;
  /** 导入项目回调（空白区域右键菜单） */
  onImportProject?: () => void;
  /** 导入项目菜单项文案 */
  importProjectLabel?: string;
  /** 导出项目回调 */
  onExportProject?: () => void | Promise<void>;
}

/**
 * AppDev 文件树适配 Hook
 * 将 useAppDevFileManagement 的能力与页面回调适配为 TaskAgentFileTree
 * 所需的 TaskAgentFileViewTree 结构，内部维护右键菜单、重命名、刷新等 UI 状态
 *
 * @param params 见 UseAppDevFileTreeParams
 * @returns tree：可直接传给 TaskAgentFileTree 的状态与处理器集合
 */
export function useAppDevFileTree(params: UseAppDevFileTreeParams): {
  tree: TaskAgentFileViewTree;
} {
  const {
    files,
    selectedFileId,
    fileManagement,
    isChatLoading = false,
    isFileTreeInitializing = false,
    onFileSelect,
    onDeleteFile,
    onRenameFile,
    onUploadSingleFile,
    onImportProject,
    importProjectLabel,
    onExportProject,
  } = params;

  // 文件树容器（用于右键菜单相对定位）
  const fileTreeContainerRef = useRef<HTMLDivElement>(null);

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

  // 文件树刷新 loading 状态
  const [isRefreshingFileTree, setIsRefreshingFileTree] =
    useState<boolean>(false);

  /**
   * 处理右键菜单显示（坐标转换为相对文件树容器，配合菜单的相对定位）
   * @param e 鼠标事件
   * @param node 目标节点，null 表示空白区域
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode | null) => {
      e.preventDefault();
      e.stopPropagation();

      // 聊天加载中禁用右键菜单
      if (isChatLoading) {
        return;
      }

      setContextMenuTarget(node);
      if (fileTreeContainerRef.current) {
        const containerRect =
          fileTreeContainerRef.current.getBoundingClientRect();
        setContextMenuPosition({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        });
      } else {
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
      }
      setContextMenuVisible(true);
    },
    [isChatLoading],
  );

  /** 关闭右键菜单 */
  const closeContextMenu = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuTarget(null);
  }, []);

  // 点击外部关闭右键菜单
  useEffect(() => {
    document.addEventListener('click', closeContextMenu);
    return () => document.removeEventListener('click', closeContextMenu);
  }, [closeContextMenu]);

  /**
   * 取消重命名；新建节点未输入名称时移除临时占位
   * 仅当取消的是当前重命名节点时才清空状态，
   * 避免上一个输入框的延迟 blur 误清掉新一轮新建的重命名状态
   */
  const handleCancelRename = useCallback(
    (options?: { removeIfNew?: boolean; node?: FileNode | null }) => {
      if (
        options?.removeIfNew &&
        options.node &&
        fileManagement.removeTempNode
      ) {
        fileManagement.removeTempNode(options.node.id);
      }
      setRenamingNode((prev) =>
        options?.node && prev && prev.id !== options.node.id ? prev : null,
      );
    },
    [fileManagement],
  );

  /** 新建文件（parentNode 为 null 时在根目录创建） */
  const handleCreateFile = useCallback(
    (parentNode: FileNode | null = null) => {
      if (!fileManagement.insertTempNodeForCreate) {
        return;
      }
      // 连续点击新建时，先移除上一个尚未命名的临时节点，避免残留空占位
      if (renamingNode?.status === 'create') {
        fileManagement.removeTempNode?.(renamingNode.id);
      }
      const newNode = fileManagement.insertTempNodeForCreate(
        parentNode,
        'file',
      );
      setRenamingNode(newNode);
    },
    [fileManagement, renamingNode],
  );

  /** 新建文件夹（parentNode 为 null 时在根目录创建） */
  const handleCreateFolder = useCallback(
    (parentNode: FileNode | null = null) => {
      if (!fileManagement.insertTempNodeForCreate) {
        return;
      }
      // 连续点击新建时，先移除上一个尚未命名的临时节点，避免残留空占位
      if (renamingNode?.status === 'create') {
        fileManagement.removeTempNode?.(renamingNode.id);
      }
      const newNode = fileManagement.insertTempNodeForCreate(
        parentNode,
        'folder',
      );
      setRenamingNode(newNode);
    },
    [fileManagement, renamingNode],
  );

  /** 重命名/新建确认：透传给页面回调（内部区分新建与重命名） */
  const handleRenameFile = useCallback(
    async (node: FileNode, newName: string) => {
      await onRenameFile?.(node, newName);
    },
    [onRenameFile],
  );

  /** 删除：适配页面 (node, event) 签名 */
  const handleDelete = useCallback(
    async (node: FileNode) => {
      const stubEvent = {
        stopPropagation: () => {},
        preventDefault: () => {},
      } as unknown as React.MouseEvent;
      onDeleteFile(node, stubEvent);
    },
    [onDeleteFile],
  );

  /** 从右键菜单触发重命名 */
  const handleRenameFromMenu = useCallback((node: FileNode) => {
    setRenamingNode(node);
  }, []);

  /** 从右键菜单/工具栏触发上传单个文件 */
  const handleUploadFromMenu = useCallback(
    async (node: FileNode | null) => {
      await onUploadSingleFile(node);
    },
    [onUploadSingleFile],
  );

  /** 刷新文件树：内部维护 loading 状态，避免重复触发 */
  const handleRefreshFileList = useCallback(async () => {
    if (isRefreshingFileTree) {
      return;
    }
    setIsRefreshingFileTree(true);
    try {
      await fileManagement.loadFileTree(true, true);
    } finally {
      setIsRefreshingFileTree(false);
    }
  }, [fileManagement, isRefreshingFileTree]);

  /** 导出项目 */
  const handleExportProject = useCallback(async () => {
    await onExportProject?.();
  }, [onExportProject]);

  const tree = useMemo<TaskAgentFileViewTree>(
    () => ({
      files,
      selectedFileId,
      renamingNode,
      contextMenuTarget,
      contextMenuPosition,
      contextMenuVisible,
      isFileTreeVisible: true,
      fileTreeContainerRef,
      fileTreeDataLoading: isFileTreeInitializing,
      isCanDeleteSkillFile: true,
      isRefreshingFileTree,
      isUploadingFiles: false,
      isDownloadingFile: false,
      hideFileTree: false,
      showRefreshButton: true,
      handleFileSelect: async (fileId: string) => {
        onFileSelect(fileId);
      },
      handleContextMenu,
      closeContextMenu,
      handleRenameFile,
      handleCancelRename,
      handleRefreshFileList,
      handleDelete,
      handleRenameFromMenu,
      handleUploadFromMenu,
      handleCreateFile,
      handleCreateFolder,
      handleImportProject: onImportProject,
      importProjectLabel,
      handleExportProject: onExportProject ? handleExportProject : undefined,
      toolbarDisabled: isChatLoading,
    }),
    [
      files,
      selectedFileId,
      renamingNode,
      contextMenuTarget,
      contextMenuPosition,
      contextMenuVisible,
      isFileTreeInitializing,
      isRefreshingFileTree,
      isChatLoading,
      onFileSelect,
      onImportProject,
      importProjectLabel,
      onExportProject,
      handleContextMenu,
      closeContextMenu,
      handleRenameFile,
      handleCancelRename,
      handleRefreshFileList,
      handleDelete,
      handleRenameFromMenu,
      handleUploadFromMenu,
      handleCreateFile,
      handleCreateFolder,
      handleExportProject,
    ],
  );

  return { tree };
}
