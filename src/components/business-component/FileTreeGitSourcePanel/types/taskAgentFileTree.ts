import type { FileNode } from '@/types/interfaces/appDev';
import type React from 'react';

/** 任务智能体文件树 UI 所需的状态与处理器 */
export interface TaskAgentFileViewTree {
  files: FileNode[];
  selectedFileId: string;
  renamingNode: FileNode | null;
  contextMenuTarget: FileNode | null;
  contextMenuPosition: { x: number; y: number };
  contextMenuVisible: boolean;
  isFileTreeVisible: boolean;
  fileTreeContainerRef: React.RefObject<HTMLDivElement>;
  fileTreeDataLoading?: boolean;
  taskAgentSelectedFileId?: string;
  isCanDeleteSkillFile: boolean;
  isRefreshingFileTree: boolean;
  isUploadingFiles: boolean;
  isDownloadingFile: boolean;
  hideFileTree: boolean;
  showRefreshButton: boolean;
  handleFileSelect: (fileId: string) => Promise<void>;
  handleContextMenu: (e: React.MouseEvent, node: FileNode | null) => void;
  closeContextMenu: () => void;
  handleRenameFile: (fileNode: FileNode, newName: string) => Promise<void>;
  handleCancelRename: (options?: {
    removeIfNew?: boolean;
    node?: FileNode | null;
  }) => void;
  handleRefreshFileList: () => Promise<void>;
  handleDelete: (node: FileNode) => Promise<void>;
  handleRenameFromMenu: (node: FileNode) => void;
  handleUploadFromMenu: (node: FileNode | null) => Promise<void>;
  handleCreateFile: (parentNode: FileNode | null) => void;
  handleCreateFolder: (parentNode: FileNode | null) => void;
  /** 通过 URL 下载文件（可选，AppDev 场景无此能力） */
  handleDownloadFileByUrl?: (
    node: FileNode,
    exportAsPdf?: boolean,
  ) => Promise<void>;
  /** 导入项目（空白区域右键菜单，可选） */
  handleImportProject?: () => void;
  /** 导入项目菜单项文案（不传时使用默认的「导入技能」文案） */
  importProjectLabel?: string;
  /** 导出项目 */
  handleExportProject?: () => Promise<void>;
  /** 是否正在导出项目 */
  isExportingProject?: boolean;
  /** 工具栏是否禁用（如对比模式、聊天加载中） */
  toolbarDisabled?: boolean;
}
