import type { ToolItem, VariableItem } from '@/types/tiptap';
import { Node, mergeAttributes } from '@tiptap/core';
import type { MentionOptions } from '@tiptap/extension-mention';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Spin } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import SuggestionPopup from './components/SuggestionPopup';
import './index.less';

// 自定义 ToolBlock 扩展
const ToolBlock = Node.create({
  name: 'toolBlock',
  group: 'block',
  content: 'inline*',
  atom: false,

  addAttributes() {
    return {
      tool: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-tool'),
        renderHTML: (attributes) => ({ 'data-tool': attributes.tool }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toolBlock"]',
        getAttrs: (element) => ({
          tool: element.getAttribute('data-tool'),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const toolName = node.attrs.tool || 'unknown';
    const content = node.content.size
      ? node.content.textBetween(0, node.content.size)
      : '';

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toolBlock',
        class: 'toolblock-node',
        'data-tool': toolName,
      }),
      [
        'div',
        { class: 'toolblock-header' },
        `{#ToolBlock tool="${toolName}"#}`,
      ],
      ['div', { class: 'toolblock-content' }, content],
      ['div', { class: 'toolblock-footer' }, '{#/ToolBlock#}'],
    ];
  },

  addCommands() {
    return {
      insertToolBlock:
        (tool: string, content?: string) =>
        ({ chain }: { chain: any }) => {
          return chain()
            .insertContent({
              type: 'toolBlock',
              attrs: { tool },
              content: content
                ? [{ type: 'text', text: content }]
                : [{ type: 'text', text: '在这里输入内容...' }],
            })
            .run();
        },
    } as any;
  },
});

interface TipTapEditorForUMIProps {
  content?: string;
  variables?: VariableItem[];
  tools?: ToolItem[];
  onChange?: (content: string) => void;
  editorOptions?: any;
  theme?: 'light' | 'dark';
  showToolbar?: boolean;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
}

/**
 * TipTap 编辑器主组件
 * 支持通过 { 字符触发变量补全和 ToolBlock 插入
 */
const TipTapEditorForUMI: React.FC<TipTapEditorForUMIProps> = ({
  content = '',
  variables = [],
  tools = [],
  onChange,
  editorOptions = {},
  theme = 'light',
  showToolbar = true,
  minHeight = 200,
  maxHeight = 500,
  placeholder = '请输入内容...',
}) => {
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });

  // 编辑器实例
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'toolBlock') {
            return '输入 ToolBlock 的内容...';
          }
          return placeholder;
        },
      }),
      ToolBlock,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention-node',
        },
        renderLabel({ node }: any) {
          return `${node.attrs.label}`;
        },
        renderText({ node }: any) {
          return `@${node.attrs.label}`;
        },
        renderHTML({ node }: any) {
          return [
            'span',
            { class: 'mention-node', 'data-id': node.attrs.id },
            `@${node.attrs.label}`,
          ];
        },
        suggestion: {
          char: '@',
          allowSpaces: true,
          items: (query: string) => {
            return variables.filter(
              (variable) =>
                variable.name.toLowerCase().includes(query.toLowerCase()) ||
                variable.key.toLowerCase().includes(query.toLowerCase()),
            );
          },
          render: () => {
            let element: HTMLElement;
            let popup: HTMLElement;

            const self = {
              onStart: (props: any) => {
                const { clientRect } = props;
                if (!clientRect) return;

                element = document.createElement('div');
                element.className = 'mention-list';

                popup = document.createElement('div');
                popup.className = 'mention-popup';
                popup.style.position = 'absolute';
                popup.style.left = clientRect.left + 'px';
                popup.style.top = clientRect.bottom + 'px';
                popup.style.zIndex = '9999';

                popup.appendChild(element);
                document.body.appendChild(popup);

                self.onUpdate(props);
              },

              onUpdate: (props: any) => {
                const { clientRect, items } = props;
                if (!clientRect) return;

                element.innerHTML = items
                  .map(
                    (item: VariableItem, index: number) => `
                  <div class="mention-item ${
                    index === 0 ? 'selected' : ''
                  }" data-index="${index}">
                    <div class="mention-name">${item.name}</div>
                    <div class="mention-key">${item.key}</div>
                    ${
                      item.description
                        ? `<div class="mention-desc">${item.description}</div>`
                        : ''
                    }
                  </div>
                `,
                  )
                  .join('');
              },

              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  self.onExit();
                  return true;
                }
                return false;
              },

              onExit: () => {
                if (popup) {
                  popup.remove();
                }
              },
            };
            return self;
          },
        },
      } as unknown as MentionOptions),
    ].filter(Boolean),
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `tiptap-editor-content ${
          theme === 'dark' ? 'dark-theme' : 'light-theme'
        }`,
        style: `min-height: ${minHeight}px; max-height: ${maxHeight}px;`,
      },
    },
    ...editorOptions,
  });

  // 取消选择
  const handleCancel = useCallback(() => {
    setSuggestionVisible(false);
  }, []);

  // 检测是否应该显示建议弹窗
  const shouldShowSuggestion = useCallback(() => {
    if (!editor) return false;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, from - 10),
      from,
      ' ',
    );

    return (
      textBefore.includes('{') ||
      textBefore.includes('{{') ||
      textBefore.includes('{}')
    );
  }, [editor]);

  // 处理键盘输入
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === '{') {
        event.preventDefault();

        if (editor && shouldShowSuggestion()) {
          const { from } = editor.state.selection;
          const coords = editor.view.coordsAtPos(from);

          setSuggestionPosition({ x: coords.left, y: coords.bottom });
          setSuggestionVisible(true);
        }
      } else if (event.key === 'Escape' && suggestionVisible) {
        event.preventDefault();
        handleCancel();
      }
    },
    [editor, shouldShowSuggestion, suggestionVisible],
  );

  // 处理选择项目
  const handleSelectItem = useCallback(
    (item: VariableItem | ToolItem, type: 'variable' | 'tool') => {
      if (!editor) return;

      if (type === 'tool') {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'toolBlock',
            attrs: { tool: item.key },
            content: [{ type: 'text', text: '在这里输入内容...' }],
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'mention',
            attrs: {
              id: item.key,
              label: 'name' in item ? item.name : item.title,
            },
          })
          .run();
      }

      setSuggestionVisible(false);
    },
    [editor],
  );

  // 监听键盘事件
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        document.activeElement &&
        editor?.view.dom.contains(document.activeElement)
      ) {
        handleKeyDown(event);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editor, handleKeyDown]);

  // 工具栏渲染
  const renderToolbar = useCallback(() => {
    if (!showToolbar || !editor) return null;

    return (
      <div className="editor-toolbar">
        <Button.Group>
          <Button
            size="small"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
          >
            粗体
          </Button>
          <Button
            size="small"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
          >
            斜体
          </Button>
          <Button
            size="small"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={
              editor.isActive('heading', { level: 1 }) ? 'is-active' : ''
            }
          >
            H1
          </Button>
          <Button
            size="small"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive('heading', { level: 2 }) ? 'is-active' : ''
            }
          >
            H2
          </Button>
          <Button
            size="small"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
          >
            列表
          </Button>
        </Button.Group>
      </div>
    );
  }, [editor, showToolbar]);

  if (!editor) {
    return (
      <div className="tiptap-editor-loading">
        <Spin size="large" />
        <div>编辑器加载中...</div>
      </div>
    );
  }

  return (
    <div className={`tiptap-editor-wrapper ${theme}-theme`}>
      {renderToolbar()}
      <div className="tiptap-editor-container">
        <EditorContent editor={editor} />
      </div>
      <div className="editor-status">
        {content.length > 0 && (
          <span className="word-count">字数: {content.length}</span>
        )}
      </div>

      <SuggestionPopup
        variables={variables}
        tools={tools}
        visible={suggestionVisible}
        position={suggestionPosition}
        onSelect={handleSelectItem}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default TipTapEditorForUMI;
