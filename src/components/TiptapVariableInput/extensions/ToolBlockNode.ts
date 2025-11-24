/*
 * ToolBlock Node Extension
 * 工具块节点扩展定义，用于渲染 {#ToolBlock ...#}content{#/ToolBlock#}
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * ToolBlock 节点扩展
 * 用于渲染工具块 {#ToolBlock id="..." type="..." name="..."#}content{#/ToolBlock#}
 */
export const ToolBlockNode = Node.create({
  name: 'toolBlock',
  group: 'inline',
  inline: true,
  atom: true, // 防止光标跳入标签内部
  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      type: {
        default: null,
      },
      name: {
        default: null,
      },
      content: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        // 使用标准的 span 标签，通过 class 识别
        tag: 'span',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          if (node.classList?.contains('tool-block-chip')) {
            return {
              id: node.getAttribute('data-tool-id'),
              type: node.getAttribute('data-tool-type'),
              name: node.getAttribute('data-tool-name'),
              content:
                node.getAttribute('data-tool-content') || node.textContent,
            };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { id, type, name, content } = HTMLAttributes;

    // 直接使用 span 标签，确保样式被应用
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-tool-id': id,
        'data-tool-type': type,
        'data-tool-name': name,
        'data-tool-content': content,
        class: 'tool-block-chip',
        style:
          'display: inline-block !important; background-color: #f6ffed !important; color: #52c41a !important; padding: 0 4px !important; border-radius: 4px !important; margin: 0 2px !important; font-size: 12px !important; line-height: 20px !important; border: 1px solid #b7eb8f !important; user-select: none !important; vertical-align: middle !important; cursor: default !important;',
      }),
      content || '',
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement('span');
      span.className = 'tool-block-chip';
      span.setAttribute('data-tool-id', node.attrs.id || '');
      span.setAttribute('data-tool-type', node.attrs.type || '');
      span.setAttribute('data-tool-name', node.attrs.name || '');
      span.setAttribute('data-tool-content', node.attrs.content || '');
      span.textContent = node.attrs.content || '';
      span.contentEditable = 'false';

      // 直接使用 setAttribute 设置内联样式（确保样式被应用）
      span.setAttribute(
        'style',
        'display: inline-block; background-color: #f6ffed; color: #52c41a; padding: 0 4px; border-radius: 4px; margin: 0 2px; font-size: 12px; line-height: 20px; border: 1px solid #b7eb8f; user-select: none; vertical-align: middle; cursor: default;',
      );

      return {
        dom: span,
        update: (node) => {
          // 更新时也确保样式存在
          if (span.getAttribute('style') === null) {
            span.setAttribute(
              'style',
              'display: inline-block; background-color: #f6ffed; color: #52c41a; padding: 0 4px; border-radius: 4px; margin: 0 2px; font-size: 12px; line-height: 20px; border: 1px solid #b7eb8f; user-select: none; vertical-align: middle; cursor: default;',
            );
          }
          if (span.textContent !== (node.attrs.content || '')) {
            span.textContent = node.attrs.content || '';
          }
          return true;
        },
      };
    };
  },
});
