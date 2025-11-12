/*
 * Prompt Variable Reference Component
 * 提示词变量引用组件
 * 支持 {{变量名}}、{{变量名.子变量名}}、{{变量名[数组索引]}} 语法
 */

import { Input, Popover } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import './styles.less';
import type { PromptVariableRefProps, VariableTreeNode } from './types';
import {
  buildVariableTree,
  drillToPath,
  filterVariableTree,
  generateVariableReference,
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
  // const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]); // 临时注释用于调试
  // const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]); // 临时注释用于调试

  const inputRef = useRef<any>(null);
  // const treeRef = useRef<any>(null); // 临时注释用于调试

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
  console.log('Variable tree built:', variableTree);

  // 过滤变量树
  const filteredTree = filterVariableTree(variableTree, searchText);
  console.log('Filtered tree:', filteredTree, 'searchText:', searchText);

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

  // 树节点选择 - 临时注释用于调试
  // const handleTreeSelect = useCallback(
  //   (selectedKeys: React.Key[]) => {
  //     setSelectedKeys(selectedKeys);
  //     if (selectedKeys.length > 0) {
  //       handleApplyVariable(selectedKeys[0] as string);
  //     }
  //   },
  //   [handleApplyVariable],
  // );

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
        open={popoverShouldShow}
        placement="bottom" // 临时使用简单的 placement
        trigger={[]} // 移除 trigger，通过 open 属性完全控制显示
        onOpenChange={(open) => console.log('Popover open changed to:', open)}
        content={
          <div
            style={{
              padding: 20,
              background: 'red',
              width: 300,
              minHeight: 200,
            }}
          >
            <div>TEST CONTENT - Popover is showing!</div>
            <div>Variables count: {filteredTree.length}</div>
            <div>Visible: {visible.toString()}</div>
            <div>Readonly: {readonly.toString()}</div>
            <div>Disabled: {disabled.toString()}</div>
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
