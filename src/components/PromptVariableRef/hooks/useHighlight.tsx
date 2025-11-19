import React, { useCallback } from 'react';

export const useHighlight = (
  internalValue: string,
  // onChange: ((value: string) => void) | undefined,
  // inputRef: React.RefObject<HTMLTextAreaElement>,
  // setTextCursorPosition: (pos: number) => void
) => {
  // 高亮显示变量引用 - 增强版本，处理尾随换行
  const renderHighlightedText = useCallback((text: string) => {
    // 处理尾随换行的问题
    const processedText = text.endsWith('\n') ? text + '\n' : text;

    const regex = /\{\{([^}]+)\}\}/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(processedText)) !== null) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        parts.push(processedText.substring(lastIndex, match.index));
      }

      // 添加高亮的变量引用
      const fullMatch = match[0]; // 完整的 {{变量名}} 匹配
      parts.push(
        <span
          key={`variable-${match.index}`}
          className="variable-highlight"
          data-variable-start={match.index}
          data-variable-end={match.index + fullMatch.length}
          data-variable-content={fullMatch}
        >
          {fullMatch}
        </span>,
      );

      lastIndex = match.index + fullMatch.length;
    }

    // 添加剩余的普通文本（包括尾随换行）
    if (lastIndex < processedText.length) {
      parts.push(processedText.substring(lastIndex));
    }

    return parts;
  }, []);

  // 识别光标位置是否在高亮区块中，并返回高亮区块信息
  const findHighlightedBlockAtCursor = useCallback(
    (text: string, cursorPos: number) => {
      const regex = /\{\{([^}]+)\}\}/g;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0];
        const startPos = match.index;
        const endPos = startPos + fullMatch.length;

        // 检查光标是否在高亮区块中
        if (cursorPos >= startPos && cursorPos <= endPos) {
          return {
            start: startPos,
            end: endPos,
            content: fullMatch,
            variableName: match[1],
          };
        }
      }

      return null;
    },
    [],
  );

  // 一次性删除高亮区块
  const deleteHighlightedBlock = useCallback(
    (cursorPos: number, isBackspace: boolean = true) => {
      const highlightedBlock = findHighlightedBlockAtCursor(
        internalValue,
        cursorPos,
      );

      if (!highlightedBlock) return false; // 没有找到高亮区块，不拦截删除操作

      console.log('发现高亮区块，一次性删除:', highlightedBlock);

      let newValue = internalValue;
      let newCursorPos = cursorPos;

      if (isBackspace) {
        // 退格键：从光标位置往前删除到高亮区块开始
        if (cursorPos >= highlightedBlock.start) {
          // 如果光标在高亮区块中间或后面，删除整个高亮区块
          newValue =
            internalValue.substring(0, highlightedBlock.start) +
            internalValue.substring(highlightedBlock.end);
          newCursorPos = highlightedBlock.start;
        } else {
          // 如果光标在高亮区块前面，正常删除（不拦截）
          return false;
        }
      } else {
        // 删除键：从光标位置往后删除到高亮区块结束
        if (cursorPos <= highlightedBlock.end) {
          // 如果光标在高亮区块中间或前面，删除整个高亮区块
          newValue =
            internalValue.substring(0, highlightedBlock.start) +
            internalValue.substring(highlightedBlock.end);
          newCursorPos = highlightedBlock.start;
        } else {
          // 如果光标在高亮区块后面，正常删除（不拦截）
          return false;
        }
      }

      // 更新值和光标位置
      // 注意：这里我们不直接调用 setInternalValue，而是通过 onChange 回调
      // 但在这个 hook 中，我们无法直接更新 internalValue，所以需要返回新的值和光标位置
      // 或者，我们可以要求传入 setInternalValue
      // 为了保持一致性，我们这里假设调用者会处理状态更新

      // 这里有一个问题：原始代码中直接调用了 setInternalValue 和 onChange
      // 我们需要让 hook 返回处理结果，或者传入 setInternalValue

      // 让我们修改一下设计，让 deleteHighlightedBlock 返回处理结果
      // 调用者根据结果来更新状态

      return {
        handled: true,
        newValue,
        newCursorPos,
      };
    },
    [internalValue, findHighlightedBlockAtCursor],
  );

  return { renderHighlightedText, deleteHighlightedBlock };
};
