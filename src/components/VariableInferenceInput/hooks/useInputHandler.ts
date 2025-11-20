import React, { useCallback } from 'react';
import { VariableTreeNode } from '../types';
import {
  ExpressionEditorParser,
  ExpressionEditorSegment,
  ExpressionEditorSegmentType,
} from '../utils/expressionParser';
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
  setCursorToPosition: (position: number) => void,
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

        // Check if there are closing braces after the cursor/search text
        const afterCursorIndex = replaceStart + triggerLen + searchText.length;
        const contentAfter = internalValue.substring(afterCursorIndex);

        let charsToSkip = 0;
        if (!isTool) {
          // For variables, check for '}}' or '}'
          if (contentAfter.startsWith('}}')) {
            charsToSkip = 2;
          } else if (contentAfter.startsWith('}')) {
            charsToSkip = 1;
          }
        } else {
          // For tools, check for '}' if it was triggered by '{'
          // But tools replace the whole block usually.
          // If we triggered with '{', and there is a closing '}', we might want to consume it?
          // The tool block format is {#...#}...{#...#}. It doesn't use simple braces.
          // But if the user typed '{', auto-completion might have added '}'.
          if (contentAfter.startsWith('}')) {
            charsToSkip = 1;
          }
        }

        const newValue =
          internalValue.substring(0, replaceStart) +
          prefix +
          valueToInsert +
          suffix +
          internalValue.substring(afterCursorIndex + charsToSkip);

        const newCursorPos =
          replaceStart + prefix.length + valueToInsert.length + suffix.length;

        setInternalValue(newValue);
        onChange?.(newValue);
        setTextCursorPosition(newCursorPos);

        // Set cursor position in the DOM after a short delay to ensure the content is rendered
        setTimeout(() => {
          setCursorToPosition(newCursorPos);
        }, 0);
      }
    },
    [
      internalValue,
      textCursorPosition,
      readonly,
      setInternalValue,
      onChange,
      setTextCursorPosition,
      setCursorToPosition,
      setVisible,
    ],
  );

  // Handle input change (from contentEditable)
  const handleInputChange = useCallback(
    (newValue: string) => {
      // Calculate cursor position from selection first to know where the change happened
      const selection = window.getSelection();
      let cursorPosition = 0;
      if (selection && selection.rangeCount > 0 && inputRef.current) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(inputRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPosition = preCaretRange.toString().length;
      }

      // Check if the change was a single '{' insertion
      // We compare length and content around cursor
      const isInsertion = newValue.length === internalValue.length + 1;
      const insertedChar = newValue.charAt(cursorPosition - 1);

      let finalValue = newValue;
      let finalCursorPos = cursorPosition;

      if (isInsertion && insertedChar === '{') {
        // Check if we should auto-close
        // Don't auto-close if the next char is already '}' (avoid duplication)
        const nextChar = newValue.charAt(cursorPosition);
        if (nextChar !== '}') {
          // Insert '}'
          finalValue =
            newValue.substring(0, cursorPosition) +
            '}' +
            newValue.substring(cursorPosition);
          // We don't move cursor forward, it stays between {}
          // But we need to tell the parent component about the new value
        }
      }

      setInternalValue(finalValue);
      onChange?.(finalValue);
      setTextCursorPosition(finalCursorPos);

      // Check for braces to show dropdown
      // Use finalValue and finalCursorPos

      // We need to pass the "line" to the parser.
      // Since we are in a single-line-ish input (or multi-line), we should treat the whole content or the current line?
      // The parser expects "lineContent" and "lineOffset".
      // If we have newlines, we should probably find the current line.
      // But for simplicity, let's treat the whole text as one "line" if possible,
      // OR find the start/end of the current line.

      // Let's find the current line boundaries around the cursor.
      const lastNewline = finalValue.lastIndexOf('\n', finalCursorPos - 1);
      const nextNewline = finalValue.indexOf('\n', finalCursorPos);
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
      const lineEnd = nextNewline === -1 ? finalValue.length : nextNewline;

      const lineContent = finalValue.substring(lineStart, lineEnd);
      const lineOffset = finalCursorPos - lineStart;

      const parseResult = ExpressionEditorParser.parse({
        lineContent,
        lineOffset,
      });

      let isInVariableContext = false;
      let searchText = '';
      let currentPath = '';

      if (parseResult) {
        // If we got a result, it means we are inside {{...}}
        isInVariableContext = true;

        // Construct search text / path from segments
        // The parser returns "reachable" segments (what is before the cursor)
        const segments = parseResult.segments.reachable;
        if (segments && segments.length > 0) {
          // Reconstruct path from segments
          // e.g. ['user', 'name'] -> "user.name"
          // e.g. ['array', '[0]'] -> "array[0]"

          // Actually, drillToPath expects a string path like "user.name".
          // We can reconstruct it.
          currentPath = segments
            .map((seg: ExpressionEditorSegment) => {
              if (seg.type === ExpressionEditorSegmentType.ArrayIndex) {
                return `[${seg.arrayIndex}]`;
              }
              return seg.objectKey || '';
            })
            .join('.');

          // Fix join: array index shouldn't have dot before it?
          // "user.[0]" is wrong. "user[0]" is right.
          // But drillToPath might handle dots?
          // Let's look at drillToPath in treeUtils.
          // It splits by '.'.
          // So "user[0]" might be treated as one key "user[0]"?
          // Or "user" then "[0]"?
          // If treeUtils expects dot-separated keys, we might need to adjust.
          // But for now, let's just use the raw text from the start of the expression to the cursor.

          // Actually, extractSearchTextFromInput was doing:
          // return input.substring(start, cursor);

          // parseResult.content.reachable is exactly that!
          // It is the content inside {{...}} up to the cursor.
          searchText = parseResult.content.reachable;
          currentPath = searchText;
        } else {
          // Empty or just started
          searchText = parseResult.content.reachable || '';
          currentPath = searchText;
        }
      } else {
        // Parser returned undefined - no complete {{...}} found
        // But we still want to show dropdown for incomplete expressions like {{ or {
        // Fallback to the original simple brace detection

        const beforeCursor = finalValue.substring(0, finalCursorPos);
        const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');
        const lastBraceStart = beforeCursor.lastIndexOf('{');

        // Check {{
        if (lastDoubleBraceStart !== -1) {
          const afterLastStart = beforeCursor.substring(
            lastDoubleBraceStart + 2,
          );
          const hasClosingBraces = afterLastStart.includes('}}');

          // Don't show dropdown if content starts with space
          if (!hasClosingBraces && !afterLastStart.startsWith(' ')) {
            isInVariableContext = true;
            currentPath = afterLastStart;
            searchText = afterLastStart;
          }
        }

        // Check { (single brace for Skill context)
        if (
          !isInVariableContext &&
          lastBraceStart !== -1 &&
          lastBraceStart !== lastDoubleBraceStart &&
          lastBraceStart !== lastDoubleBraceStart - 1 // Don't match the second { of {{
        ) {
          const contentAfterBrace = beforeCursor.substring(lastBraceStart + 1);
          const hasClosingBefore = contentAfterBrace.includes('}');

          // Don't show dropdown if content starts with space or #
          if (
            !hasClosingBefore &&
            !contentAfterBrace.startsWith(' ') &&
            !contentAfterBrace.startsWith('#')
          ) {
            isInVariableContext = true;
            currentPath = contentAfterBrace;
            searchText = contentAfterBrace;
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
                searchText: searchText, // Use extracted searchText
                treeHeight: 240,
              },
            );
            setCursorPosition(position);
          }
        }

        drillToPath(variableTree, currentPath);
      } else {
        setVisible(false);
      }
    },
    [
      internalValue, // Added dependency
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
