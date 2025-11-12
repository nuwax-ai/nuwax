/**
 * PromptEditorWithVariable 组件
 * 集成 PromptEditorRender 和变量选择功能
 */

import useClickOutside from '@/components/SmartVariableInput/hooks/useClickOutside';
import { useKeyboardSelection } from '@/components/SmartVariableInput/hooks/useKeyboardSelection';
import {
  buildAdvancedVariablePath,
  formatTreeData,
  TreeNodeData,
} from '@/components/SmartVariableInput/utils';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { convertInputConfigToTreeNodeData } from '@/utils/variableConverter';
import { PromptEditorProvider, PromptEditorRender } from 'prompt-kit-editor';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import VariablePopover from './components/VariablePopover';
import { usePromptEditorVariable } from './hooks/usePromptEditorVariable';
import './index.less';

// 扩展 PromptEditorRender 的 props（保持兼容）
interface PromptEditorWithVariableProps
  extends Omit<React.ComponentProps<typeof PromptEditorRender>, 'onChange'> {
  /**
   * 变量数据（输入参数配置）
   */
  variables?: InputAndOutConfig[];
  /**
   * 值变化回调
   */
  onChange?: (value: string) => void;
}

/**
 * PromptEditorWithVariable 组件
 * 在 PromptEditorRender 基础上集成变量选择功能
 */
const PromptEditorWithVariable: React.FC<PromptEditorWithVariableProps> = ({
  variables = [],
  className,
  ...restProps
}) => {
  // 转换变量数据格式
  const treeNodeData = useMemo(() => {
    if (!variables || variables.length === 0) {
      return [];
    }
    return convertInputConfigToTreeNodeData(variables);
  }, [variables]);

  // 格式化树数据
  const formattedVariables = useMemo(() => {
    return formatTreeData(treeNodeData);
  }, [treeNodeData]);

  // 编辑器容器 ref（需要在 hook 调用之前定义）
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  // 变量选择功能
  const {
    popoverVisible,
    position,
    containerRef,
    handleVariableSelect,
    hidePopover,
    insertVariable,
  } = usePromptEditorVariable({
    variables: formattedVariables,
    editorElement: editorContainerRef.current || null, // 确保不会是 undefined
    editorRef,
    // 传递 onChange 回调（如果外部没有提供，确保 hook 内部知道没有 onChange）
    onChange: restProps.onChange,
  });

  // 初始化展开的节点 keys（展开所有有子节点的节点）
  const getInitialExpandedKeys = (nodes: TreeNodeData[]): React.Key[] => {
    const keys: React.Key[] = [];
    const traverse = (nodeList: TreeNodeData[]) => {
      nodeList.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.push(node.key);
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return keys;
  };

  // 展开的节点 keys
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(() => {
    return getInitialExpandedKeys(formattedVariables);
  });

  // 当树数据变化时，重新初始化展开状态
  useEffect(() => {
    if (formattedVariables.length > 0) {
      const initialKeys = getInitialExpandedKeys(formattedVariables);
      setExpandedKeys(initialKeys);
    }
  }, [formattedVariables.length]);

  // 树数据（不再需要过滤，因为移除了搜索功能）
  const filteredTreeData = formattedVariables;

  // 获取扁平节点列表（用于键盘导航）
  // 注意：只包含展开的节点及其子节点
  const flatAllNodes = useMemo(() => {
    const getVisibleNodes = (nodes: TreeNodeData[]): TreeNodeData[] => {
      const visibleNodes: TreeNodeData[] = [];
      const traverse = (nodeList: TreeNodeData[]) => {
        nodeList.forEach((node) => {
          visibleNodes.push(node);
          // 如果节点已展开且有子节点，递归遍历子节点
          if (
            expandedKeys.includes(node.key) &&
            node.children &&
            node.children.length > 0
          ) {
            traverse(node.children);
          }
        });
      };
      traverse(nodes);
      return visibleNodes;
    };
    return getVisibleNodes(filteredTreeData);
  }, [filteredTreeData, expandedKeys]);

  // 键盘选择管理
  const {
    selectedTreeKey,
    resetSelection,
    handleKeyboardSelect,
    getCurrentSelectedNode,
  } = useKeyboardSelection(flatAllNodes);

  // 处理键盘事件（通过 DOM 事件监听，确保能捕获到编辑器的键盘事件）
  useEffect(() => {
    if (!popoverVisible) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // 处理键盘导航（只有在弹窗显示时才处理）
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === 'Escape'
      ) {
        // 阻止默认行为和事件传播，确保编辑器不会处理这些键
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (e.key === 'ArrowDown') {
          handleKeyboardSelect('down');
        } else if (e.key === 'ArrowUp') {
          handleKeyboardSelect('up');
        } else if (e.key === 'Enter') {
          const selectedNode = getCurrentSelectedNode();
          if (selectedNode) {
            // 检查当前节点是否有子节点
            const hasChildren =
              selectedNode.children && selectedNode.children.length > 0;

            if (hasChildren) {
              // 如果有子节点，切换展开/收起状态
              const isExpanded = expandedKeys.includes(selectedNode.key);
              if (isExpanded) {
                // 收起：从 expandedKeys 中移除
                setExpandedKeys(
                  expandedKeys.filter((key) => key !== selectedNode.key),
                );
              } else {
                // 展开：添加到 expandedKeys
                setExpandedKeys([...expandedKeys, selectedNode.key]);
              }
            } else {
              // 如果没有子节点，选中并插入变量
              const fullPath = buildAdvancedVariablePath(
                selectedNode,
                filteredTreeData,
                {
                  wrapWithBraces: true,
                  includeArrayBrackets: true,
                },
              );
              if (fullPath && fullPath.trim() !== '') {
                // 插入变量并关闭弹窗
                insertVariable(fullPath);
              }
            }
          }
        } else if (e.key === 'Escape') {
          hidePopover();
        }
      }
    };

    // 添加全局键盘事件监听
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    popoverVisible,
    handleKeyboardSelect,
    getCurrentSelectedNode,
    insertVariable,
    hidePopover,
    filteredTreeData,
    expandedKeys,
  ]);

  // 处理变量选择
  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    console.log('🔵 handleSelect called:', selectedKeys, info);
    handleVariableSelect(selectedKeys, info);
    resetSelection();
  };

  // 点击外部关闭弹窗
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(
    popoverRef,
    () => {
      if (popoverVisible) {
        hidePopover();
      }
    },
    [editorContainerRef],
  );

  // 当弹窗显示时，重置选择状态并确保焦点
  useEffect(() => {
    if (popoverVisible) {
      resetSelection();
      // 确保弹窗容器获得焦点
      if (popoverRef.current) {
        // 使用 requestAnimationFrame 确保 DOM 已渲染
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (popoverRef.current) {
              popoverRef.current.focus();
            }
          }, 50);
        });
      }
    }
  }, [popoverVisible, resetSelection]);

  // 当树数据变化时，重置选择状态
  useEffect(() => {
    if (popoverVisible && flatAllNodes.length > 0) {
      // 延迟重置，确保 DOM 已更新
      setTimeout(() => {
        resetSelection();
      }, 0);
    }
  }, [popoverVisible, flatAllNodes.length, resetSelection]);

  return (
    <div
      ref={(node) => {
        editorContainerRef.current = node;
        containerRef.current = node;
      }}
      className="prompt-editor-with-variable"
    >
      <PromptEditorProvider>
        <PromptEditorRender
          {...restProps}
          className={className}
          getEditor={(editor: any) => {
            editorRef.current = editor;
            // 如果外部也传了 getEditor，也要调用
            if (restProps.getEditor) {
              restProps.getEditor(editor);
            }
          }}
        />
      </PromptEditorProvider>

      {/* 变量选择弹窗 */}
      <VariablePopover
        ref={popoverRef}
        visible={popoverVisible}
        position={position}
        treeData={filteredTreeData}
        selectedKeys={[selectedTreeKey]}
        onSelect={handleSelect}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
      />
    </div>
  );
};

export default PromptEditorWithVariable;
