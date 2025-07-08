import renderCodePrism from '@/utils/renderCodePrism';
import { message } from 'antd';
import {
  CANVAS_CONFIG,
  DOWNLOAD_CONFIG,
  MESSAGES,
  SELECTORS,
  STYLES,
} from './constants';
import type { ToolbarData } from './types';

/**
 * HTML 解码函数
 * @param text 需要解码的文本
 * @returns 解码后的文本
 */
export { copyTextToClipboard, fallbackCopyTextToClipboard } from '@/utils';

/**
 * 获取工具栏数据
 * @param id 元素ID
 * @param fallbackData 降级数据
 * @returns 工具栏数据
 */
export const getToolbarData = (
  id: string,
  fallbackData: { content: string; title: string; language: string },
): ToolbarData => {
  const element = document
    .getElementById(id)
    ?.querySelector(SELECTORS.MARKDOWN_CODE_TOOLBAR_CONTAINER) as HTMLElement;

  const { content, title, language } = element?.dataset || {};

  return {
    content: content ? decodeURIComponent(content) : fallbackData.content,
    title: title || fallbackData.title,
    language: language || fallbackData.language,
  };
};

/**
 * 切换 Mermaid 代码视图
 * @param chartId 图表ID
 * @param isCodeView 当前是否为代码视图
 * @param content 代码内容
 * @returns 新的视图状态
 */
export const toggleMermaidCodeView = (
  chartId: string,
  isCodeView: boolean,
  content: string,
): boolean => {
  if (!chartId) return isCodeView;

  const wrapper = document.getElementById(chartId);
  if (!wrapper) return isCodeView;

  const mermaidContainer = wrapper.querySelector(
    SELECTORS.MERMAID_CONTAINER,
  ) as HTMLElement;
  if (!mermaidContainer) return isCodeView;

  let codeElement = wrapper.querySelector(SELECTORS.MERMAID_SOURCE_CODE);

  if (isCodeView) {
    // 显示图表，隐藏代码
    mermaidContainer.style.display = STYLES.DISPLAY.BLOCK;
    if (codeElement) codeElement.remove();
  } else {
    // 隐藏图表，显示代码
    mermaidContainer.style.display = STYLES.DISPLAY.NONE;
    const codeResult = renderCodePrism({
      info: 'mermaid',
      content,
    });
    // 创建代码显示元素
    const newCodeElement = document.createElement('div');
    newCodeElement.className = SELECTORS.MERMAID_SOURCE_CODE.slice(1); // 移除前缀点
    newCodeElement.innerHTML = codeResult;
    wrapper.appendChild(newCodeElement);
  }

  return !isCodeView;
};

/**
 * 下载 PNG 图片
 * @param chartId 图表ID
 */
export const downloadPNG = (chartId: string): void => {
  if (!chartId) return;

  const imgElement = document
    .getElementById(chartId)
    ?.querySelector(SELECTORS.MERMAID_CONTAINER_IMG) as HTMLImageElement;

  if (!imgElement) {
    message.error(MESSAGES.IMAGE_NOT_FOUND);
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    message.error(MESSAGES.CANVAS_FAILED);
    return;
  }

  const processDownload = () => {
    // 使用缩放因子获取高质量图片
    const width = imgElement.naturalWidth * DOWNLOAD_CONFIG.PNG.SCALE_FACTOR;
    const height = imgElement.naturalHeight * DOWNLOAD_CONFIG.PNG.SCALE_FACTOR;

    if (width === 0 || height === 0) {
      message.error(MESSAGES.SIZE_GET_FAILED);
      return;
    }

    // 设置canvas尺寸
    canvas.width = width;
    canvas.height = height;

    // 设置高质量渲染
    ctx.imageSmoothingEnabled = CANVAS_CONFIG.SMOOTHING_ENABLED;
    ctx.imageSmoothingQuality = CANVAS_CONFIG.SMOOTHING_QUALITY;

    // 绘制图片
    ctx.drawImage(imgElement, 0, 0, width, height);

    // 生成并下载PNG
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mermaid-chart-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          message.success(MESSAGES.DOWNLOAD_PNG_SUCCESS(width, height));
        } else {
          message.error(MESSAGES.PNG_GENERATE_FAILED);
        }
      },
      DOWNLOAD_CONFIG.PNG.MIME_TYPE,
      DOWNLOAD_CONFIG.PNG.QUALITY,
    );
  };

  // 检查图片是否已加载
  if (imgElement.complete && imgElement.naturalWidth !== 0) {
    processDownload();
  } else {
    imgElement.onload = processDownload;
    imgElement.onerror = () => {
      message.error(MESSAGES.IMAGE_LOAD_FAILED);
    };
  }
};

/**
 * 下载 SVG 图片
 * @param chartId 图表ID
 */
export const downloadSVG = (chartId: string): void => {
  if (!chartId) return;

  const imgElement = document
    .getElementById(chartId)
    ?.querySelector(SELECTORS.MERMAID_CONTAINER_IMG) as HTMLImageElement;

  if (!imgElement) {
    message.error(MESSAGES.IMAGE_NOT_FOUND);
    return;
  }

  const src = imgElement.src;

  if (src.startsWith(DOWNLOAD_CONFIG.SVG.DATA_PREFIX)) {
    // 解码SVG数据
    const svgData = decodeURIComponent(
      src.replace(DOWNLOAD_CONFIG.SVG.DATA_PREFIX, ''),
    );

    // 创建Blob
    const blob = new Blob([svgData], { type: DOWNLOAD_CONFIG.SVG.MIME_TYPE });
    const url = URL.createObjectURL(blob);

    // 下载
    const a = document.createElement('a');
    a.href = url;
    a.download = `mermaid-chart-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(MESSAGES.DOWNLOAD_SVG_SUCCESS);
  } else {
    message.error(MESSAGES.SVG_DATA_FAILED);
  }
};
