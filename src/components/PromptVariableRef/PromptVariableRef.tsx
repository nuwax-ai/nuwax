/*
 * Prompt Variable Reference Component
 * 提示词变量引用组件
 * 支持 {{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}} 语法
 */

import { Tree } from 'antd';
import cx from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import './styles.less';
import type { PromptVariableRefProps, VariableTreeNode } from './types';
import { calculateDropdownPosition } from './utils';
import {
  buildVariableTree,
  drillToPath,
  getVariableTypeIcon,
} from './utils/treeUtils';

// 将变量树节点转换为 Tree 组件格式
const transformToTreeDataForTree = (nodes: VariableTreeNode[]): any[] => {
  return nodes.map((node) => {
    return {
      title: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {node.variable?.type
              ? getVariableTypeIcon(node.variable.type)
              : '📝'}
          </span>
          <span
            style={{
              flex: 1,
              fontSize: '14px',
            }}
          >
            {node.label}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#8c8c8c',
            }}
          >
            {node.variable?.type || 'unknown'}
          </span>
        </div>
      ),
      key: node.key,
      value: node.value,
      selectable: true, // 所有节点都可选择
      disabled: false, // 不禁用任何节点
      children: node.children
        ? transformToTreeDataForTree(node.children)
        : undefined,
    };
  });
};

const PromptVariableRef: React.FC<PromptVariableRefProps> = ({
  variables = [],
  readonly = false,
  direction = 'bottomLeft',
  placeholder = '输入提示词，使用 {{变量名}} 引用变量',
  onChange,
  onVariableSelect,
  value,
  disabled = false,
  className = '',
  style,

  // ========== 新增：类似 textarea 的属性 ==========
  rows,
  cols,
  autosize = false,
  minRows,
  maxRows,
  showCount = false,
  maxLength,
  maxHeight = 400,
  minHeight = 80,
}) => {
  console.log('PromptVariableRef rendered with variables:', variables);
  console.log('Current value:', value);
  const [internalValue, setInternalValue] = useState(value || '');
  const [visible, setVisible] = useState(false);
  // 树相关状态
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]); // Tree 组件需要

  // 添加光标位置状态
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // ========== 新增：自动调整大小相关状态 ==========
  const [textareaHeight, setTextareaHeight] = useState<number | string>(
    minHeight,
  );
  const [charCount, setCharCount] = useState(0);

  // 从文本输入框中提取搜索关键词
  const extractSearchTextFromInput = useCallback(
    (inputText: string): string => {
      // 查找 {{ 后面的搜索内容
      const match = inputText.match(/{{([^}]*)$/);
      return match ? match[1] : '';
    },
    [],
  );

  const inputRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<any>(null);

  // 构建变量树（需要在使用前定义）
  const variableTree = buildVariableTree(variables);

  // ========== 新增：获取文本内容的函数（需要提前定义） ==========
  // 获取 contenteditable 中的纯文本内容
  // 使用 textContent 而不是 innerText，因为 textContent 更可靠，不会受样式影响
  const getTextContent = (element: HTMLElement): string => {
    // 确保获取的是纯文本，移除所有 HTML 标签的影响
    const text = element.textContent || element.innerText || '';
    // 移除可能的空白字符问题，但保留换行等格式
    return text;
  };

  // ========== 新增：自动调整大小相关函数 ==========

  // 计算文本高度（基于行数）
  const calculateTextHeight = useCallback(
    (text: string): number => {
      if (!inputRef.current) return minHeight as number;

      const lineHeight =
        parseFloat(getComputedStyle(inputRef.current).lineHeight) || 20;
      const paddingTop =
        parseFloat(getComputedStyle(inputRef.current).paddingTop) || 4;
      const paddingBottom =
        parseFloat(getComputedStyle(inputRef.current).paddingBottom) || 4;
      const borderTop =
        parseFloat(getComputedStyle(inputRef.current).borderTopWidth) || 1;
      const borderBottom =
        parseFloat(getComputedStyle(inputRef.current).borderBottomWidth) || 1;

      // 计算行数（包括换行符）
      const lines = text.split('\n');
      const totalLines = Math.max(lines.length, 1);

      // 计算总高度
      const totalHeight =
        paddingTop +
        paddingBottom +
        borderTop +
        borderBottom +
        totalLines * lineHeight;

      return Math.max(minHeight as number, totalHeight);
    },
    [minHeight],
  );

  // 自动调整大小
  const adjustTextareaSize = useCallback(() => {
    if (!autosize || !inputRef.current) return;

    const text = getTextContent(inputRef.current);
    let newHeight = calculateTextHeight(text);

    // 处理 autosize 对象配置
    if (typeof autosize === 'object') {
      const configMinRows = autosize.minRows || minRows || 1;
      const configMaxRows = autosize.maxRows || maxRows || Infinity;
      const lineHeight =
        parseFloat(getComputedStyle(inputRef.current).lineHeight) || 20;
      const paddingTop =
        parseFloat(getComputedStyle(inputRef.current).paddingTop) || 4;
      const paddingBottom =
        parseFloat(getComputedStyle(inputRef.current).paddingBottom) || 4;
      const borderTop =
        parseFloat(getComputedStyle(inputRef.current).borderTopWidth) || 1;
      const borderBottom =
        parseFloat(getComputedStyle(inputRef.current).borderBottomWidth) || 1;

      const minHeight =
        paddingTop +
        paddingBottom +
        borderTop +
        borderBottom +
        configMinRows * lineHeight;
      const maxHeight =
        paddingTop +
        paddingBottom +
        borderTop +
        borderBottom +
        configMaxRows * lineHeight;

      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    }

    // 应用最大最小高度限制
    newHeight = Math.max(
      minHeight as number,
      Math.min(newHeight, maxHeight as number),
    );

    setTextareaHeight(newHeight);
  }, [autosize, minRows, maxRows, minHeight, maxHeight, calculateTextHeight]);

  // 更新字符计数
  const updateCharCount = useCallback(() => {
    if (showCount && inputRef.current) {
      const text = getTextContent(inputRef.current);
      setCharCount(text.length);
    }
  }, [showCount]);

  // 搜索过滤函数
  const filterTreeBySearch = (
    nodes: VariableTreeNode[],
    searchText: string,
    matchMode: string = 'fuzzy', // 使用固定的模糊匹配
  ): VariableTreeNode[] => {
    if (!searchText.trim()) {
      return nodes;
    }

    const matchesNode = (node: VariableTreeNode): boolean => {
      const searchLower = searchText.toLowerCase();
      const labelLower = node.label.toLowerCase();
      const valueLower = node.value.toLowerCase();
      const typeLower = node.variable?.type.toLowerCase() || '';

      switch (matchMode) {
        case 'exact':
          return labelLower === searchLower || valueLower === searchLower;
        case 'fuzzy':
          // 支持中文的模糊匹配 - 只要包含即可
          return (
            labelLower.includes(searchLower) ||
            valueLower.includes(searchLower) ||
            typeLower.includes(searchLower)
          );
        case 'prefix':
          // 支持中文的前缀匹配
          return (
            labelLower.startsWith(searchLower) ||
            valueLower.startsWith(searchLower) ||
            labelLower.includes(searchLower) ||
            valueLower.includes(searchLower)
          );
        case 'regex':
          try {
            const regex = new RegExp(searchText, 'i');
            return (
              regex.test(node.label) ||
              regex.test(node.value) ||
              regex.test(node.variable?.type || '')
            );
          } catch {
            return false; // 无效正则表达式
          }
        default:
          return false;
      }
    };

    const filterNodes = (nodes: VariableTreeNode[]): VariableTreeNode[] => {
      const result: VariableTreeNode[] = [];

      for (const node of nodes) {
        const filteredChildren = node.children
          ? filterNodes(node.children)
          : [];
        const isMatch = matchesNode(node);

        if (isMatch || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren,
          });
        }
      }

      return result;
    };

    return filterNodes(nodes);
  };

  const displayTree = filterTreeBySearch(
    variableTree,
    extractSearchTextFromInput(internalValue),
    'fuzzy',
  );

  // 根据key查找变量节点
  const findNodeByKey = (
    tree: VariableTreeNode[],
    key: string,
  ): VariableTreeNode | null => {
    for (const node of tree) {
      // 现在key是完整路径，所以直接比较
      if (node.key === key || node.value === key) {
        return node;
      }
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  // 获取 contenteditable 中的光标位置（字符索引）
  const getCaretPosition = (element: HTMLElement): number => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    const position = preCaretRange.toString().length;
    console.log(
      'getCaretPosition result:',
      position,
      'originalText:',
      JSON.stringify(preCaretRange.toString()),
    );
    return position;
  };

  // 设置 contenteditable 中的光标位置
  const setCaretPosition = (element: HTMLElement, position: number) => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let charCount = 0;
    const nodeStack: Node[] = [element];
    let node: Node | undefined;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextCharCount = charCount + (node.textContent?.length || 0);
        if (position <= nextCharCount) {
          range.setStart(node, position - charCount);
          range.setEnd(node, position - charCount);
          foundStart = true;
        }
        charCount = nextCharCount;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    if (foundStart) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // 设置光标位置，确保光标在高亮元素外部（末尾）
  // 找到指定位置附近的高亮元素，将光标放在其后
  const setCaretPositionAfterHighlight = (
    element: HTMLElement,
    position: number,
  ) => {
    const selection = window.getSelection();
    if (!selection) return;

    // 先尝试找到目标位置附近的高亮元素
    // 由于我们知道变量引用的格式是 {{变量名}}，位置应该在 }} 之后
    // 所以我们需要找到包含这个位置的高亮 span 元素

    // 方法：遍历所有高亮元素，找到包含目标位置的那个
    const highlightElements = element.querySelectorAll(
      '.variable-highlight',
    ) as NodeListOf<HTMLElement>;

    let targetHighlightElement: HTMLElement | null = null;

    // 计算每个高亮元素在文本中的位置范围
    for (const highlightEl of highlightElements) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.setEndBefore(highlightEl);
      const beforeLength = range.toString().length;
      const highlightText = highlightEl.textContent || '';
      const afterLength = beforeLength + highlightText.length;

      // 如果目标位置在这个高亮元素的范围内
      // 如果位置正好在 afterLength，说明已经在高亮元素之后，不需要移动
      // 如果位置在 beforeLength 和 afterLength 之间，说明在高亮元素内部，需要移动到之后
      if (position >= beforeLength && position < afterLength) {
        targetHighlightElement = highlightEl;
        break;
      }
    }

    const range = document.createRange();

    if (targetHighlightElement) {
      // 如果找到了高亮元素，将光标放在它之后
      range.setStartAfter(targetHighlightElement);
      range.setEndAfter(targetHighlightElement);
    } else {
      // 如果没有找到高亮元素，使用普通方法设置光标位置
      setCaretPosition(element, position);
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  // 应用变量（需要在 useEffect 之前定义）
  const handleApplyVariable = useCallback(
    (nodeValue: string) => {
      if (!inputRef.current) return;

      const element = inputRef.current;
      const currentText = getTextContent(element);
      const cursorPos = getCaretPosition(element);

      console.log(
        'handleApplyVariable - currentText:',
        JSON.stringify(currentText),
      );
      console.log('handleApplyVariable - cursorPos:', cursorPos);
      console.log('handleApplyVariable - nodeValue:', nodeValue);

      // 查找 {{...}} 的范围
      const beforeText = currentText.substring(0, cursorPos);
      const afterText = currentText.substring(cursorPos);

      console.log(
        'handleApplyVariable - beforeText:',
        JSON.stringify(beforeText),
      );
      console.log(
        'handleApplyVariable - afterText:',
        JSON.stringify(afterText),
      );

      // 找到最近的 {{ 开始位置
      const lastStartPos = beforeText.lastIndexOf('{{');
      console.log('lastStartPos:', lastStartPos);

      if (lastStartPos !== -1) {
        // 检查是否有匹配的 }} 结束位置
        const afterStartText = beforeText.substring(lastStartPos + 2);
        const endPosMatch = afterStartText.indexOf('}}');
        console.log('endPosMatch:', endPosMatch);

        let finalText: string;
        let newCursorPos: number;

        if (endPosMatch !== -1) {
          // 替换现有的变量引用（包含 {{ 和 }}）
          const beforeVariable = beforeText.substring(0, lastStartPos);
          const afterVariable = afterText.substring(endPosMatch + 2);
          console.log('beforeVariable:', JSON.stringify(beforeVariable));
          console.log('afterVariable:', JSON.stringify(afterVariable));
          finalText = beforeVariable + `{{${nodeValue}}}` + afterVariable;
          newCursorPos = (beforeVariable + `{{${nodeValue}}}`).length;
        } else {
          // 完成新的变量引用
          const beforeVariable = beforeText.substring(0, lastStartPos);
          console.log('beforeVariable (new):', JSON.stringify(beforeVariable));
          finalText = beforeVariable + `{{${nodeValue}}}` + afterText;
          newCursorPos = (beforeVariable + `{{${nodeValue}}}`).length;
        }

        console.log(
          'handleApplyVariable - finalText:',
          JSON.stringify(finalText),
        );
        console.log('newCursorPos:', newCursorPos);

        setInternalValue(finalText);
        onChange?.(finalText);

        // 设置光标位置，确保光标在高亮元素外部（末尾）
        // 使用 requestAnimationFrame 确保 DOM 已经更新
        requestAnimationFrame(() => {
          setTimeout(() => {
            element.focus();
            setCaretPositionAfterHighlight(element, newCursorPos);
          }, 0);
        });

        // 触发变量选择回调
        const selectedNode = findNodeByKey(variableTree, nodeValue);
        if (selectedNode && selectedNode.variable) {
          onVariableSelect?.(selectedNode.variable, nodeValue);
        }
      }

      setVisible(false);
    },
    [internalValue, onChange, onVariableSelect, variableTree],
  );

  // 同步外部 value 到内部 state
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // 同步 internalValue 到 contenteditable div 的内容
  useEffect(() => {
    if (!inputRef.current) return;

    const element = inputRef.current;
    const currentText = getTextContent(element);

    console.log('Content sync - internalValue:', JSON.stringify(internalValue));
    console.log('Content sync - currentText:', JSON.stringify(currentText));

    // 只有当内容不一致时才更新（避免在用户输入时覆盖）
    // 确保比较的是纯文本内容，不包含 HTML 标签
    if (currentText !== (internalValue || '')) {
      const selection = window.getSelection();
      const range =
        selection && selection.rangeCount > 0
          ? selection.getRangeAt(0).cloneRange()
          : null;
      const cursorPos = range ? getCaretPosition(element) : 0;

      // 更新内容 - 直接使用 innerHTML 设置高亮内容
      // 先完全清空内容，避免残留的 HTML 结构影响
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }

      if (internalValue) {
        const parts: string[] = [];
        // 使用更严格的正则，确保只匹配完整的 {{变量名}} 格式
        // 匹配 {{ 开头，}} 结尾，中间不包含 }} 的内容
        const regex = /\{\{([^}]+)\}\}/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(internalValue)) !== null) {
          // 添加匹配前的普通文本
          if (match.index > lastIndex) {
            const text = internalValue.substring(lastIndex, match.index);
            // 转义 HTML 特殊字符，但保留换行符
            parts.push(
              text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '&#10;'), // 显式处理换行符
            );
          }

          // 只高亮完整的 {{变量名}}，确保 match[0] 是完整的匹配
          const fullMatch = match[0]; // 完整的 {{变量名}}
          const variableName = match[1]; // 变量名部分

          // 验证匹配的完整性：确保以 {{ 开头，以 }} 结尾
          if (fullMatch.startsWith('{{') && fullMatch.endsWith('}}')) {
            // 转义变量名中的 HTML 特殊字符
            const escapedVariableName = variableName
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
            parts.push(
              `<span class="variable-highlight">{{${escapedVariableName}}}</span>`,
            );
          } else {
            // 如果匹配不完整，作为普通文本处理
            parts.push(
              fullMatch
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;'),
            );
          }

          lastIndex = match.index + match[0].length;
        }

        // 添加剩余的普通文本
        if (lastIndex < internalValue.length) {
          const text = internalValue.substring(lastIndex);
          parts.push(
            text
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n/g, '&#10;'), // 显式处理换行符
          );
        }

        // 使用 textContent 和 innerHTML 的组合来确保正确设置
        console.log('Setting innerHTML with parts:', parts);
        console.log('Parts joined result:', JSON.stringify(parts.join('')));
        element.innerHTML = parts.join('');

        console.log(
          'After setting innerHTML, element textContent:',
          JSON.stringify(element.textContent),
        );

        // 恢复光标位置
        if (range && cursorPos <= internalValue.length) {
          setTimeout(() => {
            setCaretPosition(element, cursorPos);
          }, 0);
        }
      }
    }
  }, [internalValue]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = () => {
      if (visible) {
        setVisible(false);
      }
    };

    if (visible) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [visible]);

  // ========== 新增：自动调整大小的 useEffect ==========
  // 初始化自动调整大小
  useEffect(() => {
    if (autosize && inputRef.current) {
      const text = getTextContent(inputRef.current);
      const initialHeight = calculateTextHeight(text);
      setTextareaHeight(
        Math.max(
          minHeight as number,
          Math.min(initialHeight, maxHeight as number),
        ),
      );
    } else if (rows) {
      // 如果指定了 rows，使用固定行数计算高度
      const lineHeight = 20; // 默认行高
      const paddingHeight = 8; // 默认内边距
      setTextareaHeight(rows * lineHeight + paddingHeight);
    } else {
      // 使用默认值
      setTextareaHeight(minHeight);
    }
  }, [autosize, rows, minHeight, maxHeight, calculateTextHeight]);

  // 监听内部值变化，自动调整大小
  useEffect(() => {
    if (autosize) {
      const timer = setTimeout(() => {
        adjustTextareaSize();
        updateCharCount();
      }, 100); // 防抖处理
      return () => clearTimeout(timer);
    }
  }, [internalValue, autosize, adjustTextareaSize, updateCharCount]);

  // 检查并修复高亮元素内部的新输入内容
  // 返回是否进行了修复
  const fixHighlightStructure = (element: HTMLElement): boolean => {
    const highlightElements = element.querySelectorAll(
      '.variable-highlight',
    ) as NodeListOf<HTMLElement>;

    let fixed = false;

    for (const highlightEl of highlightElements) {
      const highlightText = highlightEl.textContent || '';

      // 检查高亮元素的内容是否符合 {{变量名}} 格式（完全匹配）
      const variableMatch = highlightText.match(/^\{\{([^}]+)\}\}$/);

      if (!variableMatch) {
        fixed = true;

        // 使用正则表达式找到第一个完整的 {{变量名}} 匹配
        const regex = /\{\{([^}]+)\}\}/;
        const match = highlightText.match(regex);

        if (match && match.index !== undefined) {
          const variablePart = match[0]; // 完整的 {{变量名}}
          const beforeVariable = highlightText.substring(0, match.index);
          const afterVariable = highlightText.substring(
            match.index + match[0].length,
          );

          // 创建新的 DOM 结构
          const fragment = document.createDocumentFragment();

          // 添加变量前的文本
          if (beforeVariable) {
            fragment.appendChild(document.createTextNode(beforeVariable));
          }

          // 创建新的高亮元素（只包含变量部分）
          const newHighlightEl = document.createElement('span');
          newHighlightEl.className = 'variable-highlight';
          newHighlightEl.textContent = variablePart;
          fragment.appendChild(newHighlightEl);

          // 添加变量后的文本（新输入的内容）
          if (afterVariable) {
            fragment.appendChild(document.createTextNode(afterVariable));
          }

          // 替换原来的高亮元素
          if (highlightEl.parentNode) {
            highlightEl.parentNode.replaceChild(fragment, highlightEl);
          }
        } else {
          // 如果没有找到完整的变量引用，说明高亮元素内容完全错误
          // 将其转换为普通文本节点
          if (highlightEl.parentNode) {
            highlightEl.parentNode.replaceChild(
              document.createTextNode(highlightText),
              highlightEl,
            );
          }
        }
      }
    }

    return fixed;
  };

  // 处理输入变化
  const handleInput = useCallback(() => {
    if (!inputRef.current) return;

    const element = inputRef.current;

    // 先保存当前光标位置（字符位置）
    const selection = window.getSelection();
    let savedCursorPos = 0;
    if (selection && selection.rangeCount > 0) {
      savedCursorPos = getCaretPosition(element);
    }

    // 先修复高亮元素结构，确保新输入的内容不在高亮元素内部
    const fixed = fixHighlightStructure(element);

    // 如果进行了修复，需要恢复光标位置
    // 由于修复后 DOM 结构变化，但文本内容不变，所以光标位置应该保持不变
    if (fixed) {
      // 使用 requestAnimationFrame 确保 DOM 更新后再设置光标
      requestAnimationFrame(() => {
        // 确保光标位置不超过文本长度
        const currentText = getTextContent(element);
        const targetPos = Math.min(savedCursorPos, currentText.length);
        setCaretPosition(element, targetPos);
      });
    }

    const newValue = getTextContent(element);
    const cursorPosition = getCaretPosition(element);

    console.log('Input changed to:', newValue);

    // ========== 新增：处理最大长度限制 ==========
    if (maxLength && newValue.length > maxLength) {
      const truncatedValue = newValue.substring(0, maxLength);
      setInternalValue(truncatedValue);
      onChange?.(truncatedValue);

      // 重新设置内容（这里简化处理，实际可能需要更复杂的逻辑）
      element.innerHTML = truncatedValue
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // 设置光标位置到末尾
      const newCursorPos = truncatedValue.length;
      setCaretPosition(element, newCursorPos);
    } else {
      setInternalValue(newValue);
      onChange?.(newValue);
    }

    // ========== 新增：更新字符计数和自动调整大小 ==========
    updateCharCount();
    adjustTextareaSize();

    // 检查光标前是否有 {{
    const beforeCursor = newValue.substring(0, cursorPosition);
    const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');
    console.log(
      'Before cursor:',
      beforeCursor,
      'lastDoubleBraceStart:',
      lastDoubleBraceStart,
    );

    // 检查是否刚刚输入了 {{ 或正在 {{...}} 中
    // 确保在 {{ 之后没有对应的 }}
    let isInVariableContext = false;
    if (lastDoubleBraceStart !== -1) {
      const afterLastStart = beforeCursor.substring(lastDoubleBraceStart + 2);
      const hasClosingBraces = afterLastStart.includes('}}');
      isInVariableContext = !hasClosingBraces;
      console.log('After last start:', JSON.stringify(afterLastStart));
      console.log('hasClosingBraces:', hasClosingBraces);
    }
    console.log(
      'isInVariableContext:',
      isInVariableContext,
      'readonly:',
      readonly,
    );

    if (isInVariableContext && !readonly) {
      console.log('Setting visible to true');
      setVisible(true);

      // 计算光标的屏幕位置
      if (inputRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // 使用改进的位置计算函数（参考 antd Select）
          const { position, adjustment } = calculateDropdownPosition(
            rect.left,
            rect.bottom,
            inputRef.current,
            undefined,
            {
              hasSearch: true,
              searchText: extractSearchTextFromInput(newValue),
              treeHeight: 240,
            },
          );

          console.log('Calculated cursor position:', {
            cursorX: rect.left,
            cursorY: rect.bottom,
            final: position,
            adjustment,
          });
          setCursorPosition(position);
        }
      }

      // 提取当前的变量路径
      const currentPath = beforeCursor.substring(lastDoubleBraceStart + 2);
      console.log('Variable context detected, currentPath:', currentPath);

      // 展开到当前路径
      const drilledTree = drillToPath(variableTree, currentPath);
      console.log('Drilled tree:', drilledTree);
    } else {
      console.log('Setting visible to false');
      setVisible(false);
    }
  }, [
    onChange,
    readonly,
    variableTree,
    extractSearchTextFromInput,
    maxLength,
    updateCharCount,
    adjustTextareaSize,
  ]);

  // 键盘导航的具体实现
  const handleTreeNavigation = useCallback(
    (e: KeyboardEvent) => {
      const treeData = transformToTreeDataForTree(displayTree);

      // 获取所有可选择的节点
      const getAllNodes = (nodes: any[], path: string[] = []): any[] => {
        const result: any[] = [];
        for (const node of nodes) {
          result.push({ ...node, path: [...path, node.key] });
          if (node.children) {
            result.push(...getAllNodes(node.children, [...path, node.key]));
          }
        }
        return result;
      };

      const allNodes = getAllNodes(treeData);
      console.log('Available nodes:', allNodes.length);

      if (allNodes.length === 0) return;

      // 获取当前选中节点的索引
      const getCurrentIndex = (): number => {
        if (selectedKeys.length === 0) return -1;
        return allNodes.findIndex((node) => node.key === selectedKeys[0]);
      };

      const currentIndex = getCurrentIndex();
      console.log(
        'Current selected index:',
        currentIndex,
        'selectedKeys:',
        selectedKeys,
      );

      if (e.key === 'ArrowDown') {
        console.log('ArrowDown pressed');
        e.preventDefault();
        const nextIndex =
          currentIndex >= 0 ? (currentIndex + 1) % allNodes.length : 0;
        const nextNode = allNodes[nextIndex];
        setSelectedKeys([nextNode.key]);
        console.log('Next node selected:', nextNode.key);

        // 自动展开父级节点
        const parentPath = nextNode.path.slice(0, -1);
        if (parentPath.length > 0) {
          const newExpandedKeys = [
            ...new Set([...expandedKeys, ...parentPath]),
          ];
          setExpandedKeys(newExpandedKeys);
        }
      } else if (e.key === 'ArrowUp') {
        console.log('ArrowUp pressed');
        e.preventDefault();
        const prevIndex =
          currentIndex >= 0
            ? (currentIndex - 1 + allNodes.length) % allNodes.length
            : allNodes.length - 1;
        const prevNode = allNodes[prevIndex];
        setSelectedKeys([prevNode.key]);
        console.log('Prev node selected:', prevNode.key);

        // 自动展开父级节点
        const parentPath = prevNode.path.slice(0, -1);
        if (parentPath.length > 0) {
          const newExpandedKeys = [
            ...new Set([...expandedKeys, ...parentPath]),
          ];
          setExpandedKeys(newExpandedKeys);
        }
      } else if (e.key === 'Enter') {
        console.log('Enter pressed');

        // 只有当下拉框有可见选项且有选中项时，才阻止默认行为并应用变量
        if (currentIndex >= 0 && allNodes.length > 0) {
          e.preventDefault();
          const selectedNode = allNodes[currentIndex];
          handleApplyVariable(selectedNode.value);
          setVisible(false);
          console.log('Variable applied:', selectedNode.value);
        }
        // 否则允许回车键执行默认行为（换行）
      } else if (e.key === 'Escape') {
        const searchText = extractSearchTextFromInput(internalValue);
        if (searchText.trim()) {
          // 如果有搜索文本，删除{{和搜索内容
          const index = internalValue.lastIndexOf('{{' + searchText);
          if (index >= 0) {
            setInternalValue(internalValue.substring(0, index));
          }
        } else if (internalValue.includes('{{')) {
          // 如果有{{但没有搜索文本，删除{{
          const index = internalValue.lastIndexOf('{{');
          if (index >= 0) {
            setInternalValue(
              internalValue.substring(0, index) +
                internalValue.substring(index + 2),
            );
          }
        } else {
          // 否则关闭下拉框
          setVisible(false);
          setSelectedKeys([]);
        }
      }
    },
    [
      displayTree,
      expandedKeys,
      selectedKeys,
      handleApplyVariable,
      extractSearchTextFromInput,
      internalValue,
    ],
  );

  // Tree 组件显示时自动获取焦点
  useEffect(() => {
    if (visible && treeRef.current) {
      // Tree 组件没有 focus 方法，所以这里不调用 focus()
      // 键盘导航通过全局事件处理器来处理
      console.log('Tree component ready for keyboard navigation');
    }
  }, [visible]);

  // 全局键盘事件处理，作为 Tree 组件内置键盘导航的备选方案
  useEffect(() => {
    if (!visible) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (readonly) return;

      console.log('Global keydown detected:', e.key, 'visible:', visible);

      // 只处理我们的快捷键
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        // 直接在这里实现键盘导航逻辑，避免函数依赖问题
        handleTreeNavigation(e);
      } else if (e.key === 'Enter') {
        // 对于 Enter 键，检查是否有选中的节点
        const treeData = transformToTreeDataForTree(displayTree);
        const getAllNodes = (nodes: any[], path: string[] = []): any[] => {
          const result: any[] = [];
          for (const node of nodes) {
            result.push({ ...node, path: [...path, node.key] });
            if (node.children) {
              result.push(...getAllNodes(node.children, [...path, node.key]));
            }
          }
          return result;
        };

        const allNodes = getAllNodes(treeData);
        const currentIndex =
          selectedKeys.length > 0
            ? allNodes.findIndex((node) => node.key === selectedKeys[0])
            : -1;

        // 只有当下拉框有可见选项且有选中项时，才阻止默认行为并应用变量
        if (currentIndex >= 0 && allNodes.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const selectedNode = allNodes[currentIndex];
          handleApplyVariable(selectedNode.value);
          setVisible(false);
          console.log('Variable applied:', selectedNode.value);
        }
        // 否则允许回车键执行默认行为（换行）
      }
    };

    console.log('Adding global keyboard listener');
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      console.log('Removing global keyboard listener');
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [
    visible,
    readonly,
    handleTreeNavigation,
    displayTree,
    selectedKeys,
    handleApplyVariable,
  ]); // 包含 handleTreeNavigation 依赖

  const popoverShouldShow =
    visible && !readonly && !disabled && internalValue.includes('{{'); // 只要包含 {{ 就显示，不要求有搜索文本
  console.log('Popover show condition:', {
    visible,
    readonly,
    disabled,
    shouldShow: popoverShouldShow,
    direction,
  });

  // 处理粘贴事件，只允许纯文本
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    // 触发输入事件
    if (inputRef.current) {
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  }, []);

  // ========== 新增：计算输入框样式 ==========
  const getInputStyle = (): React.CSSProperties => {
    const inputStyle: React.CSSProperties = {};

    // 处理高度
    if (autosize) {
      inputStyle.height = textareaHeight;
      inputStyle.minHeight = minHeight;
      inputStyle.maxHeight = maxHeight;
      inputStyle.overflowY = 'auto';
    } else if (rows) {
      const lineHeight = 20; // 默认行高
      const paddingHeight = 8; // 默认内边距
      inputStyle.height = rows * lineHeight + paddingHeight;
    } else {
      inputStyle.minHeight = minHeight;
      inputStyle.maxHeight = maxHeight;
    }

    // 处理宽度（cols）
    if (cols) {
      const charWidth = 8; // 默认字符宽度
      inputStyle.width = cols * charWidth + 22; // 添加padding和border
      inputStyle.minWidth = cols * charWidth + 22;
    }

    return inputStyle;
  };

  return (
    <div className={cx('prompt-variable-ref', className)} style={style}>
      {/* 主要的输入区域 */}
      <div className="input-container">
        {/* contenteditable 输入框 - 直接渲染高亮内容 */}
        <div
          ref={inputRef}
          contentEditable={!readonly && !disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          className={cx('prompt-variable-input', {
            'prompt-variable-input-disabled': disabled,
            'prompt-variable-input-readonly': readonly,
            'prompt-variable-input-autosize': autosize,
          })}
          data-placeholder={placeholder}
          style={getInputStyle()}
        />

        {/* ========== 新增：字符计数器 ========== */}
        {showCount && (
          <div
            className="prompt-variable-count"
            style={{
              textAlign: 'right',
              fontSize: '12px',
              color: maxLength && charCount > maxLength ? '#ff4d4f' : '#8c8c8c',
              marginTop: '4px',
              padding: '0 2px',
            }}
          >
            {maxLength ? `${charCount}/${maxLength}` : charCount}
          </div>
        )}
      </div>

      {/* 变量引用列表 */}
      {popoverShouldShow && (
        <div
          className="variable-tree-list"
          tabIndex={-1}
          style={{
            position: 'fixed',
            left: cursorPosition.x,
            top: cursorPosition.y,
            zIndex: 9999,
            width: '300px', // 设置宽度为300px
            padding: '8px', // 添加内边距
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            boxShadow:
              '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 搜索提示（当在输入框中输入{{后显示） */}
          {visible && internalValue.includes('{{') && (
            <>
              <div
                className="variable-search-stats"
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: '#666',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                {extractSearchTextFromInput(internalValue)
                  ? `搜索："${extractSearchTextFromInput(
                      internalValue,
                    )}" - 找到 ${displayTree.length} 个匹配项`
                  : `输入搜索词或浏览所有 ${variableTree.length} 个变量`}
              </div>

              {/* 开发环境：显示位置计算信息 */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <div className="position-debug">
                    <strong>位置计算信息:</strong>
                    <br />
                    光标位置: ({cursorPosition.x.toFixed(0)},{' '}
                    {cursorPosition.y.toFixed(0)})<br />
                    下拉框尺寸: 300x280 (含搜索区)
                    <br />
                    内容对齐: 以下拉框顶部/底部为准
                    <br />
                    触发元素: {inputRef.current ? '✓' : '✗'}
                  </div>

                  {/* 对齐指示器 */}
                  <div className="alignment-indicator top-center"></div>
                </>
              )}
            </>
          )}

          {/* Tree 组件 */}
          <div className="tree-list-content">
            {displayTree.length > 0 ? (
              <Tree
                ref={treeRef}
                treeData={transformToTreeDataForTree(displayTree)}
                selectedKeys={selectedKeys}
                expandedKeys={expandedKeys as string[]}
                onExpand={(newExpandedKeys) => setExpandedKeys(newExpandedKeys)}
                onSelect={(selectedKeys) => {
                  // 所有节点都可以选择和应用
                  const selectedNode = transformToTreeDataForTree(displayTree)
                    .flatMap((node) => {
                      const getAllNodes = (n: any): any[] => {
                        const nodes = [n];
                        if (n.children) {
                          nodes.push(...n.children.flatMap(getAllNodes));
                        }
                        return nodes;
                      };
                      return getAllNodes(node);
                    })
                    .find((node: any) => selectedKeys.includes(node.key));

                  if (selectedNode) {
                    handleApplyVariable(selectedNode.value);
                    setVisible(false);
                  }
                }}
                showIcon={false}
                tabIndex={-1} // 设置为 -1，禁用 Tree 组件的键盘导航
                style={{
                  border: 'none',
                  background: 'transparent',
                }}
                blockNode={true}
              />
            ) : (
              <div className="variable-empty">没有找到匹配的变量</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVariableRef;
