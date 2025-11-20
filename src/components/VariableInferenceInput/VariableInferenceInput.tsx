import { Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDropdownPosition } from './hooks/useDropdownPosition';
import { useHighlight } from './hooks/useHighlight';
import { useInputHandler } from './hooks/useInputHandler';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useScrollSync } from './hooks/useScrollSync';
import { useVariableTree } from './hooks/useVariableTree';
import './styles.less';
import { VariableInferenceInputProps } from './types';
import { extractSearchTextFromInput } from './utils/textUtils';
import { transformToTreeDataForTree } from './utils/treeHelpers';

const VariableInferenceInput: React.FC<VariableInferenceInputProps> = ({
  value,
  onChange,
  variables,
  placeholder = '输入 {{ 引用变量',
  disabled = false,
  readonly = false,
  className,
  style,
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const [visible, setVisible] = useState(false);
  const [textCursorPosition, setTextCursorPosition] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<any>(null);

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
  } = useVariableTree(variables, searchText, visible);

  // 2. Dropdown Position Logic
  const { cursorPosition, setCursorPosition } = useDropdownPosition();

  // 3. Scroll Sync Logic
  const { forceSyncScroll } = useScrollSync(
    inputRef,
    highlightLayerRef,
    internalValue,
    visible,
    textCursorPosition,
    setCursorPosition,
  );

  // 4. Highlight Logic
  const { renderHighlightedText, deleteHighlightedBlock } =
    useHighlight(internalValue);

  // 5. Input Handler Logic
  const { handleApplyVariable, handleInputChange } = useInputHandler(
    internalValue,
    setInternalValue,
    onChange,
    inputRef,
    setVisible,
    setSelectedKeys,
    textCursorPosition,
    setTextCursorPosition,
    setCursorPosition,
    variableTree,
    readonly,
    deleteHighlightedBlock,
    forceSyncScroll,
  );

  // 6. Keyboard Navigation Logic
  useKeyboardNavigation(
    visible,
    readonly,
    displayTree,
    selectedKeys,
    setSelectedKeys,
    expandedKeys,
    setExpandedKeys,
    handleApplyVariable,
    setVisible,
    internalValue,
    textCursorPosition,
    setInternalValue,
    treeRef,
  );

  const popoverShouldShow =
    visible &&
    !readonly &&
    !disabled &&
    (internalValue.includes('{{') || internalValue.includes('{}'));

  return (
    <div className={['prompt-variable-ref', className].join(' ')} style={style}>
      <div className="input-container">
        <div ref={highlightLayerRef} className="highlight-layer">
          <div className="highlight-content">
            {internalValue ? (
              renderHighlightedText(internalValue)
            ) : (
              <span style={{ visibility: 'hidden' }}>&nbsp;</span>
            )}
          </div>
        </div>

        <textarea
          ref={inputRef}
          value={internalValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={'prompt-variable-input'}
        />
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
          {/* {visible && internalValue.includes('{{') && (
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
                {searchText
                  ? `搜索："${searchText}" - 找到 ${displayTree.length} 个匹配项`
                  : `输入搜索词或浏览所有 ${variableTree.length} 个变量`}
              </div>
            </>
          )} */}

          <div className="tree-list-content">
            {displayTree.length > 0 ? (
              <Tree
                ref={treeRef}
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
                    handleApplyVariable(selectedNode.value);
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
