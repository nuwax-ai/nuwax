/*
 * Raw Node Extension
 * 原始内容节点扩展，用于展示 HTML 或 XML 原始内容，不让 ProseMirror 解析
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Raw 节点扩展
 * 用于展示 HTML 或 XML 的原始内容，防止 ProseMirror 解析内部标签
 * 使用 atom: true 确保节点作为原子单元，光标无法进入内部
 */
export const RawNode = Node.create({
  name: 'raw',
  group: 'block',
  // 保留内部内容，不让 ProseMirror 解析
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      content: {
        default: '',
        parseHTML: (element) => {
          // 从 data-content 属性或 textContent 获取内容
          const rawContent =
            element.getAttribute('data-content') || element.textContent || '';
          // 如果内容被转义了，需要反转义
          return rawContent
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
        },
        renderHTML: (attributes) => {
          // 在 data-content 属性中也需要转义
          const escapedContent = (attributes.content || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          return {
            'data-content': escapedContent,
          };
        },
      },
      // 可选：添加类型标识，用于区分 HTML 和 XML
      type: {
        default: 'html',
        parseHTML: (element) => {
          return element.getAttribute('data-type') || 'html';
        },
        renderHTML: (attributes) => {
          return {
            'data-type': attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-raw]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            content:
              element.getAttribute('data-content') || element.textContent || '',
            type: element.getAttribute('data-type') || 'html',
          };
        },
      },
      {
        tag: 'raw',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const element = node as HTMLElement;
          return {
            content:
              element.getAttribute('content') || element.textContent || '',
            type: element.getAttribute('type') || 'html',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { content, type } = HTMLAttributes;
    // 转义内容中的特殊字符，确保在 HTML 中正确显示
    const escapedContent = (content || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return [
      'pre',
      mergeAttributes(HTMLAttributes, {
        'data-raw': 'true',
        'data-content': escapedContent,
        'data-type': type,
        class: 'raw-content',
        // 使用 white-space: pre-wrap 保持格式
        style: 'white-space: pre-wrap; word-wrap: break-word;',
      }),
      escapedContent,
    ];
  },

  /**
   * 自定义节点视图，确保内容以纯文本形式显示
   */
  addNodeView() {
    return ({ node }) => {
      const pre = document.createElement('pre');
      pre.className = 'raw-content';
      pre.setAttribute('data-raw', 'true');
      pre.setAttribute('data-content', node.attrs.content || '');
      pre.setAttribute('data-type', node.attrs.type || 'html');
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.wordWrap = 'break-word';
      pre.textContent = node.attrs.content || '';
      pre.contentEditable = 'false';

      return {
        dom: pre,
        update: (updatedNode) => {
          // 更新内容
          if (pre.textContent !== (updatedNode.attrs.content || '')) {
            pre.textContent = updatedNode.attrs.content || '';
            pre.setAttribute('data-content', updatedNode.attrs.content || '');
          }
          // 更新类型
          if (
            pre.getAttribute('data-type') !== (updatedNode.attrs.type || 'html')
          ) {
            pre.setAttribute('data-type', updatedNode.attrs.type || 'html');
          }
          return true;
        },
      };
    };
  },
});
