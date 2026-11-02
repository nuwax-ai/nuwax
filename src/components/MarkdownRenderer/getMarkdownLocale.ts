import * as i18n from '@/services/i18nRuntime';
import type { Locale } from 'ds-markdown';

/**
 * 获取当前语种标识，兼容测试中可能只 mock 部分导出的场景
 */
export const getSafeCurrentLang = (): string => {
  try {
    return typeof i18n.getCurrentLang === 'function'
      ? i18n.getCurrentLang()
      : 'zh-cn';
  } catch {
    return 'zh-cn';
  }
};

/**
 * 获取 ds-markdown 渲染所需的多语言配置包
 */
export const getMarkdownLocale = (): Locale => {
  const dictFn = typeof i18n.dict === 'function' ? i18n.dict : (k: string) => k;

  return {
    codeBlock: {
      copy: dictFn('PC.Components.MarkdownRenderer.copy'),
      copied: dictFn('PC.Components.MarkdownRenderer.copied'),
      download: dictFn('PC.Components.MarkdownRenderer.download'),
    },
    mermaid: {
      diagram: dictFn('PC.Components.MarkdownRenderer.mermaidDiagram'),
      code: dictFn('PC.Components.MarkdownRenderer.mermaidCode'),
      zoomOut: dictFn('PC.Components.MarkdownRenderer.mermaidZoomOut'),
      zoomIn: dictFn('PC.Components.MarkdownRenderer.mermaidZoomIn'),
      download: dictFn('PC.Components.MarkdownRenderer.download'),
    },
  };
};
