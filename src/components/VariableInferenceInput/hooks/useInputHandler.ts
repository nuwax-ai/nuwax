import React, { useCallback } from 'react';
import { VariableTreeNode } from '../types';
import { calculateDropdownPosition } from '../utils/positionUtils';
import { extractSearchTextFromInput } from '../utils/textUtils';
import { drillToPath } from '../utils/treeUtils';

export const useInputHandler = (
  internalValue: string,
  setInternalValue: (val: string) => void,
  onChange: ((val: string) => void) | undefined,
  inputRef: React.RefObject<HTMLDivElement>,
  setVisible: (visible: boolean) => void,
  setSelectedKeys: (keys: React.Key[]) => void,
  textCursorPosition: number,
  setTextCursorPosition: (pos: number) => void,
  setCursorPosition: (pos: { x: number; y: number }) => void,
  variableTree: VariableTreeNode[],
  readonly: boolean,
) => {
  // Apply variable or tool
  const handleApplyVariable = useCallback(
    (nodeValue: string, isTool: boolean = false, toolData?: any) => {
      if (readonly) return;

      // If it's a tool, nodeValue might be the tool name or we construct the block here
      // The user said format: {#ToolBlock id="typeId" type="type" name="name"#}toolName{#/ToolBlock#}

      let valueToInsert = nodeValue;
      let prefix = '';
      let suffix = '';
      let replaceStart = 0;
      let searchText = '';

      if (isTool && toolData) {
        // Construct ToolBlock
        // Format: {#ToolBlock id="typeId" type="type" name="name"#}toolName{#/ToolBlock#}
        const id = toolData.typeId || toolData.id;
        const type = toolData.type;
        const name = toolData.name;
        const content = toolData.toolName || toolData.name;

        valueToInsert = `{#ToolBlock id="${id}" type="${type}" name="${name}"#}${content}{#/ToolBlock#}`;
        // For tools, we might not be in a {{ context, or maybe we are?
        // If we are in {{ context, we should replace {{...}} with the tool block?
        // Or maybe tools are inserted differently.
        // Assuming tools are selected from the same dropdown which is triggered by {{ or {.
        // If so, we replace the trigger with the tool block.
      } else {
        // Variable
        valueToInsert = nodeValue;
      }

      searchText = extractSearchTextFromInput(
        internalValue,
        textCursorPosition,
      );

      // Determine if we are in {{ or { mode
      const beforeCursor = internalValue.substring(0, textCursorPosition);
      const lastBraceStart = beforeCursor.lastIndexOf('{');
      const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

      if (lastBraceStart > lastDoubleBraceStart) {
        // Single brace mode {
        replaceStart = internalValue.lastIndexOf('{' + searchText);
        // If it's a tool, we replace {searchText with ToolBlock
        // If it's a variable, we replace {searchText with {{variable}}
        if (isTool) {
          prefix = '';
          suffix = '';
        } else {
          prefix = '{{';
          suffix = '}}';
        }
      } else {
        // Double brace mode {{
        replaceStart = internalValue.lastIndexOf('{{' + searchText);
        if (isTool) {
          prefix = '';
          suffix = '';
        } else {
          prefix = '{{';
          suffix = '}}';
        }
      }

      if (replaceStart >= 0) {
        // If it's a tool, we need to remove the braces that triggered it
        // If it was {{, we remove {{. If {, we remove {.
        // The replaceStart points to the start of the trigger.

        // Calculate length of text to replace
        // It is prefix_len + searchText.length
        // But prefix depends on what was there.

        let triggerLen = 0;
        if (lastBraceStart > lastDoubleBraceStart) {
          triggerLen = 1; // '{'
        } else {
          triggerLen = 2; // '{{'
        }

        const newValue =
          internalValue.substring(0, replaceStart) +
          prefix +
          valueToInsert +
          suffix +
          internalValue.substring(
            replaceStart + triggerLen + searchText.length,
          );

        const newCursorPos =
          replaceStart + prefix.length + valueToInsert.length + suffix.length;

        setInternalValue(newValue);
        onChange?.(newValue);
        setTextCursorPosition(newCursorPos);
      }
    },
    [
      internalValue,
      textCursorPosition,
      readonly,
      setInternalValue,
      onChange,
      setTextCursorPosition,
    ],
  );

  // Handle input change (from contentEditable)
  const handleInputChange = useCallback(
    (newValue: string) => {
      setInternalValue(newValue);
      onChange?.(newValue);

      // Calculate cursor position from selection
      const selection = window.getSelection();
      let cursorPosition = 0;
      if (selection && selection.rangeCount > 0 && inputRef.current) {
        const range = selection.getRangeAt(0);
        // We need to calculate offset relative to the container text content
        // This is tricky with mixed content (text + chips).
        // Our parserUtils converts chips to text markers.
        // So we need a way to map DOM selection to "internalValue" index.
        // This is complex.
        // Simplified approach:
        // If we assume the parserUtils.parseHtmlToValue is correct,
        // we can try to map it.
        // But for now, let's use the helper from useContentEditable if possible?
        // Or just use the text length of the range.

        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(inputRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPosition = preCaretRange.toString().length;
      }

      setTextCursorPosition(cursorPosition);

      // Check for braces to show dropdown
      const beforeCursor = newValue.substring(0, cursorPosition);
      const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');
      const lastBraceStart = beforeCursor.lastIndexOf('{');

      let isInVariableContext = false;

      // Check {{}}
      if (lastDoubleBraceStart !== -1) {
        const afterLastStart = beforeCursor.substring(lastDoubleBraceStart + 2);
        const hasClosingBraces = afterLastStart.includes('}}');
        isInVariableContext = !hasClosingBraces;
      }

      // Check {}
      if (
        !isInVariableContext &&
        lastBraceStart !== -1 &&
        lastBraceStart !== lastDoubleBraceStart
      ) {
        const afterBrace = newValue.substring(lastBraceStart + 1);
        const closingBracePos = afterBrace.indexOf('}');

        if (closingBracePos !== -1) {
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

        // Calculate dropdown position
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rangeRect = range.getBoundingClientRect();

            const top = rangeRect.top === 0 ? rect.top : rangeRect.top;
            const left = rangeRect.left === 0 ? rect.left : rangeRect.left;
            const height = rangeRect.height === 0 ? 20 : rangeRect.height;

            const { position } = calculateDropdownPosition(
              left,
              top + height,
              inputRef.current,
              undefined,
              {
                hasSearch: true,
                searchText: extractSearchTextFromInput(
                  newValue,
                  cursorPosition,
                ),
                treeHeight: 240,
              },
            );
            setCursorPosition(position);
          }
        }

        const currentPath = beforeCursor.substring(lastDoubleBraceStart + 2);
        // We might need to handle drilling differently if we have skills
        drillToPath(variableTree, currentPath);
      } else {
        setVisible(false);
      }
    },
    [
      setInternalValue,
      onChange,
      setTextCursorPosition,
      inputRef,
      setVisible,
      setCursorPosition,
      variableTree,
    ],
  );

  return {
    handleApplyVariable,
    handleInputChange,
  };
};
