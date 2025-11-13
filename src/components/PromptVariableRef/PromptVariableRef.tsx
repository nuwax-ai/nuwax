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
  direction = 'bottomLeft',
  placeholder = '输入提示词，使用 {{变量名}} 引用变量',
  onChange,
  onVariableSelect,
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

  // 从文本输入框中提取搜索关键词
  const extractSearchTextFromInput = useCallback(
    (inputText: string): string => {
      // 查找 {{ 后面的搜索内容
      const match = inputText.match(/{{([^}]*)$/);
      return match ? match[1] : '';
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

  // 应用变量（需要在 useEffect 之前定义）
  const handleApplyVariable = useCallback(
    (nodeValue: string) => {
      if (!inputRef.current) return;

      const textarea = inputRef.current.resizableTextArea.textArea;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const currentValue = internalValue;

      // 查找 {{...}} 的范围
      const beforeText = currentValue.substring(0, startPos);
      const afterText = currentValue.substring(endPos);

      // 找到最近的 {{ 开始位置
      const lastStartPos = beforeText.lastIndexOf('{{');
      if (lastStartPos !== -1) {
        // 检查是否有匹配的 }} 结束位置
        const afterStartText = beforeText.substring(lastStartPos + 2); // 从 {{ 后开始
        const endPosMatch = afterStartText.indexOf('}}');

        let finalText: string;
        let newCursorPos: number;

        if (endPosMatch !== -1) {
          // 替换现有的变量引用（包含 {{ 和 }}）
          const beforeVariable = beforeText.substring(0, lastStartPos);
          const afterVariable = afterText.substring(endPosMatch + 2); // 跳过 }}
          finalText = beforeVariable + `{{${nodeValue}}}` + afterVariable;
          newCursorPos = beforeVariable.length + nodeValue.length + 4; // 4 = {{}} 的长度
        } else {
          // 完成新的变量引用
          const beforeVariable = beforeText.substring(0, lastStartPos);
          finalText = beforeVariable + `{{${nodeValue}}}` + afterText;
          newCursorPos = beforeVariable.length + nodeValue.length + 4;
        }

        setInternalValue(finalText);
        onChange?.(finalText);

        // 设置光标位置
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

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

  // 同步输入框和高亮层的滚动位置
  useEffect(() => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    const handleScroll = () => {
      // 同步滚动位置
      highlightLayer.scrollTop = textarea.scrollTop;
      highlightLayer.scrollLeft = textarea.scrollLeft;
    };

    // 监听输入框滚动事件
    textarea.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
    };
  }, []); // 只在组件挂载时绑定一次

  // 当内容变化时，同步一次滚动位置（确保内容变化后滚动位置正确）
  useEffect(() => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    // 使用 requestAnimationFrame 确保 DOM 更新后再同步
    requestAnimationFrame(() => {
      highlightLayer.scrollTop = textarea.scrollTop;
      highlightLayer.scrollLeft = textarea.scrollLeft;
    });
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
      const variableName = match[1];
      parts.push(
        <span key={`variable-${match.index}`} className="variable-highlight">
          {`{{${variableName}}}`}
        </span>,
      );

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }, []);

  // 处理输入变化
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      console.log('Input changed to:', newValue);
      setInternalValue(newValue);
      onChange?.(newValue);

      // 检查是否在输入变量引用
      const cursorPosition = e.target.selectionStart || 0;
      console.log('Cursor position:', cursorPosition);

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
          const textarea = inputRef.current.resizableTextArea.textArea;
          const rect = textarea.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(textarea);
          const lineHeight = parseInt(computedStyle.lineHeight) || 20;
          const charWidth = parseInt(computedStyle.fontSize) * 0.6; // 估算字符宽度

          // 计算光标在文本中的位置
          const textBeforeCursor = newValue.substring(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLine = lines.length - 1;
          const currentCol = lines[lines.length - 1].length;

          // 计算光标相对于文本域的像素位置
          const cursorX = rect.left + currentCol * charWidth;
          const cursorY = rect.top + currentLine * lineHeight + lineHeight;

          // 使用改进的位置计算函数（参考 antd Select）
          const { position, adjustment } = calculateDropdownPosition(
            cursorX,
            cursorY,
            inputRef.current, // DOM元素或undefined
            undefined, // dimensions，使用默认值
            {
              hasSearch: true, // 变量引用下拉框始终有搜索区域
              searchText: extractSearchTextFromInput(internalValue),
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

          // 记录位置调整信息，用于定位指示器
          // const positionInfo = getPositionAdjustment(
          //   { x: cursorX, y: cursorY },
          //   position,
          // );
          // console.log('Position adjustment info:', positionInfo);
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
    },
    [onChange, readonly, variableTree],
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
    visible && !readonly && !disabled && internalValue.includes('{{'); // 只要包含 {{ 就显示，不要求有搜索文本
  console.log('Popover show condition:', {
    visible,
    readonly,
    disabled,
    shouldShow: popoverShouldShow,
    direction,
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
