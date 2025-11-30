/*
 * Variable Suggestion Extension
 * { 变量自动补全配置
 */

import { Extension } from '@tiptap/core';
import { PluginKey, TextSelection } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { ConfigProvider } from 'antd';
import { createRoot } from 'react-dom/client';
import VariableList from '../components/VariableList';
import type { VariableSuggestionItem, VariableTreeNode } from '../types';

export interface VariableSuggestionOptions {
  variables: VariableTreeNode[];
  searchText?: string;
  onSelect?: (item: VariableSuggestionItem) => void;
  /** 是否启用可编辑变量节点，默认开启 */
  enableEditableVariables?: boolean;
  /** 变量实现模式: 'node' | 'mark' | 'text'，默认 'text' */
  variableMode?: 'node' | 'mark' | 'text';
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
      enableEditableVariables: true, // 默认开启可编辑模式
      variableMode: 'text', // 默认使用纯文本模式（方案C）
    };
  },

  addProseMirrorPlugins() {
    // 辅助函数：截断 query，以 } 或空格为分隔符
    const truncateQuery = (query: string): string => {
      if (!query) return '';

      // 如果以 } 开头，返回空字符串（自动补全情况）
      if (query.startsWith('}')) return '';

      // 查找 } 和空格的位置
      const braceIndex = query.indexOf('}');
      const spaceIndex = query.indexOf(' ');

      // 如果两者都不存在，返回原 query
      if (braceIndex === -1 && spaceIndex === -1) {
        return query;
      }

      // 如果两者都存在，取较小的索引
      if (braceIndex !== -1 && spaceIndex !== -1) {
        return query.substring(0, Math.min(braceIndex, spaceIndex));
      }

      // 如果只有 }，截断到 }
      if (braceIndex !== -1) {
        return query.substring(0, braceIndex);
      }

      // 如果只有空格，截断到空格
      if (spaceIndex !== -1) {
        return query.substring(0, spaceIndex);
      }

      return query;
    };

    const suggestionPlugin = Suggestion({
      editor: this.editor,
      char: '{',
      allowSpaces: false, // 变量名中不允许空格
      startOfLine: false, // 不要求必须在行首
      pluginKey: new PluginKey('variableSuggestion'), // 使用唯一的 key
      // 设置 allowedPrefixes 为 null，允许任何字符作为前缀
      // 默认值是 [' ']，只允许空格作为前缀
      // 设置为 null 表示允许所有字符作为前缀，这样 "121212{" 也能触发
      allowedPrefixes: null, // null 表示允许所有字符作为前缀
      allow: ({ state }) => {
        // 检查光标位置，避免在特定情况下显示建议框
        const { $from } = state.selection;

        // 扩大检查范围，检查光标前最多100个字符，以检测是否有未闭合的变量引用
        const checkRange = 100;
        const startPos = Math.max(0, $from.pos - checkRange);
        const textBefore = state.doc.textBetween(
          startPos,
          $from.pos,
          '\n',
          '\n',
        );
        const textAfter = state.doc.textBetween(
          $from.pos,
          Math.min(state.doc.content.size, $from.pos + 2),
          '\n',
          '\n',
        );

        // 如果光标前一个字符是 } 或前两个字符是 }}，不显示
        if (textBefore.endsWith('}') || textBefore.endsWith('}}')) {
          return false;
        }

        // 检查光标前是否有已完成的变量引用（{{...}}）
        // 从后向前查找，找到最后一个 }} 的位置
        const lastClosingBrace = textBefore.lastIndexOf('}}');
        if (lastClosingBrace !== -1) {
          // 找到了 }}，检查它之后是否还有未闭合的 {{
          const afterClosingBrace = textBefore.substring(lastClosingBrace + 2);
          const hasUnclosedOpening = afterClosingBrace.indexOf('{{') !== -1;

          // 如果 }} 之后没有 {{，说明当前光标在一个已完成的变量引用之后，不应该触发
          if (!hasUnclosedOpening) {
            return false;
          }
        }

        // 如果光标后一个字符是 { 或后两个字符是 {{，不显示
        if (textAfter.startsWith('{') || textAfter.startsWith('{{')) {
          return false;
        }

        return true;
      },
      items: ({ query }) => {
        // 从 options 获取最新的 variables（支持动态更新）
        const variables = this.options.variables || [];

        // 简化逻辑：只要出现 { 就显示变量引用框
        // 1. 如果 query 为空（刚输入 {），返回所有变量
        // 2. 如果 query 以 } 开头（自动补全 {} 的情况），返回所有变量
        // 3. 如果 query 有内容，以 } 或空格截断，只取第一部分进行搜索
        if (!query || query.trim() === '' || query.startsWith('}')) {
          // 返回完整的变量树，显示所有变量
          return Array.isArray(variables) && variables.length > 0
            ? variables
            : [];
        }

        // 截断 query：以 } 或空格为分隔符，只取第一部分
        const searchQuery = truncateQuery(query);

        // 如果截断后为空，返回所有变量
        if (!searchQuery || searchQuery.trim() === '') {
          return Array.isArray(variables) && variables.length > 0
            ? variables
            : [];
        }

        // 有查询文本时，进行搜索过滤
        const queryLower = searchQuery.toLowerCase();
        const filterTree = (nodes: VariableTreeNode[]): VariableTreeNode[] => {
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

        return filterTree(variables);
      },
      render: () => {
        let popup: any;

        return {
          onStart: (props: any) => {
            const { items, query, command } = props;

            // 截断 query，以 } 或空格为分隔符
            const searchText = truncateQuery(query || '');

            // 创建容器
            const container = document.createElement('div');
            container.className = 'variable-suggestion-popup';
            // 确保容器能够访问到 CSS 变量（CSS 变量定义在 document.documentElement 上，是全局的）
            document.body.appendChild(container);

            // 创建 React 18 root
            const root = createRoot(container);

            // Portal ID
            const portalId = `variable-suggestion-${Date.now()}-${Math.random()}`;

            // 获取编辑器 DOM 元素（用于排除点击外部检测）
            // 在组件外部获取，确保引用稳定
            const editorDom = (this.editor?.view?.dom as HTMLElement) || null;

            // 将树节点扁平化为可选择的项列表（所有节点都可以选择）
            const flattenTree = (
              nodes: VariableTreeNode[],
            ): VariableSuggestionItem[] => {
              const result: VariableSuggestionItem[] = [];

              if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
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

              return result;
            };

            // 分离变量和工具
            const separateVariables = (nodes: VariableTreeNode[]) => {
              const regularVars: VariableTreeNode[] = [];
              const toolVars: VariableTreeNode[] = [];

              // 检查是否有 "category-skills" 节点
              const skillsCategory = nodes.find(
                (n) => n.key === 'category-skills',
              );

              if (skillsCategory) {
                // 如果有技能分类，它的子节点是工具，其他节点是普通变量
                toolVars.push(...(skillsCategory.children || []));
                regularVars.push(
                  ...nodes.filter((n) => n.key !== 'category-skills'),
                );
              } else {
                // 如果没有明确的分类，尝试根据 key 或 type 判断
                // 检查节点是否是工具（key 以 'skill-' 开头或 type 是 'Tool'）
                for (const node of nodes) {
                  const isTool =
                    node.key.startsWith('skill-') ||
                    (node.variable as any)?.type === 'Tool';
                  if (isTool) {
                    toolVars.push(node);
                  } else {
                    regularVars.push(node);
                  }
                }
              }

              return { regularVars, toolVars };
            };

            const { regularVars, toolVars } = separateVariables(items);
            const hasRegular = regularVars.length > 0;
            const hasTools = toolVars.length > 0;
            const showTabs = hasRegular && hasTools;

            // 初始 activeTab
            let activeTab = 'variables';
            if (!hasRegular && hasTools) {
              activeTab = 'tools';
            }

            // 根据 activeTab 获取当前显示的树
            const getCurrentTree = (
              tab: string,
              rVars: VariableTreeNode[],
              tVars: VariableTreeNode[],
            ) => {
              if (showTabs) {
                return tab === 'variables' ? rVars : tVars;
              }
              return items; // 如果不显示 tab，显示所有
            };

            // 初始 flatItems
            let flatItems = flattenTree(
              getCurrentTree(activeTab, regularVars, toolVars),
            );

            // 先定义 handleKeyDown 的引用，稍后定义
            let handleKeyDownRef: ((event: KeyboardEvent) => void) | null =
              null;

            // 定义关闭下拉框的函数
            const handleClose = () => {
              try {
                // 卸载 React 组件
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
            };

            // 定义 handleSelect
            const handleSelect = (item: VariableSuggestionItem) => {
              try {
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
                  // 根据 enableEditableVariables 配置决定使用可编辑或不可编辑节点
                  const useEditable =
                    this.options.enableEditableVariables !== false; // 默认为 true
                  command({
                    type: useEditable ? 'editableVariable' : 'variable',
                    attrs: {
                      key: item.key,
                      label: item.label,
                    },
                  });
                }
              } catch (error) {
                // 静默处理错误，避免影响用户体验
              } finally {
                // 清理 - 确保总是执行
                handleClose();
                this.options.onSelect?.(item);
              }
            };

            // 定义 updateRender
            const updateRender = (
              selectedIndex: number,
              currentFlatItems: VariableSuggestionItem[],
              currentTree: VariableTreeNode[],
              currentActiveTab: string,
              currentRegularVars: VariableTreeNode[],
              currentToolVars: VariableTreeNode[],
              currentShowTabs: boolean,
              currentSearchText: string,
            ) => {
              if (document.body.contains(container)) {
                try {
                  // 使用 ConfigProvider 包裹，确保主题上下文和 CSS 变量正确应用
                  // 使用 React 18 createRoot API 渲染到容器
                  const content = (
                    <ConfigProvider
                      theme={{
                        cssVar: { prefix: 'xagi' },
                      }}
                    >
                      <VariableList
                        tree={currentTree}
                        selectedIndex={selectedIndex}
                        onSelect={handleSelect}
                        searchText={currentSearchText}
                        flatItems={currentFlatItems}
                        showTabs={currentShowTabs}
                        activeTab={currentActiveTab}
                        onTabChange={(key) => {
                          // 切换 tab
                          activeTab = key;
                          // 更新 popup 状态
                          if (popup) {
                            popup.activeTab = key;
                            const newTree = getCurrentTree(
                              key,
                              currentRegularVars,
                              currentToolVars,
                            );
                            popup.flatItems = flattenTree(newTree);
                            popup.selectedIndex = 0;

                            updateRender(
                              0,
                              popup.flatItems,
                              newTree,
                              key,
                              currentRegularVars,
                              currentToolVars,
                              currentShowTabs,
                              currentSearchText,
                            );
                          }
                        }}
                        regularVariables={currentRegularVars}
                        toolVariables={currentToolVars}
                        onClose={handleClose}
                        excludeElement={editorDom}
                      />
                    </ConfigProvider>
                  );

                  // 使用 React 18 root 渲染
                  root.render(content);
                } catch (error) {
                  // 静默处理错误，避免影响用户体验
                }
              }
            };

            // 初始渲染
            updateRender(
              0,
              flatItems,
              getCurrentTree(activeTab, regularVars, toolVars),
              activeTab,
              regularVars,
              toolVars,
              showTabs,
              searchText,
            );

            // 键盘事件处理
            const handleKeyDown = (event: KeyboardEvent) => {
              // 检查 popup 是否仍然有效
              if (!popup || !document.body.contains(container)) {
                if (handleKeyDownRef) {
                  document.removeEventListener('keydown', handleKeyDownRef);
                }
                return;
              }

              // 如果正在输入中文等 IME 组合键，不处理
              if (event.isComposing) {
                return;
              }

              // 获取最新状态
              const currentFlatItems = popup.flatItems;
              const currentActiveTab = popup.activeTab;
              const currentRegularVars = popup.regularVars;
              const currentToolVars = popup.toolVars;
              const currentShowTabs = popup.showTabs;
              // 注意：这里我们需要最新的 searchText，但它不在 popup 状态中
              // 不过键盘导航不改变 searchText，所以可以使用闭包中的 searchText
              // 或者更好的是，将 searchText 也存入 popup 状态
              const currentSearchText = popup.searchText || searchText;

              if (event.key === 'ArrowUp') {
                event.preventDefault();
                popup.selectedIndex =
                  (popup.selectedIndex - 1 + currentFlatItems.length) %
                  currentFlatItems.length;

                updateRender(
                  popup.selectedIndex,
                  currentFlatItems,
                  getCurrentTree(
                    currentActiveTab,
                    currentRegularVars,
                    currentToolVars,
                  ),
                  currentActiveTab,
                  currentRegularVars,
                  currentToolVars,
                  currentShowTabs,
                  currentSearchText,
                );
                return;
              }

              if (event.key === 'ArrowDown') {
                event.preventDefault();
                popup.selectedIndex =
                  (popup.selectedIndex + 1) % currentFlatItems.length;

                updateRender(
                  popup.selectedIndex,
                  currentFlatItems,
                  getCurrentTree(
                    currentActiveTab,
                    currentRegularVars,
                    currentToolVars,
                  ),
                  currentActiveTab,
                  currentRegularVars,
                  currentToolVars,
                  currentShowTabs,
                  currentSearchText,
                );
                return;
              }

              if (event.key === 'Enter') {
                // 只有当有选中项时才阻止默认行为并执行选择
                if (currentFlatItems.length > 0) {
                  event.preventDefault();
                  event.stopPropagation(); // 阻止冒泡，防止编辑器插入换行
                  const item = currentFlatItems[popup.selectedIndex];
                  if (item) {
                    handleSelect(item);
                  }
                }
                return;
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                // 清理
                handleClose();
                return;
              }

              // 处理 Tab 键切换
              if (currentShowTabs && event.key === 'Tab') {
                event.preventDefault();
                const newTab =
                  currentActiveTab === 'variables' ? 'tools' : 'variables';
                popup.activeTab = newTab;
                const newTree = getCurrentTree(
                  newTab,
                  currentRegularVars,
                  currentToolVars,
                );
                popup.flatItems = flattenTree(newTree);
                popup.selectedIndex = 0;

                updateRender(
                  0,
                  popup.flatItems,
                  newTree,
                  newTab,
                  currentRegularVars,
                  currentToolVars,
                  currentShowTabs,
                  currentSearchText,
                );
                return;
              }

              // 处理左右箭头键切换 tab
              // if (currentShowTabs) {
              // if (event.key === 'ArrowLeft') {
              //   event.preventDefault();
              //   // 左箭头：切换到左边的 tab（tools -> variables）
              //   if (currentActiveTab === 'tools') {
              //     const newTab = 'variables';
              //     popup.activeTab = newTab;
              //     const newTree = getCurrentTree(
              //       newTab,
              //       currentRegularVars,
              //       currentToolVars,
              //     );
              //     popup.flatItems = flattenTree(newTree);
              //     popup.selectedIndex = 0;

              //     updateRender(
              //       0,
              //       popup.flatItems,
              //       newTree,
              //       newTab,
              //       currentRegularVars,
              //       currentToolVars,
              //       currentShowTabs,
              //       currentSearchText,
              //     );
              //   }
              //   return;
              // }

              // if (event.key === 'ArrowRight') {
              //   event.preventDefault();
              //   // 右箭头：切换到右边的 tab（variables -> tools）
              //   if (currentActiveTab === 'variables') {
              //     const newTab = 'tools';
              //     popup.activeTab = newTab;
              //     const newTree = getCurrentTree(
              //       newTab,
              //       currentRegularVars,
              //       currentToolVars,
              //     );
              //     popup.flatItems = flattenTree(newTree);
              //     popup.selectedIndex = 0;

              //     updateRender(
              //       0,
              //       popup.flatItems,
              //       newTree,
              //       newTab,
              //       currentRegularVars,
              //       currentToolVars,
              //       currentShowTabs,
              //       currentSearchText,
              //     );
              //   }
              //   return;
              // }
              // }
            };

            // 获取 CSS 变量值的辅助函数（从 Ant Design 主题系统）
            const getCSSVariable = (varName: string, fallback: string) => {
              return (
                getComputedStyle(document.documentElement)
                  .getPropertyValue(varName)
                  .trim() || fallback
              );
            };

            // 定位弹窗
            const updatePosition = () => {
              const { range } = props;
              if (!range) return;

              const coords = this.editor.view.coordsAtPos(range.from);
              if (coords) {
                // 从 CSS 变量获取尺寸值
                const controlHeight =
                  parseInt(getCSSVariable('--xagi-control-height', '32')) || 32;
                const popupWidth = 300;
                const popupHeight = controlHeight * 7.5; // 约 240px，基于 controlHeight
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                let left = coords.left;
                let top = coords.bottom + 10; // 默认显示在下方

                // 水平方向边界检测
                if (left + popupWidth > viewportWidth) {
                  left = Math.max(10, viewportWidth - popupWidth - 10);
                }

                // 垂直方向边界检测
                if (top + popupHeight > viewportHeight) {
                  // 如果下方空间不足，尝试显示在上方
                  const topAbove = coords.top - popupHeight - 10;
                  if (topAbove > 0) {
                    top = topAbove;
                  } else {
                    // 如果上方也不足，则尽可能显示在视口内
                    top = Math.max(10, viewportHeight - popupHeight - 10);
                  }
                }

                container.style.position = 'fixed';
                container.style.left = `${left}px`;
                container.style.top = `${top}px`;
                container.style.zIndex = getCSSVariable(
                  '--xagi-z-index-popup-base',
                  '9999',
                );
                container.style.background = getCSSVariable(
                  '--xagi-color-bg-container',
                  '#fff',
                );
                container.style.border = `${getCSSVariable(
                  '--xagi-line-width',
                  '1px',
                )} solid ${getCSSVariable(
                  '--xagi-color-border-secondary',
                  '#d9d9d9',
                )}`;
                container.style.borderRadius = getCSSVariable(
                  '--xagi-border-radius',
                  '8px',
                );
                container.style.boxShadow = getCSSVariable(
                  '--xagi-box-shadow',
                  '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
                );
                container.style.width = `${popupWidth}px`;
                container.style.height = `${popupHeight}px`;
                container.style.overflow = 'hidden'; // 改为 hidden，内部 VariableList 会处理滚动
              }
            };

            // 保存 handleKeyDown 的引用
            handleKeyDownRef = handleKeyDown;
            document.addEventListener('keydown', handleKeyDown);

            popup = {
              portalId,
              container,
              root,
              selectedIndex: 0,
              handleKeyDown,
              // 状态
              activeTab,
              regularVars,
              toolVars,
              flatItems,
              showTabs,
              searchText, // 添加 searchText 到状态
              // 方法
              updateRender,
              flattenTree,
              separateVariables,
              getCurrentTree,
            };

            // 定位弹窗
            updatePosition();
          },
          onUpdate: (props: any) => {
            const { items, query } = props;
            if (!popup) return;

            // 重新计算
            const searchText = truncateQuery(query || '');

            const { regularVars, toolVars } = popup.separateVariables(items);
            const hasRegular = regularVars.length > 0;
            const hasTools = toolVars.length > 0;
            const showTabs = hasRegular && hasTools;

            // 更新 popup 状态
            popup.regularVars = regularVars;
            popup.toolVars = toolVars;
            popup.showTabs = showTabs;
            popup.searchText = searchText; // 更新 searchText

            // 如果当前 tab 变为空，切换到另一个 tab
            if (popup.activeTab === 'variables' && !hasRegular && hasTools) {
              popup.activeTab = 'tools';
            } else if (popup.activeTab === 'tools' && !hasTools && hasRegular) {
              popup.activeTab = 'variables';
            }

            const currentTree = popup.getCurrentTree(
              popup.activeTab,
              regularVars,
              toolVars,
            );
            popup.flatItems = popup.flattenTree(currentTree);

            // 重置索引或保持（如果越界则重置）
            if (popup.selectedIndex >= popup.flatItems.length) {
              popup.selectedIndex = 0;
            }

            popup.updateRender(
              popup.selectedIndex,
              popup.flatItems,
              currentTree,
              popup.activeTab,
              regularVars,
              toolVars,
              showTabs,
              searchText,
            );
          },
          onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
              if (popup) {
                // 使用统一的关闭函数
                const handleClose = () => {
                  try {
                    popup.root.unmount();
                  } catch (e) {
                    // 忽略卸载错误
                  }
                  if (document.body.contains(popup.container)) {
                    document.body.removeChild(popup.container);
                  }
                  if (popup.handleKeyDown) {
                    document.removeEventListener(
                      'keydown',
                      popup.handleKeyDown,
                    );
                  }
                  popup = null;
                };
                handleClose();
              }
              return true;
            }
            if (props.event.key === 'Enter') {
              if (popup && popup.flatItems && popup.flatItems.length > 0) {
                return true;
              }
            }
            return false;
          },
          onExit: () => {
            if (popup) {
              // 使用统一的关闭函数
              const handleClose = () => {
                try {
                  popup.root.unmount();
                } catch (e) {
                  // 忽略卸载错误
                }
                if (document.body.contains(popup.container)) {
                  document.body.removeChild(popup.container);
                }
                if (popup.handleKeyDown) {
                  document.removeEventListener('keydown', popup.handleKeyDown);
                }
                popup = null;
              };
              handleClose();
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
          // 插入变量节点
          let { from, to } = range;

          // 检查是否是可编辑变量节点
          const useEditable = this.options.enableEditableVariables !== false; // 默认为 true

          // 检查下一个字符是否是 }，如果是则包含它
          const { state } = editor.view;
          const doc = state.doc;
          const nextChar =
            to + 1 <= doc.content.size ? doc.textBetween(to, to + 1) : '';
          // 也检查 to+1 位置的字符，因为 AutoCompleteBraces 可能已经插入了 }
          const charAfterTo =
            to + 2 <= doc.content.size ? doc.textBetween(to + 1, to + 2) : '';
          const hasClosingBrace = nextChar === '}' || charAfterTo === '}';

          // 如果下一个字符是 }，扩展 range 以包含它
          if (hasClosingBrace) {
            // 如果 nextChar 是 }，扩展 to 包含它
            // 如果 charAfterTo 是 }，扩展 to+1 包含它
            if (nextChar === '}') {
              to = to + 1; // 包含 }
            } else if (charAfterTo === '}') {
              to = to + 2; // 包含 }（跳过中间的一个字符）
            }
          }

          // 删除 { 或 {} 并插入变量节点/标记/文本
          const variableKey = props.attrs?.key || props.key || '';
          const variableText = '{{' + variableKey + '}}';
          const variableMode = this.options.variableMode || 'text';

          if (useEditable) {
            if (variableMode === 'text') {
              // 方案C：纯文本模式
              // 直接插入 {{variable}} 文本，依赖 VariableTextDecoration 自动应用样式
              editor
                .chain()
                .focus()
                .deleteRange({ from, to })
                .insertContent(variableText)
                .run();

              // 将光标移到末尾
              setTimeout(() => {
                editor.commands.setTextSelection(from + variableText.length);
              }, 0);
            } else if (variableMode === 'mark') {
              // 方案B：Mark模式
              // 插入带标记的文本
              editor
                .chain()
                .focus()
                .deleteRange({ from, to })
                .insertContent(variableText)
                .run();

              // 将刚插入的文本标记为 editableVariable
              const insertPos = from;
              const insertEnd = from + variableText.length;

              editor
                .chain()
                .setTextSelection({ from: insertPos, to: insertEnd })
                .setMark('editableVariable', {
                  key: variableKey,
                  label: props.attrs?.label || props.label || '',
                })
                .setTextSelection(insertEnd) // 将光标移到末尾
                .run();
            } else {
              // 方案A：Node模式（保留作为备选）
              editor
                .chain()
                .focus()
                .deleteRange({ from, to })
                .insertContent({
                  type: 'editableVariable',
                  attrs: {
                    key: variableKey,
                    label: props.attrs?.label || props.label || '',
                  },
                  content: [
                    {
                      type: 'text',
                      text: variableText,
                    },
                  ],
                })
                .run();

              setTimeout(() => {
                const currentPos = editor.state.selection.from;
                editor.commands.setTextSelection(currentPos);
              }, 0);
            }
          } else {
            // 不可编辑变量节点：插入原子节点
            editor
              .chain()
              .focus()
              .deleteRange({ from, to })
              .insertContent({
                type: 'variable',
                attrs: {
                  key: props.attrs?.key || props.key || '',
                  label: props.attrs?.label || props.label || '',
                  isTool: false,
                },
              })
              .run();

            // 对于原子节点，光标应该已经在节点之后，但为了确保，我们也设置一下
            requestAnimationFrame(() => {
              const { state, dispatch } = editor.view;
              const { selection, doc } = state;
              const { $from } = selection;

              // 从当前光标位置向前查找变量节点
              let foundNodePos = -1;
              let foundNodeSize = 0;

              // 从当前光标位置向前查找（最多查找 200 个字符）
              const searchRange = 200;
              const startPos = Math.max(0, $from.pos - searchRange);

              for (let pos = $from.pos; pos >= startPos; pos--) {
                try {
                  const resolvedPos = doc.resolve(pos);
                  // 检查当前深度下的节点
                  for (let depth = resolvedPos.depth; depth >= 0; depth--) {
                    const node = resolvedPos.node(depth);
                    if (node && node.type.name === 'variable') {
                      const nodeStart = resolvedPos.start(depth);
                      const nodeEnd = nodeStart + node.nodeSize;
                      // 确保光标在节点内或节点后
                      if (nodeStart <= $from.pos && $from.pos <= nodeEnd) {
                        foundNodePos = nodeStart;
                        foundNodeSize = node.nodeSize;
                        break;
                      }
                    }
                  }
                  if (foundNodePos >= 0) break;
                } catch (e) {
                  // 忽略解析错误，继续查找
                }
              }

              // 如果找到节点，将光标移动到节点之后
              if (foundNodePos >= 0 && foundNodeSize > 0) {
                const targetPos = foundNodePos + foundNodeSize;
                if (targetPos <= doc.content.size) {
                  const selection = TextSelection.create(doc, targetPos);
                  const tr = state.tr.setSelection(selection);
                  dispatch(tr);
                }
              }
            });
          }
        }
      },
    });

    // 直接返回 Suggestion 插件，它已经配置了唯一的 pluginKey
    return [suggestionPlugin];
  },
});
