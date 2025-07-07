/**
 * 工具栏位置信息
 */
export interface ContainerPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * 工具栏数据
 */
export interface ToolbarData {
  content: string;
  title: string;
  language: string;
}

/**
 * 下载类型
 */
export type DownloadType = 'svg' | 'png';

/**
 * 复制回调函数类型
 */
export type CopyCallback = (content: string) => void;

/**
 * Markdown 代码工具栏组件属性
 */
export interface MarkdownCodeToolbarProps {
  /** 标题 */
  title: string;
  /** 代码语言 */
  language: string;
  /** 代码内容 */
  content: string;
  /** 行数 */
  lineCount?: number;
  /** 是否支持折叠 */
  collapsible?: boolean;
  /** 初始折叠状态 */
  defaultCollapsed?: boolean;
  /** 折叠状态变化回调 */
  onCollapseChange?: (collapsed: boolean) => void;
  /** 复制成功回调 */
  onCopy?: CopyCallback;
  /** 容器ID，用于查找代码块 */
  containerId: string;
  /** 唯一ID */
  id: string;
  /** 类名 */
  className?: string;
}
