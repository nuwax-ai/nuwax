/**
 * MentionPopup 和 MentionEditor 组件类型定义
 *
 * @description
 * 定义了 @ 提及功能相关的所有 TypeScript 类型
 * 包括数据类型、Props 类型和 Ref Handle 类型
 */

/**
 * 提及项数据类型
 * 表示可被 @ 提及的单个项目
 *
 * @example
 * ```ts
 * const item: MentionItem = {
 *   id: 'ppt',
 *   name: 'PPT',
 *   icon: '📊',
 *   description: 'PPT 制作助手',
 *   category: 'tool'
 * };
 * ```
 */
export interface MentionItem {
  /** 唯一标识符 */
  id: string | number;
  /** 显示名称 */
  name: string;
  /** 图标（emoji 或图标类名） */
  icon?: string;
  /** 头像 URL */
  avatar?: string;
  /** 描述文本，用于搜索匹配和提示 */
  description?: string;
  /** 分类标识 */
  category?: string;
  /** 类型标识 */
  type?: string;
}

/**
 * Tab 类型枚举
 * 定义弹窗中可切换的标签页
 */
export type TabType = 'all' | 'recent' | 'favorite' | 'installed';

/**
 * Tab 配置类型
 * 用于配置弹窗顶部的标签页
 */
export interface TabConfig {
  /** Tab 唯一标识 */
  key: TabType;
  /** Tab 显示文本 */
  label: string;
}

/**
 * MentionPopup 组件 Props 类型
 *
 * @description
 * 弹窗选择器组件的属性定义
 * 支持受控和非受控两种模式
 */
export interface MentionPopupProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 弹窗位置（相对于视口） */
  position: {
    top: number;
    left: number;
  };
  /** 选择项时的回调 */
  onSelect: (item: MentionItem) => void;
  /** 关闭弹窗时的回调 */
  onClose: () => void;
  /** 搜索文本（受控模式） */
  searchText?: string;
  /** 搜索文本变化时的回调（受控模式） */
  onSearchChange?: (text: string) => void;
  /** 当前选中项索引（受控模式） */
  selectedIndex?: number;
  /** 选中项索引变化时的回调（受控模式） */
  onSelectedIndexChange?: (index: number) => void;
  /** 弹窗内容高度变化时的回调（用于外部重新定位弹窗） */
  onHeightChange?: (height: number) => void;
}

/**
 * MentionPopup 组件 Ref Handle 类型
 *
 * @description
 * 通过 ref 暴露给父组件的方法
 * 用于父组件控制弹窗的选择行为
 */
export interface MentionPopupHandle {
  /** 选择当前选中的项 */
  handleSelectCurrentItem: () => void;
  /** 向上移动选中项，到第一项时停止 */
  handleArrowUp: () => void;
  /** 向下移动选中项，在 Tab 栏时切换到列表 */
  handleArrowDown: () => void;
  /** 向左切换 Tab */
  handleArrowLeft: () => void;
  /** 向右切换 Tab */
  handleArrowRight: () => void;
  /** 重置选中索引为 0 */
  resetSelectedIndex: () => void;
}

/**
 * MentionEditor 组件 Props 类型
 *
 * @description
 * 编辑器组件的属性定义
 * 支持受控模式（通过 value 和 onChange）
 */
export interface MentionEditorProps {
  /** 编辑器内容值（受控模式） */
  value?: string;
  /** 内容变化时的回调 */
  onChange?: (value: string) => void;
  /** 按下回车键时的回调（用于发送消息） */
  onPressEnter?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** 粘贴时的回调（用于处理图片粘贴） */
  onPaste?: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否在渲染后自动获取焦点，默认 true */
  autoFocus?: boolean;
  /** 是否禁用编辑 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否启用 @ 提及功能，默认 true */
  enableMention?: boolean;
  /** MentionPopup 弹窗的展示方向：auto | up | down，默认 auto */
  mentionPlacement?: 'auto' | 'up' | 'down';
  /** 用于回显的默认提及项列表（需同时传入 value 文本） */
  defaultMentions?: MentionItem[];
  /** 选择提及项时的回调 */
  onMentionSelect?: (item: MentionItem) => void;
  /** 当前已选技能 ID 列表变化时的回调 */
  onSkillIdsChange?: (skillIds: Array<number>) => void;
  /** 最小行数（影响最小高度） */
  minRows?: number;
  /** 最大行数（影响最大高度） */
  maxRows?: number;
}

/**
 * MentionEditor 组件 Ref Handle 类型
 *
 * @description
 * 通过 ref 暴露给父组件的方法
 * 用于父组件控制编辑器
 */
export interface MentionEditorHandle {
  /** 聚焦编辑器 */
  focus: () => void;
  /** 移除编辑器焦点 */
  blur: () => void;
  /** 清空编辑器内容 */
  clear: () => void;
  /** 获取编辑器纯文本内容 */
  getTextContent: () => string;
  /** 获取所有已选中的提及项 */
  getMentions: () => MentionItem[];
}
