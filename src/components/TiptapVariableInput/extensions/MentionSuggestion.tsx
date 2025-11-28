/*
 * Mention Suggestion Extension
 * @ mentions 自动补全配置
 */

import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { ConfigProvider } from 'antd';
import { createRoot } from 'react-dom/client';
import MentionList from '../components/MentionList';
import type { MentionItem } from '../types';

export interface MentionSuggestionOptions {
  items: MentionItem[];
  onSelect?: (item: MentionItem) => void;
}

/**
 * Mention Suggestion 扩展
 * 配置 @ 触发自动补全
 */
export const MentionSuggestion = Extension.create<MentionSuggestionOptions>({
  name: 'mentionSuggestion',

  addOptions() {
    return {
      items: [],
      onSelect: undefined,
    };
  },

  addProseMirrorPlugins() {
    const suggestionPlugin = Suggestion({
      editor: this.editor,
      char: '@',
      allowSpaces: false,
      startOfLine: false,
      pluginKey: new PluginKey('mentionSuggestion'), // 使用唯一的 key
      items: ({ query }) => {
        const items = this.options.items || [];
        if (!query) return items;
        const queryLower = query.toLowerCase();
        return items.filter((item) => {
          const labelLower = item.label.toLowerCase();
          const idLower = item.id.toLowerCase();
          return (
            labelLower.includes(queryLower) || idLower.includes(queryLower)
          );
        });
      },
      render: () => {
        let popup: any;

        return {
          onStart: (props: any) => {
            const { items, command } = props;

            // 创建容器
            const container = document.createElement('div');
            container.className = 'mention-suggestion-popup';
            document.body.appendChild(container);

            // 创建 React 18 root
            const root = createRoot(container);

            // Portal ID
            const portalId = `mention-suggestion-${Date.now()}-${Math.random()}`;
            let selectedIndex = 0;
            let currentItems = items;

            // 先声明 handleKeyDown，避免在 handleSelect 中使用时未定义
            let handleKeyDown: (event: KeyboardEvent) => void;

            const handleSelect = (item: MentionItem) => {
              command({ id: item.id, label: item.label, type: item.type });
              try {
                // 卸载 React 组件
                root.unmount();
              } catch (e) {
                // 忽略卸载错误
              }
              if (document.body.contains(container)) {
                document.body.removeChild(container);
              }
              if (handleKeyDown) {
                document.removeEventListener('keydown', handleKeyDown);
              }
              this.options.onSelect?.(item);
            };

            handleKeyDown = (event: KeyboardEvent) => {
              // 如果正在输入中文等 IME 组合键，不处理
              if (event.isComposing) {
                return;
              }

              // 检查容器是否仍然存在
              if (!document.body.contains(container)) {
                document.removeEventListener('keydown', handleKeyDown);
                return;
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                selectedIndex = Math.min(
                  selectedIndex + 1,
                  currentItems.length - 1,
                );
                // 更新 Portal 内容
                const content = (
                  <ConfigProvider
                    theme={{
                      cssVar: { prefix: 'xagi' },
                    }}
                  >
                    <MentionList
                      items={currentItems}
                      selectedIndex={selectedIndex}
                      onSelect={handleSelect}
                    />
                  </ConfigProvider>
                );
                root.render(content);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                // 更新 Portal 内容
                const content = (
                  <ConfigProvider
                    theme={{
                      cssVar: { prefix: 'xagi' },
                    }}
                  >
                    <MentionList
                      items={currentItems}
                      selectedIndex={selectedIndex}
                      onSelect={handleSelect}
                    />
                  </ConfigProvider>
                );
                root.render(content);
              } else if (event.key === 'Enter') {
                event.preventDefault();
                if (currentItems[selectedIndex]) {
                  handleSelect(currentItems[selectedIndex]);
                }
              } else if (event.key === 'Escape') {
                event.preventDefault();
                root.unmount();
                if (document.body.contains(container)) {
                  document.body.removeChild(container);
                }
                document.removeEventListener('keydown', handleKeyDown);
              }
            };

            document.addEventListener('keydown', handleKeyDown);

            // 渲染列表
            // 使用 ConfigProvider 包裹，确保主题上下文和 CSS 变量正确应用
            // 使用 React 18 createRoot API 渲染到容器
            const content = (
              <ConfigProvider
                theme={{
                  cssVar: { prefix: 'xagi' },
                }}
              >
                <MentionList
                  items={items}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelect}
                />
              </ConfigProvider>
            );
            root.render(content);

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
                container.style.overflow = 'auto';
              }
            };

            updatePosition();
            popup = {
              portalId,
              container,
              root,
              handleKeyDown,
              updatePosition,
              currentItems: items,
            };
          },
          onUpdate: (props: any) => {
            if (popup) {
              const { items } = props;
              popup.currentItems = items;
              let selectedIndex = 0;
              // 更新 Portal 内容
              const content = (
                <ConfigProvider
                  theme={{
                    cssVar: { prefix: 'xagi' },
                  }}
                >
                  <MentionList
                    items={items}
                    selectedIndex={selectedIndex}
                    onSelect={(item) => {
                      props.command({
                        id: item.id,
                        label: item.label,
                        type: item.type,
                      });
                      popup.root.unmount();
                      if (document.body.contains(popup.container)) {
                        document.body.removeChild(popup.container);
                      }
                      document.removeEventListener(
                        'keydown',
                        popup.handleKeyDown,
                      );
                      this.options.onSelect?.(item);
                    }}
                  />
                </ConfigProvider>
              );
              popup.root.render(content);
              popup.updatePosition();
            }
          },
          onKeyDown: (props: any) => {
            if (props.event.key === 'Escape') {
              if (popup) {
                popup.root.unmount();
                if (document.body.contains(popup.container)) {
                  document.body.removeChild(popup.container);
                }
                document.removeEventListener('keydown', popup.handleKeyDown);
              }
              return true;
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
              if (document.body.contains(popup.container)) {
                document.body.removeChild(popup.container);
              }
              if (popup.handleKeyDown) {
                document.removeEventListener('keydown', popup.handleKeyDown);
              }
            }
          },
        };
      },
      command: ({ editor, range, props }: any) => {
        editor
          .chain()
          .focus()
          .insertContentAt(range, {
            type: 'mention',
            attrs: {
              id: props.id,
              label: props.label,
              type: props.type || 'user',
            },
          })
          .run();
      },
    });

    // 直接返回 Suggestion 插件，它已经配置了唯一的 pluginKey
    return [suggestionPlugin];
  },
});
