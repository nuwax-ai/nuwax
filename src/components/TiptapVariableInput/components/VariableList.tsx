/*
 * VariableList Component
 * { 变量下拉列表组件
 */

import { Tree } from 'antd';
import React, { useMemo, useState } from 'react';
import type { VariableTreeNode } from '../../VariableInferenceInput/types';
import { transformToTreeDataForTree } from '../../VariableInferenceInput/utils/treeHelpers';
import type { VariableSuggestionItem } from '../types';
import { convertTreeNodesToSuggestions } from '../utils/suggestionUtils';

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
  tree: VariableTreeNode[];
  selectedIndex: number;
  onSelect: (item: VariableSuggestionItem) => void;
  searchText?: string;
  flatItems?: VariableSuggestionItem[]; // 扁平化的项列表，用于键盘导航
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
}) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // 将树节点转换为扁平化的建议项列表
  const suggestions = useMemo(() => {
    console.log('VariableList - tree:', tree);
    console.log('VariableList - tree length:', tree?.length);
    console.log('VariableList - flatItems:', flatItems);
    const result = flatItems || convertTreeNodesToSuggestions(tree);
    console.log('VariableList - suggestions:', result);
    console.log('VariableList - suggestions length:', result?.length);
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
    console.log('VariableList - treeData conversion - tree:', tree);
    const result = transformToTreeDataForTree(tree);
    console.log('VariableList - treeData conversion - result:', result);
    console.log(
      'VariableList - treeData conversion - result length:',
      result?.length,
    );
    return result;
  }, [tree]);

  if (!tree || tree.length === 0) {
    console.warn('VariableList - tree is empty or undefined');
    return (
      <div style={{ padding: '8px', color: '#999', textAlign: 'center' }}>
        未找到匹配变量
      </div>
    );
  }

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) return;

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

  console.log('VariableList render - treeData:', treeData);
  console.log('VariableList render - treeData length:', treeData?.length);
  console.log('VariableList render - expandedKeys:', expandedKeys);

  return (
    <Tree
      treeData={treeData}
      expandedKeys={expandedKeys as string[]}
      selectedKeys={selectedKeys}
      onExpand={(newExpandedKeys) => setExpandedKeys(newExpandedKeys)}
      onSelect={handleSelect}
      showIcon={false}
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

export default VariableList;
