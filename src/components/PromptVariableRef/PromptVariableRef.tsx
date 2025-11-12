/*
 * Prompt Variable Reference Component
 * 提示词变量引用组件
 * 支持 {{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}} 语法
 */

import { SearchOutlined } from '@ant-design/icons';
import { Empty, Input, Popover, Tree } from 'antd';
import React, { useCallback, useRef, useState } from 'react';

import './styles.less';
import type { PromptVariableRefProps, VariableTreeNode } from './types';
import {
  buildVariableTree,
  drillToPath,
  filterVariableTree,
  generateVariableReference,
  getVariableTypeIcon,
} from './utils/treeUtils';

const { TextArea } = Input;

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
  const [internalValue, setInternalValue] = useState(value || '');
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const inputRef = useRef<any>(null);
  const treeRef = useRef<any>(null);

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

  // 同步外部 value 到内部 state
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // 构建变量树
  const variableTree = buildVariableTree(variables);

  // 过滤变量树
  const filteredTree = filterVariableTree(variableTree, searchText);

  // 应用变量
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
        const afterStartText = beforeText.substring(lastStartPos);
        const endPosMatch = afterStartText.indexOf('}}');

        let finalText: string;
        let newCursorPos: number;

        if (endPosMatch !== -1) {
          // 替换现有的变量引用
          const variableRef = generateVariableReference(nodeValue);
          finalText =
            beforeText.substring(0, lastStartPos) +
            variableRef +
            afterText.substring(endPosMatch - afterStartText.length + 2);
          newCursorPos = lastStartPos + variableRef.length;
        } else {
          // 完成新的变量引用
          const variableRef = generateVariableReference(nodeValue);
          finalText = beforeText + variableRef + afterText;
          newCursorPos = lastStartPos + variableRef.length;
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
      setSearchText('');
    },
    [value, onChange, onVariableSelect, variableTree],
  );

  // 处理输入变化
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(newValue);

      // 检查是否在输入变量引用
      const cursorPosition = e.target.selectionStart || 0;

      // 检查光标前是否有 {{
      const beforeCursor = newValue.substring(0, cursorPosition);
      const lastDoubleBraceStart = beforeCursor.lastIndexOf('{{');

      // 检查是否刚刚输入了 {{ 或正在 {{...}} 中
      // 确保在 {{ 之后没有对应的 }}
      const afterLastStart = beforeCursor.substring(lastDoubleBraceStart + 2);
      const hasClosingBraces = afterLastStart.includes('}}');
      const isInVariableContext =
        lastDoubleBraceStart !== -1 && !hasClosingBraces;

      if (isInVariableContext && !readonly) {
        setVisible(true);
        // 提取当前的变量路径
        const currentPath = beforeCursor.substring(lastDoubleBraceStart + 2);
        setSearchText(currentPath);

        // 展开到当前路径
        const drilledTree = drillToPath(variableTree, currentPath);
        // 更新展开的 keys
        const expandedKeys = drilledTree.flatMap((node) =>
          node.keyPath ? [node.keyPath.slice(0, -1).join('.')] : [],
        );
        setExpandedKeys(expandedKeys.filter(Boolean));
      } else {
        setVisible(false);
        setSearchText('');
        setExpandedKeys([]);
      }
    },
    [onChange, readonly, variableTree],
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!visible || readonly) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // 选择第一个节点
        const firstSelectableNode = document.querySelector(
          '.ant-tree-node-content-wrapper',
        );
        if (firstSelectableNode) {
          (firstSelectableNode as HTMLElement).click();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        // 处理向上选择
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // 应用选中的变量
        const selectedKey = selectedKeys[0];
        if (selectedKey) {
          handleApplyVariable(selectedKey as string);
        }
      } else if (e.key === 'Escape') {
        setVisible(false);
      }
    },
    [visible, readonly, selectedKeys, handleApplyVariable],
  );

  // 树节点选择
  const handleTreeSelect = useCallback(
    (selectedKeys: React.Key[]) => {
      setSelectedKeys(selectedKeys);
      if (selectedKeys.length > 0) {
        handleApplyVariable(selectedKeys[0] as string);
      }
    },
    [handleApplyVariable],
  );

  return (
    <div className={`prompt-variable-ref ${className}`} style={style}>
      <TextArea
        ref={inputRef}
        value={internalValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className="prompt-variable-input"
      />

      <Popover
        open={visible && !readonly && !disabled}
        placement={direction}
        trigger={[]} // 移除 trigger，通过 open 属性完全控制显示
        content={
          <div className="variable-popover-content">
            <div className="variable-search">
              <SearchOutlined />
              <input
                type="text"
                placeholder="搜索变量..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="variable-search-input"
              />
            </div>

            <div className="variable-tree-container">
              {filteredTree.length > 0 ? (
                <Tree
                  ref={treeRef}
                  treeData={filteredTree}
                  selectedKeys={selectedKeys}
                  expandedKeys={expandedKeys}
                  onExpandedKeysChange={setExpandedKeys}
                  onSelect={handleTreeSelect}
                  titleRender={(nodeData) => {
                    if (typeof nodeData === 'object' && nodeData !== null) {
                      const variable = (nodeData as any).variable;
                      if (variable) {
                        return (
                          <div className="variable-tree-node">
                            <span className="variable-type-icon">
                              {getVariableTypeIcon(variable.type)}
                            </span>
                            <span className="variable-label">
                              {nodeData.title || nodeData.label}
                            </span>
                            {variable.description && (
                              <span className="variable-description">
                                {variable.description}
                              </span>
                            )}
                          </div>
                        );
                      }
                    }
                    return nodeData.title || nodeData.label || nodeData.key;
                  }}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="没有找到匹配的变量"
                />
              )}
            </div>

            <div className="variable-popover-footer">
              <small>
                支持语法：{'{{variable}}'}, {'{{variable.property}}'},{' '}
                {'{{variable[0]}}'}
              </small>
            </div>
          </div>
        }
        overlayClassName="variable-popover"
        autoAdjustOverflow
      >
        <div style={{ display: 'none' }} />
      </Popover>
    </div>
  );
};

export default PromptVariableRef;
