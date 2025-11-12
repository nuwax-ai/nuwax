/*
 * Prompt Variable Reference Component
 * 提示词变量引用组件
 * 支持 {{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}} 语法
 */

import { Input } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import './styles.less';
import type { PromptVariableRefProps, VariableTreeNode } from './types';
import {
  buildVariableTree,
  drillToPath,
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
  console.log('PromptVariableRef rendered with variables:', variables);
  console.log('Current value:', value);
  const [internalValue, setInternalValue] = useState(value || '');
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [activeKey, setActiveKey] = useState<React.Key | null>(null); // 当前激活的变量

  // 添加光标位置状态
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

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

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visible) {
        setVisible(false);
        setSearchText('');
      }
    };

    if (visible) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [visible]);

  // 全局键盘事件处理，当下拉框显示时
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!visible || readonly) return;

      // 当下拉框显示时，直接处理键盘导航事件
      // 不检查焦点位置，因为焦点可能在输入框中
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Global keydown detected:', e.key);

        // 获取所有叶子节点
        const getAllLeafNodes = (
          nodes: VariableTreeNode[],
        ): VariableTreeNode[] => {
          const leafNodes: VariableTreeNode[] = [];
          const traverse = (nodeList: VariableTreeNode[]) => {
            nodeList.forEach((node) => {
              if (!node.children || node.children.length === 0) {
                leafNodes.push(node);
              } else {
                traverse(node.children);
              }
            });
          };
          traverse(nodes);
          return leafNodes;
        };

        const leafNodes = getAllLeafNodes(displayTree);
        console.log(
          'Available leaf nodes:',
          leafNodes.map((n) => n.key),
        );

        if (e.key === 'ArrowDown') {
          let nextIndex = 0;
          if (activeKey) {
            const currentIndex = leafNodes.findIndex(
              (node) => node.key === activeKey,
            );
            nextIndex =
              currentIndex >= 0 ? (currentIndex + 1) % leafNodes.length : 0;
          }

          const nextNode = leafNodes[nextIndex];
          console.log('Selecting next node:', nextNode);
          setActiveKey(nextNode.key);
          setSelectedKeys([nextNode.key]);

          // 滚动到选中项
          setTimeout(() => {
            const element = document.querySelector(
              `[data-node-key="${nextNode.key}"]`,
            ) as HTMLElement;
            if (element) {
              element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
        } else if (e.key === 'ArrowUp') {
          let prevIndex = leafNodes.length - 1;
          if (activeKey) {
            const currentIndex = leafNodes.findIndex(
              (node) => node.key === activeKey,
            );
            prevIndex =
              currentIndex > 0 ? currentIndex - 1 : leafNodes.length - 1;
          }

          const prevNode = leafNodes[prevIndex];
          console.log('Selecting prev node:', prevNode);
          setActiveKey(prevNode.key);
          setSelectedKeys([prevNode.key]);

          // 滚动到选中项
          setTimeout(() => {
            const element = document.querySelector(
              `[data-node-key="${prevNode.key}"]`,
            ) as HTMLElement;
            if (element) {
              element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
        } else if (e.key === 'Enter') {
          console.log('Enter pressed, activeKey:', activeKey);
          if (activeKey) {
            const selectedNode = leafNodes.find(
              (node) => node.key === activeKey,
            );
            if (selectedNode) {
              console.log('Applying variable:', selectedNode.value);
              handleApplyVariable(selectedNode.value);
            }
          } else if (leafNodes.length > 0) {
            console.log('Applying first variable:', leafNodes[0].value);
            handleApplyVariable(leafNodes[0].value);
          }
        } else if (e.key === 'Escape') {
          console.log('Escape pressed, closing dropdown');
          setVisible(false);
          setActiveKey(null);
        }
      }
    };

    if (visible) {
      console.log('Adding global keyboard listener, visible:', visible);
      document.addEventListener('keydown', handleGlobalKeyDown, true);
      return () => {
        console.log('Removing global keyboard listener');
        document.removeEventListener('keydown', handleGlobalKeyDown, true);
      };
    }
  }, [visible, readonly, handleKeyDown]);

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
        <span
          key={`variable-${match.index}`}
          style={{
            backgroundColor: '#e6f7ff',
            color: '#1890ff',
            padding: '2px 4px',
            borderRadius: '3px',
            fontFamily: 'Monaco, Menlo, monospace',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {`{{${variableName}}}`}
        </span>,
      );

      lastIndex = match.index + match.length;
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }, []);

  // 构建变量树
  const variableTree = buildVariableTree(variables);

  // 由于移除了搜索框，直接显示完整的变量树
  const displayTree = variableTree;

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
      setSearchText('');
    },
    [value, onChange, onVariableSelect, variableTree],
  );

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

          console.log('Calculated cursor position:', { cursorX, cursorY });
          setCursorPosition({ x: cursorX, y: cursorY });
        }

        // 提取当前的变量路径
        const currentPath = beforeCursor.substring(lastDoubleBraceStart + 2);
        console.log('Variable context detected, currentPath:', currentPath);
        setSearchText(currentPath);

        // 展开到当前路径
        const drilledTree = drillToPath(variableTree, currentPath);
        console.log('Drilled tree:', drilledTree);
        // 更新展开的 keys - 临时注释用于调试
        // const expandedKeys = drilledTree.flatMap((node) =>
        //   node.keyPath ? [node.keyPath.slice(0, -1).join('.')] : [],
        // );
        // const finalExpandedKeys = expandedKeys.filter(Boolean);
        // console.log('Setting expanded keys:', finalExpandedKeys);
        // setExpandedKeys(finalExpandedKeys);
      } else {
        console.log('Setting visible to false');
        setVisible(false);
        setSearchText('');
        // setExpandedKeys([]); // 临时注释用于调试
      }
    },
    [onChange, readonly, variableTree],
  );

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!visible || readonly) return;

      // 获取所有可选择的节点（叶子节点）
      const getAllLeafNodes = (
        nodes: VariableTreeNode[],
      ): VariableTreeNode[] => {
        const leafNodes: VariableTreeNode[] = [];
        const traverse = (nodeList: VariableTreeNode[]) => {
          nodeList.forEach((node) => {
            if (!node.children || node.children.length === 0) {
              leafNodes.push(node);
            } else {
              traverse(node.children);
            }
          });
        };
        traverse(nodes);
        return leafNodes;
      };

      const leafNodes = getAllLeafNodes(displayTree);
      if (leafNodes.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        let nextIndex = 0;
        if (activeKey) {
          const currentIndex = leafNodes.findIndex(
            (node) => node.key === activeKey,
          );
          nextIndex =
            currentIndex >= 0 ? (currentIndex + 1) % leafNodes.length : 0;
        }

        const nextNode = leafNodes[nextIndex];
        setActiveKey(nextNode.key);
        setSelectedKeys([nextNode.key]);

        // 自动展开到该节点的路径
        if (nextNode.keyPath) {
          const keysToExpand = nextNode.keyPath.slice(0, -1);
          setExpandedKeys((prev) => [...new Set([...prev, ...keysToExpand])]);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let prevIndex = leafNodes.length - 1;
        if (activeKey) {
          const currentIndex = leafNodes.findIndex(
            (node) => node.key === activeKey,
          );
          prevIndex =
            currentIndex > 0 ? currentIndex - 1 : leafNodes.length - 1;
        }

        const prevNode = leafNodes[prevIndex];
        setActiveKey(prevNode.key);
        setSelectedKeys([prevNode.key]);

        // 自动展开到该节点的路径
        if (prevNode.keyPath) {
          const keysToExpand = prevNode.keyPath.slice(0, -1);
          setExpandedKeys((prev) => [...new Set([...prev, ...keysToExpand])]);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeKey) {
          const selectedNode = findNodeByKey(displayTree, activeKey as string);
          if (selectedNode) {
            handleApplyVariable(selectedNode.value);
          }
        } else if (selectedKeys.length > 0) {
          handleApplyVariable(selectedKeys[0] as string);
        }
      } else if (e.key === 'Escape') {
        setVisible(false);
        setActiveKey(null);
      }
    },
    [
      visible,
      readonly,
      activeKey,
      selectedKeys,
      displayTree,
      handleApplyVariable,
    ],
  );

  // 树节点选择
  const handleTreeSelect = useCallback(
    (selectedKeys: React.Key[], info: any) => {
      setSelectedKeys(selectedKeys);
      setActiveKey(selectedKeys[0] || null);
      if (selectedKeys.length > 0) {
        handleApplyVariable(selectedKeys[0] as string);
      }
    },
    [handleApplyVariable],
  );

  const popoverShouldShow = visible && !readonly && !disabled;
  console.log('Popover show condition:', {
    visible,
    readonly,
    disabled,
    shouldShow: popoverShouldShow,
    direction,
  });

  return (
    <div className={`prompt-variable-ref ${className}`} style={style}>
      {/* 主要的输入区域 */}
      <div style={{ position: 'relative' }}>
        {/* 高亮背景层 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            padding: '4px 11px',
            backgroundColor: 'transparent',
            color: 'transparent',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            pointerEvents: 'none',
            zIndex: 1,
            fontFamily: 'Monaco, Menlo, monospace',
            fontSize: '14px',
            lineHeight: '1.5715',
          }}
        >
          {renderHighlightedText(internalValue) || <span>&nbsp;</span>}
        </div>

        {/* 实际的输入框 */}
        <TextArea
          ref={inputRef}
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className="prompt-variable-input"
          style={{
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 2,
          }}
        />
      </div>

      {/* 变量引用下拉框 */}
      {popoverShouldShow && (
        <div
          className="variable-dropdown"
          style={{
            position: 'fixed',
            left: cursorPosition.x,
            top: cursorPosition.y,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            padding: '8px 0',
            minWidth: '320px',
            maxWidth: '400px',
            maxHeight: '300px',
            overflow: 'auto',
            boxShadow:
              '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(10px)', // 稍微向下偏移避免遮挡光标
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 变量列表 - 使用树形结构 */}
          <div>
            {displayTree.length > 0 ? (
              displayTree.map((node) => (
                <div
                  key={node.key}
                  data-node-key={node.key}
                  className="variable-item"
                  style={{
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    borderBottom: '1px solid #f5f5f5',
                    transition: 'background-color 0.2s',
                    // 添加层级缩进
                    paddingLeft: `${
                      8 + ((node.keyPath?.length || 1) - 1) * 16
                    }px`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => {
                    handleApplyVariable(node.value);
                  }}
                >
                  {/* 层级指示器 */}
                  {(node.keyPath?.length || 1) > 1 && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#8c8c8c',
                        position: 'absolute',
                        left: '8px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      ├─
                    </span>
                  )}

                  <span style={{ fontSize: '12px', opacity: 0.8 }}>
                    {getVariableTypeIcon(node.variable.type)}
                  </span>
                  <span
                    style={{
                      fontWeight: (node.keyPath?.length || 1) === 1 ? 600 : 500,
                      color: '#262626',
                    }}
                  >
                    {node.label}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#8c8c8c',
                      marginLeft: 'auto',
                    }}
                  >
                    {node.variable.type}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#8c8c8c',
                }}
              >
                没有找到匹配的变量
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa',
              fontSize: '12px',
              color: '#8c8c8c',
              textAlign: 'center',
            }}
          >
            支持语法：{'{variable}'}, {'{variable.property}'}, {'{variable[0]}'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVariableRef;
