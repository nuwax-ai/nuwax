/*
 * Editable Variable Node Extension
 * 可编辑变量节点扩展定义
 */

import type { NodeViewRenderer } from '@tiptap/core';
import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

/**
 * 验证变量格式是否有效
 * 变量格式：允许字母、数字、点号、下划线、方括号（用于数组索引）
 * @param text 要验证的文本
 * @returns 是否为有效变量格式
 */
const isValidVariableFormat = (text: string): boolean => {
  if (!text || text.trim() === '') return false;
  // 变量格式：允许字母、数字、点号、下划线、方括号（用于数组索引如 array[0].property）
  // eslint-disable-next-line no-useless-escape
  return /^[a-zA-Z0-9._\[\]]+$/.test(text);
};

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

    // 使用标准的 span 标签，通过 class 识别，文本内容只包含 key，大括号通过 CSS 伪类实现
    // 在节点前后添加零宽度空格作为光标占位符
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-key': key,
        'data-label': label,
        'data-variable-name': key,
        class: 'variable-block-chip-editable',
      }),
      '\u200B' + (key || '') + '\u200B', // 文本内容包含 key，前后添加零宽度空格作为光标占位符
    ];
  },

  addNodeView(): NodeViewRenderer {
    return ({ node, editor, getPos }) => {
      // 创建包装容器
      const container = document.createElement('span');
      container.style.display = 'inline';

      // 创建左大括号元素
      const leftBrace = document.createElement('span');
      leftBrace.textContent = '{{';
      leftBrace.contentEditable = 'false';
      leftBrace.style.userSelect = 'none';
      leftBrace.style.color = 'inherit'; // 继承颜色

      // 创建一个包装 span 元素，用于添加样式
      const wrapper = document.createElement('span');
      wrapper.className = 'variable-block-chip-editable';
      wrapper.setAttribute('data-key', node.attrs.key || '');
      wrapper.setAttribute('data-label', node.attrs.label || '');
      wrapper.setAttribute('data-variable-name', node.attrs.key || '');

      // 创建一个内容容器，用于显示节点内的文本内容
      // ProseMirror 会自动管理这个容器内的文本节点
      const contentDOM = document.createElement('span');
      contentDOM.style.display = 'inline';
      wrapper.appendChild(contentDOM);

      // 创建右大括号元素
      const rightBrace = document.createElement('span');
      rightBrace.textContent = '}}';
      rightBrace.contentEditable = 'false';
      rightBrace.style.userSelect = 'none';
      rightBrace.style.color = 'inherit'; // 继承颜色

      // 组装 DOM 结构
      container.appendChild(leftBrace);
      container.appendChild(wrapper);
      container.appendChild(rightBrace);

      // 添加点击事件处理，支持在节点前后放置光标
      // 注意：对于可编辑节点，光标也可以进入节点内部，但我们也支持在节点前后
      container.addEventListener('mousedown', (e) => {
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos === null || pos === undefined) return;

        const target = e.target as HTMLElement | null;

        // 如果点击的是 contentDOM（节点内部），允许默认行为（光标进入节点内部）
        if (target && (target === contentDOM || contentDOM.contains(target))) {
          return; // 允许光标进入节点内部
        }

        // 如果点击的是大括号或 wrapper 的其他部分，将光标放在节点前后
        if (
          target === leftBrace ||
          target === rightBrace ||
          (target === wrapper && target !== contentDOM)
        ) {
          const { state, dispatch } = editor.view;
          const rect = container.getBoundingClientRect();
          const clickX = e.clientX;

          // 判断点击位置
          const clickOffset = clickX - rect.left;
          const leftBraceWidth = leftBrace.getBoundingClientRect().width;
          const wrapperWidth = wrapper.getBoundingClientRect().width;

          let targetPos: number;
          if (target === leftBrace || clickOffset < leftBraceWidth) {
            // 点击在左大括号区域
            targetPos = pos;
          } else if (
            target === rightBrace ||
            clickOffset >= leftBraceWidth + wrapperWidth
          ) {
            // 点击在右大括号区域
            targetPos = pos + node.nodeSize;
          } else {
            // 点击在 wrapper 区域，根据位置决定
            const wrapperOffset = clickOffset - leftBraceWidth;
            targetPos =
              wrapperOffset < wrapperWidth / 2 ? pos : pos + node.nodeSize;
          }

          if (targetPos >= 0 && targetPos <= state.doc.content.size) {
            // 阻止默认行为，避免触发换行
            e.preventDefault();
            e.stopPropagation();

            // 立即设置光标位置，然后确保编辑器获得焦点
            const selection = TextSelection.create(state.doc, targetPos);
            const tr = state.tr.setSelection(selection);
            dispatch(tr);

            // 使用 setTimeout 确保编辑器获得焦点
            setTimeout(() => {
              editor.view.focus();
            }, 0);
          }
        }
      });

      // 使用防抖来避免频繁更新
      let updateTimeout: NodeJS.Timeout | null = null;

      // 监听内容变化，验证变量格式
      const checkAndUpdate = () => {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        updateTimeout = setTimeout(() => {
          const textContent = contentDOM.textContent || '';
          const pos = typeof getPos === 'function' ? getPos() : null;

          if (pos === null || pos === undefined) return;

          // 验证新内容是否为有效变量格式
          if (textContent && !isValidVariableFormat(textContent)) {
            // 如果不再是有效变量格式，转换为普通文本节点
            const { state, dispatch } = editor.view;
            const tr = state.tr;
            const textNode = state.schema.text(textContent);
            tr.replaceWith(pos, pos + node.nodeSize, textNode);
            dispatch(tr);
          } else if (textContent !== node.attrs.key) {
            // 更新节点属性以保持同步
            const { state, dispatch } = editor.view;
            const tr = state.tr;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              key: textContent,
              label: textContent,
            });
            dispatch(tr);
          }
        }, 100); // 100ms 防抖
      };

      const observer = new MutationObserver(checkAndUpdate);

      // 开始观察内容变化
      observer.observe(contentDOM, {
        childList: true,
        characterData: true,
        subtree: true,
      });

      return {
        dom: container,
        contentDOM: contentDOM, // 告诉 ProseMirror 在这里渲染文本内容，这样光标可以正常移动
        update: (updatedNode) => {
          // 更新属性
          const newKey = updatedNode.attrs.key || '';
          if (wrapper.getAttribute('data-key') !== newKey) {
            wrapper.setAttribute('data-key', newKey);
            wrapper.setAttribute('data-variable-name', newKey);
          }
          if (wrapper.getAttribute('data-label') !== updatedNode.attrs.label) {
            wrapper.setAttribute('data-label', updatedNode.attrs.label || '');
          }
          return true; // 返回 true 表示更新成功，让 ProseMirror 继续管理内容
        },
        destroy: () => {
          // 清理观察器和定时器
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }
          observer.disconnect();
        },
      };
    };
  },

  addKeyboardShortcuts() {
    return {
      // 右箭头：在节点末尾时退出到节点后
      ArrowRight: ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;
        const { $from } = selection;

        // 检查光标是否在 editableVariable 节点内
        const parent = $from.parent;
        if (parent.type.name !== 'editableVariable') {
          return false; // 不处理
        }

        // 检查光标是否在节点内容的末尾
        const endOfNode = $from.parentOffset === parent.content.size;
        if (!endOfNode) {
          return false; // 不在末尾，允许默认行为
        }

        // 在末尾，将光标移到节点后面
        const posAfterNode = $from.after();
        if (posAfterNode <= state.doc.content.size) {
          editor.commands.setTextSelection(posAfterNode);
          return true; // 阻止默认行为
        }

        return false;
      },

      // 左箭头：在节点开头时退出到节点前
      ArrowLeft: ({ editor }) => {
        const { state } = editor.view;
        const { selection } = state;
        const { $from } = selection;

        // 检查光标是否在 editableVariable 节点内
        const parent = $from.parent;
        if (parent.type.name !== 'editableVariable') {
          return false;
        }

        // 检查光标是否在节点内容的开头
        const startOfNode = $from.parentOffset === 0;
        if (!startOfNode) {
          return false;
        }

        // 在开头，将光标移到节点前面
        const posBeforeNode = $from.before();
        if (posBeforeNode >= 0) {
          editor.commands.setTextSelection(posBeforeNode);
          return true;
        }

        return false;
      },
    };
  },
});
