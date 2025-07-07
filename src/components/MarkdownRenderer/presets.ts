// 引入插件
import markdownItMermaid from '@/plugins/markdown-it-mermaid';
import markdownItKatexGpt from 'markdown-it-katex-gpt';
import markdownItMultimdTable from 'markdown-it-multimd-table';

import type { MarkdownRendererConfig, PluginConfig } from './types';

// KaTeX 数学公式插件配置
export const katexPlugin: PluginConfig = {
  name: 'katex',
  plugin: markdownItKatexGpt,
  options: {
    delimiters: [
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$$', right: '$$', display: false },
    ],
  },
};

// 多行表格插件配置
export const multimdTablePlugin: PluginConfig = {
  name: 'multimd-table',
  plugin: markdownItMultimdTable,
  options: {
    multiline: true,
    rowspan: true,
    headerless: false,
    multibody: true,
    aotolabel: true,
  },
};

// Mermaid 图表插件配置
export const mermaidPlugin: PluginConfig = {
  name: 'mermaid',
  plugin: markdownItMermaid,
  options: {
    delay: 100, // 渲染延迟
    throttleDelay: 200, // 节流延迟
    theme: 'default', // Mermaid 主题
    securityLevel: 'loose',
    suppressErrors: true,
  },
};

// 预设配置组合
export const presetConfigs = {
  // 基础配置 - 只包含基本功能
  basic: (): MarkdownRendererConfig => ({
    markdownItOptions: {
      html: true,
      xhtmlOut: true,
      breaks: true,
      linkify: true,
      typographer: true,
      quotes: '""\'\'',
    },
    plugins: [],
    globalFunctions: {
      handleClipboard: true,
      showImageInModal: true,
      toggleCodeCollapse: true,
    },
  }),

  // 标准配置 - 包含常用插件
  standard: (): MarkdownRendererConfig => ({
    markdownItOptions: {
      html: true,
      xhtmlOut: true,
      breaks: true,
      linkify: true,
      typographer: true,
      quotes: '""\'\'',
    },
    plugins: [katexPlugin, multimdTablePlugin],
    globalFunctions: {
      handleClipboard: true,
      showImageInModal: true,
      toggleCodeCollapse: true,
    },
  }),

  // 完整配置 - 包含所有插件
  full: (): MarkdownRendererConfig => ({
    markdownItOptions: {
      html: true,
      xhtmlOut: true,
      breaks: true,
      linkify: true,
      typographer: true,
      quotes: '""\'\'',
    },
    plugins: [katexPlugin, multimdTablePlugin, mermaidPlugin],
    globalFunctions: {
      handleClipboard: true,
      showImageInModal: true,
      toggleCodeCollapse: true,
    },
    cssClasses: {
      codeHeader: 'code-header',
      copyImg: 'copy-img',
      extBox: 'ext-box',
    },
  }),

  // 聊天配置 - 专为聊天场景优化
  chat: (): MarkdownRendererConfig => ({
    markdownItOptions: {
      html: true,
      xhtmlOut: true,
      breaks: true,
      linkify: true,
      typographer: true,
      quotes: '""\'\'',
    },
    plugins: [katexPlugin, multimdTablePlugin, mermaidPlugin],
    globalFunctions: {
      handleClipboard: true,
      showImageInModal: true,
      toggleCodeCollapse: true,
    },
    cssClasses: {
      codeHeader: 'code-header',
      copyImg: 'copy-img',
      extBox: 'ext-box',
    },
  }),
};

// 导出所有预设插件
export const allPlugins = {
  katex: katexPlugin,
  multimdTable: multimdTablePlugin,
  mermaid: mermaidPlugin,
};
