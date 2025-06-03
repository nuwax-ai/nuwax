import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import VariablePopover from './components/VariablePopover';
import useClickOutside from './hooks/useClickOutside';
import { useKeyboardSelection } from './hooks/useKeyboardSelection';
import { usePopoverControl } from './hooks/usePopoverControl';
import { usePopoverPosition } from './hooks/usePopoverPosition';
import { useVariableInput } from './hooks/useVariableInput';
import './index.less';
import {
  PathBuildOptions,
  TreeNodeData,
  buildAdvancedVariablePath,
  formatTreeData,
} from './utils';

// 定义 ref 暴露的方法类型
export interface SmartVariableInputRef {
  showPopover: () => void;
  hidePopover: () => void;
  insertVariable: (variable: string) => void;
  getContent: () => string;
  setContent: (content: string) => void;
}

interface SmartVariableInputProps {
  variables: TreeNodeData[];
  value?: string;
  placeholder?: string;
  pathOptions?: PathBuildOptions;
  onChange?: (value: string) => void;
}

const SmartVariableInput = forwardRef<
  SmartVariableInputRef,
  SmartVariableInputProps
>(
  (
    {
      variables = [],
      value,
      placeholder = '请输入内容...',
      pathOptions = {},
      onChange,
    },
    ref,
  ) => {
    // 使用自定义 Hooks
    const { popoverVisible, showPopover, hidePopover } =
      usePopoverControl(variables);
    const { position, updatePositionFromCursor, updatePositionFromEditor } =
      usePopoverPosition();
    const {
      editorRef,
      isEmpty,
      shouldShowVariableSelector,
      insertVariable,
      handleInput,
      handleFocus,
      handleBlur,
      getContent,
      setContent,
    } = useVariableInput();

    // 格式化变量数据
    const formattedVariables = useMemo(() => {
      return formatTreeData(variables);
    }, [variables]);

    // 获取所有节点的扁平列表（包括父节点）
    const flatAllNodes = useMemo(() => {
      const getAllNodes = (nodes: TreeNodeData[]): TreeNodeData[] => {
        const allNodes: TreeNodeData[] = [];

        const traverse = (nodeList: TreeNodeData[]) => {
          nodeList.forEach((node) => {
            allNodes.push(node);
            if (node.children && node.children.length > 0) {
              traverse(node.children);
            }
          });
        };

        traverse(nodes);
        return allNodes;
      };

      return getAllNodes(formattedVariables);
    }, [formattedVariables]);

    // 键盘选择管理
    const {
      selectedTreeKey,
      resetSelection,
      handleKeyboardSelect,
      getCurrentSelectedNode,
    } = useKeyboardSelection(flatAllNodes);

    // 更新弹窗显示状态和位置
    const updatePopover = () => {
      if (shouldShowVariableSelector()) {
        showPopover();
        resetSelection();
        updatePositionFromCursor();
      } else {
        hidePopover();
      }
    };

    // 处理键盘确认选择
    const handleKeyboardConfirm = () => {
      const selectedNode = getCurrentSelectedNode();
      if (selectedNode) {
        const fullPath = buildAdvancedVariablePath(
          selectedNode,
          formattedVariables,
          pathOptions,
        );

        if (fullPath && fullPath.trim() !== '') {
          insertVariable(fullPath);
          hidePopover();
        }
      }
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!popoverVisible) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleKeyboardSelect('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleKeyboardSelect('up');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyboardConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hidePopover();
      }
    };

    // 处理输入事件
    const onInput = () => {
      handleInput();
      onChange?.(getContent());
      setTimeout(() => {
        updatePopover();
      }, 0);
    };

    // Tree 节点选择处理
    const handleTreeSelect = (selectedKeys: React.Key[], info: any) => {
      const selectedNode = info.node;

      try {
        const fullPath = buildAdvancedVariablePath(
          selectedNode,
          formattedVariables,
          pathOptions,
        );

        if (fullPath && fullPath.trim() !== '') {
          insertVariable(fullPath);
          hidePopover();
        }
      } catch (error) {
        console.error('构建路径时出错:', error);
      }
    };

    // API 方法：动态显示 Popover
    const apiShowPopover = () => {
      showPopover();
      resetSelection();

      if (editorRef.current) {
        updatePositionFromEditor(editorRef.current);
      }
    };

    // 暴露 API 方法
    useImperativeHandle(ref, () => ({
      showPopover: apiShowPopover,
      hidePopover,
      insertVariable,
      getContent,
      setContent,
    }));

    useEffect(() => {
      setContent(value || '');
    }, [value]);

    // 添加容器和弹窗的 ref
    const popoverRef = useRef<HTMLDivElement>(null);

    // 使用 useClickOutside 处理点击外部关闭弹窗
    useClickOutside(
      popoverRef, // 监听容器外部的点击
      () => {
        if (popoverVisible) {
          hidePopover();
        }
      },
      [], // 排除弹窗区域，避免点击弹窗内部也关闭
    );

    return (
      <>
        <div className="smart-variable-input">
          <div
            ref={editorRef}
            className="editor"
            contentEditable
            role="textbox"
            aria-label={placeholder}
            aria-expanded={popoverVisible}
            aria-haspopup="listbox"
            suppressContentEditableWarning
            onInput={onInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {isEmpty && <div className="placeholder">{placeholder}</div>}
        </div>

        <VariablePopover
          ref={popoverRef}
          visible={popoverVisible}
          position={position}
          treeData={formattedVariables}
          selectedKeys={[selectedTreeKey]}
          onSelect={handleTreeSelect}
        />
      </>
    );
  },
);

SmartVariableInput.displayName = 'SmartVariableInput';

export default SmartVariableInput;
