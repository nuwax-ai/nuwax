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
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(root);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  // This length is based on text content, which matches our parseHtmlToValue logic roughly
  // but we need to be careful about the chips.
  // Our parseHtmlToValue treats chips as their content text or special markers.
  // The browser's toString() of range might just concatenate text.
  return preCaretRange.toString().length;
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
    } else {
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
  onChange: (value: string) => void,
  readonly: boolean,
  disabled: boolean,
) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [internalHtml, setInternalHtml] = useState('');

  // Keep track of the last known cursor position to restore it after updates
  const cursorPositionRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  // Initialize HTML from value
  useEffect(() => {
    const newHtml = parseValueToHtml(value);
    // Only update if the parsed HTML is different from what's currently in the DOM
    // or if we have a pending cursor restore
    if (contentEditableRef.current) {
      if (contentEditableRef.current.innerHTML !== newHtml) {
        setInternalHtml(newHtml);
      }
    }
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
      const newValue = parseHtmlToValue(html);

      // Save cursor position before the update triggers a re-render
      cursorPositionRef.current = getCursorPosition(root);

      onChange(newValue);
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
  };
};
