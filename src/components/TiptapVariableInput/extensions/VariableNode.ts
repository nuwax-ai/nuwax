/*
 * Variable Node Extension
 * { 变量节点扩展定义
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

/**
 * Variable 节点扩展
 * 用于渲染变量引用 {variable.key}
 */
export const VariableNode = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true, // 防止光标跳入标签内部
  selectable: true, // 允许节点被全选

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
        class: 'variable-block-chip',
      }),
      '\u200B' + key + '\u200B', // 文本内容包含 key，前后添加零宽度空格作为光标占位符
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      // 创建包装容器
      const container = document.createElement('span');
      container.style.display = 'inline';

      // 创建左大括号元素
      const leftBrace = document.createElement('span');
      leftBrace.textContent = '{{';
      leftBrace.contentEditable = 'false';
      leftBrace.style.userSelect = 'none';

      // 变量节点本身
      const span = document.createElement('span');
      span.className = 'variable-block-chip';
      span.setAttribute('data-key', node.attrs.key);
      span.setAttribute('data-label', node.attrs.label);
      span.setAttribute('data-variable-name', node.attrs.key);
      span.textContent = node.attrs.key; // 文本内容只包含 key
      span.contentEditable = 'false';

      // 创建右大括号元素
      const rightBrace = document.createElement('span');
      rightBrace.textContent = '}}';
      rightBrace.contentEditable = 'false';
      rightBrace.style.userSelect = 'none';

      // 组装 DOM 结构
      container.appendChild(leftBrace);
      container.appendChild(span);
      container.appendChild(rightBrace);

      // 添加点击事件处理，支持在节点前后放置光标
      container.addEventListener('mousedown', (e) => {
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos === null || pos === undefined) return;

        const target = e.target as HTMLElement | null;

        // 如果点击的是大括号元素或变量节点本身，需要特殊处理
        if (target === leftBrace || target === rightBrace || target === span) {
          const { state, dispatch } = editor.view;
          const rect = container.getBoundingClientRect();
          const clickX = e.clientX;

          // 判断点击位置：左大括号区域放在节点前，右大括号区域放在节点后
          const clickOffset = clickX - rect.left;
          const leftBraceWidth = leftBrace.getBoundingClientRect().width;
          const spanWidth = span.getBoundingClientRect().width;

          let targetPos: number;
          if (clickOffset < leftBraceWidth) {
            // 点击在左大括号区域
            targetPos = pos;
          } else if (clickOffset < leftBraceWidth + spanWidth) {
            // 点击在变量节点区域，根据位置决定
            const spanOffset = clickOffset - leftBraceWidth;
            targetPos = spanOffset < spanWidth / 2 ? pos : pos + node.nodeSize;
          } else {
            // 点击在右大括号区域
            targetPos = pos + node.nodeSize;
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

      return {
        dom: container,
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
