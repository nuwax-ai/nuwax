// 插件配置类型
export interface PluginConfig {
  name: string;
  plugin: any;
  options?: any;
  async?: boolean;
}

// markdown-it 选项类型
export interface MarkdownItOptions {
  html?: boolean;
  xhtmlOut?: boolean;
  breaks?: boolean;
  linkify?: boolean;
  typographer?: boolean;
  quotes?: string;
}

// 渲染器配置类型
export interface MarkdownRendererConfig {
  // markdown-it 基础配置
  markdownItOptions?: MarkdownItOptions;

  // 插件配置列表
  plugins?: PluginConfig[];

  // 自定义渲染规则
  customRules?: {
    [key: string]: (
      tokens: any[],
      idx: number,
      options?: any,
      env?: any,
      self?: any,
    ) => string;
  };

  // 全局函数配置
  globalFunctions?: {
    handleClipboard?: boolean;
    showImageInModal?: boolean;
    toggleCodeCollapse?: boolean;
  };

  // CSS 类名配置
  cssClasses?: {
    codeBlockWrapper?: string;
    codeHeader?: string;
    extBox?: string;
    copyImg?: string;
    customTable?: string;
    imageOverlay?: string;
  };
}

// 组件 Props 类型
export interface MarkdownRendererProps {
  id: string;
  content: string;
  config?: MarkdownRendererConfig;
  className?: string;
  onCopy?: () => void;
}

// 预设插件类型
export enum PresetPlugin {
  KATEX = 'katex',
  MULTIMD_TABLE = 'multimd-table',
  MERMAID = 'mermaid',
  PRISM = 'prism',
}
