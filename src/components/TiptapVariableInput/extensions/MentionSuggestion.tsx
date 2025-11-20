/*
 * Mention Suggestion Extension
 * @ mentions 自动补全配置
 */

import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import ReactDOM from 'react-dom/client';
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

            // 创建 React 根
            const root = ReactDOM.createRoot(container);
            let selectedIndex = 0;
            let currentItems = items;

            // 先声明 handleKeyDown，避免在 handleSelect 中使用时未定义
            let handleKeyDown: (event: KeyboardEvent) => void;

            const handleSelect = (item: MentionItem) => {
              command({ id: item.id, label: item.label, type: item.type });
              root.unmount();
              if (document.body.contains(container)) {
                document.body.removeChild(container);
              }
              document.removeEventListener('keydown', handleKeyDown);
              this.options.onSelect?.(item);
            };

            handleKeyDown = (event: KeyboardEvent) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                selectedIndex = Math.min(
                  selectedIndex + 1,
                  currentItems.length - 1,
                );
                root.render(
                  <MentionList
                    items={currentItems}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelect}
                  />,
                );
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                root.render(
                  <MentionList
                    items={currentItems}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelect}
                  />,
                );
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
            root.render(
              <MentionList
                items={items}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
              />,
            );

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

            updatePosition();
            popup = {
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
              popup.root.render(
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
                />,
              );
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
              popup.root.unmount();
              if (document.body.contains(popup.container)) {
                document.body.removeChild(popup.container);
              }
              document.removeEventListener('keydown', popup.handleKeyDown);
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
