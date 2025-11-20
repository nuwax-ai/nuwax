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
    // 直接使用 span 标签，确保样式被应用
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-id': HTMLAttributes.id,
        'data-label': HTMLAttributes.label,
        'data-type': HTMLAttributes.type,
        class: 'mention-node',
        style:
          'display: inline-block !important; background-color: #e6f7ff !important; color: #1890ff !important; padding: 2px 6px !important; border-radius: 4px !important; margin: 0 2px !important; font-size: 12px !important; line-height: 20px !important; border: 1px solid #91d5ff !important; user-select: none !important; vertical-align: middle !important; cursor: default !important;',
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

      // 直接使用 setAttribute 设置内联样式（确保样式被应用）
      span.setAttribute(
        'style',
        'display: inline-block; background-color: #e6f7ff; color: #1890ff; padding: 2px 6px; border-radius: 4px; margin: 0 2px; font-size: 12px; line-height: 20px; border: 1px solid #91d5ff; user-select: none; vertical-align: middle; cursor: default;',
      );

      return {
        dom: span,
        update: (node) => {
          // 更新时也确保样式存在
          if (span.getAttribute('style') === null) {
            span.setAttribute(
              'style',
              'display: inline-block; background-color: #e6f7ff; color: #1890ff; padding: 2px 6px; border-radius: 4px; margin: 0 2px; font-size: 12px; line-height: 20px; border: 1px solid #91d5ff; user-select: none; vertical-align: middle; cursor: default;',
            );
          }
          if (span.textContent !== `@${node.attrs.label}`) {
            span.textContent = `@${node.attrs.label}`;
          }
          return true;
        },
      };
    };
  },
});
