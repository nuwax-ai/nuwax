import { FileNode } from '@/types/interfaces/appDev';

export interface FilePathHeaderProps {
  className?: string;
  /** 文件节点 */
  targetNode: FileNode | null;
  /** 是否正在下载文件 */
  isDownloadingFile?: boolean;
  /** 通过URL下载文件回调 */
  onDownloadFileByUrl?: (node: FileNode) => void;
  // 是否显示下载按钮, 默认显示
  isShowDownloadButton?: boolean;
  /** 文件树是否可见 */
  isFileTreeVisible?: boolean;
  /** 文件树是否固定（用户点击后固定） */
  isFileTreePinned?: boolean;
  /** 文件树展开/折叠回调 */
  onFileTreeToggle?: () => void;
  /** 当前视图模式（预览页签固定为 preview） */
  viewMode?: 'preview' | 'desktop';
  /** html / md 文件的查看方式：预览或代码 */
  viewFileType?: 'preview' | 'code';
  /** 切换预览 / 代码视图 */
  onViewFileTypeChange?: (type: 'preview' | 'code') => void;
}
