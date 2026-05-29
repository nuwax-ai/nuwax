import type { FilePathHeaderProps } from '@/components/FileTreeView/FilePathHeader/type';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type {
  IdleDetectionConfig,
  VncPreviewRef,
} from '@/components/business-component/VncPreview/type';
import type { HideDesktopEnum } from '@/types/enums/agent';
import type { FileNode } from '@/types/interfaces/appDev';
import type React from 'react';

export type { ChangeFileInfo };

/**
 * ConversationAgent 传递给文件视图的核心 props
 * 与 ConversationAgent/index.tsx 中 FileTreeView 的入参保持一致
 */
export interface ConversationAgentFileViewProps {
  className?: string;
  /** 通用型智能体会话中点击选中的文件ID */
  taskAgentSelectedFileId?: string;
  /** 通用型智能体文件选择触发标志 */
  taskAgentSelectTrigger?: number | string;
  /** 原始文件列表 */
  originalFiles?: any[];
  /** 文件树数据加载状态 */
  fileTreeDataLoading?: boolean;
  /** 目标ID（会话ID） */
  targetId?: string;
  /** 当前视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 是否只读 */
  readOnly?: boolean;
  /** 上传多个文件回调 */
  onUploadFiles?: (files: File[], filePaths: string[]) => Promise<void>;
  /** 重命名文件回调 */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 创建文件回调 */
  onCreateFileNode?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 删除文件回调 */
  onDeleteFile?: (node: FileNode) => Promise<boolean>;
  /** 保存文件回调 */
  onSaveFiles?: (data: ChangeFileInfo[]) => Promise<boolean>;
  /** 用户选择的智能体电脑ID */
  agentSandboxId?: string;
  /** 用户选择的智能体电脑名称 */
  agentSandboxName?: string;
  /** 关闭整个面板 */
  onClose?: () => void;
  /** 文件树是否固定 */
  isFileTreePinned?: boolean;
  /** 文件树固定状态变化回调 */
  onFileTreePinnedChange?: (pinned: boolean) => void;
  /** 文件树侧边栏是否可见（受控模式） */
  isFileTreeSidebarVisible?: boolean;
  /** 文件树侧边栏可见性变化回调 */
  onFileTreeSidebarVisibleChange?: (visible: boolean) => void;
  /** 是否可以删除技能文件 */
  isCanDeleteSkillFile?: boolean;
  /** 刷新文件树回调 */
  onRefreshFileTree?: () => Promise<void>;
  /** VNC 空闲检测配置 */
  idleDetection?: IdleDetectionConfig;
  /** 是否隐藏远程桌面 */
  hideDesktop?: HideDesktopEnum;
  /** 静态资源文件基础路径 */
  staticFileBasePath?: string;
  /** 选中文件后打开右侧预览面板（隐藏编排区域） */
  onFileSelectOpenPreview?: () => void;
}

/** ConversationAgent 预览头部 props（不含更多操作相关回调） */
export type ConversationAgentFilePathHeaderProps = Omit<
  FilePathHeaderProps,
  'onRestartServer' | 'onRestartAgent' | 'onExportProject' | 'onImportProject'
>;

/** 文件树 UI 所需的状态与处理器 */
export interface ConversationAgentFileViewTree {
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
  viewMode?: 'preview' | 'desktop';
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
  handleDownloadFileByUrl: (
    node: FileNode,
    exportAsPdf?: boolean,
  ) => Promise<void>;
}

/** 预览 UI 所需的状态、处理器与渲染函数 */
export interface ConversationAgentFileViewPreview {
  selectedFileNode: FileNode | null;
  selectedFileId: string;
  viewFileType: 'preview' | 'code';
  viewMode?: 'preview' | 'desktop';
  vncPreviewRef: React.RefObject<VncPreviewRef>;
  isFullscreen: boolean;
  hideDesktop: HideDesktopEnum;
  changeFiles: ChangeFileInfo[];
  idleDetection?: IdleDetectionConfig;
  staticFileBasePath?: string;
  targetId?: string;
  readOnly: boolean;
  /** 渲染预览内容区域（VNC / 文件预览 / 代码编辑器等） */
  renderPreviewContent: () => React.ReactNode;
  /** FilePathHeader 组件所需的 props（不含更多操作） */
  filePathHeaderProps: ConversationAgentFilePathHeaderProps;
  handleFullscreen: () => void;
  handleViewFileTypeChange: (type: 'preview' | 'code') => void;
  handleFileTreeToggle: () => void;
  saveFiles: () => Promise<void>;
  cancelSaveFiles: () => void;
}

/** useConversationAgentFileView 返回值 */
export interface ConversationAgentFileViewValue {
  className?: string;
  changeFiles: ChangeFileInfo[];
  tree: ConversationAgentFileViewTree;
  preview: ConversationAgentFileViewPreview;
}
