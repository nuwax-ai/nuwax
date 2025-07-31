import { MarkdownCMDRef } from 'ds-markdown';

// 插件配置类型
export interface PluginConfig {
  name: string;
  plugin: any;
  options?: any;
  async?: boolean;
}

// 渲染器配置类型
export interface MarkdownRendererConfig {
  // 插件配置列表
  plugins?: PluginConfig[];

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

export interface MermaidOptions {
  securityLevel?: 'loose' | 'strict' | 'antiscript' | 'sandbox';
  [key: string]: any;
}

export interface MermaidProps {
  value: string;
  requestId: string;
  id: string;
  className?: string;
  language?: string;
  dataKey?: string;
}
// 组件 Props 类型
export interface MarkdownRendererProps {
  id: string;
  // config?: MarkdownRendererConfig;
  className?: string;
  mermaid?: (props: MermaidProps) => React.ReactNode;
  disableTyping?: boolean;
  answerType?: 'answer' | 'thinking';
  markdownRef: React.RefObject<MarkdownCMDRef>;
  onCopy?: () => void;
  headerActions?: boolean;
}

// 预设插件类型
export enum PresetPlugin {
  KATEX = 'katex',
  MULTIMD_TABLE = 'multimd-table',
  MERMAID = 'mermaid',
  PRISM = 'prism',
}
