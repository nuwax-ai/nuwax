/*
 * Tiptap Variable Input Component
 * 基于 Tiptap 的变量输入组件，支持 @ mentions 和 { 变量插入
 */

import { TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { theme } from 'antd';
import { isEqual } from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import { AutoCompleteBraces } from './extensions/AutoCompleteBraces';
import { MentionNode } from './extensions/MentionNode';
import { MentionSuggestion } from './extensions/MentionSuggestion';
import { ToolBlockNode } from './extensions/ToolBlockNode';
import { VariableNode } from './extensions/VariableNode';
import { VariableSuggestion } from './extensions/VariableSuggestion';
import { useVariableTree } from './hooks/useVariableTree';
import './styles.less';
import type { TiptapVariableInputProps } from './types';
import {
  convertTextToHTML,
  extractTextFromHTML,
  shouldConvertTextToHTML,
} from './utils/htmlUtils';

/**
 * Tiptap Variable Input 内部组件
 * 支持 @ mentions 和 { 变量插入的富文本编辑器
 */
const TiptapVariableInputInner: React.FC<TiptapVariableInputProps> = ({
  value,
  onChange,
  variables = [],
  skills = [],
  mentions = [],
  placeholder = '输入 @ 或 { 开始使用',
  disabled = false,
  readonly = false,
  className,
  style,
  onVariableSelect,
  disableMentions = true, // 默认禁用 mentions
  getEditor,
}) => {
  const { token } = theme.useToken();

  /**
   * 将编辑器 HTML 规范化
   * @description tiptap 在空内容时默认返回 `<p></p>`，这里统一转换为空字符串
   * 但保留多个空段落（空行）
   */
  const getNormalizedHtml = React.useCallback((editorInstance: Editor) => {
    if (editorInstance.isEmpty) {
      return '';
    }
    const html = editorInstance.getHTML();
    // 只检查单个空段落，多个空段落（空行）应该保留
    const trimmed = html.trim();
    if (trimmed === '<p></p>' || trimmed === '<p></p>\n') {
      return '';
    }
    // 保留原始 HTML，包括空段落
    return html;
  }, []);

  // 使用 useRef 和 isEqual 确保 variables 和 skills 的引用稳定性
  // 防止因父组件传入新引用但内容相同的 props 导致无限循环
  const variablesRef = useRef(variables);
  const skillsRef = useRef(skills);

  if (!isEqual(variablesRef.current, variables)) {
    variablesRef.current = variables;
  }
  if (!isEqual(skillsRef.current, skills)) {
    skillsRef.current = skills;
  }

  const stableVariables = variablesRef.current;
  const stableSkills = skillsRef.current;

  // 构建变量树
  const { variableTree } = useVariableTree(
    stableVariables,
    stableSkills,
    '', // searchText 由 suggestion 内部管理
  );

  // 将纯文本值转换为 HTML（如果包含工具块或变量格式）
  const initialContent = useMemo(() => {
    if (!value || value === '<p></p>' || value === '<p></p>\n') return '';
    // 检查是否包含工具块或变量格式，如果是则转换为 HTML
    if (shouldConvertTextToHTML(value)) {
      return convertTextToHTML(value, disableMentions);
    }
    // 如果已经是 HTML 格式，保留空行，不清理首尾空段落
    if (/\u003c[^\u003e]+\u003e/.test(value)) {
      // 保留空行，不清理首尾空段落
      const trimmed = value.trim();
      if (!trimmed) return '';
      return value; // 保留原始格式，包括空段落
    }
    // 对于普通文本，转换为 HTML 以正确处理换行
    return convertTextToHTML(value, disableMentions);
  }, [value, disableMentions]);

  // 保存光标位置的 ref
  const cursorPositionRef = useRef<number | null>(null);
  const isUpdatingFromExternalRef = useRef(false);

  // 初始化编辑器
  // 注意：扩展的顺序很重要，Suggestion 插件应该在 AutoCompleteBraces 之后
  // 这样 Suggestion 插件能够检测到 AutoCompleteBraces 插入的 { 字符
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        !disableMentions ? MentionNode : undefined,
        VariableNode,
        ToolBlockNode,
        // VariableSuggestion 应该在 AutoCompleteBraces 之前，这样它能够检测到 { 字符
        VariableSuggestion.configure({
          variables: variableTree, // 初始化时可能为空，后续通过 useEffect 更新
          onSelect: (item) => {
            // 变量选择回调
            if (item.node?.variable && onVariableSelect) {
              onVariableSelect(item.node.variable, item.value);
            }
          },
        }),
        // AutoCompleteBraces 应该在最后，这样它能够处理 { 输入
        // 但是，由于 Suggestion 插件通过监听文档变化来检测触发字符，
        // 所以即使 AutoCompleteBraces 返回 true，Suggestion 也应该能够检测到
        AutoCompleteBraces, // 自动补全大括号（只在空白或行首时补全）
        // 只有当 disableMentions 为 false 时才启用 MentionSuggestion
        !disableMentions
          ? MentionSuggestion.configure({
              items: mentions,
              onSelect: () => {
                // Mentions 选择回调
              },
            })
          : undefined,
      ].filter(Boolean) as any, // 过滤掉 undefined 并强制类型转换
      content: initialContent,
      editable: !readonly && !disabled,
      onUpdate: ({ editor }) => {
        // 如果是从外部更新，不触发 onChange，避免循环更新
        if (isUpdatingFromExternalRef.current) {
          return;
        }
        const html = getNormalizedHtml(editor);
        onChange?.(html);
      },
      // 监听选择变化，保存光标位置
      onSelectionUpdate: ({ editor }) => {
        if (!isUpdatingFromExternalRef.current) {
          const { from } = editor.state.selection;
          cursorPositionRef.current = from;
        }
      },
    },
    [disableMentions, readonly, disabled, getNormalizedHtml],
  );

  // 暴露编辑器实例
  useEffect(() => {
    if (editor && getEditor) {
      getEditor(editor);
    }
  }, [editor, getEditor]);

  // 同步外部 value 到编辑器
  useEffect(() => {
    if (editor && value !== undefined) {
      const sanitizedValue =
        value === '<p></p>' || value === '<p></p>\n' ? '' : value;
      const currentHtml = editor.getHTML();

      // 优化：如果传入的值与当前的纯文本内容相同，则不进行更新
      // 这可以避免因为 HTML 序列化差异导致的无限循环更新和滚动跳动
      const currentRawValue = extractTextFromHTML(currentHtml);
      if (sanitizedValue === currentRawValue) {
        return;
      }

      // 检查是否需要转换
      let contentToSet = sanitizedValue;
      if (sanitizedValue && shouldConvertTextToHTML(sanitizedValue)) {
        contentToSet = convertTextToHTML(sanitizedValue, disableMentions);
      } else if (
        sanitizedValue &&
        /\u003c[^\u003e]+\u003e/.test(sanitizedValue)
      ) {
        // 如果已经是 HTML 格式，不再清理首尾空段落，以保留用户的换行
        // contentToSet = cleanHTMLParagraphs(value);
        contentToSet = sanitizedValue;
      } else if (sanitizedValue) {
        // 对于普通文本，转换为 HTML 以正确处理换行
        contentToSet = convertTextToHTML(sanitizedValue, disableMentions);
      }
      // 只有当内容不同时才更新
      if (contentToSet !== currentHtml) {
        // 保存当前光标位置和选择状态
        const currentSelection = editor.state.selection;
        const savedCursorPos = currentSelection.from;
        const wasFocused = editor.isFocused;

        // 标记正在从外部更新，避免触发 onChange
        isUpdatingFromExternalRef.current = true;

        // 设置内容，不触发历史记录
        editor.commands.setContent(contentToSet || '', false);

        // 保存当前滚动位置
        const editorElement = editor.view.dom;
        const scrollContainer = editorElement?.closest(
          '.tiptap-variable-input',
        ) as HTMLElement;
        const savedScrollTop = scrollContainer?.scrollTop || 0;
        const savedScrollLeft = scrollContainer?.scrollLeft || 0;

        // 尝试恢复光标位置
        // 使用 requestAnimationFrame 确保 DOM 已更新
        requestAnimationFrame(() => {
          try {
            const doc = editor.state.doc;
            let targetPos = savedCursorPos;

            // 如果保存的位置超出文档范围，调整到文档末尾
            if (targetPos > doc.content.size) {
              targetPos = doc.content.size;
            }

            // 如果位置有效，恢复光标
            if (targetPos >= 0 && targetPos <= doc.content.size) {
              // 使用 TextSelection 直接设置选择，不触发自动滚动
              const selection = TextSelection.create(doc, targetPos);
              const tr = editor.state.tr.setSelection(selection);
              editor.view.dispatch(tr);

              // 恢复滚动位置（防止自动滚动到底部）
              if (scrollContainer) {
                scrollContainer.scrollTop = savedScrollTop;
                scrollContainer.scrollLeft = savedScrollLeft;
              }

              // 如果之前有焦点，恢复焦点，但阻止自动滚动
              if (wasFocused) {
                // 使用 preventScroll 选项阻止浏览器在聚焦时自动滚动
                const editorDom = editor.view.dom as HTMLElement;
                if (editorDom && editorDom.focus) {
                  editorDom.focus({ preventScroll: true });
                }
                // 确保滚动位置保持不变
                if (scrollContainer) {
                  scrollContainer.scrollTop = savedScrollTop;
                  scrollContainer.scrollLeft = savedScrollLeft;
                }
              }
            } else if (doc.content.size > 0) {
              // 如果位置无效，将光标放在文档末尾
              const selection = TextSelection.create(doc, doc.content.size);
              const tr = editor.state.tr.setSelection(selection);
              editor.view.dispatch(tr);

              // 恢复滚动位置
              if (scrollContainer) {
                scrollContainer.scrollTop = savedScrollTop;
                scrollContainer.scrollLeft = savedScrollLeft;
              }

              if (wasFocused) {
                // 使用 preventScroll 选项阻止浏览器在聚焦时自动滚动
                const editorDom = editor.view.dom as HTMLElement;
                if (editorDom && editorDom.focus) {
                  editorDom.focus({ preventScroll: true });
                }
                // 确保滚动位置保持不变
                if (scrollContainer) {
                  scrollContainer.scrollTop = savedScrollTop;
                  scrollContainer.scrollLeft = savedScrollLeft;
                }
              }
            }
          } catch (error) {
            console.warn(
              'TiptapVariableInput: Failed to restore cursor position',
              error,
            );
            // 如果恢复失败，恢复滚动位置
            if (scrollContainer) {
              scrollContainer.scrollTop = savedScrollTop;
              scrollContainer.scrollLeft = savedScrollLeft;
            }
          } finally {
            // 重置标记
            isUpdatingFromExternalRef.current = false;
          }
        });
      }
    }
  }, [editor, value, disableMentions]);

  // 更新变量树（当 variables 或 skills 变化时）
  useEffect(() => {
    if (editor) {
      const variableSuggestion = editor.extensionManager.extensions.find(
        (ext) => ext.name === 'variableSuggestion',
      );

      if (variableSuggestion) {
        variableSuggestion.options.variables = variableTree;
        // 强制更新插件
        editor.view.dispatch(editor.state.tr);
      } else {
        console.warn(
          'TiptapVariableInput: variableSuggestion extension not found',
        );
      }
    }
  }, [editor, variableTree]);

  // 更新 mentions（当 mentions 变化时）
  useEffect(() => {
    if (editor) {
      const mentionSuggestion = editor.extensionManager.extensions.find(
        (ext) => ext.name === 'mentionSuggestion',
      );
      if (mentionSuggestion) {
        mentionSuggestion.options.items = mentions;
      }
    }
  }, [editor, mentions]);

  // 禁用/启用编辑器
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readonly && !disabled);
    }
  }, [editor, readonly, disabled]);

  // 应用节点样式的函数
  // 注意：由于样式已经在 Less 文件中定义，这里主要确保 contentEditable 等属性正确
  const applyNodeStyles = React.useCallback(() => {
    if (!editor?.view?.dom) return;

    const dom = editor.view.dom;

    // 为 variable-block-chip 添加样式（使用标准的 span 标签）
    // 注意：大括号通过 CSS ::before 和 ::after 实现，不需要内联样式
    const variables = dom.querySelectorAll('.variable-block-chip');
    variables.forEach((el) => {
      if (el instanceof HTMLElement) {
        // 确保 contentEditable 为 false
        el.contentEditable = 'false';
      }
    });
  }, [editor]);

  // 使用 MutationObserver 监听 DOM 变化并应用样式
  useEffect(() => {
    if (!editor?.view?.dom) return;

    // 立即应用一次样式
    applyNodeStyles();

    // 创建 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(() => {
      applyNodeStyles();
    });

    // 开始观察
    observer.observe(editor.view.dom, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    // 清理函数
    return () => {
      observer.disconnect();
    };
  }, [editor, applyNodeStyles]);

  // 从编辑器 HTML 中提取原始文本格式（{{xxx}}、{#ToolBlock ...#}...{#/ToolBlock#}）
  const rawValue = React.useMemo(() => {
    if (!editor) return value || '';
    const html = getNormalizedHtml(editor);
    return extractTextFromHTML(html);
  }, [editor, value, getNormalizedHtml]);

  // 监听编辑器内容变化，更新 rawValue
  React.useEffect(() => {
    if (!editor) return;

    const updateRawValue = () => {
      const html = getNormalizedHtml(editor);
      const extracted = extractTextFromHTML(html);
      // 更新 data-value 属性
      const wrapper = editor.view.dom.closest('.tiptap-editor-wrapper');
      if (wrapper) {
        wrapper.setAttribute('data-value', extracted);
      }
    };

    // 监听编辑器更新
    editor.on('update', updateRawValue);
    editor.on('create', updateRawValue);

    return () => {
      editor.off('update', updateRawValue);
      editor.off('create', updateRawValue);
    };
  }, [editor, getNormalizedHtml]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={['tiptap-variable-input', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="tiptap-editor-wrapper" data-value={rawValue}>
        <EditorContent editor={editor} />
        {!value && (
          <div
            className="tiptap-placeholder"
            style={{
              position: 'absolute',
              top: token.paddingSM,
              left: token.padding,
              color: token.colorTextPlaceholder,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Tiptap Variable Input 组件
 * 支持 @ mentions 和 { 变量插入的富文本编辑器
 * 直接使用 Ant Design 的 theme.useToken() 获取主题变量
 */
const TiptapVariableInput: React.FC<TiptapVariableInputProps> = (props) => {
  return <TiptapVariableInputInner {...props} />;
};

export default TiptapVariableInput;
