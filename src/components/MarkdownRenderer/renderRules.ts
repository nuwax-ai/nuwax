import { encodeHTML } from '@/utils/common';
import renderCodePrism, { safeEscapeHtml } from '@/utils/renderCodePrism';
import { v4 as uuidv4 } from 'uuid';

/**
 * 提取内联内容的文本
 * @param inlineToken 内联 token
 * @returns 纯文本内容
 */
function _extractInlineContent(inlineToken: any): string {
  if (!inlineToken.children) return '';

  return inlineToken.children
    .map((child: any) => {
      if (child.type === 'text') {
        return child.content;
      } else if (child.type === 'code_inline') {
        return `\`${child.content}\``;
      } else if (child.type === 'strong_open') {
        return '**';
      } else if (child.type === 'strong_close') {
        return '**';
      } else if (child.type === 'em_open') {
        return '*';
      } else if (child.type === 'em_close') {
        return '*';
      }
      return '';
    })
    .join('');
}

/**
 * 提取表格行的内容
 * @param tokens 所有 tokens
 * @param startIdx 行开始的 token 索引
 * @returns 行内容数组
 */
function _extractTableRow(tokens: any[], startIdx: number): string[] {
  const cells: string[] = [];
  let currentIdx = startIdx + 1; // 跳过 tr_open

  while (currentIdx < tokens.length && tokens[currentIdx].type !== 'tr_close') {
    const token = tokens[currentIdx];

    if (token.type === 'th_open' || token.type === 'td_open') {
      // 收集单元格内容
      let cellContent = '';
      currentIdx++;

      while (
        currentIdx < tokens.length &&
        tokens[currentIdx].type !== 'th_close' &&
        tokens[currentIdx].type !== 'td_close'
      ) {
        if (tokens[currentIdx].type === 'inline') {
          cellContent += _extractInlineContent(tokens[currentIdx]);
        }
        currentIdx++;
      }

      cells.push(cellContent.trim());
    }

    currentIdx++;
  }

  return cells;
}

/**
 * 从 tokens 中提取完整的表格 markdown 内容
 * @param tokens 所有 tokens
 * @param startIdx 表格开始的 token 索引
 * @returns 表格的原始 markdown 字符串
 */
function _extractTableMarkdown(tokens: any[], startIdx: number): string {
  let currentIdx = startIdx + 1; // 跳过 table_open token

  // 收集表格相关的所有内容
  const tableRows: string[] = [];
  let headerProcessed = false;

  while (
    currentIdx < tokens.length &&
    tokens[currentIdx].type !== 'table_close'
  ) {
    const token = tokens[currentIdx];

    if (token.type === 'thead_open') {
      // 处理表头
      currentIdx++;
      while (
        currentIdx < tokens.length &&
        tokens[currentIdx].type !== 'thead_close'
      ) {
        if (tokens[currentIdx].type === 'tr_open') {
          const headerRow = _extractTableRow(tokens, currentIdx);
          tableRows.push(`| ${headerRow.join(' | ')} |`);

          // 添加分隔行
          if (!headerProcessed) {
            const separatorRow = headerRow.map(() => '---');
            tableRows.push(`| ${separatorRow.join(' | ')} |`);
            headerProcessed = true;
          }

          // 跳过到 tr_close
          while (
            currentIdx < tokens.length &&
            tokens[currentIdx].type !== 'tr_close'
          ) {
            currentIdx++;
          }
        }
        currentIdx++;
      }
    } else if (token.type === 'tbody_open') {
      // 处理表体
      currentIdx++;
      while (
        currentIdx < tokens.length &&
        tokens[currentIdx].type !== 'tbody_close'
      ) {
        if (tokens[currentIdx].type === 'tr_open') {
          const bodyRow = _extractTableRow(tokens, currentIdx);
          tableRows.push(`| ${bodyRow.join(' | ')} |`);

          // 跳过到 tr_close
          while (
            currentIdx < tokens.length &&
            tokens[currentIdx].type !== 'tr_close'
          ) {
            currentIdx++;
          }
        }
        currentIdx++;
      }
    }

    currentIdx++;
  }

  return tableRows.join('\n');
}

/**
 * 创建默认的渲染规则
 * @param cssClasses CSS 类名配置
 */
export const createDefaultRenderRules = (cssClasses: any = {}) => {
  const {
    codeBlockWrapper = 'code-block-wrapper',
    customTable = 'markdown-it-custom-table',
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
      <div class="markdown-code-toolbar-container" 
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
    table_open: (tokens: any[], idx: number) => {
      const token = tokens[idx + 1];
      const content = token.content;
      console.log('table_open', content);

      return `<div class="${customTable}">
      <div class="markdown-code-toolbar-container" 
        data-title="表格" 
        data-language="text"
        data-content="${encodeURIComponent(_extractTableMarkdown(tokens, idx))}"
        ></div>
      <table>`;
    },

    // 表格结束标签渲染
    table_close: () => {
      return `</table></div>`;
    },
  };

  return rules;
};
