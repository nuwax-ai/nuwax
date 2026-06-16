import type { GitWorkspaceConfig } from '@/components/business-component/FileTreeGitSourcePanel';
import type {
  FileTreeContainerProps,
  SourceControlProps,
} from '@/components/business-component/FileTreeGitSourcePanel/types/file-tree-git-source';
import type {
  ChangeFileInfo,
  IdleDetectionConfig,
} from '@/components/FileTreeView/type';
import type { ConversationAgentFileViewPreview } from '@/pages/ConversationAgent/hooks/types';
import type { HideDesktopEnum } from '@/types/enums/agent';

/** Git 版本记录面板配置 */
export interface FileTreePreviewGitVersionControlProps {
  workspace: GitWorkspaceConfig;
  branch: string;
  onRollbackSuccess?: () => void;
}

/** 预览区 Hook 入参 */
export interface UseFileTreePreviewPanelParams {
  /** 文件预览状态与渲染函数（来自 useConversationAgentFileView） */
  preview: ConversationAgentFileViewPreview;
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
  preview: ConversationAgentFileViewPreview;
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
