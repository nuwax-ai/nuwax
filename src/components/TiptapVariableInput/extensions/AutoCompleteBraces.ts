/*
 * Auto Complete Braces Extension
 * 自动补全大括号扩展
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

/**
 * Auto Complete Braces 扩展
 * 当输入 { 时自动补全为 {} 并将光标放在中间
 */
export const AutoCompleteBraces = Extension.create({
  name: 'autoCompleteBraces',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('autoCompleteBraces'),
        props: {
          handleKeyDown: (view, event) => {
            // 只处理 { 键
            if (event.key !== '{') {
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

            // 插入 { 和 }
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
