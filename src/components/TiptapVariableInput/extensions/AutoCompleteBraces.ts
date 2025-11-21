/*
 * Auto Complete Braces Extension
 * 自动补全大括号扩展
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

/**
 * Auto Complete Braces 扩展
 * 当输入 { 时自动补全为 {}，并将光标放在中间
 * 注意：只在没有字符前缀时自动补全，有字符前缀时让 VariableSuggestion 处理
 */
export const AutoCompleteBraces = Extension.create({
  name: 'autoCompleteBraces',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoCompleteBraces'),
        props: {
          handleTextInput: (view, from, to, text) => {
            // 只处理 { 字符
            if (text !== '{') {
              return false;
            }

            const { state, dispatch } = view;
            const { selection } = state;
            const { $from } = selection;

            // 检查是否在可编辑区域
            if (!$from.parent.isTextblock) {
              return false;
            }

            // 检查下一个字符是否是 }，如果是则不处理（避免重复）
            const nextChar = $from.nodeAfter?.text?.[0];
            if (nextChar === '}') {
              return false;
            }

            // 检查光标前的字符
            const textBefore = $from.parent.textContent.slice(
              0,
              $from.parentOffset,
            );
            const lastChar = textBefore[textBefore.length - 1];

            // 如果光标前有非空白字符，不自动补全，让 VariableSuggestion 处理
            // 这样既能触发变量引用，又能在选择变量后自动补全 }
            if (lastChar && lastChar.trim() !== '') {
              // 不处理，让默认行为插入 {，然后让 Suggestion 处理
              return false;
            }

            // 如果光标前是空白或行首，自动补全 {}
            // 注意：Suggestion 插件会在事务应用后检测触发字符
            // 由于我们插入了 {}，Suggestion 应该能够检测到 { 并触发
            // query 可能是空字符串或 }，VariableSuggestion 的 items 函数已经处理了这种情况
            const tr = state.tr.insertText('{}', $from.pos);

            // 将光标放在 { 和 } 之间
            const newPos = $from.pos + 1;
            tr.setSelection(TextSelection.create(tr.doc, newPos));

            dispatch(tr);

            return true;
          },
        },
      }),
    ];
  },
});
