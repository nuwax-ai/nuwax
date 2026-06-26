import type { IdleDetectionConfig } from '@/components/business-component/VncPreview/type';
import type { DefaultSelectedEnum, HideDesktopEnum } from '@/types/enums/agent';
import type { FileNode } from '@/types/interfaces/appDev';
import type React from 'react';
import type {
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
  isImportProjectTrigger?: number | string;
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
}
