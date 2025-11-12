/**
 * PromptEditor 变量选择 Hook
 * 监听 PromptEditorRender 的输入事件，检测 { 字符，获取光标位置，插入变量
 */

import { getCursorPopoverPosition } from '@/components/SmartVariableInput/hooks/usePopoverPosition';
import {
  TreeNodeData,
  buildAdvancedVariablePath,
} from '@/components/SmartVariableInput/utils';
import { useEffect, useRef, useState } from 'react';

interface UsePromptEditorVariableOptions {
  variables: TreeNodeData[];
  editorRef?: React.RefObject<any>;
  editorElement?: HTMLElement | null;
  onInsertVariable?: (variable: string) => void;
  onChange?: (value: string) => void;
}

/**
 * PromptEditor 变量选择 Hook
 */
export const usePromptEditorVariable = ({
  variables,
  editorRef,
  editorElement,
  onInsertVariable,
  onChange,
}: UsePromptEditorVariableOptions) => {
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [searchValue, setSearchValue] = useState('');
  const containerRef = useRef<HTMLElement | null>(null);
  // 保存弹窗显示时的光标位置和上下文
  const savedCursorContextRef = useRef<{
    position: { line: number; ch: number };
    before: string;
    after: string;
  } | null>(null);

  // 获取当前光标位置的内容（前面和后面）和光标位置对象
  const getCursorContext = (): {
    before: string;
    after: string;
    cursor?: { line: number; ch: number };
  } => {
    // 尝试从编辑器获取内容
    if (editorRef?.current) {
      try {
        const editor = editorRef.current;
        const doc = editor.getDoc?.() || editor;

        // 优先使用 doc.getCursor() 获取光标位置
        let cursor = doc.getCursor?.();

        // 如果 getCursor 不存在，尝试其他方法
        if (!cursor || typeof cursor !== 'object') {
          cursor = editor.getSelection?.();
        }

        // 如果还是不存在，尝试 getCursorPosition
        if (!cursor || typeof cursor !== 'object') {
          const pos = editor.getCursorPosition?.();
          if (pos && typeof pos === 'object' && typeof pos.line === 'number') {
            cursor = pos;
          }
        }

        if (
          cursor &&
          typeof cursor === 'object' &&
          typeof cursor.line === 'number'
        ) {
          const line = doc.getLine?.(cursor.line) || '';
          const ch = cursor.ch || 0;
          return {
            before: line.slice(0, ch),
            after: line.slice(ch),
            cursor: { line: cursor.line, ch },
          };
        }
      } catch (e) {
        console.warn('Failed to get cursor context via editor API:', e);
        // 如果 API 不存在，使用 Selection API
      }
    }

    // 使用 Selection API（参考 SmartVariableInput）
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) {
      return { before: '', after: '' };
    }

    const text = selection.anchorNode.textContent || '';
    const offset = selection.anchorOffset;

    // 尝试从编辑器 API 获取光标位置对象（即使上面的 API 失败了，也可能可以获取到）
    let cursor: { line: number; ch: number } | undefined;
    if (editorRef?.current) {
      try {
        const editor = editorRef.current;
        const pos = editor.getCursorPosition?.();
        if (pos && typeof pos === 'object' && typeof pos.line === 'number') {
          cursor = { line: pos.line, ch: pos.ch || 0 };
        } else {
          const doc = editor.getDoc?.() || editor;
          const docCursor = doc.getCursor?.();
          if (
            docCursor &&
            typeof docCursor === 'object' &&
            typeof docCursor.line === 'number'
          ) {
            cursor = { line: docCursor.line, ch: docCursor.ch || 0 };
          }
        }
      } catch (e) {
        // 忽略错误，返回不带 cursor 的对象
      }
    }

    // 如果无法获取 cursor，尝试计算一个默认值（假设在第一行）
    if (!cursor) {
      // 使用 offset 作为 ch（假设所有内容在一行）
      cursor = { line: 0, ch: offset };
      console.log(
        '🔵 [getCursorContext] Fallback cursor calculated from offset:',
        cursor,
      );
    }

    return {
      before: text.slice(0, offset),
      after: text.slice(offset),
      cursor,
    };
  };

  // 检查是否应该显示变量选择器（参考 SmartVariableInput 的实现）
  // 修复：当输入 { 被自动补全为 {} 且光标在中间时，也应该显示
  const shouldShowVariableSelector = (): boolean => {
    const { before, after } = getCursorContext();

    // 检测光标前是否有 { 或 {{
    const beforeMatch = before.match(/\{+(\w*)$/);
    if (beforeMatch) {
      // 如果光标后是 }，说明是自动补全的情况，也应该显示
      if (after.startsWith('}')) {
        return true;
      }
      // 如果光标后不是 }，说明是正常的 { 输入
      return true;
    }

    return false;
  };

  // 获取编辑器内容
  const getEditorContent = (): string => {
    if (editorRef?.current) {
      // 尝试通过编辑器 API 获取内容
      try {
        const editor = editorRef.current;
        if (editor.getValue) {
          return editor.getValue() || '';
        }
        if (editor.getDoc) {
          return editor.getDoc().getValue() || '';
        }
      } catch (e) {
        // 如果 API 不存在，尝试通过 DOM 获取
      }
    }

    // 通过 DOM 获取内容
    if (containerRef.current) {
      const editorDom = containerRef.current.querySelector(
        '.cm-editor, .prompt-editor, [contenteditable="true"]',
      );
      if (editorDom) {
        return editorDom.textContent || '';
      }
    }

    return '';
  };

  // 插入变量到编辑器（参考 SystemTipsWord 的实现）
  const insertVariable = (variable: string) => {
    console.log('🔵 insertVariable called with:', variable);
    const variableText = variable.startsWith('{{')
      ? variable
      : `{{${variable}}}`;
    console.log('🔵 variableText:', variableText);

    if (onInsertVariable) {
      console.log('🔵 Using onInsertVariable callback');
      // 使用回调函数插入变量
      onInsertVariable(variableText);
      setPopoverVisible(false);
      setSearchValue('');
      return;
    }

    if (!editorRef?.current) {
      console.warn('❌ 编辑器引用不存在');
      setPopoverVisible(false);
      setSearchValue('');
      return;
    }

    console.log('🔵 Editor ref exists:', !!editorRef.current);

    try {
      const editor = editorRef.current;

      // 优先使用保存的光标上下文（在弹窗显示时保存的）
      let savedContext = savedCursorContextRef.current;
      let cursorPosition: { line: number; ch: number } | null = null;
      let before = '';
      let after = '';

      console.log('🔵 Saved cursor context:', savedContext);

      // 如果保存的上下文存在，优先使用
      if (savedContext) {
        cursorPosition = savedContext.position;
        before = savedContext.before;
        after = savedContext.after;
        console.log('🔵 Using saved context:', {
          cursorPosition,
          before,
          after,
        });
      }

      // 如果保存的位置不存在，尝试从编辑器获取
      if (!cursorPosition) {
        const doc = editor.getDoc?.() || editor;
        // 优先使用 doc.getCursor()
        cursorPosition = doc.getCursor?.();

        // 如果不存在，尝试 getSelection
        if (!cursorPosition || typeof cursorPosition !== 'object') {
          cursorPosition = doc.getSelection?.();
        }

        // 如果还是不存在，尝试 getCursorPosition
        if (!cursorPosition || typeof cursorPosition !== 'object') {
          const pos = editor.getCursorPosition?.();
          // 如果返回的是数字，说明不是我们需要的格式
          if (pos && typeof pos === 'object' && typeof pos.line === 'number') {
            cursorPosition = pos;
          }
        }

        // 如果获取到了位置但 before/after 为空，尝试从文档获取
        if (cursorPosition && (!before || !after)) {
          const doc = editor.getDoc?.() || editor;
          if (doc && doc.getLine && typeof doc.getLine === 'function') {
            const lineContent = doc.getLine(cursorPosition.line) || '';
            before = lineContent.slice(0, cursorPosition.ch);
            after = lineContent.slice(cursorPosition.ch);
            console.log(
              '🔵 Got before/after from doc.getLine:',
              before,
              '|',
              after,
            );
          } else {
            // 从文档内容中提取
            const content = getEditorContent();
            if (content) {
              const lines = content.split('\n');
              const lineContent = lines[cursorPosition.line] || '';
              before = lineContent.slice(0, cursorPosition.ch);
              after = lineContent.slice(cursorPosition.ch);
              console.log(
                '🔵 Got before/after from content:',
                before,
                '|',
                after,
              );
            } else {
              // 使用 getCursorContext
              const cursorContext = getCursorContext();
              before = cursorContext.before;
              after = cursorContext.after;
              console.log(
                '🔵 Got before/after from getCursorContext:',
                before,
                '|',
                after,
              );
            }
          }
        }
      }

      // 如果仍然无法获取，尝试从 getCursorContext 获取
      if (
        !cursorPosition ||
        typeof cursorPosition !== 'object' ||
        typeof cursorPosition.line !== 'number'
      ) {
        console.warn('⚠️ 无法通过 API 获取光标位置，尝试从上下文计算');
        const cursorContext = getCursorContext();
        if (cursorContext.cursor) {
          cursorPosition = cursorContext.cursor;
          before = cursorContext.before;
          after = cursorContext.after;
          console.log(
            '🔵 Got cursor position from context:',
            cursorPosition,
            'before:',
            before,
            'after:',
            after,
          );
        } else {
          // 最后的备用方案：从文档内容计算
          const doc = editor.getDoc?.() || editor;
          let totalLines = 0;
          if (doc && typeof doc.lineCount === 'function') {
            totalLines = doc.lineCount();
          } else if (doc && typeof doc.lineCount === 'number') {
            totalLines = doc.lineCount;
          } else {
            const content = getEditorContent();
            if (content) {
              totalLines = content.split('\n').length;
            } else {
              totalLines = 1;
            }
          }

          if (totalLines > 0 && cursorContext.before) {
            let line = 0;
            let ch = 0;

            for (let i = 0; i < totalLines; i++) {
              let lineContent = '';
              if (doc && doc.getLine) {
                lineContent = doc.getLine(i) || '';
              } else {
                const content = getEditorContent();
                const lines = content.split('\n');
                lineContent = lines[i] || '';
              }

              if (lineContent.endsWith(cursorContext.before)) {
                line = i;
                ch = lineContent.length;
                break;
              } else if (lineContent.includes(cursorContext.before)) {
                const lastIndex = lineContent.lastIndexOf(cursorContext.before);
                if (lastIndex >= 0) {
                  line = i;
                  ch = lastIndex + cursorContext.before.length;
                  break;
                }
              }
            }

            if (ch === 0 && cursorContext.before) {
              ch = cursorContext.before.length;
            }

            cursorPosition = { line, ch };
            before = cursorContext.before;
            after = cursorContext.after;
            console.log(
              '🔵 Calculated cursor position from context:',
              cursorPosition,
              'before:',
              before,
              'after:',
              after,
            );
          } else {
            console.warn('❌ 无法获取文档行数或 before 为空');
            if (cursorContext.before) {
              cursorPosition = { line: 0, ch: cursorContext.before.length };
              before = cursorContext.before;
              after = cursorContext.after;
            } else {
              setPopoverVisible(false);
              setSearchValue('');
              return;
            }
          }
        }
      }

      // 确保 cursorPosition 有 line 和 ch 属性
      if (
        !cursorPosition ||
        typeof cursorPosition.line !== 'number' ||
        typeof cursorPosition.ch !== 'number'
      ) {
        console.warn('❌ 光标位置格式不正确:', cursorPosition);
        setPopoverVisible(false);
        setSearchValue('');
        return;
      }

      console.log(
        '🔵 Valid cursor position:',
        cursorPosition,
        'before:',
        before,
        'after:',
        after,
      );

      // 获取当前文档的实际内容用于验证
      const currentContent = getEditorContent();
      console.log(
        '🔵 Current document content:',
        JSON.stringify(currentContent),
      );
      console.log('🔵 Current document length:', currentContent.length);

      // 检查编辑器 API
      const doc = editor.getDoc?.() || editor;
      console.log('🔵 Editor API check:', {
        hasGetDoc: !!editor.getDoc,
        hasReplaceRange: !!doc.replaceRange,
        hasReplaceText: !!editor.replaceText,
        hasGetValue: !!editor.getValue,
        hasOnChange: !!onChange,
        editorKeys: Object.keys(editor).slice(0, 20),
        docKeys:
          doc !== editor ? Object.keys(doc).slice(0, 20) : 'same as editor',
      });

      // 优先使用 onChange 回调（如果组件是受控的）
      if (onChange && typeof onChange === 'function') {
        console.log('🔵 Using onChange callback as primary method');

        try {
          // 计算插入位置（字符串索引）
          const beforeMatch = before.match(/(\{+)(\w*)$/);

          if (beforeMatch) {
            const matchLength = beforeMatch[0].length;

            // 计算要删除的起始位置
            const deleteStartCh = Math.max(0, cursorPosition.ch - matchLength);
            // 计算要删除的结束位置（如果有 }，也删除它）
            const deleteEndCh = after.startsWith('}')
              ? cursorPosition.ch + 1
              : cursorPosition.ch;

            // 构建新内容
            const lines = currentContent.split('\n');
            const lineContent = lines[cursorPosition.line] || '';
            const newLineContent =
              lineContent.slice(0, deleteStartCh) +
              variableText +
              lineContent.slice(deleteEndCh);

            lines[cursorPosition.line] = newLineContent;
            const newContent = lines.join('\n');

            console.log(
              '🔵 onChange: deleting from',
              deleteStartCh,
              'to',
              deleteEndCh,
              'in line',
              cursorPosition.line,
            );
            console.log('🔵 onChange: old line:', JSON.stringify(lineContent));
            console.log(
              '🔵 onChange: new line:',
              JSON.stringify(newLineContent),
            );
            console.log(
              '🔵 onChange: old content:',
              JSON.stringify(currentContent),
            );
            console.log(
              '🔵 onChange: new content:',
              JSON.stringify(newContent),
            );

            onChange(newContent);
            console.log(
              '✅ Variable inserted successfully via onChange callback',
            );
            savedCursorContextRef.current = null;
            setPopoverVisible(false);
            setSearchValue('');
            return;
          } else {
            // 如果没有匹配到 {，直接在光标位置插入
            const lines = currentContent.split('\n');
            const lineContent = lines[cursorPosition.line] || '';
            const newLineContent =
              lineContent.slice(0, cursorPosition.ch) +
              variableText +
              lineContent.slice(cursorPosition.ch);

            lines[cursorPosition.line] = newLineContent;
            const newContent = lines.join('\n');

            console.log(
              '🔵 onChange: inserting at position',
              cursorPosition.ch,
            );
            onChange(newContent);
            console.log(
              '✅ Variable inserted successfully via onChange callback (no match)',
            );
            savedCursorContextRef.current = null;
            setPopoverVisible(false);
            setSearchValue('');
            return;
          }
        } catch (onChangeError) {
          console.error('❌ onChange callback failed:', onChangeError);
          // 继续尝试其他方法
        }
      }

      // 备用方案：使用 CodeMirror replaceRange API
      if (doc && doc.replaceRange) {
        console.log('🔵 Using CodeMirror replaceRange API');

        // 计算需要删除的范围（删除 { 或 {{ 以及可能的 }）
        let from = { line: cursorPosition.line, ch: cursorPosition.ch };
        let to = { line: cursorPosition.line, ch: cursorPosition.ch };

        // 使用保存的 before 和 after 来计算删除范围
        const beforeMatch = before.match(/(\{+)(\w*)$/);
        if (beforeMatch) {
          const matchLength = beforeMatch[0].length;
          from = {
            line: cursorPosition.line,
            ch: Math.max(0, cursorPosition.ch - matchLength),
          };

          // 如果光标后是 }，也需要删除它（自动补全的情况）
          if (after.startsWith('}')) {
            to = {
              line: cursorPosition.line,
              ch: cursorPosition.ch + 1,
            };
          } else {
            // 如果没有 }，只删除 before 中的 { 部分
            to = cursorPosition;
          }
        } else {
          // 如果没有匹配到 {，检查是否光标就在 { 后面
          // 这种情况可能是光标位置计算有偏差，尝试从文档重新获取
          const doc = editor.getDoc?.() || editor;
          if (doc && doc.getLine && typeof doc.getLine === 'function') {
            const lineContent = doc.getLine(cursorPosition.line) || '';
            const actualBefore = lineContent.slice(0, cursorPosition.ch);
            const actualAfter = lineContent.slice(cursorPosition.ch);
            console.log(
              '🔵 Actual line content:',
              JSON.stringify(lineContent),
              'before:',
              JSON.stringify(actualBefore),
              'after:',
              JSON.stringify(actualAfter),
            );
            const actualBeforeMatch = actualBefore.match(/(\{+)(\w*)$/);
            if (actualBeforeMatch) {
              const matchLength = actualBeforeMatch[0].length;
              from = {
                line: cursorPosition.line,
                ch: Math.max(0, cursorPosition.ch - matchLength),
              };
              if (actualAfter.startsWith('}')) {
                to = {
                  line: cursorPosition.line,
                  ch: cursorPosition.ch + 1,
                };
              } else {
                to = cursorPosition;
              }
              console.log(
                '🔵 Recalculated from/to using actual line content:',
                from,
                to,
              );
            }
          }
        }

        console.log(
          '🔵 Replace from:',
          from,
          'to:',
          to,
          'text:',
          variableText,
          'before:',
          before,
          'after:',
          after,
        );

        // 验证删除范围是否合理
        const doc = editor.getDoc?.() || editor;
        if (doc && doc.getLine && typeof doc.getLine === 'function') {
          const lineContent = doc.getLine(from.line) || '';
          const deleteText = lineContent.slice(from.ch, to.ch);
          console.log(
            '🔵 Text to be deleted:',
            JSON.stringify(deleteText),
            'line content:',
            JSON.stringify(lineContent),
          );
        }

        try {
          console.log(
            '🔵 CodeMirror replaceRange from:',
            from,
            'to:',
            to,
            'text:',
            variableText,
          );
          doc.replaceRange(variableText, from, to);

          // 设置光标位置到插入的变量后面
          if (doc.setCursor) {
            doc.setCursor({
              line: from.line,
              ch: from.ch + variableText.length,
            });
          }

          console.log('✅ Variable inserted successfully with CodeMirror API');
          // 清除保存的光标上下文
          savedCursorContextRef.current = null;
          setPopoverVisible(false);
          setSearchValue('');
          return;
        } catch (cmError) {
          console.error('❌ CodeMirror replaceRange failed:', cmError);
          // 继续尝试其他方法
        }
      }

      // 优先方案：直接通过构造新内容并替换整个文档（最可靠）
      console.log('🔵 Trying direct content replacement');
      try {
        // 重新获取最新的文档内容
        const latestContent = editor.getValue?.() || currentContent;
        console.log(
          '🔵 Latest editor content:',
          JSON.stringify(latestContent),
          'length:',
          latestContent.length,
        );

        const lines = latestContent.split('\n');
        const lineContent = lines[cursorPosition.line] || '';

        // 计算要删除和插入的位置
        const beforeMatch = before.match(/(\{+)(\w*)$/);
        let deleteStartCh = cursorPosition.ch;
        let deleteEndCh = cursorPosition.ch;

        if (beforeMatch) {
          const matchLength = beforeMatch[0].length;
          deleteStartCh = Math.max(0, cursorPosition.ch - matchLength);
          if (after.startsWith('}')) {
            deleteEndCh = cursorPosition.ch + 1;
          }
        }

        // 构造新的行内容
        const newLineContent =
          lineContent.slice(0, deleteStartCh) +
          variableText +
          lineContent.slice(deleteEndCh);

        lines[cursorPosition.line] = newLineContent;
        const newContent = lines.join('\n');

        console.log('🔵 Content replacement:', {
          oldContent: latestContent,
          newContent: newContent,
          oldLine: lineContent,
          newLine: newLineContent,
        });

        // 尝试使用 replaceText 替换整个文档
        if (typeof editor.replaceText === 'function') {
          console.log('🔵 Using replaceText to replace entire document');
          editor.replaceText({
            from: 0,
            to: latestContent.length,
            text: newContent,
            cursorOffset: deleteStartCh + variableText.length,
            scrollIntoView: true,
            userEvent: 'insertText',
          });
          console.log('✅ Variable inserted via document replacement');
          savedCursorContextRef.current = null;
          setPopoverVisible(false);
          setSearchValue('');
          return;
        }
      } catch (directError) {
        console.error('❌ Direct content replacement failed:', directError);
      }

      // 备用方案：使用 replaceText API 精确替换
      if (typeof editor.replaceText === 'function') {
        console.log('🔵 Trying replaceText API as fallback');

        try {
          // 重新获取最新的文档内容，确保同步
          const latestContent = editor.getValue?.() || currentContent;
          console.log(
            '🔵 Latest editor content for fallback:',
            JSON.stringify(latestContent),
            'length:',
            latestContent.length,
          );

          // 尝试直接获取光标的数字位置（getCursorPosition 应该返回数字）
          let cursorOffset: number;

          if (typeof editor.getCursorPosition === 'function') {
            const pos = editor.getCursorPosition();
            console.log(
              '🔵 getCursorPosition returned:',
              pos,
              'type:',
              typeof pos,
            );

            // 如果返回的是数字，直接使用
            if (typeof pos === 'number') {
              cursorOffset = pos;
            }
            // 如果返回的是对象 {line, ch}，需要转换
            else if (
              pos &&
              typeof pos === 'object' &&
              typeof pos.line === 'number'
            ) {
              const lines = latestContent.split('\n');
              cursorOffset = 0;
              for (let i = 0; i < pos.line; i++) {
                cursorOffset += lines[i].length + 1; // +1 for newline
              }
              cursorOffset += pos.ch || 0;
            } else {
              throw new Error('Invalid cursor position format');
            }
          } else {
            // 如果没有 getCursorPosition，从 cursorPosition 对象计算
            const lines = latestContent.split('\n');
            cursorOffset = 0;
            for (let i = 0; i < cursorPosition.line; i++) {
              cursorOffset += lines[i].length + 1; // +1 for newline
            }
            cursorOffset += cursorPosition.ch;
          }

          console.log('🔵 Calculated cursor offset:', cursorOffset);

          // 使用保存的 before 和 after 计算需要删除的范围
          // 因为这些是在弹窗显示时保存的，更可靠
          let fromOffset = cursorOffset;
          let toOffset = cursorOffset;

          const beforeMatch = before.match(/(\{+)(\w*)$/);
          if (beforeMatch) {
            const matchLength = beforeMatch[0].length;
            fromOffset = Math.max(0, cursorOffset - matchLength);

            if (after.startsWith('}')) {
              toOffset = cursorOffset + 1;
            } else {
              toOffset = cursorOffset;
            }
          }

          // 验证范围是否在文档内
          // CodeMirror 6 的有效位置范围是 [0, length)，即 0 到 length-1
          const docLength = latestContent.length;

          // 修正：toOffset 不能等于 docLength，只能小于
          // 但如果我们要删除最后一个字符（比如 }），toOffset 可能需要等于 docLength
          // 所以这里的验证应该是 toOffset <= docLength
          if (fromOffset < 0 || toOffset > docLength || fromOffset > toOffset) {
            console.error('❌ Replace range invalid:', {
              from: fromOffset,
              to: toOffset,
              docLength: docLength,
              cursorOffset: cursorOffset,
              before: before,
              after: after,
            });

            // 如果范围无效，尝试简单的插入方式（不删除任何内容）
            console.log('🔵 Trying simple insertion without deletion');
            fromOffset = cursorOffset;
            toOffset = cursorOffset;
          }

          console.log(
            '🔵 Replace range:',
            fromOffset,
            'to',
            toOffset,
            'doc length:',
            docLength,
          );
          console.log(
            '🔵 Text to delete:',
            JSON.stringify(latestContent.slice(fromOffset, toOffset)),
          );
          console.log('🔵 Text to insert:', JSON.stringify(variableText));
          console.log(
            '🔵 Validation: from >= 0:',
            fromOffset >= 0,
            'to <= length:',
            toOffset <= docLength,
            'from <= to:',
            fromOffset <= toOffset,
          );

          // 确保范围有效
          // 注意：CodeMirror 6 中，如果 to === docLength，表示选择到文档末尾，这是允许的
          // 但某些情况下可能会报错，所以我们做一个特殊处理
          let validFromOffset = Math.max(0, Math.min(fromOffset, docLength));
          let validToOffset = Math.max(
            validFromOffset,
            Math.min(toOffset, docLength),
          );

          // 特殊处理：如果 toOffset === docLength 并且会报错，我们尝试不删除末尾的字符
          // 只删除开头的 {，保留末尾的 }
          if (toOffset === docLength && after.startsWith('}')) {
            console.log('🔵 Special case: not deleting closing brace at end');
            validToOffset = cursorOffset; // 只删除到光标位置，不包括后面的 }
          }

          if (validFromOffset !== fromOffset || validToOffset !== toOffset) {
            console.warn('⚠️ Adjusted replace range:', {
              originalFrom: fromOffset,
              originalTo: toOffset,
              adjustedFrom: validFromOffset,
              adjustedTo: validToOffset,
            });
          }

          editor.replaceText({
            from: validFromOffset,
            to: validToOffset,
            text: variableText,
            cursorOffset: variableText.length,
            scrollIntoView: true,
            userEvent: 'insertText',
          });
          console.log('✅ Variable inserted with replaceText API');
          savedCursorContextRef.current = null;
          setPopoverVisible(false);
          setSearchValue('');
          return;
        } catch (replaceError) {
          console.error('❌ replaceText API failed:', replaceError);
          console.error('❌ Error details:', {
            message: replaceError.message,
            stack: replaceError.stack,
          });
        }
      }

      // 最终 fallback 1：尝试使用 setValue API
      if (typeof editor.setValue === 'function') {
        console.log('🔵 Fallback: using setValue API');

        try {
          // 重新获取最新内容
          const finalContent = getEditorContent();
          const lines = finalContent.split('\n');
          const lineContent = lines[cursorPosition.line] || '';

          // 计算要删除和插入的位置
          const beforeMatch = before.match(/(\{+)(\w*)$/);
          let deleteStartCh = cursorPosition.ch;
          let deleteEndCh = cursorPosition.ch;

          if (beforeMatch) {
            const matchLength = beforeMatch[0].length;
            deleteStartCh = Math.max(0, cursorPosition.ch - matchLength);
            if (after.startsWith('}')) {
              deleteEndCh = cursorPosition.ch + 1;
            }
          }

          // 构造新的行内容
          const newLineContent =
            lineContent.slice(0, deleteStartCh) +
            variableText +
            lineContent.slice(deleteEndCh);

          lines[cursorPosition.line] = newLineContent;
          const newContent = lines.join('\n');

          console.log('🔵 setValue:', {
            oldContent: finalContent,
            newContent: newContent,
            oldLine: lineContent,
            newLine: newLineContent,
            cursorWillBeAt: deleteStartCh + variableText.length,
          });

          editor.setValue(newContent);

          // 设置光标位置到插入的变量后面
          const newCursorPosition = deleteStartCh + variableText.length;

          // 尝试多种方式设置光标位置
          if (editor.setCursor) {
            editor.setCursor({
              line: cursorPosition.line,
              ch: newCursorPosition,
            });
            console.log('🔵 Cursor set via setCursor');
          } else if (
            editor.getCursorPosition &&
            editor.getCursorPosition() !== undefined
          ) {
            // 如果 getCursorPosition 返回数字，可能有对应的 setCursorPosition
            if (typeof editor.setCursorPosition === 'function') {
              // 需要计算绝对位置
              const lines = newContent.split('\n');
              let absPosition = 0;
              for (let i = 0; i < cursorPosition.line; i++) {
                absPosition += lines[i].length + 1;
              }
              absPosition += newCursorPosition;
              editor.setCursorPosition(absPosition);
              console.log('🔵 Cursor set via setCursorPosition:', absPosition);
            }
          }

          console.log('✅ Variable inserted via setValue API');
          savedCursorContextRef.current = null;
          setPopoverVisible(false);
          setSearchValue('');
          return;
        } catch (setValueError) {
          console.error('❌ setValue API failed:', setValueError);
        }
      }

      // 最终 fallback 2：尝试通过手动构造新内容并调用 onChange
      if (onChange && typeof onChange === 'function') {
        console.log('🔵 Final fallback: using onChange callback');

        try {
          // 重新获取最新内容
          const finalContent = getEditorContent();
          const lines = finalContent.split('\n');
          const lineContent = lines[cursorPosition.line] || '';

          // 计算要删除和插入的位置
          const beforeMatch = before.match(/(\{+)(\w*)$/);
          let deleteStartCh = cursorPosition.ch;
          let deleteEndCh = cursorPosition.ch;

          if (beforeMatch) {
            const matchLength = beforeMatch[0].length;
            deleteStartCh = Math.max(0, cursorPosition.ch - matchLength);
            if (after.startsWith('}')) {
              deleteEndCh = cursorPosition.ch + 1;
            }
          }

          // 构造新的行内容
          const newLineContent =
            lineContent.slice(0, deleteStartCh) +
            variableText +
            lineContent.slice(deleteEndCh);

          lines[cursorPosition.line] = newLineContent;
          const newContent = lines.join('\n');

          console.log('🔵 Final fallback onChange:', {
            oldContent: finalContent,
            newContent: newContent,
            oldLine: lineContent,
            newLine: newLineContent,
          });

          onChange(newContent);
          console.log('✅ Variable inserted via final fallback onChange');
          savedCursorContextRef.current = null;
          setPopoverVisible(false);
          setSearchValue('');
          return;
        } catch (fallbackError) {
          console.error('❌ Final fallback also failed:', fallbackError);
        }
      } else {
        console.warn('⚠️ onChange callback not available');
      }

      console.warn('⚠️ All insertion methods failed');
    } catch (e) {
      console.error('❌ Failed to insert variable:', e);
    }

    // 如果所有方法都失败，隐藏弹窗
    // 清除保存的光标上下文
    savedCursorContextRef.current = null;
    setPopoverVisible(false);
    setSearchValue('');
  };

  // 更新弹窗位置（参考 SmartVariableInput 的实现）
  const updatePopoverPosition = () => {
    setTimeout(() => {
      const newPosition = getCursorPopoverPosition();
      if (newPosition) {
        setPosition(newPosition);
      }
    }, 0);
  };

  // 监听编辑器输入事件
  useEffect(() => {
    if (!editorElement && !containerRef.current) {
      return;
    }

    const container = editorElement || containerRef.current;
    if (!container) return;

    // 查找编辑器 DOM 元素
    const editorDom =
      container.querySelector(
        '.cm-editor, .prompt-editor, [contenteditable="true"]',
      ) || container;

    // 保存光标位置和上下文的辅助函数
    const saveCursorPosition = () => {
      const editor = editorRef?.current;
      if (!editor) return;

      // 先获取光标上下文（包含 before 和 after）
      const cursorContext = getCursorContext();
      let position: { line: number; ch: number } | null = null;

      // 方法1: 使用 getCursorPosition
      const pos = editor.getCursorPosition?.();
      if (pos && typeof pos === 'object' && typeof pos.line === 'number') {
        position = { line: pos.line, ch: pos.ch || 0 };
      }

      // 方法2: 使用 doc.getCursor
      if (!position) {
        const doc = editor.getDoc?.() || editor;
        if (doc && doc.getCursor) {
          const cursor = doc.getCursor();
          if (cursor && typeof cursor.line === 'number') {
            position = { line: cursor.line, ch: cursor.ch || 0 };
          }
        }
      }

      // 方法3: 使用 getCursorContext 返回的 cursor
      if (!position && cursorContext.cursor) {
        position = cursorContext.cursor;
      }

      // 方法4: 从文档内容计算（最后备用方案）
      if (!position) {
        const doc = editor.getDoc?.() || editor;
        if (doc && typeof doc.lineCount === 'function') {
          const totalLines = doc.lineCount();
          if (cursorContext.before) {
            // 尝试找到包含 before 的行
            for (let i = 0; i < totalLines; i++) {
              const lineContent = doc.getLine?.(i) || '';
              if (lineContent.endsWith(cursorContext.before)) {
                position = { line: i, ch: lineContent.length };
                break;
              }
            }
          }
        }
      }

      // 如果找到了位置，保存完整的上下文
      if (position) {
        savedCursorContextRef.current = {
          position,
          before: cursorContext.before || '',
          after: cursorContext.after || '',
        };
        console.log('🔵 Saved cursor context:', savedCursorContextRef.current);
      } else {
        console.warn('⚠️ Failed to save cursor position');
      }
    };

    // 处理输入事件（参考 SmartVariableInput 的实现）
    const handleInput = () => {
      // 使用 shouldShowVariableSelector 检查（基于光标位置）
      if (shouldShowVariableSelector()) {
        // 立即保存当前光标位置（在 DOM 更新之前）
        const cursorContext = getCursorContext();
        const editor = editorRef?.current;

        if (editor && cursorContext.cursor) {
          savedCursorContextRef.current = {
            position: cursorContext.cursor,
            before: cursorContext.before || '',
            after: cursorContext.after || '',
          };
          console.log(
            '🔵 [handleInput] Saved cursor context immediately:',
            savedCursorContextRef.current,
          );
        } else {
          // 如果无法从 cursorContext 获取，尝试使用 saveCursorPosition
          saveCursorPosition();
        }

        setPopoverVisible(true);
        updatePopoverPosition();
        setSearchValue('');
      } else {
        setPopoverVisible(false);
      }
    };

    // 处理键盘事件（只处理触发弹窗的 { 字符，不拦截导航键）
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果弹窗显示，不处理任何键盘事件，让全局监听器处理
      if (popoverVisible) {
        // 不拦截，让事件继续传播到全局监听器
        return;
      }

      // 检测 { 字符输入（参考 SmartVariableInput 的实现）
      if (e.key === '{') {
        // 延迟检查，等待字符被插入
        setTimeout(() => {
          if (shouldShowVariableSelector()) {
            // 立即保存当前光标位置
            const cursorContext = getCursorContext();
            const editor = editorRef?.current;

            if (editor && cursorContext.cursor) {
              savedCursorContextRef.current = {
                position: cursorContext.cursor,
                before: cursorContext.before || '',
                after: cursorContext.after || '',
              };
              console.log(
                '🔵 [handleKeyDown] Saved cursor context immediately:',
                savedCursorContextRef.current,
              );
            } else {
              // 如果无法从 cursorContext 获取，尝试使用 saveCursorPosition
              saveCursorPosition();
            }

            setPopoverVisible(true);
            updatePopoverPosition();
            setSearchValue('');
          }
        }, 0);
      }
    };

    // 添加事件监听（不使用 capture 模式，避免拦截导航键）
    editorDom.addEventListener('input', handleInput);
    editorDom.addEventListener('keydown', handleKeyDown, false);

    // 清理
    return () => {
      editorDom.removeEventListener('input', handleInput);
      editorDom.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [editorElement, popoverVisible, variables]);

  // 处理变量选择
  const handleVariableSelect = (selectedKeys: React.Key[], info: any) => {
    const selectedNode = info.node as TreeNodeData;
    if (selectedNode) {
      const fullPath = buildAdvancedVariablePath(selectedNode, variables, {
        wrapWithBraces: true,
        includeArrayBrackets: true,
      });

      if (fullPath && fullPath.trim() !== '') {
        insertVariable(fullPath);
      }
    }
  };

  // 显示弹窗（手动触发）
  const showPopover = () => {
    setPopoverVisible(true);
    updatePopoverPosition();
  };

  // 隐藏弹窗
  const hidePopover = () => {
    setPopoverVisible(false);
    setSearchValue('');
  };

  return {
    popoverVisible: variables && variables.length > 0 && popoverVisible,
    position,
    searchValue,
    setSearchValue,
    containerRef,
    handleVariableSelect,
    showPopover,
    hidePopover,
    insertVariable,
  };
};
