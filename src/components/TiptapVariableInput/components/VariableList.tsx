/*
 * VariableList Component
 * { 变量下拉列表组件
 */

import useClickOutside from '@/components/SmartVariableInput/hooks/useClickOutside';
import { Tabs, theme, Tree } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import '../styles.less';
import type { VariableSuggestionItem, VariableTreeNode } from '../types';
import { convertTreeNodesToSuggestions } from '../utils/suggestionUtils';
import { transformToTreeDataForTree } from '../utils/treeHelpers';

/**
 * 在树中查找节点
 */
function findNodeInTree(
  nodes: VariableTreeNode[],
  key: string,
): VariableTreeNode | null {
  for (const node of nodes) {
    if (node.key === key) {
      return node;
    }
    if (node.children) {
      const found = findNodeInTree(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

interface VariableListProps {
  tree: VariableTreeNode[]; // 当前显示的树（可能是全部，也可能是某个 tab 的）
  selectedIndex: number;
  onSelect: (item: VariableSuggestionItem) => void;
  searchText?: string;
  flatItems?: VariableSuggestionItem[]; // 扁平化的项列表，用于键盘导航

  // Tab 相关属性
  showTabs?: boolean;
  activeTab?: string;
  onTabChange?: (key: string) => void;
  regularVariables?: VariableTreeNode[];
  toolVariables?: VariableTreeNode[];

  // 点击外部关闭回调
  onClose?: () => void;
  // 需要排除的元素 refs（例如编辑器元素）
  excludeRefs?: React.RefObject<HTMLElement>[];
  // 需要排除的 DOM 元素（直接传递 DOM 元素，更稳定）
  // 使用单个元素而不是数组，避免每次创建新数组
  excludeElement?: HTMLElement | null;
}

/**
 * 变量下拉列表组件
 */
const VariableList: React.FC<VariableListProps> = ({
  tree,
  selectedIndex,
  onSelect,
  searchText = '',
  flatItems,
  showTabs = false,
  activeTab = 'variables',
  onTabChange,
  regularVariables = [],
  toolVariables = [],
  onClose,
  excludeRefs = [],
  excludeElement,
}) => {
  const { token } = theme.useToken();

  console.log('VariableList render debug:', {
    showTabs,
    activeTab,
    regularVariablesLength: regularVariables.length,
    toolVariablesLength: toolVariables.length,
    treeLength: tree.length,
  });

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // 创建容器 ref，用于点击外部检测
  const containerRef = useRef<HTMLDivElement>(null);

  // 将 excludeElement 转换为 ref，并合并 excludeRefs
  // 使用 useMemo 稳定化，避免每次渲染都创建新数组
  const allExcludeRefs = useMemo(() => {
    const refs: React.RefObject<HTMLElement>[] = [];

    // 添加 excludeRefs
    if (excludeRefs && excludeRefs.length > 0) {
      refs.push(...excludeRefs);
    }

    // 将 excludeElement 转换为 ref 对象
    if (excludeElement) {
      refs.push({ current: excludeElement } as React.RefObject<HTMLElement>);
    }

    return refs;
  }, [excludeRefs, excludeElement]);

  // 稳定化 handler 回调函数
  const handleClickOutside = useCallback(() => {
    // 点击外部时关闭下拉框
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // 使用 useClickOutside hook 检测点击外部事件
  // 排除 Portal 容器和编辑器（通过 class 名检查）
  useClickOutside(containerRef, handleClickOutside, allExcludeRefs, [
    'variable-suggestion-popup', // Portal 容器
    'mention-suggestion-popup', // Mention Portal 容器
    'tiptap-editor-wrapper', // 编辑器包装器
    'ProseMirror', // Tiptap 编辑器
  ]);

  // 将树节点转换为扁平化的建议项列表
  // 优先使用 flatItems（从 VariableSuggestion 传递的扁平化列表）
  // 这样可以确保键盘导航的索引与鼠标点击的索引一致
  const suggestions = useMemo(() => {
    // 优先使用 flatItems，确保与键盘导航的索引一致
    const result =
      flatItems && flatItems.length > 0
        ? flatItems
        : convertTreeNodesToSuggestions(tree);

    return result;
  }, [tree, flatItems]);

  // 根据 selectedIndex 更新选中的 key
  React.useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const selectedItem = suggestions[selectedIndex];
      if (selectedItem) {
        setSelectedKeys([selectedItem.key]);
        // 确保选中的节点在视图中可见
        const findNodeKey = (
          nodes: VariableTreeNode[],
          targetKey: string,
        ): string | null => {
          for (const node of nodes) {
            if (node.key === targetKey) {
              return node.key;
            }
            if (node.children) {
              const found = findNodeKey(node.children, targetKey);
              if (found) {
                // 展开父节点
                const parentKey = node.key;
                setExpandedKeys((prev) => {
                  if (!prev.includes(parentKey)) {
                    return [...prev, parentKey];
                  }
                  return prev;
                });
                return found;
              }
            }
          }
          return null;
        };
        findNodeKey(tree, selectedItem.key);
      }
    }
  }, [selectedIndex, suggestions, tree]);

  // 当有搜索文本时，自动展开所有节点
  React.useEffect(() => {
    if (searchText.trim()) {
      const getAllKeys = (nodes: VariableTreeNode[]): string[] => {
        return nodes.flatMap((node) => [
          node.key,
          ...(node.children ? getAllKeys(node.children) : []),
        ]);
      };
      setExpandedKeys(getAllKeys(tree));
    }
  }, [tree, searchText]);

  // 转换树数据为 Ant Design Tree 格式
  const treeData = useMemo(() => {
    return transformToTreeDataForTree(tree, token);
  }, [tree, token]);

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) {
      return;
    }

    const selectedKey = selectedKeys[0] as string;

    // 首先尝试从原始树节点查找
    const treeNode = findNodeInTree(tree, selectedKey);

    if (treeNode) {
      // 所有节点都可以选择（包括非叶子节点）
      // 检查是否是工具：工具的 key 以 'skill-' 开头，或者 variable.type 是 'Tool'（通过 as any 设置）
      const isTool =
        treeNode.key.startsWith('skill-') ||
        (treeNode.variable as any)?.type === 'Tool';

      const suggestionItem: VariableSuggestionItem = {
        key: treeNode.key,
        label: treeNode.label,
        value: treeNode.value,
        node: treeNode,
        isTool: isTool && treeNode.isLeaf, // 只有叶子节点才能是工具
        toolData:
          isTool && treeNode.isLeaf
            ? (treeNode.variable as any)?.value
            : undefined,
      };

      onSelect(suggestionItem);
      return;
    }

    // 如果找不到树节点，尝试从 treeData 中查找
    const selectedNode = treeData
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
      .find((node: any) => node.key === selectedKey);

    if (selectedNode) {
      // 查找对应的 suggestion 项
      const suggestion = suggestions.find(
        (s) => s.key === selectedNode.key || s.value === selectedNode.value,
      );

      if (suggestion) {
        onSelect(suggestion);
      } else {
        // 如果找不到 suggestion，尝试从树节点构建
        const foundTreeNode = findNodeInTree(tree, selectedKey);
        if (foundTreeNode) {
          const isTool =
            foundTreeNode.key.startsWith('skill-') ||
            (foundTreeNode.variable as any)?.type === 'Tool';
          onSelect({
            key: foundTreeNode.key,
            label: foundTreeNode.label,
            value: foundTreeNode.value,
            node: foundTreeNode,
            isTool: isTool && foundTreeNode.isLeaf,
            toolData:
              isTool && foundTreeNode.isLeaf
                ? (foundTreeNode.variable as any)?.value
                : undefined,
          });
        }
      }
    }
  };

  // 自定义标题渲染，确保所有节点都可以点击选择
  const titleRender = (nodeData: any) => {
    const originalTitle = nodeData.title;

    return (
      <div
        onClick={(e) => {
          // 阻止事件冒泡，避免触发 Tree 的默认行为
          e.stopPropagation();

          // 如果点击的是展开/折叠图标区域，不处理选择
          const target = e.target as HTMLElement;
          if (target.closest('.ant-tree-switcher')) {
            return;
          }

          // 触发选择
          const keys = [nodeData.key];
          handleSelect(keys);
        }}
        style={{ width: '100%', cursor: 'pointer' }}
      >
        {originalTitle}
      </div>
    );
  };

  const renderTree = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div
          style={{
            padding: token.paddingSM,
            color: token.colorTextTertiary,
            textAlign: 'center',
          }}
        >
          未找到匹配变量
        </div>
      );
    }

    // 检查是否所有节点都是工具（扁平列表，没有 category-skills 父节点）
    // 如果所有节点都是叶子节点且都是工具，使用列表渲染而不是树形
    const allAreTools = tree.every((node) => {
      return (
        node.isLeaf &&
        (node.key.startsWith('skill-') ||
          (node.variable as any)?.type === 'Tool')
      );
    });

    // 如果所有节点都是工具且是扁平列表（没有 category-skills 父节点），使用简单的列表渲染
    if (
      allAreTools &&
      tree.length > 0 &&
      !tree.some((n) => n.key === 'category-skills')
    ) {
      return (
        <div className="variable-tool-list-container">
          {suggestions.map((item, index) => {
            const isSelected = selectedIndex === index;

            return (
              <div
                key={item.key}
                onClick={() => {
                  onSelect(item);
                }}
                className={`variable-tool-list-item ${
                  isSelected ? 'selected' : ''
                }`}
              >
                <div className="variable-tool-list-item-content">
                  <span className="variable-tool-list-item-label">
                    {item.label}
                  </span>
                  <span className="variable-tool-list-item-type">Tool</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // 否则使用树形组件渲染
    return (
      <Tree
        treeData={data}
        expandedKeys={expandedKeys as string[]}
        selectedKeys={selectedKeys}
        onExpand={(newExpandedKeys) => {
          setExpandedKeys(newExpandedKeys);
        }}
        onSelect={handleSelect}
        titleRender={titleRender}
        showIcon={false}
        // 允许所有节点（包括非叶子节点）被选中
        selectable={true}
        // 允许点击节点标题进行选择（不仅仅是图标）
        blockNode={true}
        virtual={true}
      />
    );
  };

  if (showTabs) {
    const items = [
      {
        key: 'variables',
        label: '变量',
        children: renderTree(
          transformToTreeDataForTree(regularVariables, token),
        ),
      },
      {
        key: 'tools',
        label: '工具',
        children: renderTree(transformToTreeDataForTree(toolVariables, token)),
      },
    ];

    return (
      <div ref={containerRef} className="variable-suggestion-tabs css-var-r0">
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          items={items}
          size="small"
          tabBarStyle={{
            padding: `0 ${token.paddingSM}px`,
            margin: 0,
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="css-var-r0">
      {renderTree(treeData)}
    </div>
  ); //TODO 这里的 css-var-r0 是一个临时方案
};

export default VariableList;
