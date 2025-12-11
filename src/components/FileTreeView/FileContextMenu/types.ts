import type { FileNode } from '@/types/interfaces/appDev';

/**
 * 右键菜单项类型
 */
export interface ContextMenuItem {
  /** 菜单项唯一标识 */
  key: string;
  /** 菜单项显示文本 */
  label: string;
  /** 菜单项图标 */
  icon: React.ReactNode;
  /** 点击回调函数 */
  onClick: () => void;
  /** 是否为危险操作（如删除） */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * FileContextMenu 组件属性接口
 */
export interface FileContextMenuProps {
  /** 是否显示菜单 */
  visible: boolean;
  /** 菜单位置 */
  position: { x: number; y: number };
  /** 目标文件/文件夹节点 */
  targetNode: FileNode | null;
  /** 是否正在聊天加载中 */
  isChatLoading?: boolean;
  /** 是否处于版本对比模式 */
  isComparing?: boolean;
  /** 是否禁用删除功能（为 true 时隐藏删除菜单项和 divider） */
  disableDelete?: boolean;
  /** 关闭菜单回调 */
  onClose: () => void;
  /** 删除文件回调 */
  onDelete: (node: FileNode, event: React.MouseEvent) => void;
  /** 重命名文件回调 */
  onRename?: (node: FileNode) => void;
  /** 上传单个文件回调（直接调用，不弹窗） */
  onUploadSingleFile?: (node: FileNode | null) => void;
  /** 上传项目回调（空白区域菜单） */
  onUploadProject?: () => void;
}
