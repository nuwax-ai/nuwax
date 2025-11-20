/*
 * Variable Suggestion Extension
 * { 变量自动补全配置
 */

import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import ReactDOM from 'react-dom/client';
import type { VariableTreeNode } from '../../VariableInferenceInput/types';
import VariableList from '../components/VariableList';
import type { VariableSuggestionItem } from '../types';

export interface VariableSuggestionOptions {
  variables: VariableTreeNode[];
  searchText?: string;
  onSelect?: (item: VariableSuggestionItem) => void;
}

/**
 * Variable Suggestion 扩展
 * 配置 { 触发变量自动补全
 */
export const VariableSuggestion = Extension.create<VariableSuggestionOptions>({
  name: 'variableSuggestion',

  addOptions() {
    return {
      variables: [],
      searchText: '',
      onSelect: undefined,
    };
  },

  addProseMirrorPlugins() {
    const suggestionPlugin = Suggestion({
      editor: this.editor,
      char: '{',
      allowSpaces: false, // 变量名中不允许空格
      startOfLine: false, // 不要求必须在行首
      pluginKey: new PluginKey('variableSuggestion'), // 使用唯一的 key
      // 不设置 allowedPrefixes，默认允许所有字符作为前缀
      items: ({ query }) => {
        const variables = this.options.variables || [];

        // 调试：检查变量数据
        console.log('VariableSuggestion items - variables:', variables);
        console.log(
          'VariableSuggestion items - variables length:',
          variables.length,
        );
        console.log('VariableSuggestion items - query:', query);

        // 如果没有查询文本，返回完整的变量树（包括常规变量和工具）
        if (!query) {
          console.log(
            'VariableSuggestion items - returning all variables:',
            variables,
          );
          return variables;
        }

        // 过滤变量树
        const filterTree = (nodes: VariableTreeNode[]): VariableTreeNode[] => {
          const queryLower = query.toLowerCase();
          return nodes
            .map((node) => {
              const matches =
                node.label.toLowerCase().includes(queryLower) ||
                node.value.toLowerCase().includes(queryLower);

              const filteredChildren = node.children
                ? filterTree(node.children)
                : [];

              if (matches || filteredChildren.length > 0) {
                return {
                  ...node,
                  children: filteredChildren,
                };
              }
              return null;
            })
            .filter(Boolean) as VariableTreeNode[];
        };

        const filtered = filterTree(variables);
        console.log('VariableSuggestion items - filtered result:', filtered);
        return filtered;
      },
      render: () => {
        let popup: any;

        return {
          onStart: (props: any) => {
            const { items, query, command } = props;

            // 调试：检查 items 数据
            console.log('VariableSuggestion onStart - props:', props);
            console.log('VariableSuggestion onStart - items:', items);
            console.log(
              'VariableSuggestion onStart - items length:',
              items?.length,
            );
            console.log(
              'VariableSuggestion onStart - items type:',
              Array.isArray(items) ? 'array' : typeof items,
            );

            // 创建容器
            const container = document.createElement('div');
            container.className = 'variable-suggestion-popup';
            document.body.appendChild(container);

            // 创建 React 根
            const root = ReactDOM.createRoot(container);

            // 将树节点扁平化为可选择的项列表（所有节点都可以选择）
            const flattenTree = (
              nodes: VariableTreeNode[],
            ): VariableSuggestionItem[] => {
              const result: VariableSuggestionItem[] = [];

              // 调试：检查输入节点
              console.log('flattenTree - input nodes:', nodes);
              console.log('flattenTree - input nodes length:', nodes?.length);

              if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
                console.warn('flattenTree - empty or invalid nodes');
                return result;
              }

              for (const node of nodes) {
                if (!node) continue;

                // 所有节点都可以选择（包括非叶子节点）
                // 检查是否是工具：工具的 key 以 'skill-' 开头，或者 variable.type 是 'Tool'（通过 as any 设置）
                const isTool =
                  (node.isLeaf && node.key.startsWith('skill-')) ||
                  (node.isLeaf && (node.variable as any)?.type === 'Tool');

                result.push({
                  key: node.key,
                  label: node.label,
                  value: node.value,
                  node: node,
                  isTool: isTool && node.isLeaf, // 只有叶子节点才能是工具
                  toolData:
                    isTool && node.isLeaf
                      ? (node.variable as any)?.value
                      : undefined,
                });

                // 递归处理子节点
                if (node.children && node.children.length > 0) {
                  result.push(...flattenTree(node.children));
                }
              }

              console.log('flattenTree - result:', result);
              console.log('flattenTree - result length:', result.length);
              return result;
            };

            // 创建状态对象
            // 确保 items 是数组
            const treeItems = Array.isArray(items) ? items : [];
            console.log('onStart - treeItems:', treeItems);
            console.log('onStart - treeItems length:', treeItems.length);

            const state = {
              selectedIndex: 0,
              currentTree: treeItems,
              flatItems: flattenTree(treeItems),
            };

            console.log('onStart - state:', state);

            // 先定义 handleKeyDown 的引用，稍后定义
            let handleKeyDownRef: ((event: KeyboardEvent) => void) | null =
              null;

            // 定义 handleSelect
            const handleSelect = (item: VariableSuggestionItem) => {
              if (item.isTool && item.toolData) {
                // 技能插入 - 使用 toolBlock 节点
                const id = item.toolData.typeId || item.toolData.id;
                const type = item.toolData.type || 'undefined';
                const name = item.toolData.name;
                const content = item.toolData.toolName || item.toolData.name;

                command({
                  type: 'toolBlock',
                  attrs: {
                    id,
                    type,
                    name,
                    content,
                  },
                });
              } else {
                // 变量插入
                command({
                  key: item.key,
                  label: item.label,
                  isTool: false,
                });
              }

              // 清理
              try {
                root.unmount();
              } catch (e) {
                // 忽略卸载错误
              }
              if (document.body.contains(container)) {
                document.body.removeChild(container);
              }
              if (handleKeyDownRef) {
                document.removeEventListener('keydown', handleKeyDownRef);
              }
              popup = null;
              this.options.onSelect?.(item);
            };

            // 定义 updateRender，使用已定义的 handleSelect
            const updateRender = () => {
              console.log('updateRender called');
              console.log(
                'updateRender - container exists:',
                document.body.contains(container),
              );
              console.log('updateRender - popup exists:', !!popup);
              console.log(
                'updateRender - popup.root === root:',
                popup?.root === root,
              );

              // 检查容器是否仍然存在且根没有被卸载
              if (
                document.body.contains(container) &&
                popup &&
                popup.root === root
              ) {
                try {
                  console.log(
                    'updateRender - state.currentTree:',
                    state.currentTree,
                  );
                  console.log(
                    'updateRender - state.currentTree length:',
                    state.currentTree?.length,
                  );
                  console.log(
                    'updateRender - state.flatItems:',
                    state.flatItems,
                  );
                  console.log(
                    'updateRender - state.flatItems length:',
                    state.flatItems?.length,
                  );

                  console.log('updateRender - about to render VariableList');
                  root.render(
                    <VariableList
                      tree={state.currentTree}
                      selectedIndex={state.selectedIndex}
                      onSelect={handleSelect}
                      searchText={query}
                      flatItems={state.flatItems}
                    />,
                  );
                  console.log(
                    'updateRender - VariableList rendered successfully',
                  );
                } catch (error) {
                  // 如果根已经被卸载，忽略错误
                  console.error('updateRender - render error:', error);
                }
              } else {
                console.warn(
                  'updateRender - conditions not met, skipping render',
                );
              }
            };

            // 定义 handleKeyDown，使用已定义的 updateRender 和 handleSelect
            const handleKeyDown = (event: KeyboardEvent) => {
              // 检查 popup 是否仍然有效
              if (!popup || !document.body.contains(container)) {
                if (handleKeyDownRef) {
                  document.removeEventListener('keydown', handleKeyDownRef);
                }
                return;
              }

              if (event.key === 'ArrowDown') {
                event.preventDefault();
                state.selectedIndex = Math.min(
                  state.selectedIndex + 1,
                  state.flatItems.length - 1,
                );
                updateRender();
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
                updateRender();
              } else if (event.key === 'Enter') {
                event.preventDefault();
                if (state.flatItems[state.selectedIndex]) {
                  handleSelect(state.flatItems[state.selectedIndex]);
                }
              } else if (event.key === 'Escape') {
                event.preventDefault();
                try {
                  root.unmount();
                } catch (e) {
                  // 忽略卸载错误
                }
                if (document.body.contains(container)) {
                  document.body.removeChild(container);
                }
                if (handleKeyDownRef) {
                  document.removeEventListener('keydown', handleKeyDownRef);
                }
                popup = null;
              }
            };

            // 定位弹窗
            const updatePosition = () => {
              const { range } = props;
              if (!range) return;

              const coords = this.editor.view.coordsAtPos(range.from);
              if (coords) {
                container.style.position = 'fixed';
                container.style.left = `${coords.left}px`;
                container.style.top = `${coords.top + 20}px`;
                container.style.zIndex = '9999';
                container.style.background = '#fff';
                container.style.border = '1px solid #d9d9d9';
                container.style.borderRadius = '8px';
                container.style.boxShadow =
                  '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)';
                container.style.maxWidth = '300px';
                container.style.maxHeight = '240px';
                container.style.overflow = 'auto';
              }
            };

            // 保存 handleKeyDown 的引用
            handleKeyDownRef = handleKeyDown;
            document.addEventListener('keydown', handleKeyDown);

            // 先创建 popup 对象，然后再调用 updateRender
            popup = {
              container,
              root,
              handleKeyDown,
              updatePosition,
              state,
              updateRender,
            };

            // 定位弹窗
            updatePosition();

            // 渲染列表
            console.log('onStart - about to render');
            console.log('onStart - state:', state);
            console.log(
              'onStart - container exists:',
              document.body.contains(container),
            );
            console.log('onStart - root exists:', root);
            console.log('onStart - popup created:', popup);

            // 直接渲染组件（不通过 updateRender，因为 popup 可能还没完全初始化）
            try {
              console.log('onStart - directly rendering VariableList');
              console.log('onStart - state.currentTree:', state.currentTree);
              console.log(
                'onStart - state.currentTree length:',
                state.currentTree?.length,
              );

              root.render(
                <VariableList
                  tree={state.currentTree}
                  selectedIndex={state.selectedIndex}
                  onSelect={handleSelect}
                  searchText={query}
                  flatItems={state.flatItems}
                />,
              );
              console.log('onStart - VariableList rendered successfully');
            } catch (error) {
              console.error('onStart - render error:', error);
            }

            // 也调用 updateRender（现在 popup 已经创建）
            updateRender();
          },
          onUpdate: (props: any) => {
            if (
              popup &&
              popup.state &&
              popup.container &&
              document.body.contains(popup.container)
            ) {
              const { items } = props;

              // 重新扁平化树节点（所有节点都可以选择）
              const flattenTree = (
                nodes: VariableTreeNode[],
              ): VariableSuggestionItem[] => {
                const result: VariableSuggestionItem[] = [];
                for (const node of nodes) {
                  // 所有节点都可以选择（包括非叶子节点）
                  // 检查是否是工具：工具的 key 以 'skill-' 开头，或者 variable.type 是 'Tool'（通过 as any 设置）
                  const isTool =
                    (node.isLeaf && node.key.startsWith('skill-')) ||
                    (node.isLeaf && (node.variable as any)?.type === 'Tool');

                  result.push({
                    key: node.key,
                    label: node.label,
                    value: node.value,
                    node: node,
                    isTool: isTool && node.isLeaf, // 只有叶子节点才能是工具
                    toolData:
                      isTool && node.isLeaf
                        ? (node.variable as any)?.value
                        : undefined,
                  });

                  // 递归处理子节点
                  if (node.children) {
                    result.push(...flattenTree(node.children));
                  }
                }
                return result;
              };

              popup.state.currentTree = items;
              popup.state.flatItems = flattenTree(items);
              // 重置选中索引，确保不超出范围
              popup.state.selectedIndex = Math.min(
                popup.state.selectedIndex,
                popup.state.flatItems.length - 1,
              );
              if (popup.state.selectedIndex < 0) {
                popup.state.selectedIndex = 0;
              }

              // 安全地更新渲染
              try {
                popup.updateRender();
                popup.updatePosition();
              } catch (error) {
                // 如果根已经被卸载，清理 popup
                console.warn('Cannot update unmounted root:', error);
                if (popup.root) {
                  try {
                    popup.root.unmount();
                  } catch (e) {
                    // 忽略卸载错误
                  }
                }
                if (document.body.contains(popup.container)) {
                  document.body.removeChild(popup.container);
                }
                popup = null;
              }
            }
          },
          onKeyDown: (props: any) => {
            // 键盘导航已经在 handleKeyDown 中处理
            // 这里只处理 ESC 键的额外处理
            if (props.event.key === 'Escape') {
              if (popup && popup.handleKeyDown) {
                // handleKeyDown 会处理清理工作
                return true;
              }
            }
            return false;
          },
          onExit: () => {
            if (popup) {
              try {
                popup.root.unmount();
              } catch (e) {
                // 忽略卸载错误
              }
              if (popup.container && document.body.contains(popup.container)) {
                document.body.removeChild(popup.container);
              }
              if (popup.handleKeyDown) {
                document.removeEventListener('keydown', popup.handleKeyDown);
              }
              popup = null;
            }
          },
        };
      },
      command: ({ editor, range, props }: any) => {
        if (props.type === 'toolBlock') {
          // 插入工具块节点
          let { from, to } = range;

          // 检查是否需要包含 }，如果下一个字符是 }，则扩展 range
          const { state } = editor.view;
          const doc = state.doc;
          const nextChar = doc.textBetween(to, to + 1);
          if (nextChar === '}') {
            to = to + 1; // 包含 }
          }

          // 删除 {} 并插入工具块节点
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent({
              type: 'toolBlock',
              attrs: props.attrs,
            })
            .run();

          // 将光标移动到节点末尾
          setTimeout(() => {
            const currentPos = editor.state.selection.from;
            editor.commands.setTextSelection(currentPos);
          }, 0);
        } else {
          // 插入变量节点 - 与工具块完全相同的逻辑
          let { from, to } = range;

          // 检查是否需要包含 }，如果下一个字符是 }，则扩展 range
          const { state } = editor.view;
          const doc = state.doc;
          const nextChar = doc.textBetween(to, to + 1);
          if (nextChar === '}') {
            to = to + 1; // 包含 }
          }

          // 删除 {} 并插入变量节点（与工具块完全相同的逻辑）
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent({
              type: 'variable',
              attrs: {
                key: props.key,
                label: props.label,
                isTool: false,
              },
            })
            .run();

          // 将光标移动到节点末尾
          setTimeout(() => {
            const currentPos = editor.state.selection.from;
            editor.commands.setTextSelection(currentPos);
          }, 0);
        }
      },
    });

    // 直接返回 Suggestion 插件，它已经配置了唯一的 pluginKey
    return [suggestionPlugin];
  },
});
