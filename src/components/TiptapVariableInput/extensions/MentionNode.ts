/*
 * Mention Node Extension
 * @ mentions 节点扩展定义
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Mention 节点扩展
 * 用于渲染 @ mentions
 */
export const MentionNode = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  atom: true, // 防止光标跳入标签内部
  selectable: false,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: null,
      },
      type: {
        default: 'user',
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
          if (node.classList?.contains('mention-node')) {
            return {
              id: node.getAttribute('data-id'),
              label: node.getAttribute('data-label'),
              type: node.getAttribute('data-type') || 'user',
            };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // 直接使用 span 标签，样式通过 CSS 类应用（已在 styles.less 中定义）
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-id': HTMLAttributes.id,
        'data-label': HTMLAttributes.label,
        'data-type': HTMLAttributes.type,
        class: 'mention-node',
        // 移除内联样式，使用 CSS 类
      }),
      `@${HTMLAttributes.label || ''}`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const span = document.createElement('span');
      span.className = 'mention-node';
      span.setAttribute('data-id', node.attrs.id);
      span.setAttribute('data-label', node.attrs.label);
      span.setAttribute('data-type', node.attrs.type);
      span.textContent = `@${node.attrs.label}`;
      span.contentEditable = 'false';

      // 样式通过 CSS 类应用（已在 styles.less 中定义），不需要内联样式

      return {
        dom: span,
        update: (node) => {
          // 更新内容
          if (span.textContent !== `@${node.attrs.label}`) {
            span.textContent = `@${node.attrs.label}`;
          }
          // 确保属性正确
          if (span.getAttribute('data-id') !== node.attrs.id) {
            span.setAttribute('data-id', node.attrs.id);
          }
          if (span.getAttribute('data-label') !== node.attrs.label) {
            span.setAttribute('data-label', node.attrs.label);
          }
          if (span.getAttribute('data-type') !== node.attrs.type) {
            span.setAttribute('data-type', node.attrs.type);
          }
          return true;
        },
      };
    };
  },
});
