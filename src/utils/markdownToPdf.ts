import html2canvas from 'html2canvas';
import MarkdownIt from 'markdown-it';
// @ts-ignore - 使用 require 绕过模块联邦问题
import { jsPDF } from 'jspdf';

/**
 * Markdown 转 PDF 工具配置选项
 */
export interface MarkdownToPdfOptions {
  /** PDF 文件名（不含扩展名） */
  fileName?: string;
  /** 页面尺寸 */
  pageSize?: 'a4' | 'a3' | 'letter' | 'legal';
  /** 页面方向 */
  orientation?: 'portrait' | 'landscape';
  /** 页面边距（单位: mm） */
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** 自定义 CSS 样式 */
  customStyles?: string;
  /** 是否显示页脚 */
  showFooter?: boolean;
  /** 页脚内容（支持 {{page}} 和 {{pages}} 占位符） */
  footerContent?: string;
}

/**
 * 默认配置
 */
const defaultOptions: Required<MarkdownToPdfOptions> = {
  fileName: 'document',
  pageSize: 'a4',
  orientation: 'portrait',
  margin: { top: 15, right: 15, bottom: 15, left: 15 },
  customStyles: '',
  showFooter: false,
  footerContent: '{{page}} / {{pages}}',
};

/**
 * 页面尺寸配置 (mm)
 */
const pageSizes: Record<string, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
  letter: { width: 215.9, height: 279.4 },
  legal: { width: 215.9, height: 355.6 },
};

/**
 * 默认的 PDF 样式
 */
const defaultStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.8;
    color: #333;
    padding: 20px;
    background: #fff;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.4;
  }
  
  h1 { font-size: 28px; border-bottom: 2px solid #eaecef; padding-bottom: 8px; }
  h2 { font-size: 24px; border-bottom: 1px solid #eaecef; padding-bottom: 6px; }
  h3 { font-size: 20px; }
  h4 { font-size: 16px; }
  h5 { font-size: 14px; }
  h6 { font-size: 13px; color: #6a737d; }
  
  p { margin-bottom: 16px; }
  
  a { color: #0366d6; text-decoration: none; }
  
  ul, ol { padding-left: 2em; margin-bottom: 16px; }
  
  li { margin-bottom: 4px; }
  
  blockquote {
    margin: 16px 0;
    padding: 12px 20px;
    color: #6a737d;
    border-left: 4px solid #dfe2e5;
    background: #f6f8fa;
  }
  
  code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    background-color: rgba(27, 31, 35, 0.05);
    padding: 2px 6px;
    border-radius: 3px;
  }
  
  pre {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    background-color: #f6f8fa;
    padding: 16px;
    overflow-x: auto;
    line-height: 1.45;
    border-radius: 6px;
    margin-bottom: 16px;
  }
  
  pre code { background-color: transparent; padding: 0; font-size: inherit; }
  
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  
  table th, table td { padding: 8px 12px; border: 1px solid #dfe2e5; text-align: left; }
  
  table th { font-weight: 600; background-color: #f6f8fa; }
  
  table tr:nth-child(2n) { background-color: #f6f8fa; }
  
  hr { height: 2px; margin: 24px 0; background-color: #e1e4e8; border: 0; }
  
  img { max-width: 100%; height: auto; }
`;

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
 * 生成完整的 HTML 文档
 */
const generateFullHtml = (htmlContent: string, customStyles = ''): string => {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <style>${defaultStyles}${customStyles}</style>
    </head>
    <body>${htmlContent}</body>
    </html>
  `;
};

/**
 * 将 Markdown 内容转换为 PDF 并下载
 */
export const markdownToPdf = async (
  markdown: string,
  options: MarkdownToPdfOptions = {},
): Promise<void> => {
  const opts = { ...defaultOptions, ...options };
  const { fileName, pageSize, orientation, margin, showFooter, footerContent } =
    opts;

  const htmlContent = markdownToHtml(markdown);
  const fullHtml = generateFullHtml(htmlContent, opts.customStyles);

  // 获取页面尺寸
  const size = pageSizes[pageSize] || pageSizes.a4;
  const pageWidth = orientation === 'landscape' ? size.height : size.width;
  const pageHeight = orientation === 'landscape' ? size.width : size.height;

  // 计算内容区域尺寸
  const contentWidth = pageWidth - (margin.left || 15) - (margin.right || 15);
  const contentHeight = pageHeight - (margin.top || 15) - (margin.bottom || 15);

  // 使用 iframe 隔离渲染环境，避免样式污染主页面
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: ${contentWidth}mm;
    height: auto;
    border: none;
    visibility: hidden;
  `;
  document.body.appendChild(iframe);

  try {
    // 写入 HTML 内容到 iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('无法访问 iframe 文档');
    }

    iframeDoc.open();
    iframeDoc.write(fullHtml);
    iframeDoc.close();

    // 等待内容渲染完成
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 100);
    });

    // 获取 iframe body 作为渲染目标
    const renderTarget = iframeDoc.body;

    // 使用 html2canvas 将内容转换为 canvas
    const canvas = await html2canvas(renderTarget, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: (contentWidth * 96) / 25.4, // mm to px (96 DPI)
      windowWidth: (contentWidth * 96) / 25.4,
    });

    // 创建 PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 计算需要的页数
    const totalPages = Math.ceil(imgHeight / contentHeight);

    // 分页添加内容
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // 计算当前页的 Y 偏移
      const yOffset = -(page * contentHeight);

      // 添加图片
      pdf.addImage(
        imgData,
        'PNG',
        margin.left || 15,
        (margin.top || 15) + yOffset,
        imgWidth,
        imgHeight,
      );

      // 添加页脚
      if (showFooter && footerContent) {
        const footer = footerContent
          .replace(/\{\{page\}\}/g, String(page + 1))
          .replace(/\{\{pages\}\}/g, String(totalPages));

        pdf.setFontSize(10);
        pdf.setTextColor(128);
        pdf.text(
          footer,
          pageWidth / 2,
          pageHeight - (margin.bottom || 15) / 2,
          { align: 'center' },
        );
      }
    }

    // 下载 PDF
    pdf.save(`${fileName}.pdf`);
  } finally {
    // 清理 iframe
    document.body.removeChild(iframe);
  }
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
