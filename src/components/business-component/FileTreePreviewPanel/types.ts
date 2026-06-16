import type { GitWorkspaceConfig } from '@/components/business-component/FileTreeGitSourcePanel';
import type {
  FileTreeContainerProps,
  SourceControlProps,
} from '@/components/business-component/FileTreeGitSourcePanel/types/file-tree-git-source';
import type {
  ChangeFileInfo,
  IdleDetectionConfig,
} from '@/components/FileTreeView/type';
import type { HideDesktopEnum } from '@/types/enums/agent';
import type { FileNode } from '@/types/interfaces/appDev';
import type React from 'react';
import type { ChatFilePathHeaderProps } from './FilePathHeader/type';

export type { ChangeFileInfo };

/**
 * 文件树 + 预览视图 Hook 入参
 * 供 FileTreePreviewPanel / FileTreeViewPanel / Chat / ConversationAgent 使用
 */
export interface FileTreePreviewViewProps {
  className?: string;
  /** 文件树头部样式 */
  headerClassName?: string;
  /** 通用型智能体会话中点击选中的文件ID */
  taskAgentSelectedFileId?: string;
  /** 清除通用型智能体会话中点击选中的文件ID，手动切换文件时使用 */
  clearTaskAgentSelectedFileId?: () => void;
  /** 通用型智能体文件选择触发标志 */
  taskAgentSelectTrigger?: number | string;
  /** 是否导入了新的项目触发标志 */
  isImportProjectTrigger?: number | string;
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
  /** 导出项目回调 */
  onExportProject?: () => Promise<void>;
  /** 重启智能体电脑 / 客户端 */
  onRestartServer?: () => void;
  /** 重启智能体 */
  onRestartAgent?: () => void;
  /** 重命名文件回调 */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 创建文件回调 */
  onCreateFileNode?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 删除文件回调 */
  onDeleteFile?: (node: FileNode) => Promise<boolean>;
  /** 保存文件回调 */
  onSaveFiles?: (data: ChangeFileInfo[]) => Promise<boolean>;
  /** 导入项目 */
  onImportProject?: () => Promise<void>;
  /** 是否正在导入项目 */
  isImportingProject?: boolean;
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
  /** 是否显示更多操作菜单 */
  showMoreActions?: boolean;
  /** 是否显示全屏预览，由父组件控制 */
  isFullscreenPreview?: boolean;
  onFullscreenPreview?: (isFullscreen: boolean) => void;
  /** 分享回调 */
  onShare?: () => void;
  /** 是否显示分享按钮 */
  isShowShare?: boolean;
  /** 是否显示全屏图标 */
  showFullscreenIcon?: boolean;
  /** 是否隐藏文件树（外部控制） */
  hideFileTree?: boolean;
  /** 是否显示刷新按钮 */
  showRefreshButton?: boolean;
  /** VNC 空闲检测配置 */
  idleDetection?: IdleDetectionConfig;
  /** 是否为项目技能模式 */
  isProjectSkill?: boolean;
  /** 初始化视图类型 */
  initViewFileType?: 'preview' | 'code';
  /** 是否显示导出 PDF 按钮 */
  isShowExportPdfButton?: boolean;
  /** 是否显示下载按钮 */
  isShowDownloadButton?: boolean;
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
  /** 是否启用 Git status（仅通用型 TaskAgent 智能体） */
  enableGitStatus?: boolean;
}

/** 预览 Header 组件 props */
export type FileTreePreviewPathHeaderProps = ChatFilePathHeaderProps;

/** 预览 UI 所需的状态、处理器与渲染函数 */
export interface FileTreePreviewViewPreview {
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
  /** FilePathHeader 组件所需的 props */
  filePathHeaderProps: FileTreePreviewPathHeaderProps;
  handleFullscreen: () => void;
  handleFileTreeToggle: () => void;
  saveFiles: () => Promise<void>;
  cancelSaveFiles: () => void;
  /** 放弃单个文件的修改 */
  discardChangeFile: (fileId: string) => void;
  /** 是否正在保存文件 */
  isSavingFiles: boolean;
}

/** useFileTreePreviewView 返回值 */
export interface FileTreePreviewViewValue {
  className?: string;
  changeFiles: ChangeFileInfo[];
  /** 是否正在刷新 Git 变更列表 */
  isRefreshingGitList: boolean;
  /** 当前 Git 分支名（来自 git status 的 current） */
  gitBranch: string;
  /** 刷新 Git 变更列表（git status） */
  refreshGitList: () => Promise<void>;
  tree: FileTreeContainerProps;
  preview: FileTreePreviewViewPreview;
}

/** Git 版本记录面板配置 */
export interface FileTreePreviewGitVersionControlProps {
  workspace: GitWorkspaceConfig;
  branch: string;
  onRollbackSuccess?: () => void;
}

/** 预览区 Hook 入参 */
export interface UseFileTreePreviewPanelParams {
  /** 文件预览状态与渲染函数（来自 useFileTreePreviewView） */
  preview: FileTreePreviewViewPreview;
  /** 当前视图模式：文件预览 / 智能体电脑 */
  viewMode: 'preview' | 'desktop';
  agentSandboxId?: string;
  agentSandboxName?: string;
  onRestartServer?: () => void | Promise<void>;
  onRestartAgent?: () => void;
  onExportProject?: () => Promise<void>;
  idleDetection?: IdleDetectionConfig;
  hideDesktop?: HideDesktopEnum;
  /** Git 源代码管理选中的 diff 文件（优先于普通预览） */
  diffFile?: ChangeFileInfo | null;
  showGitVersionButton?: boolean;
  isGitVersionPanelOpen?: boolean;
  onToggleGitVersionPanel?: () => void;
}

/** FileTreePreviewPanel 组件属性 */
export interface FileTreePreviewPanelProps {
  className?: string;
  tree: FileTreeContainerProps;
  preview: FileTreePreviewViewPreview;
  sourceControl?: SourceControlProps;
  /** 是否显示源代码管理 Tab */
  showSourceControl?: boolean;
  viewMode: 'preview' | 'desktop';
  hideDesktop?: HideDesktopEnum;
  diffFile?: ChangeFileInfo | null;
  gitVersionPanelOpen?: boolean;
  onToggleGitVersionPanel?: () => void;
  gitVersionControl?: FileTreePreviewGitVersionControlProps;
  previewPanelProps: Omit<
    UseFileTreePreviewPanelParams,
    | 'preview'
    | 'viewMode'
    | 'diffFile'
    | 'showGitVersionButton'
    | 'isGitVersionPanelOpen'
    | 'onToggleGitVersionPanel'
  >;
  /** 文件树头部（搜索区）类名 */
  treeHeaderClassName?: string;
}
