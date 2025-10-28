import { useRef, useState } from 'react';

/**
 * 变量输入管理 Hook
 */
export const useVariableInput = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  // 获取当前光标前面的内容
  const getWordBeforeCursor = (): string => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return '';
    const text = selection.anchorNode.textContent;
    const offset = selection.anchorOffset;
    return text?.slice(0, offset) || '';
  };

  // 检查是否应该显示变量选择器
  const shouldShowVariableSelector = (): boolean => {
    const word = getWordBeforeCursor();
    const match = word.match(/\{+(\w*)$/);
    return !!match;
  };

  // 插入变量
  const insertVariable = (variable: string) => {
    if (!editorRef.current) {
      console.error('编辑器引用不存在');
      return;
    }

    const variableText = variable.startsWith('{{')
      ? variable
      : `{{${variable}}}`;

    const currentContent = editorRef.current.textContent || '';
    const cleanedContent = currentContent.replace(/\{+\w*$/, '').trim();
    const newContent =
      cleanedContent + (cleanedContent ? ' ' : '') + variableText;

    editorRef.current.innerHTML = newContent;
    editorRef.current.focus();

    // 设置光标到末尾
    const setCursorToEnd = () => {
      const sel = window.getSelection();
      if (sel && editorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    setTimeout(setCursorToEnd, 0);

    setTimeout(() => {
      const content = editorRef.current?.textContent || '';
      setIsEmpty(content.trim() === '');
    }, 10);
  };

  // 处理输入事件
  const handleInput = () => {
    const content = editorRef.current?.textContent || '';
    setIsEmpty(content.trim() === '');
  };

  // 处理焦点事件
  const handleFocus = () => {
    const content = editorRef.current?.textContent || '';
    setIsEmpty(content.trim() === '');
  };

  // 处理失焦事件
  const handleBlur = () => {
    const content = editorRef.current?.textContent || '';
    setIsEmpty(content.trim() === '');
  };

  // 获取内容
  const getContent = () => editorRef.current?.textContent || '';

  // 设置内容
  const setContent = (content: string) => {
    if (editorRef.current) {
      editorRef.current.textContent = content;
      setIsEmpty(content.trim() === '');
    }
  };

  return {
    editorRef,
    isEmpty,
    getWordBeforeCursor,
    shouldShowVariableSelector,
    insertVariable,
    handleInput,
    handleFocus,
    handleBlur,
    getContent,
    setContent,
  };
};
