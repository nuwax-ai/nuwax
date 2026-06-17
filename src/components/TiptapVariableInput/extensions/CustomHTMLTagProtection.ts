/*
 * Custom XML Tag Protection Extension
 * 自定义 XML 标签保护扩展
 *
 * 功能：自动转义用户输入或粘贴的自定义 XML 标签（如 <OutputFormat>）
 * 防止这些标签被 Tiptap 或浏览器解析为 HTML 元素
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { convertTextToHTML, escapeCustomHTMLTags } from '../utils/htmlUtils';

/**
 * Custom XML Tag Protection 扩展
 * 在用户输入或粘贴时自动转义自定义 XML 标签
 */
export const CustomHTMLTagProtection = Extension.create({
  name: 'customXMLTagProtection',

  /**
   * 转换粘贴的 HTML 内容
   * 在 Tiptap 解析粘贴的 HTML 之前，转义自定义 XML 标签
   */
  addPasteRules() {
    return [];
  },

  /**
   * 转换粘贴的 HTML
   * 在 HTML 被解析之前转义自定义 XML 标签，确保它们被正确显示
   */
  transformPastedHTML(html: string) {
    if (!html) return html;

    // 创建一个临时 DOM 元素来提取纯文本
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const textContent = temp.textContent || temp.innerText || '';

    // 检查是否包含自定义 XML 标签
    const hasCustomTags =
      /<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?>/.test(textContent) ||
      /<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?\s*\/>/.test(textContent) ||
      /<\/([A-Z][A-Za-z0-9]*)>/.test(textContent);

    if (!hasCustomTags) {
      return html; // 没有自定义标签，返回原始 HTML
    }

    // 转义自定义 XML 标签
    const escapedText = escapeCustomHTMLTags(textContent);

    // 将转义后的文本转换为 HTML 格式
    // 这样 HTML 实体（&lt; 和 &gt;）会被正确解析和显示
    const escapedHtml = convertTextToHTML(escapedText, true, true, 'text');

    return escapedHtml;
  },

  /**
   * 转换粘贴的纯文本
   * 在纯文本被插入之前转义自定义 XML 标签
   * 注意：如果检测到自定义标签，返回 HTML 格式以确保 HTML 实体被正确解析
   */
  transformPastedText(text: string) {
    if (!text) return text;

    // 检查是否包含自定义 XML 标签
    const hasCustomTags =
      /<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?>/.test(text) ||
      /<[A-Z][A-Za-z0-9]*(?:\s+[^>]*)?\s*\/>/.test(text) ||
      /<\/([A-Z][A-Za-z0-9]*)>/.test(text);

    if (!hasCustomTags) {
      return text; // 没有自定义标签，返回原始文本
    }

    // 转义自定义 XML 标签
    const escapedText = escapeCustomHTMLTags(text);

    // 将转义后的文本转换为 HTML 格式
    // 这样 HTML 实体（&lt; 和 &gt;）会被正确解析和显示
    // 注意：虽然方法名是 transformPastedText，但返回 HTML 也是可以的
    // Tiptap 会识别并正确解析 HTML 内容
    const escapedHtml = convertTextToHTML(escapedText, true, true, 'text');

    return escapedHtml;
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customXMLTagProtection'),
        props: {
          /**
           * 处理粘贴事件（备用方案）
           * 如果 transformPastedHTML 没有生效，这里作为备用处理
           */
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          handlePaste: (_view, _event, _slice) => {
            // transformPastedHTML 应该已经处理了，这里不需要额外处理
            return false; // 让默认处理继续
          },
        },
      }),
    ];
  },
});
