/*
 * Variable Cursor Placeholder Extension
 * 变量光标占位符扩展，确保光标可以在变量节点前后停留
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

/**
 * Variable Cursor Placeholder 扩展
 * 通过拦截光标移动事件，确保光标可以在变量节点前后停留
 */
export const VariableCursorPlaceholder = Extension.create({
  name: 'variableCursorPlaceholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableCursorPlaceholder'),
        props: {
          // 拦截键盘事件，处理左右箭头键在变量节点前后的移动
          handleKeyDown: (view, event) => {
            const { state, dispatch } = view;
            const { selection } = state;
            const { $from, empty } = selection;

            // 只处理左右箭头键
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
              return false;
            }

            // 检查是否在变量节点附近（考虑零宽度空格）
            const checkVariableNode = (
              pos: number,
              direction: 'left' | 'right',
            ) => {
              const resolvedPos = state.doc.resolve(pos);
              const nodeBefore = resolvedPos.nodeBefore;
              const nodeAfter = resolvedPos.nodeAfter;

              // 检查前一个节点是否是变量节点
              if (
                direction === 'left' &&
                nodeBefore &&
                (nodeBefore.type.name === 'variable' ||
                  nodeBefore.type.name === 'editableVariable')
              ) {
                const nodeStart = resolvedPos.pos - nodeBefore.nodeSize;
                // 如果光标在节点后的零宽度空格位置，移动到节点前
                if (pos === resolvedPos.pos) {
                  return {
                    isAtVariable: true,
                    nodePos: nodeStart,
                    nodeSize: nodeBefore.nodeSize,
                  };
                }
              }

              // 检查后一个节点是否是变量节点
              if (
                direction === 'right' &&
                nodeAfter &&
                (nodeAfter.type.name === 'variable' ||
                  nodeAfter.type.name === 'editableVariable')
              ) {
                const nodeStart = resolvedPos.pos;
                const nodeEnd = nodeStart + nodeAfter.nodeSize;
                // 如果光标在节点前的零宽度空格位置，移动到节点后
                if (pos === nodeStart) {
                  return {
                    isAtVariable: true,
                    nodePos: nodeEnd,
                    nodeSize: nodeAfter.nodeSize,
                  };
                }
              }

              return { isAtVariable: false };
            };

            if (event.key === 'ArrowLeft' && empty) {
              // 向左移动
              const currentPos = $from.pos;
              const check = checkVariableNode(currentPos, 'left');

              if (check.isAtVariable) {
                // 如果光标在变量节点后，移动到节点前
                const targetPos = check.nodePos!;
                if (targetPos >= 0 && targetPos <= state.doc.content.size) {
                  const selection = TextSelection.create(state.doc, targetPos);
                  const tr = state.tr.setSelection(selection);
                  dispatch(tr);
                  event.preventDefault();
                  return true;
                }
              }
            }

            if (event.key === 'ArrowRight' && empty) {
              // 向右移动
              const currentPos = $from.pos;
              const check = checkVariableNode(currentPos, 'right');

              if (check.isAtVariable) {
                // 如果光标在变量节点前，移动到节点后
                const targetPos = check.nodePos!;
                if (targetPos >= 0 && targetPos <= state.doc.content.size) {
                  const selection = TextSelection.create(state.doc, targetPos);
                  const tr = state.tr.setSelection(selection);
                  dispatch(tr);
                  event.preventDefault();
                  return true;
                }
              }
            }

            return false;
          },
          // 移除 handleClick，因为节点视图已经处理了点击事件
          // 如果在这里也处理，可能会与节点视图的事件处理冲突，导致光标无法聚焦
          // handleClick: (view, pos, event) => {
          //   // 由节点视图处理点击事件
          //   return false;
          // },
        },
      }),
    ];
  },
});
