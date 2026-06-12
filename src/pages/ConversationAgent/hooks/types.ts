import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import type { FileTreeContainerProps } from '@/components/business-component/FileTreeGitSourcePanel/types/file-tree-git-source';
import type { HideDesktopEnum } from '@/types/enums/agent';
import type { FileNode } from '@/types/interfaces/appDev';
import type React from 'react';
import type { FilePathHeaderProps } from '../ConversationAgentFilePreview/FilePathHeader/type';

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
  /** 是否只读 */
  readOnly?: boolean;
  /** 上传多个文件回调 */
  onUploadFiles?: (files: File[], filePaths: string[]) => Promise<void>;
  /** 导出项目回调 */
  onExportProject?: () => Promise<void>;
  /** 重命名文件回调 */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 创建文件回调 */
  onCreateFileNode?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 删除文件回调 */
  onDeleteFile?: (node: FileNode) => Promise<boolean>;
  /** 保存文件回调 */
  onSaveFiles?: (data: ChangeFileInfo[]) => Promise<boolean>;
  /** 单个文件内容变更后实时保存（防抖） */
  onSaveFileContent?: (
    fileId: string,
    content: string,
    originalFileContent: string,
  ) => Promise<boolean>;
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
  /** 是否隐藏远程桌面 */
  hideDesktop?: HideDesktopEnum;
  /** 静态资源文件基础路径 */
  staticFileBasePath?: string;
  /** 选中文件后打开右侧预览面板（隐藏编排区域） */
  onFileSelectOpenPreview?: (fileId?: string) => void;
  /** 文件重命名成功后回调，用于同步预览区标签页 */
  onFileRenamed?: (oldFileId: string, newFileId: string) => void;
  /** 文件/文件夹删除成功后回调，用于同步预览区标签页与 Git 状态 */
  onFileDeleted?: (node: FileNode) => void;
  /** CodeViewer 是否使用动态主题（Chat 页为 true） */
  isDynamicTheme?: boolean;
}

/** ConversationAgent 预览 Tab 栏右侧文件操作区 props */
export type ConversationAgentFilePathHeaderProps = FilePathHeaderProps;

/** 预览 UI 所需的状态、处理器与渲染函数 */
export interface ConversationAgentFileViewPreview {
  selectedFileNode: FileNode | null;
  selectedFileId: string;
  isFullscreen: boolean;
  hideDesktop: HideDesktopEnum;
  changeFiles: ChangeFileInfo[];
  staticFileBasePath?: string;
  targetId?: string;
  readOnly: boolean;
  /** 渲染预览内容区域（VNC / 文件预览 / 代码编辑器等） */
  renderPreviewContent: () => React.ReactNode;
  /** FilePathHeader 组件所需的 props（不含更多操作） */
  filePathHeaderProps: ConversationAgentFilePathHeaderProps;
  handleFullscreen: () => void;
  handleFileTreeToggle: () => void;
  saveFiles: () => Promise<void>;
  cancelSaveFiles: () => void;
  /** 放弃单个文件的修改 */
  discardChangeFile: (fileId: string) => void;
  /** 是否正在保存文件 */
  isSavingFiles: boolean;
}

/** useConversationAgentFileView 返回值 */
export interface ConversationAgentFileViewValue {
  className?: string;
  changeFiles: ChangeFileInfo[];
  /** 是否正在刷新 Git 变更列表 */
  isRefreshingGitList: boolean;
  /** 当前 Git 分支名（来自 git status 的 current） */
  gitBranch: string;
  /** 刷新 Git 变更列表（git status） */
  refreshGitList: () => Promise<void>;
  tree: FileTreeContainerProps;
  preview: ConversationAgentFileViewPreview;
}
