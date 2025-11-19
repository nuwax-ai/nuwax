import { useMemo } from 'react';
import { VariableTreeNode } from '../types';
import { buildVariableTree } from '../utils/treeUtils';

export const useVariableTree = (variables: any[], searchText: string) => {
  // 构建变量树
  const variableTree = useMemo(() => buildVariableTree(variables), [variables]);

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

  return { variableTree, displayTree };
};
