import { Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContentEditable } from './hooks/useContentEditable';
import { useDropdownPosition } from './hooks/useDropdownPosition';
import { useInputHandler } from './hooks/useInputHandler';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useVariableTree } from './hooks/useVariableTree';
import './styles.less';
import { VariableInferenceInputProps } from './types';
import { extractSearchTextFromInput } from './utils/textUtils';
import { transformToTreeDataForTree } from './utils/treeHelpers';

const VariableInferenceInput: React.FC<VariableInferenceInputProps> = ({
  value,
  onChange,
  variables,
  skills,
  placeholder = '输入 {{ 引用变量',
  disabled = false,
  readonly = false,
  className,
  style,
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const [visible, setVisible] = useState(false);
  const [textCursorPosition, setTextCursorPosition] = useState(0);

  // Update internal value when prop value changes
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // 1. Variable Tree Logic
  const searchText = useMemo(
    () => extractSearchTextFromInput(internalValue, textCursorPosition),
    [internalValue, textCursorPosition],
  );

  const {
    variableTree,
    displayTree,
    expandedKeys,
    setExpandedKeys,
    selectedKeys,
    setSelectedKeys,
  } = useVariableTree(variables, skills, searchText, visible);

  // 2. Dropdown Position Logic
  const { cursorPosition, setCursorPosition } = useDropdownPosition();

  // 3. Create ref to store handleInputChange before it's defined
  const handleInputChangeRef = useRef<((value: string) => void) | null>(null);

  // 4. Content Editable Logic (needs to be defined first to get ref)
  const {
    contentEditableRef,
    internalHtml,
    handleInput,
    handlePaste,
    handleCompositionStart,
    handleCompositionEnd,
  } = useContentEditable(
    internalValue,
    (newValue) => {
      // This callback is called when contentEditable changes
      // We need to pass this to useInputHandler to handle side effects (like showing dropdown)
      if (handleInputChangeRef.current) {
        handleInputChangeRef.current(newValue);
      }
    },
    readonly,
    disabled,
  );

  // 5. Input Handler Logic
  const { handleApplyVariable, handleInputChange } = useInputHandler(
    internalValue,
    setInternalValue,
    onChange,
    contentEditableRef,
    setVisible,
    setSelectedKeys,
    textCursorPosition,
    setTextCursorPosition,
    setCursorPosition,
    variableTree,
    readonly,
  );

  // Store handleInputChange in ref for useContentEditable callback
  handleInputChangeRef.current = handleInputChange;

  // 5. Keyboard Navigation Logic
  const { onKeyDown } = useKeyboardNavigation(
    visible,
    displayTree,
    selectedKeys,
    setSelectedKeys,
    expandedKeys,
    setExpandedKeys,
    handleApplyVariable,
    setVisible,
    internalValue,
    setInternalValue,
    textCursorPosition,
    readonly,
  );

  const popoverShouldShow =
    visible &&
    !readonly &&
    !disabled &&
    (internalValue.includes('{{') || internalValue.includes('{}'));

  return (
    <div className={['prompt-variable-ref', className].join(' ')} style={style}>
      <div className="input-container">
        <div
          ref={contentEditableRef}
          className="prompt-variable-input content-editable scroll-container"
          contentEditable={!readonly && !disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={onKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          dangerouslySetInnerHTML={{ __html: internalHtml }}
        />
        {!internalValue && (
          <div
            className="placeholder"
            style={{
              position: 'absolute',
              top: '9px',
              left: '9px',
              color: '#bfbfbf',
              pointerEvents: 'none',
            }}
          >
            {placeholder}
          </div>
        )}
      </div>

      {popoverShouldShow && (
        <div
          className="variable-tree-list"
          tabIndex={-1}
          style={{
            position: 'fixed',
            left: cursorPosition.x,
            top: cursorPosition.y,
            zIndex: 9999,
            width: '300px',
            padding: '8px',
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            boxShadow:
              '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="tree-list-content">
            {displayTree.length > 0 ? (
              <Tree
                treeData={transformToTreeDataForTree(displayTree)}
                selectedKeys={selectedKeys}
                expandedKeys={expandedKeys as string[]}
                onExpand={(newExpandedKeys) => setExpandedKeys(newExpandedKeys)}
                onSelect={(selectedKeys) => {
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
                    // Check if it's a tool
                    // We need to access the original node data to check type
                    // transformToTreeDataForTree might not preserve all fields in 'value'
                    // But we stored the full skill object in variable.value in useVariableTree

                    // Actually, transformToTreeDataForTree uses node.value as the value.
                    // In useVariableTree, we set value: skill.toolName || ...
                    // But we also set variable: { type: 'Tool', value: skill }
                    // We need to find the original node in displayTree to get the variable data

                    const findOriginalNode = (nodes: any[]): any => {
                      for (const node of nodes) {
                        if (node.key === selectedKeys[0]) return node;
                        if (node.children) {
                          const found = findOriginalNode(node.children);
                          if (found) return found;
                        }
                      }
                      return null;
                    };

                    const originalNode = findOriginalNode(displayTree);

                    if (
                      originalNode &&
                      originalNode.variable?.type === 'Tool'
                    ) {
                      handleApplyVariable(
                        originalNode.value,
                        true,
                        originalNode.variable.value,
                      );
                    } else {
                      handleApplyVariable(selectedNode.value);
                    }
                    setVisible(false);
                  }
                }}
                showIcon={false}
                tabIndex={-1}
                style={{
                  maxHeight: '240px',
                  overflowY: 'auto',
                }}
                height={240}
                itemHeight={28}
                virtual={true}
              />
            ) : (
              <div
                style={{ padding: '8px', color: '#999', textAlign: 'center' }}
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

export default VariableInferenceInput;
