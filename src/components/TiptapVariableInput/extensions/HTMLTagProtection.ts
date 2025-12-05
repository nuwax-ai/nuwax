/*
 * HTML Tag Protection Extension
 * HTML 标签保护扩展
 *
 * 功能：自动转义不被 Tiptap StarterKit 支持的 HTML 标签
 * 防止这些标签被 Tiptap 解析时被移除，确保原始标签能够正确显示
 */

import { Extension } from '@tiptap/core';
import { escapeHTML } from '../utils/htmlUtils';

/**
 * StarterKit 支持的 HTML 标签列表
 * 这些标签不会被转义，会被 Tiptap 正常解析
 */
const SUPPORTED_HTML_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'hardBreak',
];

/**
 * 转义不被支持的 HTML 标签
 * @param html HTML 内容
 * @returns 转义后的 HTML 内容
 */
function escapeUnsupportedHTMLTags(html: string): string {
  if (!html) return html;

  // 匹配所有 HTML 标签
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)(?:\s+[^>]*)?>/g;

  return html.replace(tagRegex, (match, tagName) => {
    const lowerTagName = tagName.toLowerCase();

    // 如果标签被支持，不转义
    if (SUPPORTED_HTML_TAGS.includes(lowerTagName)) {
      return match;
    }

    // 转义不被支持的标签
    return escapeHTML(match);
  });
}

/**
 * HTML Tag Protection 扩展
 * 在用户输入或粘贴时自动转义不被支持的 HTML 标签
 */
export const HTMLTagProtection = Extension.create({
  name: 'htmlTagProtection',

  /**
   * 转换粘贴的 HTML 内容
   * 在 Tiptap 解析粘贴的 HTML 之前，转义不被支持的 HTML 标签
   */
  transformPastedHTML(html: string) {
    if (!html) return html;

    // 检测并转义不被支持的 HTML 标签
    return escapeUnsupportedHTMLTags(html);
  },

  /**
   * 转换粘贴的纯文本
   * 如果文本中包含 HTML 标签，转义不被支持的标签
   */
  transformPastedText(text: string) {
    if (!text) return text;

    // 检查是否包含 HTML 标签
    if (!/<[^>]+>/.test(text)) {
      return text; // 没有 HTML 标签，返回原始文本
    }

    // 转义不被支持的 HTML 标签
    return escapeUnsupportedHTMLTags(text);
  },
});
