/*
 * Prompt Variable Reference Component
 * 提示词变量引用组件
 * 支持 {{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}} 语法
 */

import { Input, Tree } from 'antd';
import cx from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

import './styles.less';
import type { PromptVariableRefProps, VariableTreeNode } from './types';
import { extractSearchTextFromInput } from './utils/parser';
import { getVariableTypeIcon } from './utils/treeUtils';

// Hooks
import { useDropdownPosition } from './hooks/useDropdownPosition';
import { useInputHandler } from './hooks/useInputHandler';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useScrollSync } from './hooks/useScrollSync';
import { useVariableTree } from './hooks/useVariableTree';

const { TextArea } = Input;

// 将变量树节点转换为 Tree 组件格式
const transformToTreeDataForTree = (nodes: VariableTreeNode[]): any[] => {
  return nodes.map((node) => {
    return {
      title: (
        <div className="tree-node-title">
          <span className="node-icon">
            {node.variable?.type
              ? getVariableTypeIcon(node.variable.type)
              : '📝'}
          </span>
          <span className="node-label">{node.label}</span>
          <span className="node-type">{node.variable?.type || 'unknown'}</span>
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
  const [visible, setVisible] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  const inputRef = useRef<any>(null);
  const treeRef = useRef<any>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  // 1. Dropdown Position Hook
  const { cursorPosition, setCursorPosition } = useDropdownPosition();

  // 2. Input Handler Hook
  const {
    internalValue,
    setInternalValue,
    textCursorPosition,
    handleInputChange,
    handleApplyVariable,
  } = useInputHandler({
    value,
    onChange,
    readonly,
    inputRef,
    setCursorPosition,
    setVisible,
    setSelectedKeys,
    variables,
  });

  // 3. Variable Tree Hook
  const searchText = extractSearchTextFromInput(
    internalValue,
    textCursorPosition,
  );
  const { variableTree, displayTree } = useVariableTree(variables, searchText);

  // 4. Scroll Sync Hook
  useScrollSync({
    inputRef,
    highlightLayerRef,
    internalValue,
    visible,
    textCursorPosition,
    extractSearchTextFromInput,
    setCursorPosition,
  });

  // 5. Keyboard Navigation Hook
  const { handleKeyDown } = useKeyboardNavigation({
    visible,
    displayTree,
    selectedKeys,
    expandedKeys,
    setSelectedKeys,
    setExpandedKeys,
    onSelect: handleApplyVariable,
    onClose: () => setVisible(false),
    extractSearchTextFromInput,
    internalValue,
    textCursorPosition,
    setInternalValue,
  });

  // 同步外部 value 到内部 state
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value, setInternalValue]);

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

  // 全局键盘事件处理
  useEffect(() => {
    if (!visible) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (readonly) return;
      handleKeyDown(e);
    };

    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [visible, readonly, handleKeyDown]);

  // 高亮显示变量引用
  const renderHighlightedText = (text: string) => {
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
  };

  const popoverShouldShow =
    visible &&
    !readonly &&
    !disabled &&
    (internalValue.includes('{{') || internalValue.includes('{}'));

  return (
    <div className={cx('prompt-variable-ref', className)} style={style}>
      {/* 主要的输入区域 */}
      <div className="input-container">
        {/* 高亮背景层 - 显示所有文本，包括高亮的变量引用 */}
        <div ref={highlightLayerRef} className="highlight-layer">
          <div className="highlight-content">
            {internalValue ? (
              renderHighlightedText(internalValue)
            ) : (
              // 空内容时显示一个不可见的空格，确保有基本高度
              <span style={{ visibility: 'hidden' }}>&nbsp;</span>
            )}
          </div>
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
            left: cursorPosition.x,
            top: cursorPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 搜索提示 */}
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
                onSelect={(keys) => {
                  // 处理点击选择
                  if (keys.length > 0) {
                    const key = keys[0] as string;
                    // 查找对应的节点
                    const findNode = (
                      nodes: VariableTreeNode[],
                    ): VariableTreeNode | undefined => {
                      for (const node of nodes) {
                        if (node.key === key) return node;
                        if (node.children) {
                          const found = findNode(node.children);
                          if (found) return found;
                        }
                      }
                      return undefined;
                    };
                    const node = findNode(displayTree);
                    if (node) {
                      handleApplyVariable(node.value);
                    }
                  }
                }}
                height={240}
                itemHeight={32}
                virtual
              />
            ) : (
              <div
                style={{ padding: '8px', textAlign: 'center', color: '#999' }}
              >
                未找到匹配变量
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVariableRef;
