import { describe, expect, it, vi } from 'vitest';
import { getMarkdownLocale } from '../getMarkdownLocale';

vi.mock('@/services/i18nRuntime', () => {
  const dictionary: Record<string, Record<string, string>> = {
    'en-us': {
      'PC.Components.MarkdownRenderer.copy': 'Copy',
      'PC.Components.MarkdownRenderer.copied': 'Copied',
      'PC.Components.MarkdownRenderer.download': 'Download',
      'PC.Components.MarkdownRenderer.mermaidDiagram': 'Diagram',
      'PC.Components.MarkdownRenderer.mermaidCode': 'Code',
      'PC.Components.MarkdownRenderer.mermaidZoomOut': 'Zoom Out',
      'PC.Components.MarkdownRenderer.mermaidZoomIn': 'Zoom In',
    },
    'zh-cn': {
      'PC.Components.MarkdownRenderer.copy': '复制',
      'PC.Components.MarkdownRenderer.copied': '已复制',
      'PC.Components.MarkdownRenderer.download': '下载',
      'PC.Components.MarkdownRenderer.mermaidDiagram': '图表',
      'PC.Components.MarkdownRenderer.mermaidCode': '代码',
      'PC.Components.MarkdownRenderer.mermaidZoomOut': '缩小',
      'PC.Components.MarkdownRenderer.mermaidZoomIn': '放大',
    },
  };
  let currentLang = 'zh-cn';
  return {
    setCurrentLang: (lang: string) => {
      currentLang = lang;
    },
    dict: (key: string) => dictionary[currentLang]?.[key] || key,
  };
});

describe('getMarkdownLocale', () => {
  it('正确映射 codeBlock 和 mermaid 的多语言文本', async () => {
    const { setCurrentLang } = await import('@/services/i18nRuntime');

    setCurrentLang('zh-cn');
    const zhLocale = getMarkdownLocale();
    expect(zhLocale.codeBlock.copy).toBe('复制');
    expect(zhLocale.codeBlock.copied).toBe('已复制');
    expect(zhLocale.codeBlock.download).toBe('下载');
    expect(zhLocale.mermaid.diagram).toBe('图表');
    expect(zhLocale.mermaid.code).toBe('代码');

    setCurrentLang('en-us');
    const enLocale = getMarkdownLocale();
    expect(enLocale.codeBlock.copy).toBe('Copy');
    expect(enLocale.codeBlock.copied).toBe('Copied');
    expect(enLocale.codeBlock.download).toBe('Download');
    expect(enLocale.mermaid.diagram).toBe('Diagram');
    expect(enLocale.mermaid.code).toBe('Code');
    expect(enLocale.mermaid.zoomOut).toBe('Zoom Out');
    expect(enLocale.mermaid.zoomIn).toBe('Zoom In');
  });
});
