/*
 * Tiptap Variable Input Component
 * 基于 Tiptap 的变量输入组件，支持 @ mentions 和 { 变量插入
 */

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { theme } from 'antd';
import React, { useEffect, useMemo } from 'react';
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
  cleanHTMLParagraphs,
  convertTextToHTML,
  extractTextFromHTML,
} from './utils/htmlUtils';

/**
 * Tiptap Variable Input 组件
 * 支持 @ mentions 和 { 变量插入的富文本编辑器
 */
const TiptapVariableInput: React.FC<TiptapVariableInputProps> = ({
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
}) => {
  const { token } = theme.useToken();

  // 构建变量树
  const { variableTree } = useVariableTree(
    variables,
    skills,
    '', // searchText 由 suggestion 内部管理
  );

  // 将纯文本值转换为 HTML（如果包含工具块或变量格式）
  const initialContent = useMemo(() => {
    if (!value) return '';
    // 检查是否包含工具块或变量格式，如果是则转换为 HTML
    if (
      value.includes('{#ToolBlock') ||
      value.includes('{{') ||
      value.includes('@')
    ) {
      return convertTextToHTML(value);
    }
    // 如果已经是 HTML 格式，清理首尾空段落
    if (/<[^>]+>/.test(value)) {
      return cleanHTMLParagraphs(value);
    }
    return value;
  }, [value]);

  // 初始化编辑器
  // 注意：扩展的顺序很重要，Suggestion 插件应该在 AutoCompleteBraces 之后
  // 这样 Suggestion 插件能够检测到 AutoCompleteBraces 插入的 { 字符
  const editor = useEditor({
    extensions: [
      StarterKit,
      MentionNode,
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
      MentionSuggestion.configure({
        items: mentions,
        onSelect: () => {
          // Mentions 选择回调
        },
      }),
    ],
    content: initialContent,
    editable: !readonly && !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // 同时提供 HTML 和纯文本格式
      // 如果 onChange 期望纯文本，可以使用 extractTextFromHTML(html)
      onChange?.(html);
    },
  });

  // 同步外部 value 到编辑器
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      // 检查是否需要转换
      let contentToSet = value;
      if (
        value &&
        (value.includes('{#ToolBlock') ||
          value.includes('{{') ||
          value.includes('@'))
      ) {
        contentToSet = convertTextToHTML(value);
      } else if (value && /<[^>]+>/.test(value)) {
        // 如果已经是 HTML 格式，不再清理首尾空段落，以保留用户的换行
        // contentToSet = cleanHTMLParagraphs(value);
        contentToSet = value;
      }
      // 只有当内容不同时才更新
      if (contentToSet !== currentHtml) {
        editor.commands.setContent(contentToSet || '', false);
      }
    }
  }, [editor, value]);

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
  const applyNodeStyles = React.useCallback(() => {
    if (!editor?.view?.dom) return;

    const dom = editor.view.dom;

    // 为 tool-block-chip 添加样式
    const toolBlocks = dom.querySelectorAll('.tool-block-chip');
    toolBlocks.forEach((el) => {
      if (el instanceof HTMLElement && !el.getAttribute('style')) {
        el.setAttribute(
          'style',
          'display: inline-block !important; background-color: #f6ffed !important; color: #52c41a !important; padding: 0 4px !important; border-radius: 4px !important; margin: 0 2px !important; font-size: 12px !important; line-height: 20px !important; border: 1px solid #b7eb8f !important; user-select: none !important; vertical-align: middle !important; cursor: default !important;',
        );
      }
    });

    // 为 variable-block-chip 添加样式（使用标准的 span 标签）
    // 注意：大括号通过 CSS ::before 和 ::after 实现，不需要内联样式
    const variables = dom.querySelectorAll('.variable-block-chip');
    variables.forEach((el) => {
      if (el instanceof HTMLElement) {
        // 确保 contentEditable 为 false
        el.contentEditable = 'false';
      }
    });

    // 为 mention-node 添加样式
    const mentions = dom.querySelectorAll('.mention-node');
    mentions.forEach((el) => {
      if (el instanceof HTMLElement && !el.getAttribute('style')) {
        el.setAttribute(
          'style',
          'display: inline-block !important; background-color: #e6f7ff !important; color: #1890ff !important; padding: 2px 6px !important; border-radius: 4px !important; margin: 0 2px !important; font-size: 12px !important; line-height: 20px !important; border: 1px solid #91d5ff !important; user-select: none !important; vertical-align: middle !important; cursor: default !important;',
        );
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
    const html = editor.getHTML();
    return extractTextFromHTML(html);
  }, [editor, value]);

  // 监听编辑器内容变化，更新 rawValue
  React.useEffect(() => {
    if (!editor) return;

    const updateRawValue = () => {
      const html = editor.getHTML();
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
  }, [editor]);

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
              color: '#bfbfbf',
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

export default TiptapVariableInput;
