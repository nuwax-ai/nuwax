/*
 * Markdown Syntax Highlight Extension
 * 为 Markdown 语法提供高亮显示（颜色），但不改变文本结构
 * 注意：此扩展只提供视觉高亮，不会将 Markdown 转换为 HTML 结构
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * 检查位置是否在变量节点内
 * @param state ProseMirror 状态
 * @param pos 位置
 * @returns 是否在变量节点内
 */
function isInVariableNode(state: any, pos: number): boolean {
  const $pos = state.doc.resolve(pos);
  // 检查是否在 variable-block-chip 节点内
  for (let i = $pos.depth; i > 0; i--) {
    const node = $pos.node(i);
    if (node.type.name === 'variableNode') {
      return true;
    }
  }
  return false;
}

/**
 * 检查位置是否在工具块节点内
 * @param state ProseMirror 状态
 * @param pos 位置
 * @returns 是否在工具块节点内
 */
function isInToolBlockNode(state: any, pos: number): boolean {
  const $pos = state.doc.resolve(pos);
  for (let i = $pos.depth; i > 0; i--) {
    const node = $pos.node(i);
    if (node.type.name === 'toolBlockNode') {
      return true;
    }
  }
  return false;
}

export const MarkdownHighlight = Extension.create({
  name: 'markdownHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            // 用于跟踪已装饰的位置，避免重复装饰
            const decoratedRanges = new Set<string>();

            doc.descendants((node, pos) => {
              // 只处理文本节点
              if (!node.isText) {
                return;
              }

              const text = node.text || '';
              if (!text) {
                return;
              }

              // 检查是否在变量节点或工具块节点内，如果是则跳过
              if (
                isInVariableNode(state, pos) ||
                isInToolBlockNode(state, pos)
              ) {
                return;
              }

              let match: RegExpExecArray | null;

              // 1. Headers (# H1, ## H2, etc.)
              // 匹配行首的 # 号，后面必须跟空格
              const headerRegex = /^(#{1,6})\s+/gm;
              while ((match = headerRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  // 高亮 # 号标记
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-header-mark',
                    }),
                  );
                  // 高亮整行标题文本（从 # 号到行尾）
                  const lineEnd = Math.min(
                    pos + text.length,
                    start + text.length,
                  );
                  decorations.push(
                    Decoration.inline(start, lineEnd, {
                      class: 'md-header-text',
                    }),
                  );
                }
              }

              // 2. Bold (**text** or __text__)
              // 注意：避免匹配到变量中的 {{ 或 }}
              const boldRegex = /(\*\*|__)(?![{])[^*_\n]*(?<![}])\1/g;
              while ((match = boldRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                // 确保不匹配到变量语法 {{ 或 }}
                const matchText = match[0];
                if (matchText.includes('{{') || matchText.includes('}}')) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-bold',
                    }),
                  );
                }
              }

              // 3. Italic (*text* or _text_)
              // 注意：避免匹配到 bold 和变量语法
              // 先匹配所有可能的斜体模式，然后过滤掉 bold 的情况
              const italicStarRegex = /\*([^*\n]+?)\*/g;
              while ((match = italicStarRegex.exec(text)) !== null) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;

                // 检查前后字符，确保不是 bold 的一部分
                const prevChar = matchStart > 0 ? text[matchStart - 1] : '';
                const nextChar = matchEnd < text.length ? text[matchEnd] : '';

                // 如果前后都是 *，说明是 bold，跳过
                if (prevChar === '*' || nextChar === '*') {
                  continue;
                }

                const start = pos + matchStart;
                const end = pos + matchEnd;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                // 确保不匹配到变量语法
                const matchText = match[0];
                if (matchText.includes('{{') || matchText.includes('}}')) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-italic',
                    }),
                  );
                }
              }

              // 匹配 _text_ 格式的斜体
              const italicUnderscoreRegex = /_([^_\n]+?)_/g;
              while ((match = italicUnderscoreRegex.exec(text)) !== null) {
                const matchStart = match.index;
                const matchEnd = matchStart + match[0].length;

                // 检查前后字符，确保不是 bold 的一部分
                const prevChar = matchStart > 0 ? text[matchStart - 1] : '';
                const nextChar = matchEnd < text.length ? text[matchEnd] : '';

                // 如果前后都是 _，说明是 bold，跳过
                if (prevChar === '_' || nextChar === '_') {
                  continue;
                }

                const start = pos + matchStart;
                const end = pos + matchEnd;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                // 确保不匹配到变量语法
                const matchText = match[0];
                if (matchText.includes('{{') || matchText.includes('}}')) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-italic',
                    }),
                  );
                }
              }

              // 4. Inline Code (`text`)
              // 注意：避免匹配到变量中的 { 或 }
              const codeRegex = /`([^`\n]+?)`/g;
              while ((match = codeRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                // 确保不匹配到变量语法
                const matchText = match[0];
                if (matchText.includes('{{') || matchText.includes('}}')) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-code',
                    }),
                  );
                }
              }

              // 5. Lists (- item, * item, 1. item)
              // 匹配行首的列表标记
              const listRegex = /^(\s*)([-*+]|\d+\.)\s+/gm;
              while ((match = listRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-list-mark',
                    }),
                  );
                }
              }

              // 6. Blockquote (> quote)
              // 匹配行首的 > 号
              const quoteRegex = /^(\s*>\s+)/gm;
              while ((match = quoteRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  // 高亮 > 标记
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-quote-mark',
                    }),
                  );
                  // 高亮整行引用文本
                  const lineEnd = Math.min(
                    pos + text.length,
                    start + text.length,
                  );
                  decorations.push(
                    Decoration.inline(start, lineEnd, {
                      class: 'md-quote-text',
                    }),
                  );
                }
              }

              // 7. Links ([text](url))
              const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
              while ((match = linkRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                // 确保不匹配到变量语法
                const matchText = match[0];
                if (matchText.includes('{{') || matchText.includes('}}')) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-link',
                    }),
                  );
                }
              }

              // 8. Strikethrough (~~text~~)
              const strikethroughRegex = /~~([^~\n]+?)~~/g;
              while ((match = strikethroughRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const key = `${start}-${end}`;

                // 检查是否在变量节点内
                if (
                  isInVariableNode(state, start) ||
                  isInToolBlockNode(state, start)
                ) {
                  continue;
                }

                if (!decoratedRanges.has(key)) {
                  decoratedRanges.add(key);
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'md-strikethrough',
                    }),
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
