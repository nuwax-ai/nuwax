import type { IdleDetectionConfig } from '@/components/business-component/VncPreview/type';
import type { DefaultSelectedEnum, HideDesktopEnum } from '@/types/enums/agent';
import type { FileNode } from '@/types/interfaces/appDev';
import type React from 'react';
import type {
  FileTreeContainerProps,
  GitWorkspaceConfig,
  SourceControlCallbacks,
} from '../../FileTreeGitSourcePanel';

/** Git 变更类型（与 VS Code 源代码管理角标一致） */
export type ChangeFileGitStatusKind =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'untracked'
  | 'conflict'
  | 'renamed';

/** 修改的文件信息 */
export interface ChangeFileInfo {
  fileId: string;
  fileContent: string;
  originalFileContent: string;
  /** 暂存区状态 */
  stagedStatus?: ChangeFileGitStatusKind;
  /** 工作区未暂存状态 */
  unstagedStatus?: ChangeFileGitStatusKind;
}

export type { IdleDetectionConfig };

/** FileTreeViewPanel 暴露给父组件的 ref */
export interface FileTreeViewRef {
  changeFiles: ChangeFileInfo[];
  /** 当前在文件树/预览区选中的文件 ID */
  selectedFileId: string;
}

/**
 * FileTreeViewPanel 组件属性（兼容原 FileTreeView）
 */
export interface FileTreeViewProps {
  className?: string;
  headerClassName?: string;
  taskAgentSelectedFileId?: string;
  clearTaskAgentSelectedFileId?: () => void;
  taskAgentSelectTrigger?: number | string;
  originalFiles?: any[];
  fileTreeDataLoading?: boolean;
  readOnly?: boolean;
  targetId?: string;
  viewMode?: 'preview' | 'desktop';
  onUploadFiles?: (files: File[], filePaths: string[]) => Promise<void>;
  onExportProject?: () => Promise<void>;
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
  onCreateFileNode?: (node: FileNode, newName: string) => Promise<boolean>;
  onDeleteFile?: (node: FileNode) => Promise<boolean>;
  onSaveFiles?: (data: ChangeFileInfo[]) => Promise<boolean>;
  onImportProject?: () => Promise<void>;
  isImportingProject?: boolean;
  agentSandboxId?: string;
  agentSandboxName?: string;
  onRestartServer?: () => void;
  onRestartAgent?: () => void;
  /**
   * VNC 重连前回调：应先 ensurePod 并恢复 keepalive 轮询
   * 典型实现：ensureDesktopConnection(conversationId)
   */
  onReconnect?: () => void | Promise<void>;
  showMoreActions?: boolean;
  isFullscreenPreview?: boolean;
  onFullscreenPreview?: (isFullscreen: boolean) => void;
  onShare?: () => void;
  isShowShare?: boolean;
  onClose?: () => void;
  showFullscreenIcon?: boolean;
  hideFileTree?: boolean;
  isFileTreePinned?: boolean;
  onFileTreePinnedChange?: (pinned: boolean) => void;
  isCanDeleteSkillFile?: boolean;
  onRefreshFileTree?: () => Promise<void>;
  showRefreshButton?: boolean;
  idleDetection?: IdleDetectionConfig;
  hideDesktop?: HideDesktopEnum;
  /** 网站应用环境，仅 AppDevPro 传入 */
  appStage?: 'dev' | 'prod';
  isDynamicTheme?: boolean;
  isShowExportPdfButton?: boolean;
  isShowDownloadButton?: boolean;
  staticFileBasePath?: string;
  isProjectSkill?: boolean;
  initViewFileType?: 'preview' | 'code';
  /** Git 源代码管理配置；传入后显示源代码管理面板 */
  gitSourceControl?: {
    workspace: GitWorkspaceConfig;
    callbacks?: Partial<
      Pick<
        SourceControlCallbacks,
        'addFileToGitignore' | 'onCommitSuccess' | 'onRefreshGitList'
      >
    >;
  };
  /** 智能体是否开启版本管理 */
  enableVersionControl?: DefaultSelectedEnum;
  /** 文件树预览面板底部内容 */
  bottomContent?: React.ReactNode;
  /** 刷新文件树后，当前选中/待选文件已不存在时回调 */
  onSelectedFileMissing?: (fileId: string) => void;
  /** 是否启用 Git status 拉取 */
  enableGitStatus?: boolean;
  /**
   * 点击文件夹时加载该目录。
   * 传入后展开文件夹会按层请求 file-list，而不是只展开已有子节点。
   */
  onOpenDirectory?: (node: FileNode) => void | Promise<void>;
  /** 模型层文件树刷新信号，用于重拉当前打开文件的正文 */
  fileTreeRefreshTrigger?: number;
  /**
   * 目标文件所在目录是否已加载。
   * 未加载时自动选中会等待，避免分层树还没返回就把文件判成不存在。
   */
  isAutoSelectDirectoryLoaded?: (fileId: string) => boolean;
  /** 已完成分层加载的文件夹节点 id */
  loadedFolderIds?: Set<string>;
  /** 正在请求子列表的文件夹节点 id */
  loadingFolderIds?: Set<string>;
  /** 已展开但尚未加载的目录，由文件树补拉 */
  onLoadDirectory?: (path: string) => void | Promise<void>;
  /** 文件树搜索走服务端 */
  remoteFileSearch?: FileTreeContainerProps['remoteFileSearch'];
  /** 搜索命中尚未出现在树上时，先拉它所在的目录 */
  onEnsureFallbackDirectory?: (options?: {
    selectFolder?: boolean;
    openDirectory?: boolean;
    fallbackNode?: FileNode;
  }) => Promise<void>;
  /**
   * 任务结果文件打开后的选中入口。
   * 分层加载 hook 比预览面板更早创建，渲染后再把选中函数写进这个 ref。
   */
  selectFileRef?: React.MutableRefObject<
    (
      fileId: string,
      options?: { selectFolder?: boolean; fallbackNode?: FileNode },
    ) => Promise<void> | void
  >;
}
