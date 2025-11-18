/*
 * Prompt Variable Reference Component
 * 提示词变量引用组件
 * 支持 {{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}} 语法
 */

import { Input, Tree } from 'antd';
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

const { TextArea } = Input;

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
  // 移除 direction 参数，使用智能动态定位
  placeholder = '输入提示词，使用 {{变量名}} 引用变量',
  onChange,
  value,
  disabled = false,
  className = '',
  style,
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
  // 添加文本光标位置状态
  const [textCursorPosition, setTextCursorPosition] = useState(0);

  // 从文本输入框中提取搜索关键词
  const extractSearchTextFromInput = useCallback(
    (inputText: string, cursorPosition: number): string => {
      // 检查光标前是否有 { 或 {{
      const beforeCursor = inputText.substring(0, cursorPosition);
      const lastBraceStart = beforeCursor.lastIndexOf('{');
      const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

      console.log('Extract search text - initial check:', {
        inputText,
        cursorPosition,
        beforeCursor,
        lastBraceStart,
        lastDoubleBraceStart,
      });

      // 确定当前在哪种上下文中
      let mode: 'single' | 'double' = 'double';
      let braceStartPos = lastDoubleBraceStart;

      if (lastBraceStart > lastDoubleBraceStart) {
        // 检查单个大括号是否有效
        // 需要检查完整的 inputText，而不仅仅是 beforeCursor，因为 } 可能在光标后面
        const afterBraceInFullText = inputText.substring(lastBraceStart + 1);
        const closingBracePosInFullText = afterBraceInFullText.indexOf('}');
        const hasClosingBrace = closingBracePosInFullText !== -1;

        console.log('Single brace check:', {
          lastBraceStart,
          lastDoubleBraceStart,
          afterBraceInFullText: afterBraceInFullText.substring(0, 20), // 只显示前20个字符
          closingBracePosInFullText,
          hasClosingBrace,
        });

        if (hasClosingBrace) {
          // 检查光标是否在 { 和 } 之间
          const betweenBraces = inputText.substring(
            lastBraceStart + 1,
            cursorPosition,
          );
          const hasClosingBeforeCursor = betweenBraces.includes('}');

          console.log('Between braces check:', {
            betweenBraces,
            hasClosingBeforeCursor,
            cursorPosition,
            closingBracePosInFullText,
            braceEndPos: lastBraceStart + 1 + closingBracePosInFullText,
          });

          if (!hasClosingBeforeCursor) {
            mode = 'single';
            braceStartPos = lastBraceStart;
            console.log('Mode set to single, braceStartPos:', braceStartPos);
          }
        }
      }

      console.log('Final mode detection:', {
        mode,
        braceStartPos,
      });

      // 提取搜索文本：支持在 {} 或 {{}} 中输入内容时搜索
      if (braceStartPos !== -1) {
        if (mode === 'single') {
          // 单个大括号模式：在 { } 中搜索
          const afterBrace = inputText.substring(braceStartPos + 1);
          const closingBracePos = afterBrace.indexOf('}');

          if (closingBracePos !== -1) {
            // 检查光标是否在 { 和 } 之间（包括 } 的位置）
            const isInBraces =
              cursorPosition > braceStartPos &&
              cursorPosition <= braceStartPos + 1 + closingBracePos + 1; // +1 包括 } 的位置

            console.log('Extract search text (single mode):', {
              inputText,
              cursorPosition,
              braceStartPos,
              closingBracePos,
              isInBraces,
              afterBrace: afterBrace.substring(0, closingBracePos),
            });

            if (isInBraces) {
              // 提取光标前的内容作为搜索文本（从 { 后到光标位置，但不包括 }）
              const endPos = Math.min(
                cursorPosition,
                braceStartPos + 1 + closingBracePos,
              );
              const searchText = inputText.substring(braceStartPos + 1, endPos);
              const result = searchText.split(' ')[0];
              console.log('Extracted search text:', result);
              return result;
            }
          }
        } else {
          // 双大括号模式：检查光标是否在 {{ 后面
          if (cursorPosition >= braceStartPos + 2) {
            const match = inputText.match(/{{([^}]*)$/);
            if (match) {
              // 提取光标前的内容作为搜索文本
              const searchText = inputText.substring(
                braceStartPos + 2,
                cursorPosition,
              );
              return searchText.split(' ')[0];
            }
          }
        }
      }

      // 光标不在 { 或 {{ 后面时，返回空字符串（不进行搜索）
      return '';
    },
    [],
  );

  const inputRef = useRef<any>(null);
  const treeRef = useRef<any>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  // 构建变量树（需要在使用前定义）
  const variableTree = buildVariableTree(variables);

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

  const searchText = extractSearchTextFromInput(
    internalValue,
    textCursorPosition,
  );
  console.log('Display tree search:', {
    internalValue,
    textCursorPosition,
    searchText,
    hasSearchText: !!searchText,
  });

  const displayTree = filterTreeBySearch(variableTree, searchText, 'fuzzy');

  // 应用变量（需要在 useEffect 之前定义）
  const handleApplyVariable = useCallback(
    (nodeValue: string) => {
      if (!inputRef.current) return;

      const textarea = inputRef.current.resizableTextArea.textArea;
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

      // 添加调试日志
      console.log('Mode detection:', {
        currentValue,
        startPos,
        lastBraceStart,
        lastDoubleBraceStart,
        mode,
        braceStartPos,
      });

      let finalText: string;
      let newCursorPos: number;

      // 在处理前验证模式选择的正确性
      const validateMode = () => {
        if (mode === 'single') {
          // 确保确实在单个 {} 上下文中
          if (braceStartPos < 0 || braceStartPos >= currentValue.length) {
            console.warn(
              'Invalid braceStartPos for single mode:',
              braceStartPos,
            );
            return false;
          }

          const braceContent = currentValue.substring(
            braceStartPos,
            Math.min(braceStartPos + 10, currentValue.length),
          );
          if (!braceContent.startsWith('{')) {
            console.warn('BraceStartPos does not point to {:', braceContent);
            return false;
          }
        }
        return true;
      };

      if (!validateMode()) {
        console.log('Mode validation failed, switching to default double mode');
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

          console.log('Single brace replacement:', {
            originalText: currentValue,
            braceStartPos,
            originalBraceContent,
            isAlreadyDoubleBrace,
            nodeValue,
          });

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
        console.log('Detected bracket error, auto-correcting:', {
          original: finalText,
          error: bracketError[0],
        });

        // 自动修正：移除多余的大括号
        finalText = finalText.replace(/\{\{\{/g, '{{');
        finalText = finalText.replace(/\}\}\}/g, '}}');

        console.log('Auto-corrected to:', finalText);
        setInternalValue(finalText);
        onChange?.(finalText);
      }

      // 设置光标位置到变量引用后面
      setTimeout(() => {
        if (inputRef.current) {
          const textarea = inputRef.current.resizableTextArea.textArea;

          // 验证光标位置是否在有效范围内
          const maxPos = finalText.length;
          const safeCursorPos = Math.min(Math.max(0, newCursorPos), maxPos);

          console.log('Setting cursor position:', {
            requested: newCursorPos,
            safe: safeCursorPos,
            textLength: maxPos,
            finalText,
          });

          textarea.setSelectionRange(safeCursorPos, safeCursorPos);
          textarea.focus();
        }
      }, 10); // 增加延时确保DOM更新完成

      // 关闭下拉框
      setVisible(false);
      setSelectedKeys([]);

      console.log('Variable applied:', {
        mode,
        nodeValue,
        finalText,
        newCursorPos,
        cursorPosition: `${newCursorPos} (应该定位到 '}}' 后面)`,
        finalTextPreview: finalText.substring(
          Math.max(0, newCursorPos - 10),
          newCursorPos + 10,
        ),
      });
    },
    [internalValue, onChange],
  );

  // 同步外部 value 到内部 state
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // 同步输入框和高亮层的滚动位置 - 增强版本
  useEffect(() => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    let rafId: number;
    let scrollSyncRafId: number;
    let isScrolling = false;

    // 重新计算下拉框位置
    const recalculateDropdownPosition = () => {
      const textarea = inputRef.current?.resizableTextArea?.textArea;
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

      console.log('Enhanced recalculateDropdownPosition:', {
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
    };

    // 使用更精确的滚动同步方法
    const syncScrollPosition = () => {
      const currentScrollTop = textarea.scrollTop;
      const currentScrollLeft = textarea.scrollLeft;

      // 同步高亮层滚动位置
      highlightLayer.scrollTop = currentScrollTop;
      highlightLayer.scrollLeft = currentScrollLeft;

      console.log('Enhanced scroll synced:', {
        scrollTop: currentScrollTop,
        scrollLeft: currentScrollLeft,
        isVisible: visible,
        timestamp: Date.now(),
      });

      // 如果下拉框可见，重新计算位置
      if (visible) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          recalculateDropdownPosition();
        });
      }
    };

    // 优化滚动监听：使用更高的触发频率和更精确的检测
    const handleScroll = () => {
      // 立即同步
      syncScrollPosition();

      // 设置滚动状态标记
      isScrolling = true;

      // 清除之前的debounce定时器
      if (scrollSyncRafId) {
        cancelAnimationFrame(scrollSyncRafId);
      }

      // 使用 requestAnimationFrame 进行防抖
      scrollSyncRafId = requestAnimationFrame(() => {
        if (isScrolling) {
          syncScrollPosition();
          isScrolling = false;
        }
      });
    };

    // 添加多种滚动事件监听以确保同步
    textarea.addEventListener('scroll', handleScroll, { passive: true });

    // 监听鼠标滚轮事件（更早触发）
    textarea.addEventListener('wheel', handleScroll, { passive: true });

    // 监听键盘滚动事件
    textarea.addEventListener('keydown', (e) => {
      if (
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        (e.ctrlKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp'))
      ) {
        // 延迟触发以确保键盘滚动完成
        setTimeout(handleScroll, 0);
      }
    });

    // 使用 ResizeObserver 监听输入框尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      // 尺寸变化时立即同步滚动位置
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncScrollPosition);
    });
    resizeObserver.observe(textarea);

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
      textarea.removeEventListener('wheel', handleScroll);
      textarea.removeEventListener('keydown', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollSyncRafId) cancelAnimationFrame(scrollSyncRafId);
      resizeObserver.disconnect();
    };
  }, [visible, internalValue, textCursorPosition, extractSearchTextFromInput]);

  // 当内容变化时，同步一次滚动位置 - 增强版本
  useEffect(() => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    console.log('Content changed, preparing enhanced sync scroll:', {
      contentLength: internalValue.length,
      scrollTop: textarea.scrollTop,
      scrollLeft: textarea.scrollLeft,
      timestamp: Date.now(),
    });

    // 增强的滚动同步：立即同步 + 双重 requestAnimationFrame
    const syncScroll = () => {
      const currentScrollTop = textarea.scrollTop;
      const currentScrollLeft = textarea.scrollLeft;

      highlightLayer.scrollTop = currentScrollTop;
      highlightLayer.scrollLeft = currentScrollLeft;

      console.log('Enhanced content scroll synced:', {
        scrollTop: currentScrollTop,
        scrollLeft: currentScrollLeft,
        contentLength: internalValue.length,
        timestamp: Date.now(),
      });

      // 标记同步完成
      highlightLayer.classList.add('sync-complete');

      // 300ms 后移除标记，允许下次同步
      setTimeout(() => {
        highlightLayer.classList.remove('sync-complete');
      }, 300);
    };

    // 立即同步一次
    syncScroll();

    // 使用双重 requestAnimationFrame 确保 DOM 更新后再同步
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        syncScroll();
      });
    });

    // 额外的延迟同步，确保复杂布局情况下也能正确同步
    const timeoutId = setTimeout(() => {
      syncScroll();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (highlightLayer) {
        highlightLayer.classList.remove('sync-complete');
      }
    };
  }, [internalValue]); // 当内容变化时同步滚动位置

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

  // 高亮显示变量引用
  const renderHighlightedText = useCallback((text: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
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

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
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
      setInternalValue(newValue);
      onChange?.(newValue);
      setTextCursorPosition(newCursorPos);

      // 同步设置输入框的光标位置
      if (inputRef.current) {
        setTimeout(() => {
          const textarea = inputRef.current.resizableTextArea.textArea;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
      }

      return true; // 已处理删除操作
    },
    [internalValue, onChange, findHighlightedBlockAtCursor],
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
        console.log(
          '检测到删除操作，原值:',
          prevValue,
          '新值:',
          newValue,
          '光标位置:',
          cursorPosition,
        );

        // 检查是否为一次性删除高亮区块
        // 使用当前光标位置和前一个光标位置来判断删除类型
        const prevCursorPos = textCursorPosition; // 之前保存的光标位置
        const isBackspace = cursorPosition <= prevCursorPos; // 光标位置没有移动或后退，说明是退格键
        const handledByHighlightDelete = deleteHighlightedBlock(
          cursorPosition,
          isBackspace,
        );

        if (handledByHighlightDelete) {
          console.log('高亮区块删除已处理，不再执行默认删除逻辑');
          return; // 已经处理了删除操作，不执行后续逻辑
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
            console.log('Auto-complete triggered:', {
              charAtCursor,
              cursorPosition,
              newValue,
              prevValue,
              nearbyText,
            });
          }
        }
      }

      if (shouldAutoCompleteBrace) {
        // 插入闭合的 } 并将光标移到中间
        const beforeCursor = newValue.substring(0, cursorPosition);
        const afterCursor = newValue.substring(cursorPosition);
        const newText = beforeCursor + '}' + afterCursor;

        // 计算新的光标位置：保持在 {} 中间
        // 用户输入 { 后，光标在 { 后面
        // 插入 } 后，光标应该在 } 前面，这样就在 {} 中间
        const newCursorPosition = cursorPosition; // 光标位置不变，正好在 {} 中间

        console.log(
          'Auto-completed text:',
          newText,
          'original cursor at:',
          cursorPosition,
          'new cursor at:',
          newCursorPosition,
          'preview:',
          newText.substring(
            Math.max(0, newCursorPosition - 5),
            newCursorPosition + 5,
          ),
        );

        setInternalValue(newText);
        onChange?.(newText);

        // 强制设置可见状态，确保下拉框显示
        console.log('Force setting visible to true for auto-complete');
        setVisible(true);

        // 延迟设置光标位置，确保DOM更新完成
        setTimeout(() => {
          if (inputRef.current) {
            const textarea = inputRef.current.resizableTextArea.textArea;

            console.log('Setting cursor position for auto-complete:', {
              requested: newCursorPosition,
              textLength: newText.length,
              finalText: newText,
              cursorPreview: newText.substring(
                Math.max(0, newCursorPosition - 3),
                newCursorPosition + 3,
              ),
            });

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

            console.log('Brace check:', {
              cursorPosition,
              lastBraceStart,
              closingBracePos,
              isInBraces,
              newText,
            });

            if (isInBraces) {
              console.log('Setting visible to true for brace input');
              setVisible(true);

              // 计算光标位置
              if (inputRef.current) {
                const textarea = inputRef.current.resizableTextArea.textArea;
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
                const scrollLeft =
                  textarea.scrollLeft ||
                  window.pageXOffset ||
                  document.documentElement.scrollLeft ||
                  0;
                const scrollTop =
                  textarea.scrollTop ||
                  window.pageYOffset ||
                  document.documentElement.scrollTop ||
                  0;

                // 计算光标相对于视口的像素位置（考虑滚动偏移）
                const cursorX = rect.left + currentCol * charWidth - scrollLeft;
                const cursorY =
                  rect.top + currentLine * lineHeight + lineHeight - scrollTop;

                console.log('Auto-complete cursor calculation enhanced:', {
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
                  cursorPosition,
                  newTextLength: newText.length,
                });

                // 使用改进的位置计算函数（参考 antd Select）
                const { position, adjustment } = calculateDropdownPosition(
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

                console.log('Calculated cursor position:', {
                  cursorX,
                  cursorY,
                  final: position,
                  adjustment,
                });
                setCursorPosition(position);
              }
            } else {
              console.log('Cursor not in braces, closing dropdown');
              setVisible(false);
            }
          } else {
            console.log('No closing brace found, closing dropdown');
            setVisible(false);
          }
        } else {
          console.log('No opening brace found, closing dropdown');
          setVisible(false);
        }

        return; // 提前返回，不执行后续逻辑
      }

      console.log('Input changed to:', newValue);
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
            console.log('In single brace context, showing dropdown');
          }
        }
      }

      if (isInVariableContext) {
        setVisible(true);

        // 计算光标的屏幕位置
        if (inputRef.current) {
          const textarea = inputRef.current.resizableTextArea.textArea;
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
          const scrollLeft =
            textarea.scrollLeft ||
            window.pageXOffset ||
            document.documentElement.scrollLeft ||
            0;
          const scrollTop =
            textarea.scrollTop ||
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            0;

          // 计算光标相对于视口的像素位置（考虑滚动偏移）
          const cursorX = rect.left + currentCol * charWidth - scrollLeft;
          const cursorY =
            rect.top + currentLine * lineHeight + lineHeight - scrollTop;

          console.log('Variable apply cursor calculation enhanced:', {
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
            cursorPosition,
            newValueLength: newValue.length,
          });

          // 使用改进的位置计算函数（参考 antd Select）
          const { position, adjustment } = calculateDropdownPosition(
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

          console.log('Calculated cursor position:', {
            cursorX,
            cursorY,
            final: position,
            adjustment,
          });
          setCursorPosition(position);
        }

        // 提取当前的变量路径
        const currentPath = beforeCursor.substring(lastDoubleBraceStart + 2);
        console.log('Variable context detected, currentPath:', currentPath);

        // 展开到当前路径
        const drilledTree = drillToPath(variableTree, currentPath);
        console.log('Drilled tree:', drilledTree);
      } else {
        setVisible(false);
        setSelectedKeys([]);
      }
    },
    [internalValue, readonly, variableTree, onChange],
  );

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
        e.preventDefault();
        if (currentIndex >= 0) {
          const selectedNode = allNodes[currentIndex];
          handleApplyVariable(selectedNode.value);
          setVisible(false);
          console.log('Variable applied:', selectedNode.value);
        }
      } else if (e.key === 'Escape') {
        const searchText = extractSearchTextFromInput(
          internalValue,
          textCursorPosition,
        );

        if (searchText.trim()) {
          // 如果有搜索文本，检查是单个大括号还是双大括号
          const beforeCursor = internalValue.substring(0, textCursorPosition);
          const lastBraceStart = beforeCursor.lastIndexOf('{');
          const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

          if (lastBraceStart > lastDoubleBraceStart) {
            // 单个大括号：删除 { 和搜索内容
            const index = internalValue.lastIndexOf('{' + searchText);
            if (index >= 0) {
              setInternalValue(internalValue.substring(0, index));
            }
          } else {
            // 双大括号：删除 {{ 和搜索内容
            const index = internalValue.lastIndexOf('{{' + searchText);
            if (index >= 0) {
              setInternalValue(internalValue.substring(0, index));
            }
          }
        } else {
          // 检查是否有 { 或 {{
          if (internalValue.includes('{')) {
            const beforeCursor = internalValue.substring(0, textCursorPosition);
            const lastBraceStart = beforeCursor.lastIndexOf('{');
            const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

            if (lastBraceStart > lastDoubleBraceStart) {
              // 单个大括号：删除 { 和对应的 }
              const index = internalValue.lastIndexOf('{');
              if (index >= 0) {
                // 找到对应的 }
                const afterBrace = internalValue.substring(index + 1);
                const closingBracePos = afterBrace.indexOf('}');

                if (closingBracePos !== -1) {
                  // 删除 {xxx}
                  setInternalValue(
                    internalValue.substring(0, index) +
                      internalValue.substring(index + 1 + closingBracePos + 1),
                  );
                } else {
                  // 只有 {，删除 {
                  setInternalValue(internalValue.substring(0, index));
                }
              }
            } else if (internalValue.includes('{{')) {
              // 双大括号：删除 {{
              const index = internalValue.lastIndexOf('{{');
              if (index >= 0) {
                setInternalValue(
                  internalValue.substring(0, index) +
                    internalValue.substring(index + 2),
                );
              }
            }
          }
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
      textCursorPosition,
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
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        e.stopPropagation();

        // 直接在这里实现键盘导航逻辑，避免函数依赖问题
        handleTreeNavigation(e);
      }
    };

    console.log('Adding global keyboard listener');
    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      console.log('Removing global keyboard listener');
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [visible, readonly, handleTreeNavigation]); // 包含 handleTreeNavigation 依赖

  const popoverShouldShow =
    visible &&
    !readonly &&
    !disabled &&
    (internalValue.includes('{{') || internalValue.includes('{}')); // 支持 {{ 和 {} 两种情况

  // 添加详细的调试日志
  console.log('Popover show condition:', {
    visible,
    readonly,
    disabled,
    shouldShow: popoverShouldShow,
    internalValue,
    hasDoubleBrace: internalValue.includes('{{'),
    hasSingleBrace: internalValue.includes('{}'),
  });

  return (
    <div className={cx('prompt-variable-ref', className)} style={style}>
      {/* 主要的输入区域 */}
      <div className="input-container">
        {/* 高亮背景层 - 显示所有文本，包括高亮的变量引用 */}
        <div ref={highlightLayerRef} className="highlight-layer">
          {internalValue ? renderHighlightedText(internalValue) : ''}
        </div>

        {/* 实际的输入框 - 文本透明，只显示光标和选择效果 */}
        <TextArea
          ref={inputRef}
          value={internalValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className="prompt-variable-input"
        />
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
                {extractSearchTextFromInput(internalValue, textCursorPosition)
                  ? `搜索："${extractSearchTextFromInput(
                      internalValue,
                      textCursorPosition,
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
