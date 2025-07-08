/**
 * 支持的语言类型
 */
export const SUPPORTED_LANGUAGES = {
  MERMAID: 'mermaid',
} as const;

/**
 * CSS 选择器常量
 */
export const SELECTORS = {
  MARKDOWN_CODE_TOOLBAR_CONTAINER: '.markdown-code-toolbar-container',
  MERMAID_CONTAINER: '.mermaid-container',
  MERMAID_SOURCE_CODE: '.mermaid-source-code',
  MERMAID_CONTAINER_IMG: '.mermaid-container-img',
} as const;

/**
 * 样式常量
 */
export const STYLES = {
  TEXTAREA: {
    FONT_SIZE: '16px',
    POSITION: 'fixed',
    LEFT: '-999999px',
    TOP: '-999999px',
  },
  DISPLAY: {
    BLOCK: 'block',
    NONE: 'none',
  },
} as const;

/**
 * HTML 实体编码映射
 */
export const HTML_ENTITIES = {
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
} as const;

/**
 * 消息提示文本
 */
export const MESSAGES = {
  COPY_FAILED: '复制失败',
  COPY_FAILED_NO_CONTENT: '复制失败：未找到代码内容',
  COPY_SUCCESS: '复制成功',
  COPYING: '复制中',
  DOWNLOAD_FAILED: '下载失败',
  DOWNLOAD_PNG_SUCCESS: (width: number, height: number) =>
    `PNG图片下载成功 (${width}×${height})`,
  DOWNLOAD_SVG_SUCCESS: 'SVG图片下载成功',
  IMAGE_NOT_FOUND: '未找到图片元素',
  IMAGE_LOAD_FAILED: '图片加载失败',
  CANVAS_FAILED: '下载失败',
  SIZE_GET_FAILED: '无法获取图片原始尺寸',
  PNG_GENERATE_FAILED: '生成PNG失败',
  SVG_DATA_FAILED: '无法获取SVG数据',
} as const;

/**
 * 文件下载配置
 */
export const DOWNLOAD_CONFIG = {
  PNG: {
    MIME_TYPE: 'image/png',
    QUALITY: 1.0,
    SCALE_FACTOR: 10,
  },
  SVG: {
    MIME_TYPE: 'image/svg+xml',
    DATA_PREFIX: 'data:image/svg+xml,',
  },
} as const;

/**
 * 延迟时间常量（毫秒）
 */
export const DELAYS = {
  POSITION_CALCULATION: 300,
} as const;

/**
 * Canvas 渲染配置
 */
export const CANVAS_CONFIG = {
  SMOOTHING_ENABLED: true,
  SMOOTHING_QUALITY: 'high' as const,
} as const;
