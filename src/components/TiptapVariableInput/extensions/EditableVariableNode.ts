/*
 * Editable Variable Node Extension
 * 可编辑变量节点扩展定义
 */

import type { NodeViewRenderer } from '@tiptap/core';
import { Node, mergeAttributes } from '@tiptap/core';

/**
 * EditableVariable 节点扩展
 * 用于渲染可编辑的变量引用 {variable.key}
 * 与 VariableNode 不同，支持光标进入、字符级编辑
 */
export const EditableVariableNode = Node.create({
  name: 'editableVariable',
  group: 'inline',
  inline: true,
  atom: false, // 允许光标进入节点内部
  selectable: true, // 可选择
  content: 'text*', // 允许节点包含文本内容，支持字符级编辑

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
          if (node.classList?.contains('variable-block-chip-editable')) {
            return {
              key:
                node.getAttribute('data-key') ||
                node.getAttribute('data-variable-name') ||
                node.textContent?.trim() ||
                '',
              label: node.getAttribute('data-label'),
            };
          }
          return false;
        },
        // 在解析时，确保节点前后有可放置光标的位置
        // 通过 skip 选项，保留节点前后的文本节点
        skip: false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { key, label } = HTMLAttributes;

    // 使用标准的 span 标签，大括号直接包含在文本内容中
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-key': key,
        'data-label': label,
        'data-variable-name': key,
        class: 'variable-block-chip-editable',
      }),
      '{{' + (key || '') + '}}', // 文本内容包含完整的 {{key}}
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ({ node }) => {
      // 创建一个包装 span 元素，既是容器也是 contentDOM
      const wrapper = document.createElement('span');
      wrapper.className = 'variable-block-chip-editable';
      wrapper.setAttribute('data-key', node.attrs.key || '');
      wrapper.setAttribute('data-label', node.attrs.label || '');
      wrapper.setAttribute('data-variable-name', node.attrs.key || '');

      return {
        dom: wrapper,
        contentDOM: wrapper, // wrapper 本身就是 contentDOM
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'editableVariable') return false;

          // 更新 data 属性（只在改变时更新）
          if (wrapper.getAttribute('data-key') !== updatedNode.attrs.key) {
            wrapper.setAttribute('data-key', updatedNode.attrs.key || '');
          }
          if (
            wrapper.getAttribute('data-variable-name') !== updatedNode.attrs.key
          ) {
            wrapper.setAttribute(
              'data-variable-name',
              updatedNode.attrs.key || '',
            );
          }
          if (wrapper.getAttribute('data-label') !== updatedNode.attrs.label) {
            wrapper.setAttribute('data-label', updatedNode.attrs.label || '');
          }

          return true;
        },
        destroy: () => {
          // 清理观察器和定时器
        },
      };
    };
  },

  addKeyboardShortcuts() {
    return {
      // Backspace: 确保在节点内逐字符删除
      Backspace: ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;
        const { $from } = selection;

        // 只在节点内部处理
        if ($from.parent.type.name !== 'editableVariable') {
          return false;
        }

        // 如果有选区，让默认行为处理
        if (!selection.empty) {
          return false;
        }

        // 让 ProseMirror 默认处理删除
        return false;
      },

      // Delete: 确保在节点内逐字符删除
      Delete: ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;
        const { $from } = selection;

        // 只在节点内部处理
        if ($from.parent.type.name !== 'editableVariable') {
          return false;
        }

        // 如果有选区，让默认行为处理
        if (!selection.empty) {
          return false;
        }

        // 让 ProseMirror 默认处理删除
        return false;
      },
    };
  },
});
