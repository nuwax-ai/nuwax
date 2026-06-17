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

    // 直接使用 span 标签，样式通过 CSS 类应用（已在 styles.less 中定义）
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-tool-id': id,
        'data-tool-type': type,
        'data-tool-name': name,
        'data-tool-content': content,
        class: 'tool-block-chip',
        // 移除内联样式，使用 CSS 类
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

      // 样式通过 CSS 类应用（已在 styles.less 中定义），不需要内联样式

      return {
        dom: span,
        update: (node) => {
          // 更新内容
          if (span.textContent !== (node.attrs.content || '')) {
            span.textContent = node.attrs.content || '';
          }
          // 确保属性正确
          if (span.getAttribute('data-tool-id') !== (node.attrs.id || '')) {
            span.setAttribute('data-tool-id', node.attrs.id || '');
          }
          if (span.getAttribute('data-tool-type') !== (node.attrs.type || '')) {
            span.setAttribute('data-tool-type', node.attrs.type || '');
          }
          if (span.getAttribute('data-tool-name') !== (node.attrs.name || '')) {
            span.setAttribute('data-tool-name', node.attrs.name || '');
          }
          if (
            span.getAttribute('data-tool-content') !==
            (node.attrs.content || '')
          ) {
            span.setAttribute('data-tool-content', node.attrs.content || '');
          }
          return true;
        },
      };
    };
  },
});
