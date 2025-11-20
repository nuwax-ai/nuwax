import { useEffect, useMemo, useState } from 'react';
import { VariableTreeNode } from '../types';
import { buildVariableTree } from '../utils/treeUtils';

export const useVariableTree = (
  variables: any[] = [],
  skills: any[] = [],
  searchText: string,
  visible: boolean,
) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // 构建变量树
  const variableTree = useMemo(() => {
    const tree = buildVariableTree(variables);

    if (skills && skills.length > 0) {
      // Convert skills to tree nodes
      const skillNodes: VariableTreeNode[] = skills.map((skill, index) => ({
        key: `skill-${skill.typeId || skill.id || index}`,
        value: skill.toolName || skill.name || 'Unknown Tool', // Display name
        label: skill.toolName || skill.name || 'Unknown Tool',
        isLeaf: true,
        variable: {
          name: skill.name,
          type: 'Tool', // Special type for tools
          value: skill, // Store full skill object here
        } as any,
      }));

      // Add a Skills category
      tree.push({
        key: 'category-skills',
        value: 'Skills',
        label: 'Skills',
        isLeaf: false,
        children: skillNodes,
        variable: {
          name: 'Skills',
          type: 'Category',
        } as any,
      });
    }

    return tree;
  }, [variables, skills]);

  // 当不可见时重置选中状态
  useEffect(() => {
    if (!visible) {
      setSelectedKeys([]);
    }
  }, [visible]);

  // 搜索过滤逻辑
  const displayTree = useMemo(() => {
    const filterTreeBySearch = (
      nodes: VariableTreeNode[],
      searchText: string,
      matchMode: string = 'fuzzy',
    ): VariableTreeNode[] => {
      if (!searchText.trim()) {
        return nodes;
      }

      const matchesNode = (node: VariableTreeNode): boolean => {
        const searchLower = searchText.toLowerCase();
        const labelLower = node.label.toLowerCase();
        const valueLower = node.value.toLowerCase();
        const typeLower = node.variable?.type.toLowerCase() || '';

        switch (matchMode) {
          case 'exact':
            return labelLower === searchLower || valueLower === searchLower;
          case 'fuzzy':
            // 支持中文的模糊匹配 - 只要包含即可
            return (
              labelLower.includes(searchLower) ||
              valueLower.includes(searchLower) ||
              typeLower.includes(searchLower)
            );
          case 'prefix':
            // 支持中文的前缀匹配
            return (
              labelLower.startsWith(searchLower) ||
              valueLower.startsWith(searchLower) ||
              labelLower.includes(searchLower) ||
              valueLower.includes(searchLower)
            );
          case 'regex':
            try {
              const regex = new RegExp(searchText, 'i');
              return (
                regex.test(node.label) ||
                regex.test(node.value) ||
                regex.test(node.variable?.type || '')
              );
            } catch {
              return false; // 无效正则表达式
            }
          default:
            return false;
        }
      };

      const filterNodes = (nodes: VariableTreeNode[]): VariableTreeNode[] => {
        const result: VariableTreeNode[] = [];

        for (const node of nodes) {
          const filteredChildren = node.children
            ? filterNodes(node.children)
            : [];
          const isMatch = matchesNode(node);

          if (isMatch || filteredChildren.length > 0) {
            result.push({
              ...node,
              children: filteredChildren,
            });
          }
        }

        return result;
      };

      return filterNodes(nodes);
    };

    return filterTreeBySearch(variableTree, searchText, 'fuzzy');
  }, [variableTree, searchText]);

  // 当搜索结果变化时，自动展开所有节点
  useEffect(() => {
    if (searchText.trim()) {
      const getAllKeys = (nodes: VariableTreeNode[]): string[] => {
        return nodes.flatMap((node) => [
          node.key,
          ...(node.children ? getAllKeys(node.children) : []),
        ]);
      };
      setExpandedKeys(getAllKeys(displayTree));
    }
  }, [displayTree, searchText]);

  return {
    variableTree,
    displayTree,
    expandedKeys,
    setExpandedKeys,
    selectedKeys,
    setSelectedKeys,
  };
};
