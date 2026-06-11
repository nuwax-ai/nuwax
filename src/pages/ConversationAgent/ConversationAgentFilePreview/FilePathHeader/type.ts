import { FileNode } from '@/types/interfaces/appDev';

export interface FilePathHeaderProps {
  /** 会话ID */
  conversationId: string;
  className?: string;
  /** 文件节点 */
  targetNode: FileNode | null;
  /** 重启服务器回调 */
  onRestartServer?: () => void;
  /** 重启智能体回调 */
  onRestartAgent?: () => void;
  /** 导入项目回调 */
  onImportProject?: () => void;
  /** 导出项目回调 */
  onExportProject?: () => void;
  /** 全屏回调 */
  onFullscreen?: () => void;
  /** 是否处于全屏状态 */
  isFullscreen?: boolean;
  /** 是否显示全屏图标 */
  showFullscreenIcon?: boolean;
  /** 是否正在导出项目 */
  isExportingProjecting?: boolean;
  /** 是否正在下载文件 */
  isDownloadingFile?: boolean;
  /** 是否显示更多操作菜单 */
  showMoreActions?: boolean;
  /** 通过URL下载文件回调 */
  onDownloadFileByUrl?: (node: FileNode) => void;
  /** 分享回调 */
  onShare?: () => void;
  // 是否显示分享按钮
  isShowShare?: boolean;
  // 是否显示下载按钮, 默认显示
  isShowDownloadButton?: boolean;
  // 是否显示导出 PDF 按钮, 默认显示
  isShowExportPdfButton?: boolean;
  /** 导出为 PDF 回调（仅 Markdown 文件） */
  onExportPdf?: (node: FileNode) => void;
  /** 是否正在导出 PDF */
  isExportingPdf?: boolean;
  // 关闭整个面板
  onClose?: () => void;
  /** 文件树是否可见 */
  isFileTreeVisible?: boolean;
  /** 文件树是否固定（用户点击后固定） */
  isFileTreePinned?: boolean;
  /** 文件树展开/折叠回调 */
  onFileTreeToggle?: () => void;
  /** 是否是云电脑 */
  isCloudComputer?: boolean;
  /** 当前视图模式（预览页签固定为 preview） */
  viewMode?: 'preview' | 'desktop';
  /** html / md 文件的查看方式：预览或代码 */
  viewFileType?: 'preview' | 'code';
  /** 切换预览 / 代码视图 */
  onViewFileTypeChange?: (type: 'preview' | 'code') => void;
}
