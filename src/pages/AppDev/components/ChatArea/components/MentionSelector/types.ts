/**
 * MentionSelector 组件类型定义
 */

import type { FileNode } from '@/types/interfaces/appDev';
import type { DataResource } from '@/types/interfaces/dataResource';

/**
 * 提及触发检测结果
 */
export interface MentionTriggerResult {
  /** 是否触发 */
  trigger: boolean;
  /** 触发字符 */
  triggerChar?: string;
  /** 搜索文本 */
  searchText?: string;
  /** @ 字符位置 */
  startIndex?: number;
}

/**
 * 下拉菜单位置信息
 */
export interface MentionPosition {
  /** 水平位置 */
  left: number;
  /** 垂直位置 */
  top: number;
  /** 是否可见 */
  visible: boolean;
}

/**
 * 视图类型
 */
export type ViewType =
  | 'main'
  | 'search'
  | 'files'
  | 'datasources'
  | 'datasource-list'
  | 'datasource-category';

/**
 * MentionSelector 组件暴露的方法
 */
export interface MentionSelectorHandle {
  /** 处理当前选中项的选择 */
  handleSelectCurrentItem: () => void;
  /** 处理 ESC 键返回上一级 */
  handleEscapeKey: () => boolean;
  /** 处理右方向键进入下一级 */
  handleArrowRightKey: () => boolean;
  /** 处理左方向键返回上一级 */
  handleArrowLeftKey: () => boolean;
}

/**
 * MentionSelector 组件属性
 */
export interface MentionSelectorProps {
  /** 是否显示下拉菜单 */
  visible: boolean;
  /** 下拉菜单位置 */
  position: MentionPosition;
  /** 搜索文本 */
  searchText: string;
  /** 文件列表 */
  files: FileNode[];
  /** 数据源列表 */
  dataSources: DataResource[];
  /** 选择文件回调 */
  onSelectFile: (file: FileNode) => void;
  /** 选择数据源回调 */
  onSelectDataSource: (dataSource: DataResource) => void;
  /** 键盘导航选中的索引 */
  selectedIndex: number;
  /** 下拉菜单容器引用 */
  containerRef?: React.RefObject<HTMLDivElement>;
  /** 键盘导航索引变化回调 */
  onSelectedIndexChange?: (index: number) => void;
}
