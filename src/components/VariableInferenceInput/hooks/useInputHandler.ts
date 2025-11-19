import React, { useCallback } from 'react';
import { calculateDropdownPosition } from '../utils/positionUtils';
import { extractSearchTextFromInput } from '../utils/textUtils';
import { drillToPath } from '../utils/treeUtils';

export const useInputHandler = (
  internalValue: string,
  setInternalValue: (val: string) => void,
  onChange: ((val: string) => void) | undefined,
  inputRef: React.RefObject<HTMLTextAreaElement>,
  setVisible: (visible: boolean) => void,
  setSelectedKeys: (keys: React.Key[]) => void,
  textCursorPosition: number,
  setTextCursorPosition: (pos: number) => void,
  setCursorPosition: (pos: { x: number; y: number }) => void,
  variableTree: any[],
  readonly: boolean,
  deleteHighlightedBlock: (
    cursorPos: number,
    isBackspace: boolean,
  ) => { handled: boolean; newValue?: string; newCursorPos?: number } | boolean,
) => {
  // 应用变量
  const handleApplyVariable = useCallback(
    (nodeValue: string) => {
      if (!inputRef.current) return;

      const textarea = inputRef.current;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const currentValue = internalValue;

      // 查找光标前的 { 或 {{
      const beforeText = currentValue.substring(0, startPos);
      const afterText = currentValue.substring(endPos);

      // 首先检查是否在单个 { } 之间
      const lastBraceStart = beforeText.lastIndexOf('{');
      const lastDoubleBraceStart = beforeText.lastIndexOf('{{');

      // 重新设计模式检测逻辑
      let mode: 'single' | 'double' = 'double';
      let braceStartPos = lastDoubleBraceStart;

      // 强制使用单大括号模式的条件：确实在单个 {} 中间
      const isInSingleBraceContext = () => {
        if (lastBraceStart !== -1) {
          const afterBrace = currentValue.substring(lastBraceStart + 1);
          const closingBracePos = afterBrace.indexOf('}');

          if (closingBracePos !== -1) {
            // 检查光标是否精确在 { 和 } 之间
            const isInRange =
              startPos > lastBraceStart &&
              startPos <= lastBraceStart + 1 + closingBracePos;

            // 额外检查：确保中间没有其他的大括号对
            const betweenBraces = currentValue.substring(
              lastBraceStart + 1,
              startPos,
            );
            const hasOtherBraces =
              betweenBraces.includes('{') || betweenBraces.includes('}');

            // 确保这不是 {{}} 的情况
            const isNotDoubleBrace = lastBraceStart !== lastDoubleBraceStart;

            return isInRange && !hasOtherBraces && isNotDoubleBrace;
          }
        }
        return false;
      };

      if (isInSingleBraceContext()) {
        mode = 'single';
        braceStartPos = lastBraceStart;
      }

      let finalText: string;
      let newCursorPos: number;

      // 在处理前验证模式选择的正确性
      const validateMode = () => {
        if (mode === 'single') {
          // 确保确实在单个 {} 上下文中
          if (braceStartPos < 0 || braceStartPos >= currentValue.length) {
            return false;
          }

          const braceContent = currentValue.substring(
            braceStartPos,
            Math.min(braceStartPos + 10, currentValue.length),
          );
          if (!braceContent.startsWith('{')) {
            return false;
          }
        }
        return true;
      };

      if (!validateMode()) {
        mode = 'double';
        braceStartPos = lastDoubleBraceStart;
      }

      if (mode === 'single') {
        // 单个大括号模式：{...} -> {{xxx}}，光标移到末尾
        const beforeBrace = currentValue.substring(0, braceStartPos);

        // 找到对应的 } 位置
        const afterOpeningBrace = currentValue.substring(braceStartPos + 1);
        const closingBracePos = afterOpeningBrace.indexOf('}');

        if (closingBracePos !== -1) {
          // 完整的 {xxx} 结构，替换为 {{xxx}}
          const completeBeforeBrace = currentValue.substring(0, braceStartPos);
          const completeAfterBrace = currentValue.substring(
            braceStartPos + 1 + closingBracePos + 1,
          );

          // 检查是否已经被双大括号包围，避免重复添加
          const originalBraceContent = currentValue.substring(
            braceStartPos,
            braceStartPos + 1 + closingBracePos + 1,
          );
          const isAlreadyDoubleBrace =
            originalBraceContent.startsWith('{{') &&
            originalBraceContent.endsWith('}}');

          if (isAlreadyDoubleBrace) {
            // 如果已经是被 {{ }} 包围的，直接替换内容
            const beforeDoubleBrace = currentValue.substring(0, braceStartPos);
            const afterDoubleBrace = currentValue.substring(
              braceStartPos + originalBraceContent.length,
            );
            finalText =
              beforeDoubleBrace + `{{${nodeValue}}}` + afterDoubleBrace;
            newCursorPos = beforeDoubleBrace.length + 2 + nodeValue.length + 2; // {{变量名}}
          } else {
            // 正常的 {xxx} -> {{xxx}} 转换
            finalText =
              completeBeforeBrace + `{{${nodeValue}}}` + completeAfterBrace;
            newCursorPos =
              completeBeforeBrace.length + 2 + nodeValue.length + 2; // {{变量名}}
          }
        } else {
          // 只有 {xxx，没有 }，添加 }} 变成 {{xxx}}
          finalText = beforeBrace + `{{${nodeValue}}}` + afterText;
          newCursorPos = beforeBrace.length + 2 + nodeValue.length + 2; // {{变量名}}
        }
      } else {
        // 双大括号模式：保持原有逻辑
        const lastStartPos = lastDoubleBraceStart;
        if (lastStartPos !== -1) {
          // 检查是否有匹配的 }} 结束位置
          const afterStartText = beforeText.substring(lastStartPos + 2); // 从 {{ 后开始
          const endPosMatch = afterStartText.indexOf('}}');

          if (endPosMatch !== -1) {
            // 替换现有的变量引用（包含 {{ 和 }}）
            const beforeVariable = beforeText.substring(0, lastStartPos);
            const afterVariable = afterText.substring(endPosMatch + 2); // 跳过 }}
            finalText = beforeVariable + `{{${nodeValue}}}` + afterVariable;
            newCursorPos = beforeVariable.length + 2 + nodeValue.length + 2; // {{变量名}}
          } else {
            // 完成新的变量引用
            const beforeVariable = beforeText.substring(0, lastStartPos);
            finalText = beforeVariable + `{{${nodeValue}}}` + afterText;
            newCursorPos = beforeVariable.length + 2 + nodeValue.length + 2; // {{变量名}}
          }
        } else {
          // 如果没有找到 {{，则在当前位置插入变量
          finalText =
            currentValue.substring(0, startPos) +
            `{{${nodeValue}}}` +
            afterText;
          newCursorPos = startPos + 2 + nodeValue.length + 2; // {{变量名}}
        }
      }

      setInternalValue(finalText);
      onChange?.(finalText);

      // 添加最终检查：防止生成错误的大括号结构
      const bracketError = finalText.match(/\{[^}]*\{[^}]*\}/);
      if (bracketError && finalText.includes('{{{')) {
        // 自动修正：移除多余的大括号
        finalText = finalText.replace(/\{\{\{/g, '{{');
        finalText = finalText.replace(/\}\}\}/g, '}}');
        setInternalValue(finalText);
        onChange?.(finalText);
      }

      // 设置光标位置到变量引用后面
      setTimeout(() => {
        if (inputRef.current) {
          const textarea = inputRef.current;

          // 验证光标位置是否在有效范围内
          const maxPos = finalText.length;
          const safeCursorPos = Math.min(Math.max(0, newCursorPos), maxPos);

          textarea.setSelectionRange(safeCursorPos, safeCursorPos);
          textarea.focus();
        }
      }, 10); // 增加延时确保DOM更新完成

      // 关闭下拉框
      setVisible(false);
      setSelectedKeys([]);
    },
    [
      internalValue,
      onChange,
      inputRef,
      setVisible,
      setSelectedKeys,
      setInternalValue,
    ],
  );

  // 处理输入变化
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart || 0;
      const prevValue = internalValue;

      // 更新文本光标位置
      setTextCursorPosition(cursorPosition);

      // 检测删除操作（文本长度减少）
      if (!readonly && newValue.length < prevValue.length) {
        // 检查是否为一次性删除高亮区块
        // 使用当前光标位置和前一个光标位置来判断删除类型
        const prevCursorPos = textCursorPosition; // 之前保存的光标位置
        const isBackspace = cursorPosition <= prevCursorPos; // 光标位置没有移动或后退，说明是退格键
        const result = deleteHighlightedBlock(cursorPosition, isBackspace);

        if (typeof result === 'object' && result.handled) {
          // 如果 hook 返回了新的值，我们需要在这里更新状态
          if (result.newValue !== undefined) {
            setInternalValue(result.newValue);
            onChange?.(result.newValue);
          }
          if (result.newCursorPos !== undefined) {
            setTextCursorPosition(result.newCursorPos);
            // 同步设置输入框的光标位置
            if (inputRef.current) {
              setTimeout(() => {
                const textarea = inputRef.current;
                if (textarea) {
                  textarea.setSelectionRange(
                    result.newCursorPos!,
                    result.newCursorPos!,
                  );
                  textarea.focus();
                }
              }, 0);
            }
          }
          return; // 已经处理了删除操作，不执行后续逻辑
        } else if (result === true) {
          // 兼容旧的返回类型，如果返回 true 表示已处理（但状态更新可能在 hook 内部做了？不，我们在 hook 里移除了状态更新）
          // 所以这里应该不会走到 result === true 的分支，除非 hook 实现变了
          return;
        }
      }

      // 检测是否刚输入了单个 {，如果是则自动补全 }
      let shouldAutoCompleteBrace = false;
      if (
        !readonly &&
        cursorPosition > 0 &&
        newValue.length > prevValue.length
      ) {
        // 只在文本增加时检查（排除删除操作）
        const charAtCursor =
          cursorPosition > 0 ? newValue[cursorPosition - 1] : '';
        // 优化检测条件：只对单个 { 触发自动补全，避免干扰 {{
        if (charAtCursor === '{') {
          // 检查光标位置附近是否有 {{，而不是检查整个文本
          const nearbyText = newValue.substring(
            Math.max(0, cursorPosition - 3),
            Math.min(newValue.length, cursorPosition + 3),
          );
          const hasDoubleBraceNearby = nearbyText.includes('{{');

          // 额外检查：确保不是连续的 { 字符
          const prevChar =
            cursorPosition > 1 ? newValue[cursorPosition - 2] : '';

          if (!hasDoubleBraceNearby && prevChar !== '{') {
            shouldAutoCompleteBrace = true;
          }
        }
      }

      if (shouldAutoCompleteBrace) {
        // 插入闭合的 } 并将光标移到中间
        const beforeCursor = newValue.substring(0, cursorPosition);
        const afterCursor = newValue.substring(cursorPosition);
        const newText = beforeCursor + '}' + afterCursor;

        // 计算新的光标位置：保持在 {} 中间
        const newCursorPosition = cursorPosition; // 光标位置不变，正好在 {} 中间

        setInternalValue(newText);
        onChange?.(newText);

        // 强制设置可见状态，确保下拉框显示
        setVisible(true);

        // 延迟设置光标位置，确保DOM更新完成
        setTimeout(() => {
          if (inputRef.current) {
            const textarea = inputRef.current;
            textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 10);

        // 检查是否需要显示变量选择框
        const beforeBrace = newText.substring(0, cursorPosition);
        const lastBraceStart = beforeBrace.lastIndexOf('{');
        if (lastBraceStart !== -1) {
          // 检查光标是否在 { } 之间
          const afterBrace = newText.substring(lastBraceStart + 1);
          const closingBracePos = afterBrace.indexOf('}');

          if (closingBracePos !== -1) {
            // 检查光标是否在 { 和 } 之间
            const isInBraces =
              cursorPosition > lastBraceStart &&
              cursorPosition <= lastBraceStart + 1 + closingBracePos;

            if (isInBraces) {
              setVisible(true);

              // 计算光标位置
              if (inputRef.current) {
                const textarea = inputRef.current;
                const rect = textarea.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(textarea);
                const lineHeight = parseInt(computedStyle.lineHeight) || 20;
                const charWidth = parseFloat(computedStyle.fontSize) * 0.6; // 提高精度

                // 计算光标在文本中的位置
                const textBeforeCursor = newText.substring(0, cursorPosition);
                const lines = textBeforeCursor.split('\n');
                const currentLine = Math.max(0, lines.length - 1);
                const currentCol = Math.max(
                  0,
                  lines[lines.length - 1]?.length || 0,
                );

                // 获取文本框的滚动偏移（增强版本）
                const scrollLeft = textarea.scrollLeft || 0;
                const scrollTop = textarea.scrollTop || 0;

                // 计算光标相对于视口的像素位置（考虑滚动偏移）
                const cursorX = rect.left + currentCol * charWidth - scrollLeft;
                const cursorY =
                  rect.top + currentLine * lineHeight + lineHeight - scrollTop;

                // 使用改进的位置计算函数
                const { position } = calculateDropdownPosition(
                  cursorX,
                  cursorY,
                  inputRef.current, // DOM元素或undefined
                  undefined, // dimensions，使用默认值
                  {
                    hasSearch: true, // 变量引用下拉框始终有搜索区域
                    searchText: extractSearchTextFromInput(
                      newText,
                      cursorPosition,
                    ),
                    treeHeight: 240, // tree-list-content的固定高度
                  },
                );

                setCursorPosition(position);
              }
            } else {
              setVisible(false);
            }
          } else {
            setVisible(false);
          }
        } else {
          setVisible(false);
        }

        return; // 提前返回，不执行后续逻辑
      }

      setInternalValue(newValue);
      onChange?.(newValue);

      // 继续原有的 {{ 处理逻辑，同时支持 {} 模式
      const beforeCursor = newValue.substring(0, cursorPosition);
      const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');
      const lastBraceStart = beforeCursor.lastIndexOf('{');

      let isInVariableContext = false;

      // 检查是否在 {{}} 中
      if (lastDoubleBraceStart !== -1) {
        const afterLastStart = beforeCursor.substring(lastDoubleBraceStart + 2);
        const hasClosingBraces = afterLastStart.includes('}}');
        isInVariableContext = !hasClosingBraces;
      }

      // 检查是否在 {} 中（单大括号模式）
      if (
        !isInVariableContext &&
        lastBraceStart !== -1 &&
        lastBraceStart !== lastDoubleBraceStart
      ) {
        const afterBrace = newValue.substring(lastBraceStart + 1);
        const closingBracePos = afterBrace.indexOf('}');

        if (closingBracePos !== -1) {
          // 检查光标是否在 { 和 } 之间
          const isInBraces =
            cursorPosition > lastBraceStart &&
            cursorPosition <= lastBraceStart + 1 + closingBracePos;

          if (isInBraces) {
            isInVariableContext = true;
          }
        }
      }

      if (isInVariableContext) {
        setVisible(true);

        // 计算光标的屏幕位置
        if (inputRef.current) {
          const textarea = inputRef.current;
          const rect = textarea.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(textarea);
          const lineHeight = parseInt(computedStyle.lineHeight) || 20;
          const charWidth = parseFloat(computedStyle.fontSize) * 0.6; // 提高精度

          // 计算光标在文本中的位置
          const textBeforeCursor = newValue.substring(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = Math.max(0, lines.length - 1);
          const currentCol = Math.max(0, lines[lines.length - 1]?.length || 0);

          // 获取文本框的滚动偏移（增强版本）
          const scrollLeft = textarea.scrollLeft || 0;
          const scrollTop = textarea.scrollTop || 0;

          // 计算光标相对于视口的像素位置（考虑滚动偏移）
          const cursorX = rect.left + currentCol * charWidth - scrollLeft;
          const cursorY =
            rect.top + currentLine * lineHeight + lineHeight - scrollTop;

          // 使用改进的位置计算函数
          const { position } = calculateDropdownPosition(
            cursorX,
            cursorY,
            inputRef.current, // DOM元素或undefined
            undefined, // dimensions，使用默认值
            {
              hasSearch: true, // 变量引用下拉框始终有搜索区域
              searchText: extractSearchTextFromInput(newValue, cursorPosition),
              treeHeight: 240, // tree-list-content的固定高度
            },
          );

          setCursorPosition(position);
        }

        // 提取当前的变量路径
        const currentPath = beforeCursor.substring(lastDoubleBraceStart + 2);

        // 展开到当前路径
        drillToPath(variableTree, currentPath);
      } else {
        setVisible(false);
        setSelectedKeys([]);
      }
    },
    [
      internalValue,
      readonly,
      variableTree,
      onChange,
      textCursorPosition,
      deleteHighlightedBlock,
      inputRef,
      setInternalValue,
      setTextCursorPosition,
      setVisible,
      setCursorPosition,
      setSelectedKeys,
    ],
  );

  return {
    handleApplyVariable,
    handleInputChange,
  };
};
