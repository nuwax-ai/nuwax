import MarkdownIt from 'markdown-it';
import { generateFullHtml, htmlToPdf, HtmlToPdfOptions } from './htmlToPdf';

/**
 * Markdown 转 PDF 工具配置选项
 */
export type MarkdownToPdfOptions = HtmlToPdfOptions;

// 初始化 Markdown 解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

/**
 * 将 Markdown 内容转换为 HTML
 */
export const markdownToHtml = (markdown: string): string => {
  return md.render(markdown);
};

/**
 * 将 Markdown 内容转换为 PDF 并下载
 */
export const markdownToPdf = async (
  markdown: string,
  options: MarkdownToPdfOptions = {},
): Promise<void> => {
  const htmlContent = markdownToHtml(markdown);
  await htmlToPdf(htmlContent, options);
};

/**
 * 打开新窗口预览 Markdown 渲染结果
 */
export const previewMarkdown = (
  markdown: string,
  options: MarkdownToPdfOptions = {},
): Window | null => {
  const htmlContent = markdownToHtml(markdown);
  const fullHtml = generateFullHtml(htmlContent, options.customStyles);

  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(fullHtml);
    previewWindow.document.close();
  }

  return previewWindow;
};

export default markdownToPdf;
