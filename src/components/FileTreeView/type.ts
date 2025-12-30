import { FileNode } from '@/types/interfaces/appDev';

// 修改的文件信息
export interface ChangeFileInfo {
  fileId: string;
  fileContent: string;
  originalFileContent: string;
}

/**
 * FileTreeView 组件暴露给父组件的方法和属性
 */
export interface FileTreeViewRef {
  /** 修改的文件列表 */
  changeFiles: ChangeFileInfo[];
}

/**
 * 文件树视图组件属性
 */
export interface FileTreeViewProps {
  // 是否显示视图模式切换按钮
  showViewModeButtons?: boolean;
  // 是否显示文件树展开/折叠按钮
  showFileTreeToggleButton?: boolean;
  // 文件树头部样式
  headerClassName?: string;
  // 任务智能体会话中点击选中的文件ID
  taskAgentSelectedFileId?: string;
  // 任务智能体文件选择触发标志，每次点击按钮时传入不同的值（如时间戳），用于强制触发文件选择
  taskAgentSelectTrigger?: number | string;
  // 原始文件列表
  originalFiles: any[];
  /** 文件树数据加载状态 */
  fileTreeDataLoading?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 目标ID, 可以是技能ID、会话ID等 */
  targetId?: string;
  /** 当前视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 上传多个文件回调 */
  onUploadFiles?: (node: FileNode | null) => void;
  /** 导出项目回调 */
  onExportProject?: () => Promise<void>;
  /** 重命名文件回调 */
  onRenameFile?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 创建文件回调 */
  onCreateFileNode?: (node: FileNode, newName: string) => Promise<boolean>;
  /** 删除文件回调 */
  onDeleteFile?: (node: FileNode) => Promise<boolean>;
  /** 视图模式切换回调 */
  onViewModeChange?: (mode: 'preview' | 'desktop') => void;
  /** 保存文件回调 */
  onSaveFiles?: (data: ChangeFileInfo[]) => Promise<boolean>;
  // 导入项目
  onImportProject?: () => void;
  /** 重启容器回调 */
  onRestartServer?: () => void;
  /** 重启智能体回调 */
  onRestartAgent?: () => void;
  // 是否显示更多操作菜单
  showMoreActions?: boolean;
  /** 是否显示全屏预览，由父组件控制 */
  isFullscreenPreview?: boolean;
  onFullscreenPreview?: (isFullscreen: boolean) => void;
  /** 分享回调 */
  onShare?: () => void;
  // 是否显示分享按钮
  isShowShare?: boolean;
  // 关闭整个面板
  onClose?: () => void;
  // 是否显示全屏图标
  showFullscreenIcon?: boolean;
  /** 是否隐藏文件树（外部控制） */
  hideFileTree?: boolean;
  /** 文件树是否固定（用户点击后固定） */
  isFileTreePinned?: boolean;
  /** 文件树固定状态变化回调 */
  onFileTreePinnedChange?: (pinned: boolean) => void;
  // 是否可以删除技能文件, 默认不可以删除
  isCanDeleteSkillFile?: boolean;
  /** 刷新文件树回调 */
  onRefreshFileTree?: () => void;
  // 是否显示刷新按钮, 默认显示
  showRefreshButton?: boolean;
}
