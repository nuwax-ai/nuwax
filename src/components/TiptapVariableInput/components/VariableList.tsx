/*
 * VariableList Component
 * { 变量下拉列表组件
 */

import { Tabs, Tree } from 'antd';
import React, { useMemo, useState } from 'react';
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
}) => {
  console.log('VariableList render debug:', {
    showTabs,
    activeTab,
    regularVariablesLength: regularVariables.length,
    toolVariablesLength: toolVariables.length,
    treeLength: tree.length,
  });

  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

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
    return transformToTreeDataForTree(tree);
  }, [tree]);

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
        <div style={{ padding: '8px', color: '#999', textAlign: 'center' }}>
          未找到匹配变量
        </div>
      );
    }

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
        style={{
          maxHeight: '240px',
          overflowY: 'auto',
        }}
        height={240}
        itemHeight={28}
        virtual={true}
      />
    );
  };

  if (showTabs) {
    const items = [
      {
        key: 'variables',
        label: '变量',
        children: renderTree(transformToTreeDataForTree(regularVariables)),
      },
      {
        key: 'tools',
        label: '工具',
        children: renderTree(transformToTreeDataForTree(toolVariables)),
      },
    ];

    return (
      <div className="variable-suggestion-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={onTabChange}
          items={items}
          size="small"
          tabBarStyle={{ marginBottom: 8, padding: '0 8px' }}
        />
      </div>
    );
  }

  return renderTree(treeData);
};

export default VariableList;
