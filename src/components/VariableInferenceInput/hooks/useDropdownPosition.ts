import React, { useCallback, useState } from 'react';
import { calculateDropdownPosition } from '../utils/positionUtils';
import { extractSearchTextFromInput } from '../utils/textUtils';

export const useDropdownPosition = (
  inputRef: React.RefObject<HTMLTextAreaElement>,
  internalValue: string,
  textCursorPosition: number,
) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // 重新计算下拉框位置
  const recalculateDropdownPosition = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight) || 20;
    const charWidth = parseFloat(computedStyle.fontSize) * 0.6;

    const textBeforeCursor = internalValue.substring(0, textCursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = Math.max(0, lines.length - 1);
    const currentCol = Math.max(0, lines[lines.length - 1]?.length || 0);

    // 获取滚动偏移（增强版本）
    const scrollLeft = textarea.scrollLeft || 0;
    const scrollTop = textarea.scrollTop || 0;

    // 计算相对于视口的光标位置（考虑滚动偏移）
    const cursorX = rect.left + currentCol * charWidth - scrollLeft;
    const cursorY =
      rect.top + currentLine * lineHeight + lineHeight - scrollTop;

    console.log('🎯 Recalculate dropdown position:', {
      rectLeft: rect.left,
      rectTop: rect.top,
      currentLine,
      currentCol,
      lineHeight,
      charWidth,
      scrollLeft,
      scrollTop,
      cursorX,
      cursorY,
    });

    // 重新计算下拉框位置
    const { position } = calculateDropdownPosition(
      cursorX,
      cursorY,
      inputRef.current,
      undefined,
      {
        hasSearch: true,
        searchText: extractSearchTextFromInput(
          internalValue,
          textCursorPosition,
        ),
        treeHeight: 240,
      },
    );

    setCursorPosition(position);
  }, [inputRef, internalValue, textCursorPosition]);

  return { cursorPosition, setCursorPosition, recalculateDropdownPosition };
};
