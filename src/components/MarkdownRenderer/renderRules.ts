import { encodeHTML } from '@/utils/common';
import renderCodePrism, { safeEscapeHtml } from '@/utils/renderCodePrism';
import { v4 as uuidv4 } from 'uuid';

/**
 * 创建默认的渲染规则
 * @param cssClasses CSS 类名配置
 */
export const createDefaultRenderRules = (cssClasses: any = {}) => {
  const {
    codeBlockWrapper = 'code-block-wrapper',
    customTable = 'custom-table',
  } = cssClasses;

  const rules: Record<string, any> = {
    // HTML 块自定义转义
    html_block: (tokens: any[], idx: number) => {
      return encodeHTML(tokens[idx].content);
    },

    // 代码块渲染规则 - 支持行号和折叠功能
    fence: (tokens: any[], idx: number) => {
      const token = tokens[idx];
      const lang = token.info?.trim().split(/\s+/g)[0] || 'text';
      const content = token.content;
      const lineCount = content.split('\n').length - 1;
      const codeId = `code-block-${uuidv4()}`;
      let result = renderCodePrism(token);

      return `<div class="${codeBlockWrapper}" id="${codeId}">
      <div class="markdown-code-toolbar-mount" 
        data-language="${lang}" 
        data-content="${encodeURIComponent(content)}"
        data-line-count="${lineCount}"
        data-container-id="${codeId}">
      </div>
      ${result}
    </div>`;
    },

    // 图片渲染规则 - 支持点击放大
    image: (tokens: any[], idx: number) => {
      const token = tokens[idx];
      const src = token.attrGet ? token.attrGet('src') : '';
      const alt = token.attrGet ? token.attrGet('alt') || '' : '';

      return `<img src="${src}" data-src="${src}" alt="${safeEscapeHtml(
        alt,
      )}" class="markdown-it__image_clickable"/>`;
    },

    // 表格开始标签渲染
    table_open: () => {
      return `<div class="${customTable}"><table>`;
    },

    // 表格结束标签渲染
    table_close: () => {
      return `</table></div>`;
    },
    inline: (tokens: any[], idx: number) => {
      const token = tokens[idx];
      const content = token.content;
      return `<span class="markdown-it__inline">${content}</span>`;
    },
  };

  return rules;
};
