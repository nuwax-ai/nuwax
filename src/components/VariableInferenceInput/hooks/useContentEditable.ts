import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { parseHtmlToValue, parseValueToHtml } from '../utils/parserUtils';

// Helper to get the linear cursor position from the DOM
const getCursorPosition = (root: Node): number => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);

  // Helper to get the length of a node
  const getNodeLength = (node: Node): number => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.length || 0;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // For BR tags, length is 1
      if (element.tagName === 'BR') {
        return 1;
      }

      // For tool blocks, they are treated as a single unit in the raw value
      // But in the DOM they might have complex structure.
      // However, parseHtmlToValue extracts their full text representation.
      // So we should probably calculate the length of their "value" representation.
      if (element.classList.contains('tool-block-chip')) {
        const toolId = element.getAttribute('data-tool-id') || '';
        const toolType = element.getAttribute('data-tool-type') || '';
        const toolName = element.getAttribute('data-tool-name') || '';
        const content = element.textContent || '';
        return `{#ToolBlock id="${toolId}" type="${toolType}" name="${toolName}"#}${content}{#/ToolBlock#}`
          .length;
      }

      // For variable blocks, in the "dirty" DOM state (user typing),
      // they behave like normal elements with text content.
      // We should NOT use fixed length here because the user might have added text inside.
      // We will traverse their children in calculatePosition.
      return 0;
    }
    return 0;
  };

  // Helper to get the full length of a node (recursive for elements)
  const getFullNodeLength = (node: Node): number => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.length || 0;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName === 'BR') return 1;
      if (element.classList.contains('tool-block-chip')) {
        return getNodeLength(element);
      }
      // For variables and other containers, sum children
      let len = 0;
      node.childNodes.forEach((child) => {
        len += getFullNodeLength(child);
      });
      return len;
    }
    return 0;
  };

  // Helper function to calculate position recursively
  const calculatePosition = (
    node: Node,
    targetNode: Node,
    targetOffset: number,
  ): number | null => {
    if (node === targetNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        return targetOffset;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // targetOffset is the child index
        // We need to calculate the length of all children before targetOffset
        let position = 0;
        for (let i = 0; i < targetOffset && i < node.childNodes.length; i++) {
          const child = node.childNodes[i];
          // If it's a tool block, use its special length
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            (child as HTMLElement).classList.contains('tool-block-chip')
          ) {
            const len = getNodeLength(child);
            console.log('Debug Cursor: Found Tool Block', {
              len,
              html: (child as HTMLElement).outerHTML,
            });
            position += len;
          } else {
            // For other nodes (text, variables, BRs), we need to traverse or get length
            const len = getFullNodeLength(child);
            console.log('Debug Cursor: Node', {
              type: child.nodeType,
              tagName: (child as HTMLElement).tagName,
              className: (child as HTMLElement).className,
              len,
            });
            position += len;
          }
        }
        return position;
      }
      return 0;
    }

    let position = 0;

    if (node.nodeType === Node.TEXT_NODE) {
      return null; // Not found in this text node
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // Handle tool chips - treat as atomic
      if (element.classList.contains('tool-block-chip')) {
        const toolLength = getNodeLength(element);
        // Check if target is inside this chip (shouldn't happen if contenteditable=false, but just in case)
        if (element.contains(targetNode) || element === targetNode) {
          // If cursor is somehow inside, we just return the start of the tool block?
          // Or maybe we should try to be more precise?
          // Given tools are not editable, let's assume cursor is at end if matched
          return toolLength;
        }
        return null;
      }

      // Handle BR tags
      if (element.tagName === 'BR') {
        if (element === targetNode || element.contains(targetNode)) {
          return 1;
        }
        return null;
      }
    }

    // Recursive step for children
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      const result = calculatePosition(child, targetNode, targetOffset);

      if (result !== null) {
        return position + result;
      }

      // If child is not the target, add its length to position
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        (child as HTMLElement).classList.contains('tool-block-chip')
      ) {
        position += getNodeLength(child);
      } else {
        position += getFullNodeLength(child);
      }
    }

    return null;
  };

  const pos = calculatePosition(root, range.endContainer, range.endOffset);
  return pos !== null ? pos : 0;
};

// Helper to set the cursor position based on linear index
const setCursorPosition = (root: Node, position: number) => {
  const selection = window.getSelection();
  if (!selection) return;

  let charCount = 0;
  let targetNode: Node | null = null;
  let targetOffset = 0;

  const traverse = (node: Node) => {
    if (targetNode) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      if (charCount + textLength >= position) {
        targetNode = node;
        targetOffset = position - charCount;
        return;
      }
      charCount += textLength;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // Handle tool chips - treat as atomic
      if (element.classList.contains('tool-block-chip')) {
        const toolId = element.getAttribute('data-tool-id') || '';
        const toolType = element.getAttribute('data-tool-type') || '';
        const toolName = element.getAttribute('data-tool-name') || '';
        const content = element.textContent || '';
        const toolLength =
          `{#ToolBlock id="${toolId}" type="${toolType}" name="${toolName}"#}${content}{#/ToolBlock#}`
            .length;

        if (charCount + toolLength >= position) {
          // Position is within or at the end of this chip
          // Place cursor after the chip
          targetNode = element.parentNode;
          targetOffset =
            Array.from(element.parentNode?.childNodes || []).indexOf(element) +
            1;
          return;
        }
        charCount += toolLength;
        return; // Don't traverse children
      }

      // Handle BR tags
      if (element.tagName === 'BR') {
        if (charCount + 1 >= position) {
          targetNode = element.parentNode;
          targetOffset =
            Array.from(element.parentNode?.childNodes || []).indexOf(element) +
            1;
          return;
        }
        charCount += 1;
        return;
      }

      // Traverse children for other elements (including variable blocks)
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
        if (targetNode) return;
      }
    }
  };

  traverse(root);

  if (targetNode) {
    const range = document.createRange();
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

export const useContentEditable = (
  value: string,
  onChange: (value: string, cursorPosition?: number) => void,
  readonly: boolean,
  disabled: boolean,
) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [internalHtml, setInternalHtml] = useState('');

  // Keep track of the last known cursor position to restore it after updates
  const cursorPositionRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  // Track previous value for auto-completion detection
  const previousValueRef = useRef<string>(value);

  // Initialize HTML from value
  useEffect(() => {
    // Get current cursor position before re-parsing
    let cursorPos = -1;
    if (
      contentEditableRef.current &&
      document.activeElement === contentEditableRef.current
    ) {
      cursorPos = getCursorPosition(contentEditableRef.current);
    }

    const newHtml = parseValueToHtml(value, cursorPos);
    // Only update if the parsed HTML is different from what's currently in the DOM
    if (contentEditableRef.current) {
      if (contentEditableRef.current.innerHTML !== newHtml) {
        setInternalHtml(newHtml);
      }
    }

    // Update previousValueRef when value prop changes
    previousValueRef.current = value;
  }, [value]);

  // Restore cursor position after render
  useLayoutEffect(() => {
    if (
      contentEditableRef.current &&
      cursorPositionRef.current !== null &&
      !isComposingRef.current
    ) {
      setCursorPosition(contentEditableRef.current, cursorPositionRef.current);
      cursorPositionRef.current = null; // Reset after restore
    }
  }, [internalHtml]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      if (readonly || disabled || isComposingRef.current) return;

      const root = e.currentTarget;
      const html = root.innerHTML;

      // Get current cursor position before parsing
      const currentCursorPos = getCursorPosition(root);

      // Parse to get the raw text value
      let newValue = parseHtmlToValue(html);

      // Auto-completion logic for '{'
      // Check if a single '{' was just inserted
      // Use previousValueRef to get the old value before this input event
      const oldValue = previousValueRef.current;
      const isInsertion = newValue.length === oldValue.length + 1;
      const insertedChar = newValue.charAt(currentCursorPos - 1);

      if (isInsertion && insertedChar === '{') {
        // Check if we should auto-close (don't if next char is already '}')
        const nextChar = newValue.charAt(currentCursorPos);
        if (nextChar !== '}') {
          // Insert '}'
          newValue =
            newValue.substring(0, currentCursorPos) +
            '}' +
            newValue.substring(currentCursorPos);

          // Update the cursor position ref to stay between {}
          cursorPositionRef.current = currentCursorPos;
        }
      } else {
        // Save cursor position before the update triggers a re-render
        cursorPositionRef.current = currentCursorPos;
      }

      // Update previousValueRef after processing
      previousValueRef.current = newValue;

      onChange(newValue, currentCursorPos);
    },
    [onChange, readonly, disabled],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    // Trigger input handler manually after composition ends
    if (contentEditableRef.current) {
      const root = contentEditableRef.current;
      const html = root.innerHTML;
      const newValue = parseHtmlToValue(html);
      cursorPositionRef.current = getCursorPosition(root);
      onChange(newValue);
    }
  }, [onChange]);

  return {
    contentEditableRef,
    internalHtml,
    handleInput,
    handlePaste,
    handleCompositionStart,
    handleCompositionEnd,
    setCursorToPosition: (position: number) => {
      if (contentEditableRef.current) {
        setCursorPosition(contentEditableRef.current, position);
      }
    },
  };
};
