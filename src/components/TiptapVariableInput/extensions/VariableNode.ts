/*
 * Variable Node Extension
 * { 变量节点扩展定义
 */

import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Variable 节点扩展
 * 用于渲染变量引用 {variable.key}
 */
export const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true, // 防止光标跳入标签内部
  selectable: false,

  addAttributes() {
    return {
      key: {
        default: null,
      },
      label: {
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
          if (node.classList?.contains('variable-block-chip')) {
            return {
              key:
                node.getAttribute('data-key') ||
                node.getAttribute('data-variable-name'),
              label: node.getAttribute('data-label'),
            };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { key, label } = HTMLAttributes;

    // 使用标准的 span 标签，通过 class 识别，文本内容只包含 key，大括号通过 CSS 伪类实现
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-key': key,
        'data-label': label,
        'data-variable-name': key,
        class: 'variable-block-chip',
      }),
      key, // 文本内容只包含 key，不包含大括号
    ];
  },

  addNodeView() {
    return ({ node }) => {
      // 使用标准的 span 标签，参考工具块的渲染方式
      const span = document.createElement('span');
      span.className = 'variable-block-chip';
      span.setAttribute('data-key', node.attrs.key);
      span.setAttribute('data-label', node.attrs.label);
      span.setAttribute('data-variable-name', node.attrs.key);
      span.textContent = node.attrs.key; // 文本内容只包含 key，不包含大括号
      span.contentEditable = 'false';

      // 样式通过 CSS 伪类实现，不需要内联样式
      // 大括号通过 ::before 和 ::after 伪类添加

      return {
        dom: span,
        update: (node) => {
          // 更新时确保属性正确
          if (span.getAttribute('data-key') !== node.attrs.key) {
            span.setAttribute('data-key', node.attrs.key);
            span.setAttribute('data-variable-name', node.attrs.key);
          }
          if (span.getAttribute('data-label') !== node.attrs.label) {
            span.setAttribute('data-label', node.attrs.label);
          }
          if (span.textContent !== node.attrs.key) {
            span.textContent = node.attrs.key;
          }
          return true;
        },
      };
    };
  },
});
