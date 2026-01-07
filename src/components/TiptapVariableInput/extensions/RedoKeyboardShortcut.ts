/**
 * Redo Keyboard Shortcut Extension
 *
 * 为 Tiptap 编辑器添加 Mod+Y (Ctrl+Y / Cmd+Y) 作为重做快捷键
 * Tiptap 默认只支持 Mod+Shift+Z，这个扩展添加了 Mod+Y 支持
 */

import { Extension } from '@tiptap/core';

export const RedoKeyboardShortcut = Extension.create({
  name: 'redoKeyboardShortcut',

  addKeyboardShortcuts() {
    return {
      // 添加 Mod+Y 作为重做快捷键
      // Mod 在 Mac 上是 Cmd，在 Windows/Linux 上是 Ctrl
      'Mod-y': () => this.editor.commands.redo(),
    };
  },
});

export default RedoKeyboardShortcut;
