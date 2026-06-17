/*
 * Variable Text Decoration Extension
 * 变量文本装饰扩展 - 方案C：普通文本 + CSS类名
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * VariableTextDecoration 扩展
 * 自动检测文本中的 {{variable}} 模式并应用CSS类
 * 优点：完全的普通文本，没有节点边界，光标自然移动，无跳字
 */
export const VariableTextDecoration = Extension.create({
  name: 'variableTextDecoration',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableTextDecoration'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            // 遍历文档中的所有文本节点
            doc.descendants((node, pos) => {
              if (!node.isText || !node.text) {
                return;
              }

              const text = node.text;
              // 匹配 {{xxx}} 模式
              const regex = /\{\{([^}]+)\}\}/g;
              let match;

              while ((match = regex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;

                // 创建装饰，应用 CSS 类
                decorations.push(
                  Decoration.inline(start, end, {
                    class: 'variable-text-decoration',
                    'data-variable-key': match[1], // 保存变量名
                  }),
                );
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
