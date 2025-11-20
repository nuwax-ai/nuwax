/**
 * TipTap 编辑器相关的类型定义
 */

// 变量项目接口
export interface VariableItem {
  /** 变量的唯一标识符 */
  key: string;
  /** 变量显示名称 */
  name: string;
  /** 变量描述 */
  description?: string;
  /** 变量类型 */
  type?: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'url' | 'object';
}

// 工具项目接口
export interface ToolItem {
  /** 工具的唯一标识符 */
  key: string;
  /** 工具显示标题 */
  title: string;
  /** 工具描述 */
  description?: string;
  /** 工具分类 */
  category?: string;
  /** 子工具列表 */
  children?: ToolItem[];
}

// ToolBlock 内容接口
export interface ToolBlockContent {
  /** 工具名称 */
  tool: string;
  /** 内容文本 */
  content: string;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

// 编辑器配置接口
export interface TipTapEditorConfig {
  /** 编辑器主题 */
  theme?: 'light' | 'dark';
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 编辑器最小高度 */
  minHeight?: number;
  /** 编辑器最大高度 */
  maxHeight?: number;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否自动聚焦 */
  autofocus?: boolean;
  /** 是否可编辑 */
  editable?: boolean;
  /** 编辑器内容 */
  content?: string;
}

// 建议项接口
export interface SuggestionItem {
  /** 项目类型 */
  type: 'variable' | 'tool';
  /** 项目数据 */
  item: VariableItem | ToolItem;
  /** 匹配文本 */
  matchText?: string;
  /** 匹配分数 */
  score?: number;
}

// 选择器位置接口
export interface SelectorPosition {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
}

// 建议弹窗配置接口
export interface SuggestionPopupConfig {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 弹窗位置 */
  position: SelectorPosition;
  /** 搜索关键词 */
  searchValue?: string;
  /** 当前选中的索引 */
  selectedIndex?: number;
  /** 活动的标签页 */
  activeTab?: string;
}

// 编辑器事件接口
export interface TipTapEditorEvents {
  /** 内容变化事件 */
  onChange?: (content: string) => void;
  /** 获取焦点事件 */
  onFocus?: () => void;
  /** 失去焦点事件 */
  onBlur?: () => void;
  /** 选择变化事件 */
  onSelectionUpdate?: () => void;
  /** 工具栏操作事件 */
  onToolbarAction?: (action: string, editor?: any) => void;
}

// 工具栏按钮配置接口
export interface ToolbarButtonConfig {
  /** 按钮标识符 */
  key: string;
  /** 按钮显示文本 */
  label: string;
  /** 按钮图标 */
  icon?: React.ReactNode;
  /** 按钮样式类名 */
  className?: string;
  /** 按钮是否激活 */
  active?: boolean;
  /** 按钮点击事件 */
  onClick?: () => void;
  /** 按钮禁用状态 */
  disabled?: boolean;
}

// ToolBlock 扩展配置接口
export interface ToolBlockExtensionConfig {
  /** 工具属性名 */
  toolAttr: string;
  /** 默认工具值 */
  defaultTool?: string;
  /** 内容属性名 */
  contentAttr: string;
  /** HTML 标签名 */
  htmlTag: string;
  /** CSS 类名 */
  className: string;
}

// 提及扩展配置接口
export interface MentionExtensionConfig {
  /** 触发字符 */
  char: string;
  /** 允许空格 */
  allowSpaces: boolean;
  /** HTML 属性 */
  htmlAttributes?: Record<string, any>;
  /** 渲染标签函数 */
  renderLabel?: (node: any) => string;
  /** 建议配置 */
  suggestion: {
    /** 搜索函数 */
    items: (query: string) => VariableItem[];
    /** 渲染函数 */
    render: () => any;
  };
}

// 编辑器扩展配置接口
export interface TipTapExtensionsConfig {
  /** 是否包含基础工具包 */
  includeStarterKit?: boolean;
  /** 是否包含占位符 */
  includePlaceholder?: boolean;
  /** 是否包含提及 */
  includeMention?: boolean;
  /** 是否包含 ToolBlock */
  includeToolBlock?: boolean;
  /** 自定义扩展 */
  customExtensions?: any[];
  /** 基础工具包配置 */
  starterKitConfig?: any;
  /** 占位符配置 */
  placeholderConfig?: any;
  /** 提及配置 */
  mentionConfig?: MentionExtensionConfig;
  /** ToolBlock 配置 */
  toolBlockConfig?: ToolBlockExtensionConfig;
}

// 导出状态接口
export interface ExportOptions {
  /** 导出格式 */
  format: 'html' | 'json' | 'markdown' | 'text';
  /** 是否包含样式 */
  includeStyles?: boolean;
  /** 是否包含元数据 */
  includeMetadata?: boolean;
  /** 文件名 */
  filename?: string;
  /** 压缩选项 */
  compression?: {
    /** 是否启用压缩 */
    enabled?: boolean;
    /** 压缩级别 */
    level?: number;
  };
}

// 导入选项接口
export interface ImportOptions {
  /** 导入格式 */
  format: 'html' | 'json' | 'markdown' | 'text';
  /** 是否验证内容 */
  validate?: boolean;
  /** 是否转换格式 */
  transform?: (content: string) => string;
  /** 错误处理 */
  onError?: (error: Error) => void;
}

// 编辑器统计信息接口
export interface EditorStats {
  /** 字符数 */
  characterCount: number;
  /** 单词数 */
  wordCount: number;
  /** 行数 */
  lineCount: number;
  /** 段落数 */
  paragraphCount: number;
  /** ToolBlock 数量 */
  toolBlockCount: number;
  /** 变量数量 */
  variableCount: number;
  /** 最后更新時間 */
  lastUpdated?: string;
}

// 编辑器快捷键配置接口
export interface EditorShortcutsConfig {
  /** 粗体快捷键 */
  bold?: string[];
  /** 斜体快捷键 */
  italic?: string[];
  /** 下划线快捷键 */
  underline?: string[];
  /** 删除线快捷键 */
  strike?: string[];
  /** 代码快捷键 */
  code?: string[];
  /** 标题快捷键 */
  heading?: Array<{
    level: number;
    keys: string[];
  }>;
  /** 列表快捷键 */
  bulletList?: string[];
  /** 有序列表快捷键 */
  orderedList?: string[];
  /** 引用快捷键 */
  blockquote?: string[];
  /** 代码块快捷键 */
  codeBlock?: string[];
  /** 撤销快捷键 */
  undo?: string[];
  /** 重做快捷键 */
  redo?: string[];
}

// 主题配置接口
export interface EditorThemeConfig {
  /** 主题名称 */
  name: string;
  /** 主题类型 */
  type: 'light' | 'dark' | 'custom';
  /** 颜色配置 */
  colors: {
    /** 主色调 */
    primary: string;
    /** 辅助色 */
    secondary: string;
    /** 背景色 */
    background: string;
    /** 文本色 */
    text: string;
    /** 边框色 */
    border: string;
    /** 工具栏背景 */
    toolbarBackground: string;
    /** 工具栏文本 */
    toolbarText: string;
    /** 选中色 */
    selection: string;
    /** 高亮色 */
    highlight: string;
  };
  /** 字体配置 */
  fonts: {
    /** 主字体 */
    primary: string;
    /** 等宽字体 */
    monospace: string;
    /** 字体大小 */
    size: {
      /** 小字体 */
      small: string;
      /** 正常字体 */
      normal: string;
      /** 大字体 */
      large: string;
      /** 标题字体 */
      heading: string;
    };
  };
  /** 间距配置 */
  spacing: {
    /** 基础间距 */
    base: string;
    /** 小间距 */
    small: string;
    /** 中间距 */
    medium: string;
    /** 大间距 */
    large: string;
  };
}
